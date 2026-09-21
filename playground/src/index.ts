import seedcord from './bot';
import { UnstorageClass } from 'seedcord-plugin-unstorage'

seedcord.attach('storage', UnstorageClass)

await seedcord.start();
