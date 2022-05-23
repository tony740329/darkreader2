// @ts-check
import fs from 'fs-extra';
import globby from 'globby';
import prettier from 'prettier';
import {getDestDir, PLATFORM} from './paths.js';
import {createTask} from './task.js';
import {log} from './utils.js';

/** @type {import('prettier').Options} */
const options = {
    arrowParens: 'always',
    bracketSpacing: false,
    endOfLine: 'crlf',
    printWidth: 80,
    quoteProps: 'consistent',
    singleQuote: false,
    tabWidth: 4,
    trailingComma: 'none',
};

const extensions = ['html', 'css', 'js'];

async function codeStyle({debug}) {
    const dir = getDestDir({debug, platform: PLATFORM.CHROME});
    const files = await globby(extensions.map((ext) => `${dir}/**/*.${ext}`));
    for (const file of files) {
        const code = await fs.readFile(file, 'utf8');
        const formatted = prettier.format(code, {
            ...options,
            filepath: file,
        });
        if (code !== formatted) {
            await fs.outputFile(file, formatted);
            debug && log.ok(file);
        }
    }
}

export default createTask(
    'code-style',
    codeStyle,
);