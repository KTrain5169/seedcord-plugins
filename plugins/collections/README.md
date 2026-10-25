# seedcord-plugin-collections

Live content collections for [seedcord](https://seedcord.org) bots.

A collection groups related entries behind one schema. This plugin only supports **live** collections: every read calls the loader, and nothing is cached, generated at build time, or written to disk.

## Install

```sh
pnpm add seedcord-plugin-collections
```

## Define collections

```ts
// src/content.ts
import { defineCollection } from "seedcord-plugin-collections";
import { z } from "zod";

import { db } from "./db";

export const collections = {
  posts: defineCollection({
    name: "posts",
    type: "live",
    // called every time listItems() runs
    generateIds: async () => db.posts.ids(),
    // called for getItem() and for every id listItems() returns
    loader: async (id) => db.posts.find(id),
    schema: z.object({
      title: z.string(),
      body: z.string(),
    }),
  }),
};
```

`schema` accepts any [Standard Schema](https://standardschema.dev) validator, so Zod, Valibot, ArkType, and others work without an adapter.

Schemas that also implement the Standard Schema
[JSON Schema specification](https://standardschema.dev/json-schema) can opt in to
JSON Schema generation:

```ts
const collections = {
  posts: defineCollection({
    name: "posts",
    type: "live",
    generateIds: () => db.posts.ids(),
    loader: (id) => db.posts.find(id),
    schema: z.object({
      title: z.string(),
      body: z.string(),
    }),
    generateJsonSchema: "draft-2020-12",
    outDir: "./generated",
  }),
};
```

`outDir` is required when `generateJsonSchema` is set. The value selects the
target JSON Schema version. The schema must
provide `schema["~standard"].jsonSchema` as defined by `StandardJSONSchemaV1`.

Generation is not wired up yet. For now these options only enforce the schema
shape at the type level, so opting in does not write any files.

If several collections share the same loader options, define them once with
`defineLoader` and attach them with `collectionFromLoader`:

```ts
import { collectionFromLoader, defineLoader } from "seedcord-plugin-collections";

const postLoader = defineLoader({
  schema: z.object({
    title: z.string(),
    body: z.string(),
  }),
});

const collections = {
  posts: collectionFromLoader(postLoader, {
    name: "posts",
    type: "live",
    generateIds: () => db.posts.ids(),
    loader: (id) => db.posts.find(id),
  }),
};
```

## Attach it

```ts
import { Seedcord } from "@seedcord/gateway";

import { collections } from "./content";
import { Collections } from "seedcord-plugin-collections";

export default new Seedcord(config).attach("content", Collections<typeof collections>, {
  collections,
});
```

The collection key is what handlers use:

```ts
const post = await this.core.content.getItem("posts", id);

if (post === undefined) {
  // the loader reported that the entry does not exist
} else if (Array.isArray(post)) {
  // the schema rejected the entry; these are Standard Schema issues
} else {
  post.title; // typed from the schema
}
```

`listItems()` returns every validated entry. It throws `CollectionValidationError` if any entry fails its schema, rather than silently dropping entries. Because there is no cache, calling it again queries the source again.

## API

| Member              | Description                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `listCollections()` | Names of every registered collection.                                                               |
| `listItems(name)`   | Loads, validates, and returns every entry currently in a collection.                                |
| `getItem(name, id)` | Loads and validates one entry. Returns `undefined` when missing, or the schema issues when invalid. |

Errors:

- `CollectionNotFoundError` — an unregistered collection name was queried.
- `CollectionValidationError` — an entry failed its schema while listing a collection.
- `CollectionError` — base class for both.
