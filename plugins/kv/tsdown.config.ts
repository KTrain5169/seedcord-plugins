import { defineConfig } from 'tsdown/config'

export default defineConfig({
    exports: true,
    attw: true,
    entry: ['src/index.ts', 'src/decorators/index.ts'],
    tsconfig: './tsconfig.json'
})
