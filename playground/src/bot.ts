import { resolve } from 'node:path';

import { Seedcord } from '@seedcord/gateway';
import { GatewayIntentBits, Partials } from 'discord.js';
import { Envapter } from 'envapt';

import { UnstorageClass } from 'seedcord-plugin-unstorage'

Envapter.baseDir = resolve(import.meta.dirname, '..');

export const seedcord = new Seedcord({
    bot: {
        clientOptions: {
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.AutoModerationConfiguration,
                GatewayIntentBits.AutoModerationExecution,
                GatewayIntentBits.GuildMessagePolls,
                GatewayIntentBits.DirectMessagePolls
            ],
            partials: [Partials.Message, Partials.Channel, Partials.Poll, Partials.PollAnswer]
        },
        interactions: {
            path: resolve(import.meta.dirname, './handlers')
        },
        commands: {
            path: resolve(import.meta.dirname, './commands')
        },
        events: {
            path: resolve(import.meta.dirname, './events')
        }
    },
    subscribers: {
        path: null
    },
    botColor: 'Blurple',
    notifications: {
        developerUsername: 'KTrain5369'
    }
}).attach('storage', UnstorageClass);

export default seedcord;
