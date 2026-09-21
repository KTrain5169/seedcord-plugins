import { SlashHandler, SlashRoute } from "@seedcord/gateway";

@SlashRoute('write_storage')
export class WriteStorage extends SlashHandler<'write_storage'> {
    override async execute(): Promise<void> {
        const storage = this.core.storage.getStorage()
        await storage.set(this.options.getString('key'), this.options.getString('value'))
        await this.reply(`Successfully wrote to key "${this.options.getString('key')}"!`)
    }
}
