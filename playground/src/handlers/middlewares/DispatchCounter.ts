import { InteractionMiddleware, RegisterInteractionMiddleware } from "@seedcord/gateway";
import { OverrideUnstorage } from "seedcord-plugin-unstorage/decorators";
import memoryDriver from "unstorage/drivers/memory";

import type { Storage } from "unstorage";

// The single-driver form: every dispatch lands in this middleware's own storage,
// apart from the plugin at this.core.storage.
@RegisterInteractionMiddleware()
@OverrideUnstorage<string>(memoryDriver())
export class DispatchCounter extends InteractionMiddleware {
    declare unstorage: Storage<string>;

    override async execute(): Promise<void> {
        const seen = Number(await this.unstorage.getItem('dispatches')) + 1;
        await this.unstorage.setItem('dispatches', String(seen))
        this.logger.debug(`dispatch ${seen}: ${this.dispatch.routeId}`)
    }
}
