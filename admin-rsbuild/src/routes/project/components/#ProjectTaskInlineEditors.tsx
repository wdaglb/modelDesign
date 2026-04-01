import {
  type KeyboardEvent,
  type ReactNode,
  useRef,
  useState,
} from 'react';
import { type Dayjs } from 'dayjs';
import { DatePicker, Dropdown, Select } from 'antd';

import {
  formatDateValue,
  parseDateValue,
  resolvePopupContainer,
} from './#projectTaskHelper';
import type { CellOption } from './#projectTaskTypes';

interface CellDisplayProps {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}

interface InlineSelectEditorProps {
  disabled?: boolean;
  options: CellOption[];
  placeholder: string;
  value?: string | number;
  width: number;
  onCancel: () => void;
  onSave: (value?: string | number) => Promise<void>;
}

interface InlineDateEditorProps {
  disabled?: boolean;
  placeholder: string;
  value?: string;
  width: number;
  onCancel: () => void;
  onSave: (value?: string) => Promise<void>;
}

interface InlineDropdownEditorProps {
  children: ReactNode;
  disabled?: boolean;
  onCancel: () => void;
  onSave: (value?: string | number) => Promise<void>;
  options: CellOption[];
  value?: string | number;
}

const compactCellStyle = {
  minHeight: 26,
  minWidth: 80,
  paddingInline: 6,
  borderRadius: 6,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  width: '100%',
  overflow: 'hidden',
} as const;

/**
 * 展示态单元格。
 *
 * 统一处理键盘可访问性和紧凑尺寸。
 */
export function CellDisplay(props: CellDisplayProps) {
  let tabIndex = 0;

  if (props.disabled) {
    tabIndex = -1;
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (props.disabled) {
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    props.onClick();
  };

  return (
    <div
      role="button"
      tabIndex={tabIndex}
      style={compactCellStyle}
      onClick={() => {
        if (props.disabled) {
          return;
        }

        props.onClick();
      }}
      onKeyDown={handleKeyDown}
    >
      {props.children}
    </div>
  );
}

/**
 * 单元格内联下拉编辑器。
 *
 * 组件挂载后立即展开，下拉关闭时若未保存则恢复展示态。
 */
export function InlineSelectEditor(props: InlineSelectEditorProps) {
  const closingBySaveRef = useRef(false);
  const [open, setOpen] = useState(true);

  const handleChange = async (value?: string | number) => {
    closingBySaveRef.current = true;
    setOpen(false);
    await props.onSave(value);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      return;
    }

    if (closingBySaveRef.current) {
      return;
    }

    props.onCancel();
  };

  return (
    <Select
      allowClear={false}
      autoFocus
      disabled={props.disabled}
      open={open}
      options={props.options}
      placeholder={props.placeholder}
      popupMatchSelectWidth={false}
      size="small"
      style={{
        width: props.width,
        maxWidth: '100%',
        display: 'inline-block',
        verticalAlign: 'top',
      }}
      variant="borderless"
      value={props.value}
      getPopupContainer={resolvePopupContainer}
      suffixIcon={null}
      styles={{
        input: {
          minHeight: 24,
          display: 'flex',
          alignItems: 'center',
          paddingInlineStart: 0,
          paddingInlineEnd: 18,
          background: 'transparent',
          boxShadow: 'none',
          whiteSpace: 'nowrap',
        },
      }}
      onChange={async (value) => {
        await handleChange(value);
      }}
      onOpenChange={handleOpenChange}
    />
  );
}

/**
 * 单元格内联日期编辑器。
 *
 * 只有点击日期面板的确认按钮时才会提交修改。
 */
export function InlineDateEditor(props: InlineDateEditorProps) {
  const closingBySaveRef = useRef(false);
  const [open, setOpen] = useState(true);
  const [draftValue, setDraftValue] = useState<Dayjs | null>(
    parseDateValue(props.value),
  );

  const handleSave = async (value?: string) => {
    closingBySaveRef.current = true;
    setOpen(false);
    await props.onSave(value);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      return;
    }

    if (closingBySaveRef.current) {
      return;
    }

    props.onCancel();
  };

  return (
    <DatePicker
      allowClear={false}
      autoFocus
      variant="borderless"
      disabled={props.disabled}
      format="YYYY-MM-DD HH:mm"
      needConfirm
      open={open}
      placeholder={props.placeholder}
      showTime
      size="small"
      style={{ width: props.width }}
      value={draftValue}
      getPopupContainer={resolvePopupContainer}
      onChange={async (value) => {
        setDraftValue(value);
      }}
      onOk={async (value) => {
        await handleSave(formatDateValue(value ?? draftValue));
      }}
      onOpenChange={handleOpenChange}
    />
  );
}

/**
 * 单元格内联下拉菜单编辑器。
 *
 * 适用于优先级、状态这种轻量枚举字段。
 */
export function InlineDropdownEditor(props: InlineDropdownEditorProps) {
  const closingBySaveRef = useRef(false);

  const items = props.options.map((item) => {
    return {
      key: String(item.value),
      label: item.label,
    };
  });

  return (
    <Dropdown
      disabled={props.disabled}
      open
      trigger={['click']}
      menu={{
        items,
        selectable: true,
        selectedKeys: [String(props.value)],
        onClick: async ({ key }) => {
          closingBySaveRef.current = true;
          await props.onSave(key);
        },
      }}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          return;
        }

        if (closingBySaveRef.current) {
          return;
        }

        props.onCancel();
      }}
    >
      <span>{props.children}</span>
    </Dropdown>
  );
}
