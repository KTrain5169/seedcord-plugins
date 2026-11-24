/**
 * The slice of Vite's import.meta.env this package reads, so it type-checks
 * without vite/client in its tsconfig. Vite replaces it under seedcord dev and
 * in a build; untransformed code on Node reads no env at all.
 */
interface ImportMetaEnv {
    readonly MODE?: string
    readonly PROD?: boolean
}

interface ImportMeta {
    readonly env?: ImportMetaEnv
}
