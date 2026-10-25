import type { StandardSchemaV1 } from "@standard-schema/spec";

/** Base class for errors thrown by the collections plugin. */
export class CollectionError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** Thrown when a collection name is not registered on the plugin. */
export class CollectionNotFoundError extends CollectionError {
  /** The collection name that was requested. */
  public readonly collection: string;

  /** Every collection name that is registered. */
  public readonly available: readonly string[];

  constructor(collection: string, available: readonly string[]) {
    const list = available.length === 0 ? "none" : available.join(", ");
    super(`Collection "${collection}" is not registered. Available collections: ${list}.`);

    this.collection = collection;
    this.available = available;
  }
}

/**
 * Thrown when an entry does not match its collection schema.
 *
 * {@link Collections.getItem} returns the issues instead of throwing.
 * {@link Collections.listItems} throws this once one entry fails validation,
 * since returning a partially valid collection would silently hide entries.
 */
export class CollectionValidationError extends CollectionError {
  /** The collection the entry belongs to. */
  public readonly collection: string;

  /** The id of the entry that failed validation. */
  public readonly id: string;

  /** The issues reported by the collection's schema. */
  public readonly issues: readonly StandardSchemaV1.Issue[];

  constructor(collection: string, id: string, issues: readonly StandardSchemaV1.Issue[]) {
    super(`Collection "${collection}" entry "${id}" failed validation:${formatIssues(issues)}`);

    this.collection = collection;
    this.id = id;
    this.issues = issues;
  }
}

function formatIssues(issues: readonly StandardSchemaV1.Issue[]): string {
  if (issues.length === 0) return "\n  (no issues reported)";

  return issues
    .map((issue) => {
      const path = issue.path?.map(formatPathSegment).filter(Boolean).join(".");
      return `\n  ${path ? `${path}: ` : ""}${issue.message}`;
    })
    .join("");
}

function formatPathSegment(segment: PropertyKey | StandardSchemaV1.PathSegment): string {
  if (typeof segment === "object" && segment !== null && "key" in segment) {
    return String(segment.key);
  }

  return String(segment);
}
