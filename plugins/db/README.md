# seedcord-plugin-db0

A seedcord plugin that gives a bot a [db0](https://github.com/unjs/db0) database, started and stopped with the bot, with optional drizzle and kysely integrations.

Three entrypoints:

| import | what `getDatabase()` returns |
| --- | --- |
| `seedcord-plugin-db0` | the db0 `Database` |
| `seedcord-plugin-db0/drizzle` | a drizzle instance, with `getRawDatabase()` for the db0 `Database` |
| `seedcord-plugin-db0/kysely` | a kysely instance, with `getRawDatabase()` for the db0 `Database` |

## Install

```sh
pnpm add seedcord-plugin-db0 db0
```

Add `drizzle-orm` or `kysely` when you use the relevant entrypoints. All three are optional peers of this package.

## Attaching

```ts title="src/bot.ts"
import { Seedcord } from '@seedcord/gateway';
import { DB0Plugin } from 'seedcord-plugin-db0';
import sqliteConnector from 'db0/connectors/better-sqlite3';

export const seedcord = new Seedcord({ /* ... */ })
    .attach('db', DB0Plugin, sqliteConnector({ path: './data.db' }));
```

Run `seedcord codegen` after attaching, then read the database from any handler:

```ts
const db = this.core.db.getDatabase();
await db.sql`SELECT * FROM users`;
```

The drizzle entrypoint takes the same connector plus an optional drizzle config, and supports the `sqlite`, `libsql`, `postgresql`, and `mysql` dialects. The kysely entrypoint takes the connector plus an optional kysely config:

```ts
import { DB0Plugin } from 'seedcord-plugin-db0/drizzle';

.attach('db', DB0Plugin, sqliteConnector({ path: './data.db' }));
```

```ts
import { DB0Plugin } from 'seedcord-plugin-db0/kysely';

.attach('db', DB0Plugin, sqliteConnector({ path: './data.db' }));
```

## One connector for each environment

Pass `{ dev, prod }` — both slots required — and the plugin picks per session. Each slot takes the connector itself or a factory that builds it, so only the connector the bot runs with is ever constructed:

```ts
.attach('db', DB0Plugin, {
    prod: () => sqliteConnector({ path: './data.db' }),
    dev: () => sqliteConnector({ path: ':memory:' })
});
```

Both slots must be the same connector *type* — two sqlite paths or two postgres URLs — so `getDatabase()` stays typed as one dialect. For a genuinely different database per environment, pass a single connector chosen in your own `bot.ts`.

How the pick is made:

| session | slot |
| --- | --- |
| `seedcord dev` | `dev` |
| `ENV=production pnpm run dev` | `prod` — try the production connector in your dev loop |
| a production or staging build | `prod`, baked in wherever Vite bundles this package |
| a built Node bot | envapt's runtime detection, reading `ENVIRONMENT`, `ENV`, `NODE_ENV`, or `MODE` |

A built Node bot loads this package straight from `node_modules`, where no Vite flag can reach, so the mode there comes from envapt's runtime detection, reading `ENVIRONMENT`, `ENV`, `NODE_ENV`, or `MODE`. Start it the way seedcord's deploy docs describe — `ENV=production node dist/index.mjs` — and run `NODE_ENV=development` locally to flip it. With no mode variable set at all, the `prod` value is the default, so an unconfigured deployment runs the production connector rather than silently falling into development. A single value passed instead of a pair is used in every environment, unchanged.

## Peer dependencies

- `@seedcord/core` — `^0.14.0`
- `db0` — `^0.4.1`
- `drizzle-orm` — `1.0.0-rc.5`, optional, for the drizzle entrypoint
- `kysely` — `^0.29.7`, optional, for the kysely entrypoint

`envapt` is a peer of [`@ktrain5369/seedcord-plugin-utils`](https://github.com/KTrain5169/seedcord-plugins), the shared package this plugin resolves its options with, and through it of any bot that passes a pair.
