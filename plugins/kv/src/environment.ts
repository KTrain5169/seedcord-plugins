import { Envapter } from 'envapt'

/**
 * One driver for each environment, development and production. Each slot
 * takes the value itself or a factory that builds it, so only the driver the
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
    // reads no env at all, and envapt's runtime detection takes over there,
    // honoring the ENVIRONMENT, ENV, NODE_ENV, or MODE the bot started with.
    const mode = import.meta.env?.MODE ?? Envapter.environment
    return resolve(mode === 'production' || mode === 'staging' ? options.prod : options.dev)
}
