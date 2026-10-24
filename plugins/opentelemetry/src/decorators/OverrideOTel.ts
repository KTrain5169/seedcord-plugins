import type { NodeSDKConfiguration } from "@opentelemetry/sdk-node";

// Optional polyfill for the metadata API so this package works without an explicit
// `reflect-metadata` import. Uses the real implementation when it is available.
const ReflectMetadata = Reflect as unknown as {
  defineMetadata?: (key: unknown, value: unknown, target: unknown) => void;
  getMetadata?: (key: unknown, target: unknown) => unknown;
  getOwnMetadata?: (key: unknown, target: unknown) => unknown;
  hasMetadata?: (key: unknown, target: unknown) => boolean;
  hasOwnMetadata?: (key: unknown, target: unknown) => boolean;
  deleteMetadata?: (key: unknown, target: unknown) => boolean;
  metadata?: (key: unknown, value: unknown) => (target: unknown) => unknown;
};
const metadataStores = new WeakMap<object, Map<unknown, unknown>>();

function getMetadataStore(target: object): Map<unknown, unknown> {
  let store = metadataStores.get(target);
  if (!store) {
    store = new Map();
    metadataStores.set(target, store);
  }
  return store;
}

function walkPrototypeChain(target: object | null, key: unknown): unknown {
  let current: object | null = target;
  while (current !== null) {
    const store = metadataStores.get(current);
    if (store?.has(key)) return store.get(key);
    current = Object.getPrototypeOf(current) as object | null;
  }
  return undefined;
}

if (typeof ReflectMetadata.defineMetadata !== "function") {
  ReflectMetadata.defineMetadata = (key, value, target) => {
    if (target && (typeof target === "object" || typeof target === "function")) {
      getMetadataStore(target as object).set(key, value);
    }
  };
  ReflectMetadata.getOwnMetadata = (key, target) => {
    if (target && (typeof target === "object" || typeof target === "function")) {
      return metadataStores.get(target as object)?.get(key);
    }
    return undefined;
  };
  ReflectMetadata.getMetadata = (key, target) => {
    if (target && (typeof target === "object" || typeof target === "function")) {
      return walkPrototypeChain(target as object, key);
    }
    return undefined;
  };
  ReflectMetadata.hasOwnMetadata = (key, target) => {
    if (target && (typeof target === "object" || typeof target === "function")) {
      return metadataStores.get(target as object)?.has(key) ?? false;
    }
    return false;
  };
  ReflectMetadata.hasMetadata = (key, target) => {
    if (target && (typeof target === "object" || typeof target === "function")) {
      return walkPrototypeChain(target as object, key) !== undefined;
    }
    return false;
  };
  ReflectMetadata.deleteMetadata = (key, target) => {
    if (target && (typeof target === "object" || typeof target === "function")) {
      return metadataStores.get(target as object)?.delete(key) ?? false;
    }
    return false;
  };
  ReflectMetadata.metadata = (key, value) => (target) => {
    ReflectMetadata.defineMetadata?.(key, value, target);
    return target;
  };
}

const defineMetadata = (target: Function, key: unknown, value: unknown) => {
  if (typeof ReflectMetadata.defineMetadata === "function") {
    ReflectMetadata.defineMetadata(key, value, target);
  } else {
    getMetadataStore(target as object).set(key, value);
  }
};

const getMetadata = (target: Function | object | null | undefined, key: unknown) => {
  if (typeof ReflectMetadata.getMetadata === "function") {
    return ReflectMetadata.getMetadata(key, target);
  }
  if (target && (typeof target === "object" || typeof target === "function")) {
    return walkPrototypeChain(target as object, key);
  }
  return undefined;
};
type Constructor<T = unknown> = new (...args: any[]) => T;

export type OpenTelemetryPluginOptions = { sdkConfig?: Partial<NodeSDKConfiguration> };

/**
 * Metadata key used to store OpenTelemetry option overrides applied to a handler through
 * {@link OverrideOTel}.
 */
export const OverrideOTelMetadataKey = Symbol.for("seedcord:opentelemetry:override");
export const OTelOverrideMetadataKey = OverrideOTelMetadataKey;
export const OpenTelemetryOverrideMetadataKey = OverrideOTelMetadataKey;

/**
 * Normalize a decorator argument into the canonical plugin-option shape. A bare
 * {@link NodeSDKConfiguration} partial is treated as `{ sdkConfig }` so consumers may write either.
 */
function normalizeOptions(
    options?: OpenTelemetryPluginOptions | (Partial<NodeSDKConfiguration> & { sdkConfig?: never })
): OpenTelemetryPluginOptions {
    if (options == null) return {};
    if (typeof options === "object" && "sdkConfig" in options && (options as { sdkConfig?: unknown }).sdkConfig !== undefined) {
        return options as OpenTelemetryPluginOptions;
    }
    // Heuristic: if the object looks like a NodeSDKConfiguration (has sdk-level keys) treat as sdkConfig.
    return { sdkConfig: options as Partial<NodeSDKConfiguration> };
}

function defineOverride(target: Function, options?: OpenTelemetryPluginOptions | Partial<NodeSDKConfiguration>): void {
    const resolved = normalizeOptions(options as OpenTelemetryPluginOptions | Partial<NodeSDKConfiguration>);
    defineMetadata(target, OverrideOTelMetadataKey, resolved);
}

/**
 * Overrides the OpenTelemetry plugin settings for a particular handler.
 *
 * Legacy (experimental) decorator: pass it directly or call it with options. Stores the override as
 * metadata on the decorated handler class so it can be resolved through {@link otelOverrideOf}
 * (or the plugin's `overrideFor` helper) at runtime.
 *
 * @decorator
 * @example
 * ```ts
 * \@OverrideOTel({ sdkConfig: { traceExporter: new ConsoleSpanExporter() } })
 * class PingHandler extends SlashHandler {}
 * ```
 */
export function OverrideOTel(): (ctor: Constructor<object>) => void;
export function OverrideOTel(options?: OpenTelemetryPluginOptions | Partial<NodeSDKConfiguration>): (ctor: Constructor<object>) => void;
export function OverrideOTel(target?: Function | OpenTelemetryPluginOptions | Partial<NodeSDKConfiguration>): unknown {
    if (typeof target === "function") {
        // Applied as a bare decorator (`@OverrideOTel`).
        defineOverride(target, {});
        return;
    }

    // Applied as a factory (`@OverrideOTel()` or `@OverrideOTel({...})`).
    const options = target as OpenTelemetryPluginOptions | Partial<NodeSDKConfiguration> | undefined;
    return (ctor: Constructor<object>): void => {
        defineOverride(ctor, options);
    };
}

export function otelOverrideOf(target: Function | object | null | undefined): OpenTelemetryPluginOptions | undefined {
    if (target == null) return undefined;
    const ctor = typeof target === "function" ? target : (target as { constructor?: Function }).constructor;
    if (ctor == null) return undefined;
    const value = getMetadata(ctor, OverrideOTelMetadataKey);
    return (value ?? undefined) as OpenTelemetryPluginOptions | undefined;
}

export const overrideOTelOf = otelOverrideOf;
export const getOTelOverride = otelOverrideOf;
export const getOverrideOTel = otelOverrideOf;
export const OverrideOTelOf = otelOverrideOf;

export function hasOverrideOTel(target: Function | object | null | undefined): boolean {
    return otelOverrideOf(target) !== undefined;
}