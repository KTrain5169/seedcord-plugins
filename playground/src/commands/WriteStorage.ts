import { BuilderComponent, RegisterCommand } from "@seedcord/gateway";

@RegisterCommand('global')
export class WriteStorage extends BuilderComponent<'command'> {
    constructor() {
        super('command')

        this.instance.setName('write_storage').setDescription('Write to the configured unstorage')
            .addStringOption((opt) => opt.setName('key').setDescription('The key to write the contents into.'))
            .addStringOption((opt) => opt.setName('value').setDescription('The value to write to the key.'))
    }
}
