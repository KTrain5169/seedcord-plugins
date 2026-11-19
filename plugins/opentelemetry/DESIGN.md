# `seedcord-plugin-opentelemetry` design

The plugin's north star: a bot author attaches it, points it at an OTLP
endpoint (or sets the standard `OTEL_EXPORTER_OTLP_*` env vars), and gets
traces, correlated logs, and framework dispatch metrics in their observability
backend with zero bot-code changes — and a clean flush on shutdown.

seedcord's guide documents two facts that shape everything below:

- On the **server runtime**, the framework logs through **winston**
  (`WinstonConsoleSink`, `WinstonFileSink`).
- The framework **measures every dispatch, reply write, and fault itself**,
  publishes the numbers as telemetry keys on `core.bus`, and stores **none of
  them** — a subscriber that saves them is the intended pattern.

So the plugin has exactly two telemetry sources to orchestrate, and both are
already built into the framework.

## Simple defaults

The defaults maximise signal-to-noise for the 99% use case.

- **Quiet by default.** The plugin logs its own lifecycle at `debug`, which
  seedcord's default level floor (`info` outside development) hides. Only
  warnings and errors surface by default: a failed flush, a rejected options
  combination, a bridge callback that threw.
- **Automatically orchestrates both the event bus and `this.logger`.**
  - `this.logger` → OTel logs. Every line a handler, subscriber, or plugin
    logs travels through seedcord's winston sinks on the server runtime. The
    plugin passes its log record processors to `WinstonInstrumentation`, so
    each line becomes an OTel log record carrying the active trace context.
    No user code changes.
  - The framework bus → OTel metrics and fault records. The plugin is the
    subscriber that turns the telemetry keys into durable telemetry.
- **OTLP when configured, console otherwise.** Per signal: an endpoint from
  options or the standard `OTEL_EXPORTER_OTLP_*` env vars (which the OTLP
  exporters read natively) selects batched OTLP export; nothing configured
  falls back to console exporters, keeping local development zero-config.
- **The server-only scope is a guarantee, not a limitation.** It is what makes
  the winston orchestration safe — an edge bot logs through
  `ObjectConsoleSink` instead — so the plugin refuses to attach on Workers
  entirely rather than half-working.

### The bus bridge

seedcord publishes its own keys on `core.bus`; bots can subscribe but never
publish them. The bus guide recommends plain `bus.on` callbacks for code that
already holds `core` — a plugin — so the bridge subscribes in `init()`,
unsubscribes with `off` in `dispose()`, and types every payload through
`SubscriptionData<'key'>`, so a payload field seedcord adds later surfaces as
a compile-time change rather than an invented API.

| bus key | where | what the bridge emits |
| --- | --- | --- |
| `interactionDispatched` | both | `seedcord.interaction.duration` histogram (ms; attrs `routeId`, `kind`, `outcome`, `fallback`) and `seedcord.interaction.queued` histogram (`queuedMs`) |
| `responseAttempted` | both | `seedcord.response.duration` histogram (ms; attrs `method`, `outcome`) |
| `eventDispatched` | gateway | `seedcord.event.duration` histogram (ms; attr `name`) and a per-handler outcome counter (attrs `name`, `handler`, `outcome`) |
| `unknownException` | both | exception log record (severity error; attrs `dispatchId` — **nullable** on process-level throws such as unhandled rejections — plus `uuid`, `origin`) and `seedcord.fault` counter |
| `handledException` | both | exception log record (attrs `dispatchId` — always set on this key — `uuid`, `origin`) and `seedcord.fault` counter |
| `unhandledInteractionError` | both | exception log record; the payload carries only `{ error }` |
| `unhandledEventError` | gateway | exception log record; the payload carries only `{ error }` |

The two `unhandled*Error` keys cover throws the fault boundary never sees —
the guide's answer for hearing about them in production is a subscriber, and
the bridge is that subscriber.

Not bridged by default:

- `anyInteraction` — its payload is a discord.js `Interaction` on gateway and
  an `APIInteraction` on http, so bridging it means per-transport branching for
  data the dispatch span already covers.
- `eventDispatching` — publishes only when a handler is about to run, and
  duplicates what `eventDispatched` reports after the fact.
- `commandsDeployed` — the framework already logs every deploy; the key is for
  shipping command lists elsewhere, not telemetry.

**Correlation.** Every dispatched key carries a `dispatchId`, unique per run
and shared by the dispatch report, its write reports, and its faults. The
middleware puts the same id on the dispatch span, the bridge puts it on every
emitted record, and user code can read it too (`this.dispatch.id` in a handler
or middleware), so a slow span, its winston logs, and its fault line all join
on one value.

**Cardinality and privacy.** Attributes mirror the payload field names
exactly (`routeId`, `kind`, `outcome`, `method`, `name`). `userId` and
`guildId` are deliberately **not** exported by default — unbounded label
cardinality for user privacy's sake — with an explicit opt-in for bots that
want them.

**Transport asymmetry is harmless.** Subscribing to a gateway-only key on http
is a no-op: the key never publishes there. The bridge does not need to detect
the transport before subscribing.

**Clock honesty.** `queuedMs` compares the server's clock against the
snowflake-embedded creation time Discord bakes into every interaction id, so a
server behind on NTP reports negatives. The bridge exports the number as-is
and the README documents the skew — clamping the value would hide the
misconfiguration it signals.

**Bridge failures are not faults.** seedcord catches a throwing bus callback
and logs it on the `subscribers` channel; the bridge additionally self-catches
and logs at `warn`, so one bad payload never escalates or doubles up.

## Highly configurable

- **The full NodeSDK remains the escape hatch.** Anything the first-class
  options don't model is configurable through a `sdkConfig` passthrough that
  wins over every default.
- **One precedence ladder:** explicit `sdkConfig` → first-class options
  (`serviceName`, `endpoint`, exporter choices, bridge toggles) → env-informed
  defaults → console fallback. Invalid combinations are rejected at `attach()`
  time through `rejectOptions()`, never discovered at runtime.
- **Per handler/middleware overrides.** `@OverrideOTel` decorates a handler or
  middleware class with dispatch-time settings — extra span `attributes`, a
  `spanName`, or `sampling: 'off'`. The settings apply to that class's
  dispatches through the plugin's middleware. They cannot and do not try to
  reconfigure the process-global NodeSDK per request; one process gets one
  SDK.
- **Opt-in instrumentation.** Winston is the default because the framework
  logs through it; `undici`/`http` instrumentations (which cover discord.js
  REST calls) are opt-in additions.

## Shutdown

Telemetry only counts if it flushes. `dispose()` runs in the `Disconnect`
phase and shuts the SDK down, which flushes the batch span and log
processors and forces the metric reader out. A failed or hung flush is caught
and warned about, never thrown, so a dead collector cannot block the
coordinated shutdown — and the dispose timeout is sized to fit inside the
framework's 25s shutdown deadline.

## Design decisions and rationale

1. **`bus.on` callbacks, not `@Subscribe` classes.** The bus guide says a
   callback registered with `on` suits code that already holds `core`, like a
   plugin. A `Subscriber` class would also need the bot to point
   `subscribers.path` at a folder the plugin cannot ship files into.
2. **Bridge the framework's own clocks, don't re-time.** seedcord measures
   dispatch, writes, and faults on a monotonic clock around middleware,
   gates, and replies — a middleware stopwatch would drift from the
   framework's own numbers and miss the error-card writes.
3. **`sdkConfig` stays plugin-level.** Per-handler exporters would fight over
   the global providers, so decorator overrides are dispatch-time concerns
   (attributes, span name, sampling) instead.
4. **The middleware is a file the bot author drops in, not a pre-decorated
   export.** `InteractionMiddleware`'s base class is exported by the transport
   packages, so a transport-agnostic plugin cannot ship a ready-made class.
   A ~10-line delegation to plugin methods keeps the ceremony minimal.
5. **`dispatchId` is the join key, not trace ids.** The framework, the
   winston pipeline, and user code all already carry it; trace ids only exist
   once the middleware starts a span.

## Reference docs

- The bus: <https://seedcord.org/guide/events/bus.md>
- The framework's bus keys: <https://seedcord.org/guide/events/default-keys.md>
- Reading the telemetry: <https://seedcord.org/guide/events/telemetry.md>
- Logging: <https://seedcord.org/guide/built-ins/logging.md>
- Logger sinks (winston on node): <https://seedcord.org/guide/built-ins/logger-config.md>
- Interaction middleware: <https://seedcord.org/guide/checks/middleware.md>
