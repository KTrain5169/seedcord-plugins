import { Plugin } from "@seedcord/core/plugin";
import type { CoreBase } from "@seedcord/core";
import { type Connector, createDatabase, type Database } from 'db0'
import { type DB0DrizzleSQLiteConfig, drizzle } from "db0/integrations/drizzle";
import type { AnyRelations, EmptyRelations } from "drizzle-orm/relations";

export class DB0Plugin<const TConnector extends Connector, const TRelations extends AnyRelations = EmptyRelations> extends Plugin {
    private db?: Database<TConnector>
    private orm?: ReturnType<typeof drizzle<TRelations>>
    constructor(host: CoreBase, private readonly connector: TConnector, private readonly drizzleConfig?: DB0DrizzleSQLiteConfig<TRelations>) {
        super(host)
    }
    async init(): Promise<void> {
        this.logger.debug('creating db0 instance...')
        this.db = createDatabase(this.connector)
        this.logger.debug('creating drizzle client...')
        this.orm = drizzle(this.db, this.drizzleConfig)
        this.logger.debug('drizzle client initialized')
    }

    getDatabase() {
        return this.orm!
    }

    override async dispose(): Promise<void> {
        await this.orm?.$client.dispose()
    }
}
