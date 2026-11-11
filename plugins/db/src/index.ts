import { Plugin } from '@seedcord/core/plugin'
import { CoreBase } from '@seedcord/core'
import { type Connector, createDatabase, type Database } from 'db0'

export class DB0Plugin<const TInstance extends unknown, const TConnector extends Connector<TInstance>> extends Plugin {
    private db?: Database<TConnector>
    constructor(host: CoreBase, private readonly dbConnector: TConnector | {
        prod: TConnector
        dev?: TConnector
    }) {
        super(host)
    }

    async init(): Promise<void> {
        const connector = 'prod' in this.dbConnector ? this.dbConnector.prod : this.dbConnector
        this.logger.debug('setting up db0 instance')
        this.db = createDatabase(connector)
        this.logger.debug('db0 instance set')
    }

    getDatabase() {
        return this.db!
    }

    override async dispose(): Promise<void> {
        await this.db!.dispose()
    }
}
