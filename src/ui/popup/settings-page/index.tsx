import {m} from 'malevic';
import {isFirefox} from '../../../utils/platform';
import {ViewProps} from '../types';
import AutomationButton from './automation-button';
import DevToolsGroup from './devtools';
import EnabledByDefaultGroup from './enabled-by-default';
import InvertPDF from './invert-pdf';
import ManageSettingsButton from './mange-settings-button';

type SettingsPageProps = ViewProps & {
    onAutomationNavClick: () => void;
    onManageSettingsClick: () => void;
};

export default function SettingsPage(props: SettingsPageProps) {
    return (
        <section class="m-section">
            <EnabledByDefaultGroup {...props} />
            {isFirefox() ? null : <InvertPDF {...props} />}
            <DevToolsGroup {...props} />
            <AutomationButton onClick={props.onAutomationNavClick} />
            <ManageSettingsButton onClick={props.onManageSettingsClick} />
        </section>
    );
}
