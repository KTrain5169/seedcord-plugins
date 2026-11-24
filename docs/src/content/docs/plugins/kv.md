---
title: KV
description: Key-value storage for your bot, backed by Unstorage.
---

The KV plugin ([`seedcord-plugin-unstorage`](https://www.npmjs.com/package/seedcord-plugin-unstorage)) wraps [Unstorage](https://unstorage.unjs.io) as a seedcord plugin. Attach it once with the driver of your choice, then read and write typed key-value storage from any handler through `this.core`.

```ts
import { UnstorageClass } from 'seedcord-plugin-unstorage'

seedcord.attach('storage', UnstorageClass<string>)
```

The class takes one type parameter, `TValueType`, which narrows the type of every value you `get()` and `set()`.

:::note
This plugin is your own storage. It is separate from the framework's built-in `this.kv` records that every plugin already has access to.
:::

## Install

```sh
pnpm add seedcord-plugin-unstorage
```

`unstorage` ships with the plugin. The only peer dependency is `@seedcord/core`.

## Attach

Pass the driver as the second constructor argument. seedcord forwards everything after the host to your constructor, so the driver simply follows the class:

```ts
import { UnstorageClass } from 'seedcord-plugin-unstorage'
import redisDriver from 'unstorage/drivers/redis'

seedcord.attach('storage', UnstorageClass<string>, redisDriver({
    base: 'redis://localhost:6379/0',
}))
```

Omit the driver and Unstorage falls back to its in-memory driver — the storage works, but everything is lost on restart.

Any [Unstorage driver](https://unstorage.unjs.io/drivers) works the same way: `fs`, `http`, `cloudflare-kv-binding`, `libsql`, and the rest are imported from `unstorage/drivers/<name>`.

## Use it

`getStorage()` returns the `Storage` instance Unstorage created. Every Unstorage method is available: `get`, `setItem`, `del`, `keys`, `getItems`, and the rest.

```ts mark={6-7}
import { SlashHandler, SlashRoute } from '@seedcord/gateway'

@SlashRoute('write_storage')
export class WriteStorage extends SlashHandler<'write_storage'> {
    override async execute(): Promise<void> {
        const storage = this.core.storage.getStorage()
        await storage.set(this.options.getString('key'), this.options.getString('value'))
        await this.reply(`Successfully wrote to key "${this.options.getString('key')}"!`)
    }
}
```

Because the playground attached the plugin as `UnstorageClass<string>`, `storage.get()` returns `string | null` here instead of a loose `StorageValue`.

## Lifecycle

seedcord calls the plugin like any other:

| Method | When | What it does |
| --- | --- | --- |
| `init()` | `StartupPhase.Configuration` | Creates the `Storage` instance with the driver you passed. |
| `dispose()` | `ShutdownPhase.Disconnect` | Calls `storage.dispose()`, closing driver connections. |

## API

### `class UnstorageClass<TValueType>`

```ts
new UnstorageClass(host, driver?)
```

| Parameter | Type | Description |
| --- | --- | --- |
| `host` | `CoreBase` | Passed by `attach()`. |
| `driver` | `Driver` (optional) | The Unstorage driver. Defaults to in-memory storage. |

| Method | Returns | Description |
| --- | --- | --- |
| `getStorage()` | `Storage<TValueType>` | The Unstorage instance. Available after `init()`. |
| `init()` | `Promise<void>` | Creates the storage instance. |
| `dispose()` | `Promise<void>` | Disposes the storage instance. |
