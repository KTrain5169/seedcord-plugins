import { BuilderComponent, RegisterCommand } from "@seedcord/gateway";

@RegisterCommand('global')
export class OverrideStorage extends BuilderComponent<'command'> {
    constructor() {
        super('command')

        this.instance.setName('override_storage').setDescription("Write to the handler's own override storage")
            .addStringOption((opt) => opt.setName('key').setDescription('The key to write to.').setRequired(true))
            .addStringOption((opt) => opt.setName('value').setDescription('The value to store.').setRequired(true))
    }
}
