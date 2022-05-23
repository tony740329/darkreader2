// @ts-check
import {m} from 'malevic';
import {getContext, tags} from 'malevic/dom';
import {withState, useState} from 'malevic/state';
import Button from '../../controls/button';
import MessageBox from '../../controls/message-box';
import OverlayLegacy from '../../controls/overlay';
import ThemeEngines from '../../../generators/theme-engines';
import {DEVTOOLS_DOCS_URL} from '../../../utils/links';
import {getCurrentThemePreset} from '../../popup/theme/utils';
import {isFirefox} from '../../../utils/platform';

/** @typedef {import('../../../definitions').ExtWrapper} ExtWrapper */
/** @typedef {import('../../../definitions').TabInfo} TabInfo */

/** @typedef {ExtWrapper & {tab: TabInfo}} BodyProps */

const {body, header, img, h1, h3, strong, a, textarea, label, div, p} = tags;
const Overlay = (/** @type {any} */props, /** @type {Array<Malevic.Child>} */...content) => m(OverlayLegacy, props, ...content);

/** @type {Malevic.Component<BodyProps>} */
function Body({data, tab, actions}) {
    const context = getContext();
    const {state, setState} = useState({errorText: /** @type {string} */(null)});
    /** @type {HTMLTextAreaElement} */
    let textNode;
    const previewButtonText = data.settings.previewNewDesign ? 'Switch to old design' : 'Preview new design';
    const {theme} = getCurrentThemePreset({data, tab, actions});

    const wrapper = (theme.engine === ThemeEngines.staticTheme
        ? {
            header: 'Static Theme Editor',
            fixesText: data.devtools.staticThemesText,
            apply: (/** @type {string} */text) => actions.applyDevStaticThemes(text),
            reset: () => actions.resetDevStaticThemes(),
        } : theme.engine === ThemeEngines.cssFilter || theme.engine === ThemeEngines.svgFilter ? {
            header: 'Inversion Fix Editor',
            fixesText: data.devtools.filterFixesText,
            apply: (/** @type {string} */text) => actions.applyDevInversionFixes(text),
            reset: () => actions.resetDevInversionFixes(),
        } : {
            header: 'Dynamic Theme Editor',
            fixesText: data.devtools.dynamicFixesText,
            apply: (/** @type {string} */text) => actions.applyDevDynamicThemeFixes(text),
            reset: () => actions.resetDevDynamicThemeFixes(),
        });

    /** @type {(node: HTMLTextAreaElement) => void} */
    function onTextRender(node) {
        textNode = node;
        if (!state.errorText) {
            textNode.value = wrapper.fixesText;
        }
        node.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const indent = ' '.repeat(4);
                if (isFirefox) {
                    // https://bugzilla.mozilla.org/show_bug.cgi?id=1220696
                    const start = node.selectionStart;
                    const end = node.selectionEnd;
                    const before = node.value.substring(0, start);
                    const after = node.value.substring(end);
                    node.focus();
                    node.value = `${before}${indent}${after}`;
                    const cursorPos = start + indent.length;
                    node.setSelectionRange(cursorPos, cursorPos);
                } else {
                    document.execCommand('insertText', false, indent);
                }
            }
        });
    }

    async function apply() {
        const text = textNode.value;
        try {
            await wrapper.apply(text);
            setState({errorText: null});
        } catch (err) {
            setState({
                errorText: String(err),
            });
        }
    }

    function showDialog() {
        context.store.isDialogVisible = true;
        context.refresh();
    }

    function hideDialog() {
        context.store.isDialogVisible = false;
        context.refresh();
    }

    const dialog = context && context.store.isDialogVisible ? (
        MessageBox(
            {
                caption: 'Are you sure you want to remove current changes? You cannot restore them later.',
                onOK: reset,
                onCancel: hideDialog,
            },
        )
    ) : null;

    function reset() {
        context.store.isDialogVisible = false;
        wrapper.reset();
        setState({errorText: null});
    }

    function toggleDesign() {
        actions.changeSettings({previewNewDesign: !data.settings.previewNewDesign});
    }

    return (
        body(
            header(
                img({id: 'logo', src: '../assets/images/darkreader-type.svg', alt: 'Dark Reader'}),
                h1({id: 'title'}, 'Developer Tools'),
            ),
            h3({id: 'sub-title'}, wrapper.header),
            textarea(
                {
                    id: 'editor',
                    onrender: onTextRender,
                    spellcheck: 'false',
                    autocorrect: 'off',
                    autocomplete: 'off',
                    autocapitalize: 'off',
                },
            ),
            label({id: 'error-text'}, state.errorText),
            div({id: 'buttons'},
                Button({onclick: showDialog},
                    'Reset changes',
                    dialog,
                ),
                Button({onclick: apply}, 'Apply'),
                Button({class: 'preview-design-button', onclick: toggleDesign}, previewButtonText),
            ),
            p({id: 'description'},
                'Read about this tool ', strong(
                    a({href: DEVTOOLS_DOCS_URL, target: '_blank', rel: 'noopener noreferrer'},
                        'here',
                    )
                ), '.\n',
                'If a ', strong('popular'), ' website looks incorrect,\n',
                'e-mail to ', strong('DarkReaderApp@gmail.com'),
            ),
            Overlay(),
        )
    );
}

export default withState(Body);
