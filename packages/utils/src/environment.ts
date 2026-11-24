import { ENVIRONMENT_KEYS, Envapter } from 'envapt'

/**
 * One value for each environment, development and production. Each slot
 * takes the value itself or a factory that builds it, so only the value the
 * bot runs with is ever constructed.
 */
export type EnvironmentPair<T extends object> = {
    prod: T | (() => T)
    dev: T | (() => T)
}

function isFactory<T extends object>(value: T | (() => T)): value is () => T {
    return typeof value === 'function'
}

function resolve<T extends object>(value: T | (() => T)): T {
    return isFactory(value) ? value() : value
}

/**
 * The session's mode. When Vite transformed this code, its MODE wins. When it
 * didn't — a package loaded straight from node_modules on Node — envapt's
 * detection decides, but only when one of the mode variables was actually
 * passed, reading the same shell and .env values envapt does. With none of
 * them set, production is the default, so a Node bot started with no
 * environment at all runs the prod value instead of silently falling into
 * development.
 */
function detectMode(): string {
    const viteMode = import.meta.env?.MODE
    if (viteMode !== undefined) {
        return viteMode
    }
    for (const key of ENVIRONMENT_KEYS) {
        const value = Envapter.get(key)
        if (value !== undefined && value !== '') {
            return Envapter.environment
        }
    }
    return 'production'
}

/**
 * Picks the `dev` value while the session runs in development and the `prod`
 * value in production and staging. A value that isn't a pair passes through
 * as it is, whatever the environment.
 */
export function byEnvironment<const T extends object>(options: T | EnvironmentPair<T>): T
export function byEnvironment<const T extends object>(options: T | EnvironmentPair<T> | undefined): T | undefined
export function byEnvironment<const T extends object>(options: T | EnvironmentPair<T> | undefined): T | undefined {
    if (options === undefined || !('prod' in options)) {
        return options
    }
    // Vite fills import.meta.env.MODE with the session's mode and statically
    // replaces it in a build, folding the pick to a constant: development
    // under seedcord dev, production baked into the bundle. Code Vite never
    // transformed, like a package loaded straight from node_modules on Node,
    // reads no env at all, and the mode comes from detectMode() instead.
    const mode = detectMode()
    return resolve(mode === 'production' || mode === 'staging' ? options.prod : options.dev)
}
