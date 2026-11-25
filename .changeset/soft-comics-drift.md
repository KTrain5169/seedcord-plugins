---
"@ktrain5369/seedcord-plugin-utils": minor
---

Initial release: the shared helpers used by the unstorage and db0 plugins, starting with `byEnvironment` and `EnvironmentPair`, the dev/prod value pair both plugins resolve their options with — Vite's `import.meta.env.MODE` where Vite transformed the code, envapt's runtime detection where it didn't, and the `prod` value when no mode variable was passed at all.
