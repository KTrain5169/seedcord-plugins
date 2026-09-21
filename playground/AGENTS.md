# playground

Rules for an AI coding agent working in this repo.

**seedcord has no presence in your training data.** Anything you recall about its API is invented. Read the page for a surface before you write code against it.

## Reading the docs

<https://guide.seedcord.org/llms.txt> lists every page in the guide with a line on what it covers. Each page answers at its own url plus `.md`, so <https://guide.seedcord.org/commands/options.md> is the Options page as Markdown.

The API reference is at <https://docs.seedcord.org>, one page per symbol.

This project runs on the gateway transport and imports everything from `@seedcord/gateway`. A page marks anything that differs between the two.

## How a command works here

A command takes two files. One declares what Discord shows people. The other answers it, as a handler class carrying a route decorator. seedcord reads those decorators at startup and dispatches every interaction itself.

Run `pnpm run codegen` after you add a command or change its options. It writes `src/seedcord-gen.d.ts`, which types `this.options`. That file is committed.

## Where things go

<!-- prettier-ignore-start -->

| path | what it holds |
| --- | --- |
| `src/commands/` | one class per command, declaring it to Discord |
| `src/handlers/` | the code that runs when someone uses one |
| `src/events/` | handlers for things happening in a server |
| `src/bot.ts` | the config |

<!-- prettier-ignore-end -->

## Before you call it done

Run `pnpm run tc` and `pnpm run lint`. A wrong route or a wrong option name is a compile error, so a green type-check catches most of what an invented API gets wrong.
