import type { CollectionFields, CollectionOptions, LoaderOptions } from "./config";

/**
 * Defines reusable loader options.
 *
 * The returned options preserve the schema's inferred output type and can be
 * used as part of a collection definition. Set `generateJsonSchema` to require
 * a schema that implements both Standard Schema and Standard JSON Schema.
 */
export function defineLoader<const TLoader extends LoaderOptions>(loader: TLoader): TLoader {
  return loader;
}

/**
 * Defines a complete live collection.
 *
 * The returned collection can be passed to {@link Collections} in the
 * `collections` map. Using this helper preserves the schema's inferred output
 * type, so reads from the plugin are typed.
 */
export function defineCollection<const TCollection extends CollectionOptions>(
  collection: TCollection,
): TCollection {
  return collection;
}

/**
 * Combines reusable loader options with the fields that identify a collection.
 *
 * The returned object preserves the loader's exact type, so a schema that also
 * implements Standard JSON Schema stays visible to the collection entry types.
 */
export function collectionFromLoader<
  const TLoader extends LoaderOptions,
  const TFields extends CollectionFields,
>(loader: TLoader, fields: TFields): TLoader & TFields {
  return {
    ...fields,
    ...loader,
  } as TLoader & TFields;
}
