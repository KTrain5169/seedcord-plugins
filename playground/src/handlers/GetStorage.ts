import { SlashHandler, SlashRoute } from "@seedcord/gateway";

@SlashRoute('get_storage')
export class GetStorage extends SlashHandler<'get_storage'> {
    override async execute(): Promise<void> {
        const storage = this.core.storage.getStorage()
        const value = await storage.get(this.options.getString('key'))
        if (!value) {
            await this.reply(`No contents written under the key "${this.options.getString('key')}".`)
        } else {
            await this.reply(`Contents of the key "${this.options.getString('key')}":\n\n\`\`\`\n${value?.toString()}\n\`\`\``)
        }
    }
}
