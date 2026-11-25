---
"seedcord-plugin-db0": minor
"seedcord-plugin-unstorage": minor
---

Accept one driver or connector for each environment.

Pass a single value as before to use it in every environment, or pass `{ dev, prod }` — both slots required, each taking the value itself or a factory like `prod: () => redisDriver(...)`, so only the driver the bot runs with is ever constructed. The plugin picks `dev` while the session runs in development and `prod` in production and staging, from the mode Vite fills into `import.meta.env.MODE`: `development` under seedcord dev, `production` baked into a build. Code Vite never transformed, like a package loaded straight from node_modules on Node, reads the mode from envapt's runtime detection instead — defaulting to `prod` when no mode variable was passed at all — so `envapt` is a peer dependency again. If you passed `{ prod }` without a `dev` slot on an earlier db0 version, pass the connector by itself instead — the object form now requires both.
