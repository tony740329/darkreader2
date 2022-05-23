import {formatSitesFixesConfig} from './utils/format';
import {parseSitesFixesConfig} from './utils/parse';
import {parseArray, formatArray} from '../utils/text';
import {compareURLPatterns, isURLInList} from '../utils/url';
import {DynamicThemeFix} from '../definitions';

const dynamicThemeFixesCommands = {
    'IGNORE INLINE STYLE': 'ignoreInlineStyle',
    'INVERT': 'invert',
    'CSS': 'css',
};

export function parseDynamicThemeFixes(text: string) {
    return parseSitesFixesConfig<DynamicThemeFix>(text, {
        commands: Object.keys(dynamicThemeFixesCommands),
        getCommandPropName: (command) => dynamicThemeFixesCommands[command] || null,
        parseCommandValue: (command, value) => {
            if (command === 'CSS') {
                return value.trim();
            }
            return parseArray(value);
        },
    });
}

export function formatDynamicThemeFixes(dynamicThemeFixes: DynamicThemeFix[]) {
    const fixes = dynamicThemeFixes.slice().sort((a, b) => compareURLPatterns(a.url[0], b.url[0]));

    return formatSitesFixesConfig(fixes, {
        props: Object.values(dynamicThemeFixesCommands),
        getPropCommandName: (prop) => Object.entries(dynamicThemeFixesCommands).find(([, p]) => p === prop)[0],
        formatPropValue: (prop, value) => {
            if (prop === 'css') {
                return value.trim();
            }
            return formatArray(value).trim();
        },
        shouldIgnoreProp: (prop, value) => {
            if (prop === 'css') {
                return !value;
            }
            return !(Array.isArray(value) && value.length > 0);
        },
    });
}

export function getDynamicThemeFixesFor(url: string, frameURL: string, fixes: DynamicThemeFix[]) {
    if (fixes.length === 0 || fixes[0].url[0] !== '*') {
        return null;
    }

    const common = {
        url: fixes[0].url,
        ignoreInlineStyle: fixes[0].ignoreInlineStyle || [],
        invert: fixes[0].invert || [],
        css: fixes[0].css || [],
    };

    const sortedBySpecificity = fixes
        .slice(1)
        .map((theme) => {
            return {
                specificity: isURLInList(frameURL || url, theme.url) ? theme.url[0].length : 0,
                theme
            };
        })
        .filter(({specificity}) => specificity > 0)
        .sort((a, b) => b.specificity - a.specificity);

    if (sortedBySpecificity.length === 0) {
        return common;
    }

    const match = sortedBySpecificity[0].theme;

    return {
        url: match.url,
        ignoreInlineStyle: common.ignoreInlineStyle.concat(match.ignoreInlineStyle || []),
        invert: common.invert.concat(match.invert || []),
        css: [common.css, match.css].filter((s) => s).join('\n'),
    };
}
