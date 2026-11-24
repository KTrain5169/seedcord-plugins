import { createStorage, type Driver, type Storage, type StorageValue } from 'unstorage'
import { byEnvironment, type EnvironmentPair } from '../environment'

/**
 * The storages the OverrideUnstorage decorator built, so the plugin's dispose()
 * can close them with the bot's other resources. Only disposal goes through
 * here, which keeps storages of different value types in one set.
 */
const overriddenStorages = new Set<{ dispose(): Promise<void> }>()

function track(storage: { dispose(): Promise<void> }): void {
    overriddenStorages.add(storage)
}

/**
 * Overrides the KV settings for one handler or middleware.
 *
 * A decorated class reads its own storage through `this.unstorage`, built from
 * these settings and picked per environment like the plugin's own driver,
 * while every other handler keeps the driver the plugin was attached with:
 *
 * ```ts
 * import { OverrideUnstorage } from 'seedcord-plugin-unstorage/decorators';
 * import type { Storage } from 'unstorage';
 *
 * @SlashRoute('get_storage')
 * @OverrideUnstorage<string>({
 *     prod: () => redisDriver({ url: REDIS_URL }),
 *     dev: () => memoryDriver()
 * })
 * export class GetStorage extends SlashHandler<'get_storage'> {
 *     declare unstorage: Storage<string>;
 *
 *     override async execute(): Promise<void> {
 *         const value = await this.unstorage.get(this.options.getString('key'));
 *     }
 * }
 * ```
 *
 * The plugin itself is unaffected: it stays at `this.core.<your-attach-key>`
 * and keeps serving every other handler. The storage is built the first time
 * the class reads it and is shared by every instance of the class. The
 * attached plugin disposes it when the bot stops.
 *
 * The `declare unstorage` line types `this.unstorage` because TypeScript's
 * legacy decorators can't add members to the class they decorate. This
 * decorator is a legacy one, for the `experimentalDecorators` setting, since
 * seedcord doesn't support the TC39 decorator syntax.
 */
export function OverrideUnstorage<const TValueType extends StorageValue = StorageValue>(
    settings: Driver | EnvironmentPair<Driver>
) {
    return (target: abstract new (...args: never[]) => object): void => {
        let storage: Storage<TValueType> | undefined
        Object.defineProperty(target.prototype, 'unstorage', {
            get() {
                storage ??= createStorage<TValueType>({
                    driver: byEnvironment(settings),
                })
                track(storage)
                return storage
            },
            configurable: true,
        })
    }
}

/**
 * Disposes every storage the OverrideUnstorage decorator built. The attached
 * plugin calls this from its dispose(); nothing else should.
 *
 * @internal
 */
export async function disposeOverriddenStorages(): Promise<void> {
    const storages = [...overriddenStorages]
    overriddenStorages.clear()
    await Promise.all(storages.map((storage) => storage.dispose()))
}
