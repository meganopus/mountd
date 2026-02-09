import * as esbuild from 'esbuild';

esbuild.build({
    entryPoints: ['./src/index.ts'],
    bundle: true,
    outfile: './dist/index.js',
    platform: 'node',
    format: 'esm',
    // packages: 'external',
    sourcemap: false,
    minify: true,
    banner: {
        js: `
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
`,
    },
}).then(() => {
    console.log('Build complete!');
}).catch(() => process.exit(1));
