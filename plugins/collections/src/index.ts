export function fn() {
  return 'Hello, tsdown!'
}

import { CoreBase } from "@seedcord/core"
import { Plugin } from "@seedcord/core/plugin"
import { StandardSchemaV1 } from "@standard-schema/spec"

interface Config {
  type: 'live' | 'build'
  schema?: StandardSchemaV1
  collector: Collector
}

interface Collector {
  name: string
  load(ctx: {}): Promise<void>
  createSchema(): Promise<{ schema: StandardSchemaV1, types: string }>
}

export class Collections<const TConfig extends Record<string, Config>> extends Plugin {
  constructor(host: CoreBase, private readonly cfg: TConfig) {
    super(host)
  }
  async init(): Promise<void> {}

  async listCollections() {}
  async listItems<const T extends string>(collection: T) {}
  async viewItem<const T extends string>(collection: T, item: string) {}
}
