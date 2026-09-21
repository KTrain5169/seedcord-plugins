import { BuilderComponent, RegisterCommand } from "@seedcord/gateway";

@RegisterCommand('global')
export class GetStorage extends BuilderComponent<'command'> {
    constructor() {
        super('command')

        this.instance.setName('get_storage').setDescription('Retrieve from the configured unstorage')
            .addStringOption((opt) => opt.setName('key').setDescription('The key to read from.').setRequired(true))
    }
}
