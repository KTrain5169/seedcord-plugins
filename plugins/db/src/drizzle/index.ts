import { Plugin } from "@seedcord/core/plugin";
import type { CoreBase } from "@seedcord/core";
import { type Connector, createDatabase, type Database } from 'db0'
import type { DrizzleSQLiteDatabase, DB0DrizzleSQLiteConfig } from "db0/integrations/drizzle/sqlite";
import type { DrizzlePgConfig, DrizzlePgDatabase } from "db0/integrations/drizzle/postgres";
import type { DrizzleMySqlConfig, DrizzleMySqlDatabase } from "db0/integrations/drizzle/mysql";
import type { AnyRelations, EmptyRelations } from "drizzle-orm/relations";
import { byEnvironment, type EnvironmentPair } from "@ktrain5369/seedcord-plugin-utils";

interface DialectMappings<TRelations extends AnyRelations> {
    mysql: {
        driver: DrizzleMySqlDatabase<TRelations>
        config: DrizzleMySqlConfig<TRelations>
    }
    postgresql: {
        driver: DrizzlePgDatabase<TRelations>
        config: DrizzlePgConfig<TRelations>
    }
    sqlite: {
        driver: DrizzleSQLiteDatabase<TRelations>
        config: DB0DrizzleSQLiteConfig<TRelations>
    }
    libsql: {
        driver: DrizzleSQLiteDatabase<TRelations>
        config: DB0DrizzleSQLiteConfig<TRelations>
    }
}

export class DB0Plugin<const TInstance extends unknown, const TConnector extends Connector<TInstance>, const TRelations extends AnyRelations = EmptyRelations> extends Plugin {
    private db?: Database<TConnector>
    private orm?: DialectMappings<TRelations>[TConnector['dialect']]['driver']
    constructor(host: CoreBase, private readonly connector: TConnector | EnvironmentPair<TConnector>, private readonly drizzleConfig?: DialectMappings<TRelations>[TConnector['dialect']]['config']) {
        super(host)
    }
    async init(): Promise<void> {
        const connector = byEnvironment(this.connector);
        if (!(["sqlite", "postgresql", "mysql", "libsql"] satisfies (keyof DialectMappings<TRelations>)[]).includes(connector.dialect)) {
            throw new Error(`Unsupported dialect: ${connector.dialect}`)
        }
        else {
            this.logger.debug(`Detected database dialect: ${connector.dialect}`)
        }
        this.logger.debug('creating db0 instance...')
        this.db = createDatabase(connector)
        this.logger.debug('creating drizzle client...')
        switch (connector.dialect) {
            case 'sqlite':
            case 'libsql':
                this.orm = (await import('db0/integrations/drizzle/sqlite')).drizzle(this.db, this.drizzleConfig)
                break
            case 'postgresql':
                this.orm = (await import('db0/integrations/drizzle/postgres')).drizzle(this.db, this.drizzleConfig)
                break
            case 'mysql':
                this.orm = (await import('db0/integrations/drizzle/mysql')).drizzle(this.db, this.drizzleConfig)
                break
        }
        this.logger.debug('drizzle client initialized')
    }

    getDatabase(): DialectMappings<TRelations>[TConnector['dialect']]['driver'] {
        return this.orm!
    }

    getRawDatabase(): Database<TConnector> {
        return this.db!
    }

    override async dispose(): Promise<void> {
        await this.orm?.$client.dispose()
    }
}
