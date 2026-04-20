/**
 * Markdown 图片上传结果。
 */
export interface MarkdownImageUploadResult {
  /**
   * 图片地址。
   */
  url: string;

  /**
   * 图片替代文本。
   */
  alt?: string;

  /**
   * 图片标题。
   */
  title?: string;
}

/**
 * Markdown 编辑器属性。
 */
export interface KMarkdownEditorProps {
  /**
   * 工具栏预设。
   */
  toolbarPreset?: 'default' | 'compact';

  /**
   * 当前内容。
   */
  value?: string;

  /**
   * 内容变化回调。
   */
  onChange?: (value: string) => void;

  /**
   * 占位文本。
   */
  placeholder?: string;

  /**
   * 编辑器高度。
   */
  height?: number | string;

  /**
   * 是否禁用。
   */
  disabled?: boolean;

  /**
   * 是否启用预览切换。
   */
  preview?: boolean;

  /**
   * 自定义图片上传回调。
   */
  onUploadImage?: (file: File) => Promise<MarkdownImageUploadResult>;
}

/**
 * Markdown 预览组件属性。
 */
export interface KMarkdownPreviewProps {
  /**
   * 预览内容。
   */
  value?: string;

  /**
   * 预览区域高度。
   *
   * 不传时使用自适应高度，适合详情态展示。
   */
  height?: number | string;

  /**
   * 点击 Markdown 待办事项后的回调。
   *
   * 组件内部负责识别被点击的待办项，并生成切换后的完整 Markdown 内容；
   * 外层只需要基于新内容决定是否保存、提示或回滚。
   */
  onTodoToggle?: (payload: MarkdownTodoTogglePayload) => void | Promise<void>;
}

/**
 * Markdown 待办事项切换事件。
 */
export interface MarkdownTodoTogglePayload {
  /**
   * 被点击的待办索引，按 Markdown 源文中的出现顺序计算。
   */
  todoIndex: number;

  /**
   * 切换后的选中状态。
   */
  checked: boolean;

  /**
   * 切换后的完整 Markdown 内容。
   */
  nextValue: string;
}
