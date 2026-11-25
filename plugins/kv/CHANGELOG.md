# seedcord-plugin-unstorage

## 1.4.0

### Minor Changes

- Bump minimum supported seedcord core to 0.14.0

- [#9](https://github.com/KTrain5169/seedcord-plugins/pull/9) [`7056d46`](https://github.com/KTrain5169/seedcord-plugins/commit/7056d46aa0ae33c5d1d27dfc4989595399aa0194) Thanks [@KTrain5169](https://github.com/KTrain5169)! - Add a `@OverrideUnstorage` decorator under `seedcord-plugin-unstorage/decorators` that overrides the KV settings for a single handler or middleware. A decorated class reads its own storage through `this.unstorage`, declares it with a `declare unstorage: Storage<...>` line (TypeScript's legacy decorators can't add members to a class's type), and takes the same settings as the plugin: a single driver or a `{ dev, prod }` pair, each slot a value or a factory. The storage builds lazily on the first read, is shared by every instance of the class, and the attached plugin disposes it on shutdown.

- [#9](https://github.com/KTrain5169/seedcord-plugins/pull/9) [`d61f8e6`](https://github.com/KTrain5169/seedcord-plugins/commit/d61f8e66c630191b71078e4cf24a3782337496ba) Thanks [@KTrain5169](https://github.com/KTrain5169)! - Accept one driver or connector for each environment.
  
  Pass a single value as before to use it in every environment, or pass `{ dev, prod }` — both slots required, each taking the value itself or a factory like `prod: () => redisDriver(...)`, so only the driver the bot runs with is ever constructed. The plugin picks `dev` while the session runs in development and `prod` in production and staging, from the mode Vite fills into `import.meta.env.MODE`: `development` under seedcord dev, `production` baked into a build. Code Vite never transformed, like a package loaded straight from node_modules on Node, reads the mode from envapt's runtime detection instead — defaulting to `prod` when no mode variable was passed at all — so `envapt` is a peer dependency again. If you passed `{ prod }` without a `dev` slot on an earlier db0 version, pass the connector by itself instead — the object form now requires both.

### Patch Changes

- Updated dependencies [[`92fdbd4`](https://github.com/KTrain5169/seedcord-plugins/commit/92fdbd470d4dd25b86a53abe2751bfb3da727f08)]:
  - @ktrain5369/seedcord-plugin-utils@0.1.0

## 1.3.2

### Patch Changes

- [`5736b2f`](https://github.com/KTrain5169/seedcord-plugins/commit/5736b2fb9a0ceef352d265cc4092f186a44b9291) Thanks [@KTrain5169](https://github.com/KTrain5169)! - Bump compatible seedcord versions

## 1.3.1

### Patch Changes

- [`8e29bda`](https://github.com/KTrain5169/seedcord-plugins/commit/8e29bda03c9c57207b7978fed21db41db97f3c6c) Thanks [@KTrain5169](https://github.com/KTrain5169)! - Bup minimum peer unstorage version

## 1.3.0

### Minor Changes

- [`fc83a65`](https://github.com/KTrain5169/seedcord-plugins/commit/fc83a65abf5f6de77198cc11f9a52c264b9cb0dd) Thanks [@KTrain5169](https://github.com/KTrain5169)! - Bump supported seedcord versions

### Patch Changes

- [`a518045`](https://github.com/KTrain5169/seedcord-plugins/commit/a5180451b61451c2bd1d5143396728fb4001b414) Thanks [@KTrain5169](https://github.com/KTrain5169)! - Make storage and db variables private

- [`33f9b47`](https://github.com/KTrain5169/seedcord-plugins/commit/33f9b47daba8c00ddc0eb97c8c281e48e4730ca0) Thanks [@KTrain5169](https://github.com/KTrain5169)! - Make UnstorageClass create the storage in init() hook instead, a bit annoying but oh well

## 1.2.0

### Minor Changes

- [`e17ac35`](https://github.com/KTrain5169/seedcord-plugins/commit/e17ac3589426d00645669d16d19eeb1f411f9c9b) Thanks [@KTrain5169](https://github.com/KTrain5169)! - bump supported seedcord version

## 1.1.1

### Patch Changes

- [`01b7126`](https://github.com/KTrain5169/seedcord-plugins/commit/01b712603bc427137f7d573517e92693f4000271) Thanks [@KTrain5169](https://github.com/KTrain5169)! - Add build artifacts, thanks

## 1.1.0

### Minor Changes

- [`d2ca768`](https://github.com/KTrain5169/seedcord-plugins/commit/d2ca768af8614b26d3afbcb9262e325d16c894b0) Thanks [@KTrain5169](https://github.com/KTrain5169)! - initial release
