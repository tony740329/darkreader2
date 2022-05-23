import {m} from 'malevic';
import {DEFAULT_SETTINGS, DEFAULT_COLORS} from '../../../../defaults';
import {Theme} from '../../../../definitions';
import {ViewProps} from '../../types';
import {BackgroundColor, Brightness, Contrast, Grayscale, Mode, ResetButton, Scheme, Scrollbar, SelectionColorEditor, Sepia, TextColor} from '../controls';
import ThemePresetPicker from '../preset-picker';
import {getCurrentThemePreset} from '../utils';
import Collapsible from './collapsible-panel';

interface ThemeGroupProps {
    theme: Theme;
    change: (theme: Partial<Theme>) => void;
}

function MainGroup({theme, change}: ThemeGroupProps) {
    return (
        <Array>
            <Brightness
                value={theme.brightness}
                onChange={(v) => change({brightness: v})}
            />
            <Contrast
                value={theme.contrast}
                onChange={(v) => change({contrast: v})}
            />
            <Sepia
                value={theme.sepia}
                onChange={(v) => change({sepia: v})}
            />
            <Grayscale
                value={theme.grayscale}
                onChange={(v) => change({grayscale: v})}
            />
            <Scheme
                isDark={theme.mode === 1}
                onChange={(isDark) => change({mode: isDark ? 1 : 0})}
            />
            <Mode
                mode={theme.engine}
                onChange={(mode) => change({engine: mode})}
            />
        </Array>
    );
}

function ColorsGroup({theme, change}: ThemeGroupProps) {
    const isDarkScheme = theme.mode === 1;
    const bgProp: keyof Theme = isDarkScheme ? 'darkSchemeBackgroundColor' : 'lightSchemeBackgroundColor';
    const fgProp: keyof Theme = isDarkScheme ? 'darkSchemeTextColor' : 'lightSchemeTextColor';
    const defaultSchemeColors = isDarkScheme ? DEFAULT_COLORS.darkScheme : DEFAULT_COLORS.lightScheme;
    return (
        <Array>
            <BackgroundColor
                value={theme[bgProp]}
                defaultColor={defaultSchemeColors.background}
                onChange={(v) => change({[bgProp]: v})}
                onReset={() => change({[bgProp]: DEFAULT_SETTINGS.theme[bgProp]})}
            />
            <TextColor
                value={theme[fgProp]}
                defaultColor={defaultSchemeColors.text}
                onChange={(v) => change({[fgProp]: v})}
                onReset={() => change({[fgProp]: DEFAULT_SETTINGS.theme[fgProp]})}
            />
            <Scrollbar
                value={theme.scrollbarColor}
                onChange={(v) => change({scrollbarColor: v})}
                onReset={() => change({scrollbarColor: DEFAULT_SETTINGS.theme.scrollbarColor})}
            />
            <SelectionColorEditor
                value={theme.selectionColor}
                onChange={(v) => change({selectionColor: v})}
                onReset={() => change({selectionColor: DEFAULT_SETTINGS.theme.selectionColor})}
            />
        </Array>
    );
}

export default function ThemePage(props: ViewProps) {
    const {theme, change} = getCurrentThemePreset(props);

    return (
        <section class="m-section theme-page">
            <ThemePresetPicker {...props} />
            <Collapsible>
                <Collapsible.Group id="main" label="Brightness, contrast, mode">
                    <MainGroup theme={theme} change={change} />
                </Collapsible.Group>
                <Collapsible.Group id="colors" label="Colors">
                    <ColorsGroup theme={theme} change={change} />
                </Collapsible.Group>
            </Collapsible>
            <ResetButton {...props} />
        </section>
    );
}
