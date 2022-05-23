import {m} from 'malevic';
import {getContext} from 'malevic/dom';
import ColorPicker from '../color-picker';
import DropDown from '../dropdown';
import {parse} from '../../../utils/color';

interface ColorDropDownProps {
    class?: string;
    value: string;
    colorSuggestion: string;
    hasDefaultOption?: boolean;
    hasAutoOption?: boolean;
    onChange: (value: string) => void;
    onReset: () => void;
}

export default function ColorDropDown(props: ColorDropDownProps) {
    const context = getContext();
    const store = context.store as {
        isOpen: boolean;
        listNode: HTMLElement;
        selectedNode: HTMLElement;
    };

    const labels = {
        DEFAULT: 'Default',
        AUTO: 'Auto',
        CUSTOM: 'Custom',
    };

    const dropDownValues = [
        props.hasDefaultOption ? labels.DEFAULT : null,
        props.hasAutoOption ? labels.AUTO : null,
        labels.CUSTOM,
    ].filter((v) => v);

    const selectedDropDownValue = (
        props.value === '' ? labels.DEFAULT :
            props.value === 'auto' ? labels.AUTO :
                labels.CUSTOM
    );

    function onDropDownChange(value: string) {
        const result = {
            [labels.DEFAULT]: '',
            [labels.AUTO]: 'auto',
            [labels.CUSTOM]: props.colorSuggestion,
        }[value];
        props.onChange(result);
    }

    let isPickerVisible: boolean;

    try {
        parse(props.value);
        isPickerVisible = true;
    } catch (err) {
        isPickerVisible = false;
    }

    const prevValue = context.prev ? context.prev.props.value : null;
    const shouldFocusOnPicker = (
        (props.value !== '' && props.value !== 'auto') &&
        prevValue != null &&
        (prevValue === '' || prevValue === 'auto')
    );

    function onRootRender(root: Element) {
        if (shouldFocusOnPicker) {
            const pickerNode = root.querySelector('.color-dropdown__picker');
            ColorPicker.focus(pickerNode);
        }
    }

    return (
        <span
            class={{
                'color-dropdown': true,
                'color-dropdown--open': store.isOpen,
                [props.class]: Boolean(props.class),
            }}
            onrender={onRootRender}
        >
            <DropDown class="color-dropdown__options"
                values={dropDownValues}
                selected={selectedDropDownValue}
                onChange={onDropDownChange}
            />
            <ColorPicker
                class={{
                    'color-dropdown__picker': true,
                    'color-dropdown__picker--hidden': !isPickerVisible,
                }}
                color={props.value}
                onChange={props.onChange}
                onReset={props.onReset}
            />
        </span>
    );
}
