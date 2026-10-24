import type { StandardSchemaV1, StandardJSONSchemaV1 } from "@standard-schema/spec";

type StandardCombinedV1 = StandardSchemaV1 & StandardJSONSchemaV1;

type SchemaOptions =
  | {
      schema: StandardSchemaV1;
      generateJsonSchema?: false;
    }
  | {
      schema: StandardCombinedV1;
      generateJsonSchema: true;
      outDir: string;
    };

export type LoaderOptions = SchemaOptions & {
  name: string;
  loader: (item: string) => unknown;
  generateIds: () => string[];
  type: "live"; // build coming soon?
};
