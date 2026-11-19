# Planning for OpenTelemetry plugin

Make the plugin functional for the 99% use case: attach it, set an OTLP
endpoint, and get traces, winston logs, and seedcord dispatch metrics flowing
to an observability backend with zero user code, plus a clean shutdown flush.

## Requirements

- This plugin must be restricted to server runtimes.
- This plugin must (by default) automatically orchestrate for Winston (since
  that's the underlying logger library used by seedcord).
- This plugin must allow users to configure anything within the OpenTelemetry
  NodeSDK itself.
- There must be decorators that allow overriding the provided settings for a
  particular handler. Decorators must be legacy TypeScript decorators, NOT
  TC39 decorators.

## Decisions (agreed)

| decision | choice |
| --- | --- |
| default exporters | OTLP when an endpoint is configured (option or `OTEL_EXPORTER_OTLP_*`), console fallback otherwise |
| decorator semantics | dispatch-time settings (`attributes`, `spanName`, `sampling`), applied by a middleware; NOT per-handler `sdkConfig` |
| telemetry-bus bridge | on by default, opt-out |
| API cleanup | clean break — v0.0.0 was never published, cut dead aliases and template leftovers |

## Known bugs in the current draft (verified against installed deps)

- [ ] `fn()` / "Hello, tsdown!" template leftover exported from the public API,
      with the placeholder test as the only test.
- [ ] `this.otel.start()` is not awaited; early telemetry can be dropped.
- [ ] `traceExporter` and `spanProcessors` are both set, but the pinned
      `@opentelemetry/sdk-node` ignores `traceExporter` when `spanProcessors`
      is present — the `traceExporter` default is dead config and the live
      `SimpleSpanProcessor` path exports every span synchronously, which the
      SDK itself warns against for production.
- [ ] `defu` concatenates arrays (`[...user, ...defaults]`), so user-supplied
      `spanProcessors` / `logRecordProcessors` keep the console defaults too —
      every span exported to the user's collector AND printed to console.
      Same hazard for `metricReader` vs `metricReaders`.
- [ ] `OverrideOTel` stores metadata that nothing consumes — a decorated
      handler behaves identically to an undecorated one.
- [ ] `WinstonInstrumentation({})` only injects trace context; it emits OTel
      log records only when passed `logRecordProcessors`, so seedcord's winston
      lines never reach the OTel logs pipeline.
- [ ] No `this.logger` usage anywhere; no options validation via
      `rejectOptions()`.
- [x] Peer dep aligned to `^0.13.0` (done); version `0.0.0` with no
      changeset — still pending.
- [ ] Importing the plugin monkey-patches global `Reflect` when
      `reflect-metadata` is absent.

## Phase 0 — Hygiene & release plumbing

- [ ] Remove `export function fn()` from `src/index.ts`.
- [ ] Delete the placeholder test in `tests/index.test.ts` (replaced in
      Phase 6).
- [x] Align peer dep `@seedcord/core` to `^0.13.0` (already done in
      package.json; the required `super(host, { runtime: 'server' })`
      companion fix landed with the sdk-trace migration).
- [ ] Write a changeset so the Changesets pipeline can version the release.

## Phase 1 — Correctness fixes (no behavior change beyond correctness)

- [ ] `await this.otel.start()` in `init()`.
- [ ] Log lifecycle at `debug` through `this.logger` (matching `docker` / `kv`
      conventions), so the plugin stays quiet at the default level floor —
      only warnings and errors surface by default (DESIGN.md: signal-to-noise).
- [ ] Build exactly one trace pipeline: resolve `traceExporter` vs
      `spanProcessors` vs `spanProcessor` explicitly instead of passing both.
- [ ] Replace blind `defu` with explicit resolution:
  - [ ] user exporters / span processors / log record processors / metric
        readers fully **replace** the defaults;
  - [ ] user instrumentations **append** to defaults, deduped by
        instrumentation class;
  - [ ] `sdkConfig` remains the full NodeSDK escape hatch (Requirement 3).
- [ ] Harden `dispose()`:
  - [ ] stay in `ShutdownPhase.Disconnect` but pass an explicit, longer
        timeout so OTLP batch flush fits the 25s shutdown deadline;
  - [ ] catch and warn on flush failure so shutdown never blocks on a dead
        collector.
- [ ] Validate options with `rejectOptions()` (e.g. per-signal exporter AND
      `sdkConfig` exporter for the same signal).

## Phase 2 — Production defaults & Winston orchestration

- [ ] Add `@opentelemetry/exporter-trace-otlp-http`,
      `@opentelemetry/exporter-metrics-otlp-http`,
      `@opentelemetry/exporter-logs-otlp-http`.
- [ ] Per-signal exporter resolution:
  - [ ] endpoint from options or standard `OTEL_EXPORTER_OTLP_*` env vars
        (exporters read these natively) → batched OTLP
        (`BatchSpanProcessor`, `BatchLogRecordProcessor`,
        `PeriodicExportingMetricReader`);
  - [ ] nothing configured → console exporters (dev-friendly);
  - [ ] `sdkConfig` overrides everything, documented.
- [ ] `serviceName` option → Resource; rely on NodeSDK auto-detection for
      `OTEL_SERVICE_NAME` / `OTEL_RESOURCE_ATTRIBUTES`.
- [ ] Pass the plugin's log processors into
      `WinstonInstrumentation({ logRecordProcessors })` so seedcord's winston
      lines flow into the OTel logs pipeline with trace correlation
      (Requirement 2, the currently-missing half).

## Phase 3 — seedcord telemetry-bus bridge (default on)

- [ ] Option `telemetryBus: false | { ... }` to opt out or filter.
- [ ] Subscribe via `this.core.bus.on(...)` in `init()` — the bus guide
      recommends plain callbacks for code that already holds `core`, i.e. a
      plugin — and unsubscribe with `off` in `dispose()`.
- [ ] Type every payload through `SubscriptionData<'key'>` (exported from
      `@seedcord/core`) so payload fields seedcord adds later surface at
      compile time, not as invented API.
- [ ] Self-catch inside every bridge callback and log at `warn` — seedcord
      already catches bus-callback throws on the `subscribers` channel, so the
      bridge must neither escalate nor double up.
- [ ] Key mapping (from guide/events/default-keys.md):

  | bus key | where | bridge emits |
  | --- | --- | --- |
  | `interactionDispatched` | both | `seedcord.interaction.duration` histogram (ms; attrs `routeId`, `kind`, `outcome`, `fallback`) + `seedcord.interaction.queued` histogram (`queuedMs`) |
  | `responseAttempted` | both | `seedcord.response.duration` histogram (ms; attrs `method`, `outcome`) |
  | `eventDispatched` | gateway | `seedcord.event.duration` histogram (ms; attr `name`) + per-handler outcome counter (attrs `name`, `handler`, `outcome`) |
  | `unknownException` | both | exception log record (severity error; attrs `dispatchId` — **nullable** on process-level throws — `uuid`, `origin`) + `seedcord.fault` counter |
  | `handledException` | both | exception log record (attrs `dispatchId` — always set on this key — `uuid`, `origin`) + `seedcord.fault` counter |
  | `unhandledInteractionError` | both | exception log record — payload carries only `{ error }`; these throws never reach the fault boundary, so the bridge is the production visibility for them |
  | `unhandledEventError` | gateway | exception log record — same `{ error }` shape |

- [ ] Document why these are NOT bridged by default: `anyInteraction` (payload
      is discord.js `Interaction` on gateway vs `APIInteraction` on http —
      per-transport branching for data the dispatch span already covers),
      `eventDispatching` (publishes only when a handler is about to run;
      duplicates `eventDispatched`), `commandsDeployed` (framework already
      logs every deploy).
- [ ] Attribute policy: mirror payload field names (`routeId`, `kind`,
      `outcome`, `method`, `name`) only. `userId` / `guildId` are NOT
      exported as attributes by default — unbounded cardinality and user
      privacy — opt in via a `telemetryBus.ids` flag.
- [ ] Subscribe to gateway-only keys unconditionally: on http they never
      publish, which is a harmless no-op — no transport detection needed.
- [ ] Keep `dispatchId` on every emitted record so dispatches, winston logs,
      fault records, and the Phase 4 dispatch span all join on one value.
- [ ] Do NOT clamp negative `queuedMs` — it compares the server clock against
      Discord's snowflake timestamp, so a run of negatives means the server
      clock is behind; document the NTP caveat in the README instead.

## Phase 4 — Functional decorator + middleware

- [ ] Redefine `@OverrideOTel` options as dispatch-time settings on a handler
      OR middleware class: `{ attributes?, spanName?, sampling?: 'default' |
      'off' }`. Legacy TS decorators preserved (Requirement 4).
- [ ] Remove `sdkConfig` from the decorator — a process-global NodeSDK cannot
      be reconfigured per handler.
- [ ] Ship a documented ~10-line `OTelDispatch` middleware the bot author
      places in their `interactions.middlewares` folder, extending their
      transport's `InteractionMiddleware` (the base class is transport-exported,
      so the plugin cannot pre-decorate it) and delegating to plugin methods
      `beginDispatch()` / `endDispatch(result)`.
- [ ] The middleware reads the decorated class's override and applies
      attributes / span name / sampling to the dispatch span, correlating with
      Phase 3 telemetry.
- [ ] Keep `Plugin<{ runtime: 'server'; transport: 'any' }>` (Requirement 1)
      and pass the spec to `super()` per the installed core version.

## Phase 5 — Opt-in auto-instrumentation

- [ ] `instrumentations` option supporting `undici` / `http` (undici traces
      discord.js REST — answers "is it my code or Discord that's slow").
- [ ] Default stays Winston-only to keep the default light.

## Phase 6 — Clean API, docs, tests

- [ ] Cut the alias zoo: keep `otelOverrideOf` + one plugin helper method; drop
      `overrideOTelOf`, `getOTelOverride`, `getOverrideOTel`,
      `OverrideOTelOf`, the 3 static aliases, and the extra metadata-key
      aliases.
- [ ] Replace the global `Reflect` monkey-patch with a plain WeakMap store (no
      import side effects).
- [ ] README: install/attach, options table, env-var table, middleware
      snippet, decorator examples, scenario recipes (local console, local
      collector, SaaS backend).
- [ ] Vitest suites:
  - [ ] exporter resolution (env / option / console fallback);
  - [ ] merge semantics — user exporters replace defaults (regression test
        for the defu trap);
  - [ ] decorator storage + middleware application;
  - [ ] bus-bridge emission against a fake bus;
  - [ ] dispose flush behavior.

## Verification points during implementation

- [ ] Middleware's access to the handler class for override lookup; fallback
      is recording routeId ↔ override at decoration time.
- [ ] Exact OTLP protocol selection from `OTEL_EXPORTER_OTLP_PROTOCOL`.
- [ ] Confirm `SubscriptionData<'key'>` import surface from `@seedcord/core`
      for the bridge payloads.
- [ ] Confirm the dispatch span end in middleware `after()` is consistent with
      `interactionDispatched` — middleware `after()` callbacks run *after*
      seedcord publishes that key, so the span closes after the bus metric,
      both under the same `dispatchId`.
- [ ] `handledException` may carry a `Notice` thrown from autocomplete (it
      publishes on the fault keys, not a dispatch key) — the bridge must not
      assume `routeId` exists on it.
- [ ] Run `seedcord ask` / read the docs page for any core API the plugin
      touches, per the repo's agent instructions.
- [ ] `pnpm run typecheck` and `pnpm run test` green in
      `plugins/opentelemetry`; playground attaches and boots with the plugin
      before calling it done.

## Suggested release order

1. Phases 0–1 as one PR — pure fixes, no behavior change beyond correctness.
2. Phase 2 — the headline 99% change.
3. Phase 3 — bus bridge.
4. Phase 4 — decorator + middleware.
5. Phases 5–6 — instrumentation option, docs, tests.

Each phase is independently shippable.

## Resources

- seedcord docs: <https://seedcord.org/docs>
- guide index: <https://guide.seedcord.org/llms.txt>
- DESIGN.md — full design rationale for this plan
- the bus: <https://seedcord.org/guide/events/bus.md>
- the framework's bus keys: <https://seedcord.org/guide/events/default-keys.md>
- reading the telemetry: <https://seedcord.org/guide/events/telemetry.md>
- middleware: <https://seedcord.org/guide/checks/middleware.md>
- plugin lifecycles: <https://seedcord.org/guide/plugins/lifecycle.md>
- plugin runtimes: <https://seedcord.org/guide/writing-plugins/runtimes.md>
