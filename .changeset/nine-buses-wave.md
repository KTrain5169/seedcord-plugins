---
"seedcord-plugin-unstorage": minor
---

Add a `@OverrideUnstorage` decorator under `seedcord-plugin-unstorage/decorators` that overrides the KV settings for a single handler or middleware. A decorated class reads its own storage through `this.unstorage`, declares it with a `declare unstorage: Storage<...>` line (TypeScript's legacy decorators can't add members to a class's type), and takes the same settings as the plugin: a single driver or a `{ dev, prod }` pair, each slot a value or a factory. The storage builds lazily on the first read, is shared by every instance of the class, and the attached plugin disposes it on shutdown.
