import { fixupConfigRules } from '@eslint/compat';
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactJsx from 'eslint-plugin-react/configs/jsx-runtime.js';
import react from 'eslint-plugin-react/configs/recommended.js';
import globals from 'globals';

export default [
  { languageOptions: { globals: globals.browser } },
  js.configs.recommended,
  ...fixupConfigRules([
    {
      ...react,
      settings: {
        react: { version: 'detect' },
      },
    },
    reactJsx,
  ]),
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "JSXOpeningElement[name.name='Alert'] > JSXAttribute[name.name='message']",
          message:
            'Ant Design 的 Alert 组件 `message` 已废弃，请改用 `title`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Space'] > JSXAttribute[name.name='direction']",
          message:
            'Ant Design 的 Space 组件 `direction` 已废弃，请改用 `orientation`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Space'] > JSXAttribute[name.name='split']",
          message:
            'Ant Design 的 Space 组件 `split` 已废弃，请改用 `separator`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Card'] > JSXAttribute[name.name='bodyStyle']",
          message:
            'Ant Design 的 Card 组件 `bodyStyle` 已废弃，请改用 `styles.body`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Card'] > JSXAttribute[name.name='headStyle']",
          message:
            'Ant Design 的 Card 组件 `headStyle` 已废弃，请改用 `styles.header`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Card'] > JSXAttribute[name.name='bordered']",
          message:
            'Ant Design 的 Card 组件 `bordered` 已废弃，请改用 `variant`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Modal'] > JSXAttribute[name.name='bodyStyle']",
          message:
            'Ant Design 的 Modal 组件 `bodyStyle` 已废弃，请改用 `styles.body`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Modal'] > JSXAttribute[name.name='maskStyle']",
          message:
            'Ant Design 的 Modal 组件 `maskStyle` 已废弃，请改用 `styles.mask`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Modal'] > JSXAttribute[name.name='destroyOnClose']",
          message:
            'Ant Design 的 Modal 组件 `destroyOnClose` 已废弃，请改用 `destroyOnHidden`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Dropdown'] > JSXAttribute[name.name='overlay']",
          message:
            'Ant Design 的 Dropdown 组件 `overlay` 已废弃，请改用 `menu`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Dropdown'] > JSXAttribute[name.name='dropdownRender']",
          message:
            'Ant Design 的 Dropdown 组件 `dropdownRender` 已废弃，请改用 `popupRender`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Dropdown'] > JSXAttribute[name.name='overlayClassName']",
          message:
            'Ant Design 的 Dropdown 组件 `overlayClassName` 已废弃，请改用 `classNames.root`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Dropdown'] > JSXAttribute[name.name='overlayStyle']",
          message:
            'Ant Design 的 Dropdown 组件 `overlayStyle` 已废弃，请改用 `styles.root`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Dropdown'] > JSXAttribute[name.name='destroyPopupOnHide']",
          message:
            'Ant Design 的 Dropdown 组件 `destroyPopupOnHide` 已废弃，请改用 `destroyOnHidden`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Tooltip'] > JSXAttribute[name.name='overlayStyle']",
          message:
            'Ant Design 的 Tooltip 组件 `overlayStyle` 已废弃，请改用 `styles.root`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Tooltip'] > JSXAttribute[name.name='overlayInnerStyle']",
          message:
            'Ant Design 的 Tooltip 组件 `overlayInnerStyle` 已废弃，请改用 `styles.container`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Tooltip'] > JSXAttribute[name.name='overlayClassName']",
          message:
            'Ant Design 的 Tooltip 组件 `overlayClassName` 已废弃，请改用 `classNames.root`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Tooltip'] > JSXAttribute[name.name='destroyTooltipOnHide']",
          message:
            'Ant Design 的 Tooltip 组件 `destroyTooltipOnHide` 已废弃，请改用 `destroyOnHidden`。',
        },
        {
          selector:
            ":matches(JSXOpeningElement[name.name='Select'], JSXOpeningElement[name.name='TreeSelect'], JSXOpeningElement[name.name='AutoComplete']) > JSXAttribute[name.name='dropdownStyle']",
          message:
            'Ant Design 的选择类组件 `dropdownStyle` 已废弃，请改用 `styles.popup.root`。',
        },
        {
          selector:
            ":matches(JSXOpeningElement[name.name='Select'], JSXOpeningElement[name.name='TreeSelect'], JSXOpeningElement[name.name='AutoComplete']) > JSXAttribute[name.name='dropdownClassName']",
          message:
            'Ant Design 的选择类组件 `dropdownClassName` 已废弃，请改用 `classNames.popup.root`。',
        },
        {
          selector:
            ":matches(JSXOpeningElement[name.name='Select'], JSXOpeningElement[name.name='TreeSelect'], JSXOpeningElement[name.name='AutoComplete']) > JSXAttribute[name.name='popupClassName']",
          message:
            'Ant Design 的选择类组件 `popupClassName` 已废弃，请改用 `classNames.popup.root`。',
        },
        {
          selector:
            ":matches(JSXOpeningElement[name.name='Select'], JSXOpeningElement[name.name='TreeSelect'], JSXOpeningElement[name.name='AutoComplete']) > JSXAttribute[name.name='dropdownRender']",
          message:
            'Ant Design 的选择类组件 `dropdownRender` 已废弃，请改用 `popupRender`。',
        },
        {
          selector:
            ":matches(JSXOpeningElement[name.name='Select'], JSXOpeningElement[name.name='TreeSelect'], JSXOpeningElement[name.name='AutoComplete']) > JSXAttribute[name.name='onDropdownVisibleChange']",
          message:
            'Ant Design 的选择类组件 `onDropdownVisibleChange` 已废弃，请改用 `onOpenChange`。',
        },
        {
          selector:
            ":matches(JSXOpeningElement[name.name='Select'], JSXOpeningElement[name.name='TreeSelect'], JSXOpeningElement[name.name='AutoComplete']) > JSXAttribute[name.name='dropdownMatchSelectWidth']",
          message:
            'Ant Design 的选择类组件 `dropdownMatchSelectWidth` 已废弃，请改用 `popupMatchSelectWidth`。',
        },
        {
          selector:
            ":matches(JSXOpeningElement[name.name='Select'], JSXOpeningElement[name.name='TreeSelect'], JSXOpeningElement[name.name='AutoComplete']) > JSXAttribute[name.name='bordered']",
          message:
            'Ant Design 的选择类组件 `bordered` 已废弃，请改用 `variant`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Tabs'] > JSXAttribute[name.name='popupClassName']",
          message:
            'Ant Design 的 Tabs 组件 `popupClassName` 已废弃，请改用 `classNames.popup`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Tabs'] > JSXAttribute[name.name='tabPosition']",
          message:
            'Ant Design 的 Tabs 组件 `tabPosition` 已废弃，请改用 `tabPlacement`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Tabs'] > JSXAttribute[name.name='destroyInactiveTabPane']",
          message:
            'Ant Design 的 Tabs 组件 `destroyInactiveTabPane` 已废弃，请改用 `destroyOnHidden`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Divider'] > JSXAttribute[name.name='type']",
          message:
            'Ant Design 的 Divider 组件 `type` 已废弃，请改用 `orientation`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Steps'] > JSXAttribute[name.name='labelPlacement']",
          message:
            'Ant Design 的 Steps 组件 `labelPlacement` 已废弃，请改用 `titlePlacement`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Steps'] > JSXAttribute[name.name='progressDot']",
          message:
            'Ant Design 的 Steps 组件 `progressDot` 已废弃，请改用 `type="dot"`。',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Steps'] > JSXAttribute[name.name='direction']",
          message:
            'Ant Design 的 Steps 组件 `direction` 已废弃，请改用 `orientation`。',
        },
      ],
    },
  },
  { ignores: ['dist/', 'node_modules/'] },
];
