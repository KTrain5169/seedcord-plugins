export function fn() {
  return 'Hello, tsdown!'
}

import { Plugin } from "@seedcord/core/plugin"
import { OpenFeature, type Client, type Provider } from "@openfeature/server-sdk"
import type { CoreBase } from "@seedcord/core"

export class OpenFeatureFlags extends Plugin {
  private ofeat?: Client
  constructor(host: CoreBase, private readonly provider: Provider) {
    super(host)
  }

  async init(): Promise<void> {
    await OpenFeature.setProviderAndWait(this.provider)
    this.ofeat = OpenFeature.getClient()
    OpenFeature.setLogger(this.logger)
  }

  getClient() {
    return this.ofeat!
  }

  async dispose(): Promise<void> {
    await OpenFeature.close()
  }
}
