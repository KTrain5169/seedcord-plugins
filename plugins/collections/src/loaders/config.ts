import type { StandardJSONSchemaV1, StandardSchemaV1 } from "@standard-schema/spec";

/** A validator that implements both Standard Schema and Standard JSON Schema. */
export type StandardCombinedV1<TInput = unknown, TOutput = TInput> = StandardSchemaV1<
  TInput,
  TOutput
> &
  StandardJSONSchemaV1<TInput, TOutput>;

/**
 * Schema options for a live collection loader.
 *
 * Omitting `generateJsonSchema` only requires a Standard Schema validator that
 * can validate entries. Setting `generateJsonSchema` additionally requires the
 * schema to expose a Standard JSON Schema converter, and requires an `outDir`
 * for the future generated output.
 *
 * JSON Schema generation is not implemented yet. These options exist so
 * collections can opt in at the type level without another breaking change
 * when generation lands.
 */
export type LoaderOptions<TSchema extends StandardSchemaV1 = StandardSchemaV1> =
  | {
      /** Validates (and optionally transforms) each entry before it is returned. */
      readonly schema: TSchema;

      /** Omit to disable JSON Schema generation for this collection. */
      readonly generateJsonSchema?: undefined;

      /** Only meaningful when {@link generateJsonSchema} is set. */
      readonly outDir?: undefined;
    }
  | {
      /**
       * Validates each entry and can also describe itself as JSON Schema.
       */
      readonly schema: TSchema & StandardJSONSchemaV1;

      /**
       * Target version for the generated JSON Schema.
       *
       * Currently a no-op; generation is reserved for a future release.
       */
      readonly generateJsonSchema: StandardJSONSchemaV1.Options["target"];

      /** Directory where the generated JSON Schema will be written. */
      readonly outDir: string;
    };

/** Fields every complete collection definition carries. */
export interface CollectionFields {
  /**
   * A human-readable name for this loader. It is used in logs and error
   * messages, and does not have to match the collection's key.
   */
  readonly name: string;

  /**
   * Loads a single entry by its id.
   *
   * Return `undefined` when the entry does not exist. The schema is not run for
   * missing entries.
   */
  readonly loader: (item: string) => unknown | Promise<unknown>;

  /**
   * Returns the ids of every entry currently in the collection.
   *
   * This is called on every {@link Collections.listItems} call. It may do I/O,
   * and may return a promise.
   */
  readonly generateIds: () => readonly string[] | Promise<readonly string[]>;

  /**
   * Only live collections are supported. Build-time collections never run and
   * do not have a configuration shape.
   */
  readonly type: "live";
}

/**
 * Options for a live collection.
 *
 * Combines the reusable loader and schema options with the collection's
 * identity and data-loading functions.
 */
export type CollectionOptions<TSchema extends StandardSchemaV1 = StandardSchemaV1> =
  LoaderOptions<TSchema> & CollectionFields;

/**
 * A live collection definition.
 */
export type LiveCollectionOptions<TSchema extends StandardSchemaV1 = StandardSchemaV1> =
  CollectionOptions<TSchema>;
