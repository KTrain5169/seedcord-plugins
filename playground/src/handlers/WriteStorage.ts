import { SlashHandler, SlashRoute } from "@seedcord/gateway";

@SlashRoute('write_storage')
export class WriteStorage extends SlashHandler<'write_storage'> {
    override async execute(): Promise<void> {}
}
