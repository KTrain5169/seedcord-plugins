export function fn() {
  return 'Hello, tsdown!'
}

import type { CoreBase } from "@seedcord/core";
import { Plugin } from "@seedcord/core/plugin";
import { chat, decide, generateImage, summarize, toolDefinition } from "@tanstack/ai";

export class AI extends Plugin {
  constructor(host: CoreBase) {
    super(host)
  }

  async init(): Promise<void> {}

  // Low level access to the direct TanStack AI APIs
  chat = chat
  image = generateImage
  pick = decide
  summarize = summarize

  createTool = toolDefinition

  llm = {
    // Sessions abstraction layer
    create(name: string, opts: SessionOptions): AISession {
        return new AISession(name, opts)
    }
  }
}

interface SessionOptions {
    tokenLimit: number
}

class AISession {
    readonly name: string
    readonly tokenLimit: number
    private readonly messages = []
    constructor(name: string, opts: SessionOptions) {
        this.name = name
        this.tokenLimit = opts.tokenLimit
    }
}
