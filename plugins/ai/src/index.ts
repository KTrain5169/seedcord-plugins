export function fn() {
  return 'Hello, tsdown!'
}

import type { CoreBase } from "@seedcord/core";
import { Plugin } from "@seedcord/core/plugin";
import { chat, decide, generateImage, summarize, toolDefinition } from "@tanstack/ai";

export class AI extends Plugin {
  constructor(host: CoreBase, private readonly options?: {}) {
    super(host)
  }

  async init(): Promise<void> {}

  // Low level access to the direct TanStack AI APIs
  chat = chat
  image = generateImage
  pick = decide
  summarize = summarize

  createTool = toolDefinition

  // Sessions abstraction layer
  sessions = {}
}
