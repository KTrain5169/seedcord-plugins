import { createStorage, Driver, Storage } from 'unstorage'
import { CoreBase } from '@seedcord/core'
import { Plugin } from '@seedcord/core/plugin'

export class UnstorageClass extends Plugin {
    storage: Storage
    constructor(host: CoreBase, driver?: Driver) {
        super(host)

        this.logger.debug('creating storage instance')
        this.storage = createStorage({
            driver,
        })
        this.logger.debug('storage instance set')
    }

    async init(): Promise<void> {}

    getStorage() {
        return this.storage
    }

    override async dispose(): Promise<void> {
        await this.storage.dispose()
    }
}
