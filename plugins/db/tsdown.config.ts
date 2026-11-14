import { defineConfig } from 'tsdown/config'

export default defineConfig({
    exports: true,
    attw: true,
    entry: ['src/index.ts', 'src/drizzle/index.ts', 'src/kysely/index.ts']
})
