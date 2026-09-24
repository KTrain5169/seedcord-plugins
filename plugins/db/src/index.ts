import { Plugin } from '@seedcord/core/plugin'
import { CoreBase } from '@seedcord/core'
import { Connector, createDatabase, Database } from 'db0'

export class DB0Plugin<const TConnector extends Connector> extends Plugin {
    private db: Database<TConnector>
    constructor(host: CoreBase, private readonly dbConnector: TConnector) {
        super(host)

        this.logger.debug('setting up db0 instance')
        this.db = createDatabase(this.dbConnector)
        this.logger.debug('db0 instance set')
    }

    async init(): Promise<void> {}

    getDatabase() {
        return this.db
    }

    override async dispose(): Promise<void> {
        await this.db.dispose()
    }
}
