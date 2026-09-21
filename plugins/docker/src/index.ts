import { CoreBase } from '@seedcord/core'
import { Plugin } from '@seedcord/core/plugin'
import Docker from 'dockerode'

export class DockerPlugin extends Plugin<{ runtime: "server" }> {
    client: Docker
    constructor(host: CoreBase, private readonly options?: Docker.DockerOptions) {
        super(host)

        this.logger.debug('constructing docker client')
        this.client = new Docker(options)
        this.logger.debug('attached docker client')
    }

    async init(): Promise<void> {
        this.logger.debug('checking auth')
        await this.client.checkAuth({})
        this.logger.debug('auth checked')
    }

    getClient() {
        return this.client
    }
}
