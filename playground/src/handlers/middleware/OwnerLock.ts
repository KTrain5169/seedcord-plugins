import { BuilderComponent, InteractionMiddleware, Notice, RegisterInteractionMiddleware, ReplyResponse } from "@seedcord/gateway";

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
    override async execute(): Promise<void> {
        if (this.event.user.id !== "703180970567925792") {
            throw new Locked()
        } else {
            this.execute()
        }
    }
}
