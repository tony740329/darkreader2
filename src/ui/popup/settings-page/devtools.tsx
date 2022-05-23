import {m} from 'malevic';
import ThemeEngines from '../../../generators/theme-engines';
import {getLocalMessage} from '../../../utils/locales';
import {NavButton} from '../../controls';
import ControlGroup from '../control-group';
import {ViewProps} from '../types';
import {openExtensionPage} from '../../../utils/url';

async function openDevTools() {
    await openExtensionPage('devtools/index.html');
}

export default function DevToolsGroup(props: ViewProps) {
    const globalThemeEngine = props.data.settings.theme.engine;
    const devtoolsData = props.data.devtools;
    const hasCustomFixes = (
        (globalThemeEngine === ThemeEngines.dynamicTheme && devtoolsData.hasCustomDynamicFixes) ||
        ([ThemeEngines.cssFilter, ThemeEngines.svgFilter].includes(globalThemeEngine) && devtoolsData.hasCustomFilterFixes) ||
        (globalThemeEngine === ThemeEngines.staticTheme && devtoolsData.hasCustomStaticFixes)
    );

    return (
        <ControlGroup>
            <ControlGroup.Control>
                <NavButton
                    onClick={openDevTools}
                    class={{
                        'dev-tools-button': true,
                        'dev-tools-button--has-custom-fixes': hasCustomFixes,
                    }}
                >
                    🛠 {getLocalMessage('open_dev_tools')}
                </NavButton>
            </ControlGroup.Control>
            <ControlGroup.Description>
                Make a fix for a website
            </ControlGroup.Description>
        </ControlGroup>
    );
}
