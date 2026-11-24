---
title: DB
description: SQL database access for your bot through db0, with optional Drizzle and Kysely integrations.
---

The DB plugin ([`seedcord-plugin-db0`](https://www.npmjs.com/package/seedcord-plugin-db0)) wraps [db0](https://github.com/unjs/db0) as a seedcord plugin. Pick a connector for the database of your choice, and attach one of three entrypoints:

| Entrypoint | Import from | What `getDatabase()` returns |
| --- | --- | --- |
| Plain db0 | `seedcord-plugin-db0` | A `Database` for raw SQL. |
| Drizzle ORM | `seedcord-plugin-db0/drizzle` | A Drizzle instance typed to your connector's dialect. |
| Kysely | `seedcord-plugin-db0/kysely` | A `Kysely` instance typed to your table definitions. |

All three share one constructor shape: the host, a db0 connector, and an optional config for the integration.

## Install

```sh
pnpm add seedcord-plugin-db0
```

You also need the driver library your connector uses, for example `better-sqlite3` or `pg`. When you use the Drizzle or Kysely entrypoint, install `drizzle-orm` or `kysely` as well — both are optional peer dependencies and are only required for the entrypoint you import.

## Pick a connector

Connectors come from db0 (`db0/connectors/<name>`) and each returns a `Connector` ready to pass to the plugin. Every db0 connector is supported: `better-sqlite3`, `sqlite3`, `node-sqlite`, `libsql`, `mysql2`, `postgresql`, `neon`, `planetscale`, `pglite`, `cloudflare-d1`, and the rest.

```ts
import sqlite from 'db0/connectors/better-sqlite3'

const connector = sqlite({ path: 'data.db' })
```

## Plain db0

Attach the root entrypoint and `getDatabase()` gives you db0's `Database`: `exec`, `prepare`, and the `sql` tagged template for typed queries.

```ts
import { DB0Plugin } from 'seedcord-plugin-db0'
import sqlite from 'db0/connectors/better-sqlite3'

seedcord.attach('db', DB0Plugin, sqlite({ path: 'data.db' }))
```

```ts mark={6-7}
import { SlashHandler, SlashRoute } from '@seedcord/gateway'

@SlashRoute('tag')
export class Tag extends SlashHandler<'tag'> {
    override async execute(): Promise<void> {
        const db = this.core.db.getDatabase()
        const result = await db.sql`SELECT * FROM tags WHERE name = ${this.options.getString('name')}`
        await this.reply(result.rows?.[0]?.value ?? 'Tag not found.')
    }
}
```

## Drizzle

Import the class from `seedcord-plugin-db0/drizzle` and attach it with the same connector. The plugin detects the connector's dialect and builds the matching Drizzle client, so `getDatabase()` returns `DrizzleSQLiteDatabase`, `DrizzlePgDatabase`, or `DrizzleMySqlDatabase` depending on what you attached.

```ts
import { DB0Plugin } from 'seedcord-plugin-db0/drizzle'
import sqlite from 'db0/connectors/better-sqlite3'

seedcord.attach('db', DB0Plugin, sqlite({ path: 'data.db' }), { schema })
```

```ts mark={6-7}
import { SlashHandler, SlashRoute } from '@seedcord/gateway'

@SlashRoute('tag')
export class Tag extends SlashHandler<'tag'> {
    override async execute(): Promise<void> {
        const drizzle = this.core.db.getDatabase()
        const row = await drizzle.query.tags.findFirst({
            where: eq(tags.name, this.options.getString('name')),
        })
        await this.reply(row?.value ?? 'Tag not found.')
    }
}
```

Supported dialects are `sqlite`, `libsql`, `postgresql`, and `mysql` — `init()` throws on anything else. The third constructor argument is the config db0's Drizzle integration takes (`DB0DrizzleSQLiteConfig`, `DrizzlePgConfig`, or `DrizzleMySqlConfig` depending on dialect) and is optional.

`getRawDatabase()` still returns the underlying db0 `Database` when you need a raw query next to your ORM code.

## Kysely

Import the class from `seedcord-plugin-db0/kysely`. Its first type parameter is your table definitions, and `getDatabase()` returns a fully typed `Kysely` instance.

```ts
import { DB0Plugin } from 'seedcord-plugin-db0/kysely'
import sqlite from 'db0/connectors/better-sqlite3'

interface DatabaseTables {
    tags: { id: number; name: string; value: string }
}

seedcord.attach('db', DB0Plugin<DatabaseTables>, sqlite({ path: 'data.db' }))
```

```ts mark={6-10}
import { SlashHandler, SlashRoute } from '@seedcord/gateway'

@SlashRoute('tag')
export class Tag extends SlashHandler<'tag'> {
    override async execute(): Promise<void> {
        const kysely = this.core.db.getDatabase()
        const row = await kysely
            .selectFrom('tags')
            .select('value')
            .where('name', '=', this.options.getString('name'))
            .executeTakeFirst()
        await this.reply(row?.value ?? 'Tag not found.')
    }
}
```

The third constructor argument takes Kysely's `KyselyConfig` minus `dialect` — db0 supplies the dialect from your connector — and is optional.

`getRawDatabase()` returns the underlying db0 `Database` here too.

## Lifecycle

seedcord calls the plugin like any other:

| Method | When | What it does |
| --- | --- | --- |
| `init()` | `StartupPhase.Configuration` | Creates the db0 `Database`, then the ORM client (Drizzle and Kysely entrypoints). |
| `dispose()` | `ShutdownPhase.Disconnect` | Closes the database connection. |

:::note
A Prisma entrypoint is planned but not published yet. Only the root, `./drizzle`, and `./kysely` exports exist today.
:::

## API

All three classes are named `DB0Plugin` — the entrypoint you import from decides which one you get.

### `seedcord-plugin-db0`

```ts
new DB0Plugin(host, connector)
```

| Parameter | Type | Description |
| --- | --- | --- |
| `host` | `CoreBase` | Passed by `attach()`. |
| `connector` | `Connector` | The db0 connector. |

| Method | Returns | Description |
| --- | --- | --- |
| `getDatabase()` | `Database<TConnector>` | The db0 instance. Available after `init()`. |
| `init()` | `Promise<void>` | Creates the database instance. |
| `dispose()` | `Promise<void>` | Disposes the database instance. |

### `seedcord-plugin-db0/drizzle`

```ts
new DB0Plugin(host, connector, drizzleConfig?)
```

| Parameter | Type | Description |
| --- | --- | --- |
| `host` | `CoreBase` | Passed by `attach()`. |
| `connector` | `Connector` | The db0 connector. `sqlite`, `libsql`, `postgresql`, and `mysql` dialects only. |
| `drizzleConfig` | dialect config (optional) | Passed straight to db0's Drizzle integration. |

| Method | Returns | Description |
| --- | --- | --- |
| `getDatabase()` | `DrizzleSQLiteDatabase` / `DrizzlePgDatabase` / `DrizzleMySqlDatabase` | The Drizzle client for your connector's dialect. |
| `getRawDatabase()` | `Database<TConnector>` | The underlying db0 instance. |
| `init()` | `Promise<void>` | Creates the db0 instance and the Drizzle client. Throws on an unsupported dialect. |
| `dispose()` | `Promise<void>` | Disposes the Drizzle client. |

### `seedcord-plugin-db0/kysely`

```ts
new DB0Plugin<DatabaseTables>(host, connector, kyselyConfig?)
```

| Parameter | Type | Description |
| --- | --- | --- |
| `DatabaseTables` | type parameter | Your table definitions. Types everything `getDatabase()` returns. |
| `host` | `CoreBase` | Passed by `attach()`. |
| `connector` | `Connector` | The db0 connector. |
| `kyselyConfig` | `Omit<KyselyConfig, 'dialect'>` (optional) | Passed straight to db0's Kysely integration. |

| Method | Returns | Description |
| --- | --- | --- |
| `getDatabase()` | `Kysely<DatabaseTables>` | The Kysely instance. |
| `getRawDatabase()` | `Database<TConnector>` | The underlying db0 instance. |
| `init()` | `Promise<void>` | Creates the db0 instance and the Kysely instance. |
| `dispose()` | `Promise<void>` | Disposes the db0 instance. |
