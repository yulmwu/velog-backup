const { build } = require('esbuild')

build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    minify: true,
    treeShaking: true,
    sourcemap: false,
    platform: 'node',
    target: 'es2020',
    outfile: 'bundle/index.js',
}).catch(() => process.exit(1))
