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
}
