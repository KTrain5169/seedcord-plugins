import { createStorage, Driver, Storage, StorageValue } from 'unstorage'
import { CoreBase } from '@seedcord/core'
import { Plugin } from '@seedcord/core/plugin'

export class UnstorageClass<const TValueType extends StorageValue> extends Plugin {
    storage?: Storage<TValueType>
    constructor(host: CoreBase, private readonly driver?: Driver) {
        super(host)
    }

    async init(): Promise<void> {
        this.logger.debug('creating storage instance')
        this.storage = createStorage<TValueType>({
            driver: this.driver,
        })
        this.logger.debug('storage instance set')
    }

    getStorage() {
        return this.storage!
    }

    override async dispose(): Promise<void> {
        await this.storage!.dispose()
    }
}
