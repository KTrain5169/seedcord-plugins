import { CoreBase } from "@seedcord/core";
import { Plugin } from "@seedcord/core/plugin";
import { createDatabase, type Connector, type Database } from "db0";
import { kysely } from "db0/integrations/kysely";
import { KyselyConfig } from "kysely";

export class DB0Plugin<const TDatabaseTables extends object, const TConnector extends Connector> extends Plugin {
    private db?: Database<TConnector>
    private orm?: ReturnType<typeof kysely<TDatabaseTables>>
    constructor(host: CoreBase, private readonly connector: TConnector, private readonly kyselyConfig?: Omit<KyselyConfig, "dialect">) {
        super(host)
    }
    async init(): Promise<void> {
        this.logger.debug('creating db0 instance...')
        this.db = createDatabase(this.connector)
        this.logger.debug('creating kysely instance...')
        this.orm = kysely(this.db, this.kyselyConfig)
        this.logger.debug('kysely instance created')
    }

    getDatabase() {
        return this.orm!
    }

    getRawDatabase() {
        return this.db!
    }

    override async dispose(): Promise<void> {
        await this.db?.dispose()
    }
}