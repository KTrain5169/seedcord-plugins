# seedcord-plugin-unstorage

A seedcord plugin that gives a bot a typed [unstorage](https://unstorage.unjs.io) instance, started and stopped with the bot, plus a decorator that overrides the settings for a single handler or middleware.

## Install

```sh
pnpm add seedcord-plugin-unstorage
```

The plugin ships its own copy of unstorage, but your bot's code imports drivers from it, so add `unstorage` too when you pass one:

```sh
pnpm add unstorage
```

## Attaching

```ts title="src/bot.ts"
import { Seedcord } from '@seedcord/gateway';
import { UnstorageClass } from 'seedcord-plugin-unstorage';

export const seedcord = new Seedcord({ /* ... */ })
    .attach('storage', UnstorageClass<string>);
```

With no options the storage is in-memory. Pass a single driver to use it in every environment:

```ts
import fsDriver from 'unstorage/drivers/fs';

.attach('storage', UnstorageClass<string>, fsDriver({ base: './data' }));
```

Run `seedcord codegen` after attaching, then read the store from any handler:

```ts
const storage = this.core.storage.getStorage(); // Storage<string>
await storage.setItem('key', 'value');
```

## One driver for each environment

Pass `{ dev, prod }` — both slots required — and the plugin picks per session. Each slot takes the driver itself or a factory that builds it, so only the driver the bot runs with is ever constructed:

```ts
import memoryDriver from 'unstorage/drivers/memory';
import redisDriver from 'unstorage/drivers/redis';
import { Converters, Envapter } from 'envapt';

.attach('storage', UnstorageClass<string>, {
    prod: () => redisDriver({
        url: Envapter.getRequired('REDIS_URL', Converters.String)
    }),
    dev: () => memoryDriver()
});
```

How the pick is made:

| session | slot |
| --- | --- |
| `seedcord dev` | `dev` |
| `ENV=production pnpm run dev` | `prod` — try the production driver in your dev loop |
| a production or staging build | `prod`, baked in wherever Vite bundles this package |
| a built Node bot | envapt's runtime detection, reading `ENVIRONMENT`, `ENV`, `NODE_ENV`, or `MODE` |

A built Node bot loads this package straight from `node_modules`, where no Vite flag can reach, so the mode there comes from envapt's runtime detection, reading `ENVIRONMENT`, `ENV`, `NODE_ENV`, or `MODE`. Start it the way seedcord's deploy docs describe — `ENV=production node dist/index.mjs` — and run `NODE_ENV=development` locally to flip it. With no mode variable set at all, the `prod` value is the default, so an unconfigured deployment runs the production driver rather than silently falling into development. A single value passed instead of a pair is used in every environment, unchanged.

## Overriding the settings for one handler or middleware

`seedcord-plugin-unstorage/decorators` exports a `@OverrideUnstorage` decorator for a class that needs its own storage. It takes the same settings as the plugin — a single driver or a `{ dev, prod }` pair — and the decorated class reads its storage through `this.unstorage`, a property the decorator defines on the class. The plugin itself is unaffected: it stays at `this.core.<your-attach-key>` and keeps serving every other handler, and a decorated class's `this.unstorage` is a separate storage built from these settings.

```ts title="src/handlers/GetStorage.ts"
import { SlashHandler, SlashRoute } from '@seedcord/gateway';
import { OverrideUnstorage } from 'seedcord-plugin-unstorage/decorators';
import memoryDriver from 'unstorage/drivers/memory';
import type { Storage } from 'unstorage';

@SlashRoute('get_storage')
@OverrideUnstorage<string>({
    prod: () => redisDriver({ url: 'redis://localhost:6379' }),
    dev: () => memoryDriver()
})
export class GetStorage extends SlashHandler<'get_storage'> {
    declare unstorage: Storage<string>;

    override async execute(): Promise<void> {
        const value = await this.unstorage.get(this.options.getString('key'));
        // ...
    }
}
```

The same decorator works on a middleware class, or any class: the getter lands on the prototype.

Things worth knowing:

- **The `declare unstorage` line is required.** TypeScript's legacy decorators can't add members to the class they decorate, so the line is what types `this.unstorage`; the decorator supplies the runtime getter.
- **Write `declare`, not a plain field.** seedcord's tsconfigs set `useDefineForClassFields`, under which a non-`declare` field emits a `defineProperty` in the constructor that replaces the decorator's getter.
- **Legacy decorators only.** seedcord doesn't support the TC39 decorator syntax; a bot created with it already runs `experimentalDecorators`.
- **Stacking order doesn't matter.** The decorator mutates the class instead of replacing it, so `@SlashRoute` registers the same class either way.
- **The storage is lazy and shared.** It's built on the first `this.unstorage` read, every instance of the class shares it, and the attached plugin disposes it on shutdown.

## Peer dependencies

- `@seedcord/core` — `^0.14.0`
- `unstorage` — `^1.17.5`, optional, needed once your code imports drivers

`envapt` is a peer of [`@ktrain5369/seedcord-plugin-utils`](https://github.com/KTrain5169/seedcord-plugins), the shared package this plugin resolves its options with, and through it of any bot that passes a pair.
