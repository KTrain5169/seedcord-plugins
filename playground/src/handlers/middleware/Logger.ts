import {
    InteractionMiddleware,
    RegisterInteractionMiddleware
} from '@seedcord/gateway';

@RegisterInteractionMiddleware()
export class Logger extends InteractionMiddleware {
    public async execute(): Promise<void> {
        this.logger.debug(`reached ${this.dispatch.routeId}`);
        await Promise.resolve();
    }
}