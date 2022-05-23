const rollup = require('rollup');
const rollupPluginCommonjs = require('@rollup/plugin-commonjs');
const rollupPluginNodeResolve = require('@rollup/plugin-node-resolve');
const rollupPluginReplace = require('@rollup/plugin-replace');
const rollupPluginTypescript = require('rollup-plugin-typescript2');
const typescript = require('typescript');
const packageJSON = require('../package.json');

async function bundleAPI() {
    const src = 'src/api/index.ts';
    const dest = 'darkreader.js';

    const bundle = await rollup.rollup({
        input: src,
        plugins: [
            rollupPluginNodeResolve(),
            rollupPluginCommonjs(),
            rollupPluginTypescript({
                typescript,
                tsconfig: 'src/tsconfig.json',
                tsconfigOverride: {
                    compilerOptions: {
                        removeComments: true,
                        target: 'es5',
                    },
                },
                clean: true,
                cacheRoot: null,
            }),
            rollupPluginReplace({
                '__DEBUG__': 'false',
            }),
        ].filter((x) => x)
    });
    await bundle.write({
        banner: `/**\n * Dark Reader v${packageJSON.version}\n * https://darkreader.org/\n */\n`,
        file: dest,
        strict: true,
        format: 'umd',
        name: 'DarkReader',
        sourcemap: false,
    });
}

module.exports = bundleAPI;
