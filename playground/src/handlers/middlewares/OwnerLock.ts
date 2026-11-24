import { BuilderComponent, InteractionMiddleware, Notice, RegisterInteractionMiddleware } from "@seedcord/gateway";

import type { ReplyResponse } from "@seedcord/gateway";

class LockClass extends BuilderComponent<'container'> {
    constructor() {
        super('container')

        this.instance.addTextDisplayComponents((text) => {
            text.setContent("You aren't allowed to do this!")
            return text
        })
    }
}

class Locked extends Notice {
    constructor() {
        super("You aren't allowed to do this!")
    }

    override render(): ReplyResponse {
        return {
            components: [new LockClass().component]
        }
    }
}

@RegisterInteractionMiddleware()
export class OwnerLock extends InteractionMiddleware {
    // A middleware that doesn't throw lets the dispatch continue, so the
    // owner case just returns. execute() has nothing to await, which is why
    // it is sync and returns an already-resolved promise.
    override execute(): Promise<void> {
        if (this.event.user.id !== "703180970567925792") {
            throw new Locked()
        }
        return Promise.resolve()
    }
}
