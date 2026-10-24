import { CoreBase } from "@seedcord/core";
import { Plugin } from "@seedcord/core/plugin";
import { LoaderOptions } from "./loaders/config";

interface Config {
  collections: Record<string, LoaderOptions>;
}

export class Collections<const TConfig extends Config> extends Plugin<{ runtime: "server" }> {
  constructor(
    host: CoreBase,
    private readonly cfg: TConfig,
  ) {
    super(host);
  }
  async init(): Promise<void> {}

  async listCollections() {}
  async listItems<const T extends keyof TConfig["collections"]>(collection: T) {}
  async viewItem<const T extends keyof TConfig["collections"]>(collection: T, item: string) {}
}
