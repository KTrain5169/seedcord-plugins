import type { CoreBase } from "@seedcord/core";
import { Plugin } from "@seedcord/core/plugin";
import type { StandardSchemaV1 } from "@standard-schema/spec";

import { CollectionError, CollectionNotFoundError, CollectionValidationError } from "./errors";
import type { CollectionOptions } from "./loaders/config";

export { CollectionError, CollectionNotFoundError, CollectionValidationError } from "./errors";
export { collectionFromLoader, defineCollection, defineLoader } from "./loaders";
export type {
  CollectionFields,
  CollectionOptions,
  LiveCollectionOptions,
  LoaderOptions,
  StandardCombinedV1,
} from "./loaders/config";

export interface CollectionsConfig {
  readonly collections: Record<string, CollectionOptions>;
}

export type CollectionName<TConfig extends CollectionsConfig> = Extract<
  keyof TConfig["collections"],
  string
>;

export type CollectionSchema<
  TConfig extends CollectionsConfig,
  TName extends CollectionName<TConfig>,
> = TConfig["collections"][TName]["schema"];

export type CollectionEntry<
  TConfig extends CollectionsConfig,
  TName extends CollectionName<TConfig>,
> = StandardSchemaV1.InferOutput<CollectionSchema<TConfig, TName>>;

export type CollectionItemResult<
  TConfig extends CollectionsConfig,
  TName extends CollectionName<TConfig>,
> = CollectionEntry<TConfig, TName> | StandardSchemaV1.Issue[] | undefined;

export class Collections<const TConfig extends CollectionsConfig> extends Plugin<{
  runtime: "server";
}> {
  public constructor(
    host: CoreBase,
    private readonly cfg: TConfig,
  ) {
    super(host);

    this.assertConfig();
  }

  public async init(): Promise<void> {
    const names = this.collectionNames();
    this.logger.debug(
      `registered ${names.length} live collection${names.length === 1 ? "" : "s"}${
        names.length > 0 ? `: ${names.join(", ")}` : ""
      }`,
    );
  }

  public async listCollections(): Promise<CollectionName<TConfig>[]> {
    return this.collectionNames();
  }

  public async listItems<const TName extends CollectionName<TConfig>>(
    collection: TName,
  ): Promise<CollectionEntry<TConfig, TName>[]> {
    const definition = this.resolve(collection);
    const ids = await definition.generateIds();

    if (!Array.isArray(ids)) {
      throw new CollectionError(
        `Collection "${String(collection)}" loader "${definition.name}" returned a non-array from generateIds().`,
      );
    }

    const uniqueIds: string[] = [];
    const seen = new Set<string>();

    for (const id of ids) {
      if (typeof id !== "string") {
        throw new CollectionError(
          `Collection "${String(collection)}" loader "${definition.name}" returned a non-string id from generateIds().`,
        );
      }

      if (seen.has(id)) continue;

      seen.add(id);
      uniqueIds.push(id);
    }

    const loaded = await Promise.all(
      uniqueIds.map(async (id) => ({ id, result: await this.load(collection, id) })),
    );
    const entries: CollectionEntry<TConfig, TName>[] = [];

    for (const { id, result } of loaded) {
      if (result.status === "invalid") {
        throw new CollectionValidationError(String(collection), id, result.issues);
      }

      if (result.status === "ok") entries.push(result.value);
    }

    return entries;
  }

  public async getItem<const TName extends CollectionName<TConfig>>(
    collection: TName,
    item: string,
  ): Promise<CollectionItemResult<TConfig, TName>> {
    const result = await this.load(collection, item);

    if (result.status === "missing") return undefined;
    if (result.status === "invalid") return [...result.issues];

    return result.value;
  }

  private collectionNames(): CollectionName<TConfig>[] {
    return Object.keys(this.cfg.collections) as CollectionName<TConfig>[];
  }

  private resolve<const TName extends CollectionName<TConfig>>(
    name: TName,
  ): TConfig["collections"][TName] {
    if (!Object.prototype.hasOwnProperty.call(this.cfg.collections, name)) {
      throw new CollectionNotFoundError(String(name), this.collectionNames());
    }

    return this.cfg.collections[name] as TConfig["collections"][TName];
  }

  private async load<const TName extends CollectionName<TConfig>>(
    collection: TName,
    id: string,
  ): Promise<
    | { readonly status: "missing" }
    | { readonly status: "invalid"; readonly issues: readonly StandardSchemaV1.Issue[] }
    | { readonly status: "ok"; readonly value: CollectionEntry<TConfig, TName> }
  > {
    const definition = this.resolve(collection);
    const value = await definition.loader(id);

    if (value === undefined) return { status: "missing" };

    const result = await definition.schema["~standard"].validate(value);

    if (result.issues !== undefined) {
      return { status: "invalid", issues: result.issues };
    }

    return { status: "ok", value: result.value as CollectionEntry<TConfig, TName> };
  }

  private assertConfig(): void {
    const collections = (this.cfg as CollectionsConfig | undefined)?.collections;

    if (collections === null || typeof collections !== "object" || Array.isArray(collections)) {
      this.rejectOptions("config.collections must be an object of live collections");
    }

    for (const [key, collection] of Object.entries(collections as Record<string, unknown>)) {
      if (key.trim().length === 0) {
        this.rejectOptions("collection names cannot be empty");
      }

      if (collection === null || typeof collection !== "object") {
        this.rejectOptions(`collection "${key}" must be a live loader object`);
      }

      const definition = collection as Partial<CollectionOptions>;

      if (typeof definition.name !== "string" || definition.name.trim().length === 0) {
        this.rejectOptions(`collection "${key}" needs a non-empty loader name`);
      }

      if (definition.type !== "live") {
        this.rejectOptions(`collection "${key}" must be live (set type to "live")`);
      }

      if (typeof definition.generateIds !== "function") {
        this.rejectOptions(`collection "${key}" needs a generateIds() function`);
      }

      if (typeof definition.loader !== "function") {
        this.rejectOptions(`collection "${key}" needs a loader() function`);
      }

      if (!isStandardSchema(definition.schema)) {
        this.rejectOptions(`collection "${key}" needs a Standard Schema schema`);
      }
    }
  }
}

function isStandardSchema(value: unknown): value is StandardSchemaV1 {
  if (typeof value !== "object" || value === null || !("~standard" in value)) return false;

  const standard = (value as { "~standard"?: { validate?: unknown } })["~standard"];
  return (
    typeof standard === "object" && standard !== null && typeof standard.validate === "function"
  );
}
