---
"seedcord-plugin-db0": minor
"seedcord-plugin-unstorage": minor
---

Accept one driver or connector for development and another for production.

Pass a single value as before to use it in every environment, or pass `{ dev, prod }` and the plugin picks `dev` while the session runs in development and `prod` in production and staging, from the mode Vite fills into `import.meta.env.MODE`: `development` under seedcord dev, `production` baked into a build. Code Vite never transformed, like a package loaded straight from node_modules on Node, falls back to envapt's runtime detection instead, so `envapt` is a peer dependency again. Each slot also accepts a factory, like `prod: () => redisDriver(...)`, so only the driver the bot runs with is ever constructed.
