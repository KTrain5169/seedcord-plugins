import { SlashHandler, SlashRoute } from "@seedcord/gateway";
import { OverrideUnstorage } from "seedcord-plugin-unstorage/decorators";
import fsDriver from "unstorage/drivers/fs";
import memoryDriver from "unstorage/drivers/memory";

import type { Storage } from "unstorage";

// The pair form: the fs driver in a production build, memory under seedcord dev.
// This handler's this.unstorage is separate from the plugin at this.core.storage.
@SlashRoute('override_storage')
@OverrideUnstorage<string>({
    prod: () => fsDriver({ base: './logs/override-storage' }),
    dev: () => memoryDriver()
})
export class OverrideStorage extends SlashHandler<'override_storage'> {
    declare unstorage: Storage<string>;

    override async execute(): Promise<void> {
        await this.unstorage.setItem(this.options.getString('key'), this.options.getString('value'))
        const readBack = await this.unstorage.getItem(this.options.getString('key'))
        await this.reply(
            `The override storage holds "${readBack}" under "${this.options.getString('key')}". /get_storage can't see it.`
        )
    }
}
