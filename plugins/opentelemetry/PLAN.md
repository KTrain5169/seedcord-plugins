# Planning for OpenTelemtry plugin

- This plugin must be restricted to server runtimes.
- This plugin must (by default) automatically orchestrate for Winston (since that's the underlying logger library used by seedcord)
- This plugin must allow users to configure anything within the OpenTelemtry NodeSDK itself.
- There must be decorators that allow overriding the provided settings for a particular handler. Decorators must be legacy TypeScript decorators, NOT TC39 decorators.

## Resources

- seedcord docs: seedcord.org/docs
