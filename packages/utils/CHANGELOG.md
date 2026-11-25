# @ktrain5369/seedcord-plugin-utils

## 0.1.0

### Minor Changes

- [#9](https://github.com/KTrain5169/seedcord-plugins/pull/9) [`92fdbd4`](https://github.com/KTrain5169/seedcord-plugins/commit/92fdbd470d4dd25b86a53abe2751bfb3da727f08) Thanks [@KTrain5169](https://github.com/KTrain5169)! - Initial release: the shared helpers used by the unstorage and db0 plugins, starting with `byEnvironment` and `EnvironmentPair`, the dev/prod value pair both plugins resolve their options with — Vite's `import.meta.env.MODE` where Vite transformed the code, envapt's runtime detection where it didn't, and the `prod` value when no mode variable was passed at all.
