import { createStorage, Driver, Storage, StorageValue } from 'unstorage'
import { CoreBase } from '@seedcord/core'
import { Plugin } from '@seedcord/core/plugin'
import { byEnvironment, type EnvironmentPair } from './environment'

export class UnstorageClass<const TValueType extends StorageValue> extends Plugin {
    private storage?: Storage<TValueType>
    constructor(host: CoreBase, private readonly driver?: Driver | EnvironmentPair<Driver>) {
        super(host)
    }

    async init(): Promise<void> {
        this.logger.debug('creating storage instance')
        this.storage = createStorage<TValueType>({
            driver: byEnvironment(this.driver),
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
