import React, { useRef, useState } from 'react';
import { Button, Input, Modal, Space, Spin, Typography, message } from 'antd';
import { MdEditor, config as configureMarkdownEditor } from 'md-editor-rt';
import type {
  CodeMirrorExtension,
  ExposeParam,
  ToolbarNames,
} from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';

import { ApiFile } from '@/api';

import KMarkdownPreview from './Preview';
import {
  buildMarkdownImageText,
  getPastedImageFiles,
  insertTextAtSelection,
  normalizeMarkdownValue,
  resolveEditorHeight,
} from './helpers';
import type {
  KMarkdownEditorProps,
  KMarkdownPreviewProps,
  MarkdownTodoTogglePayload,
  MarkdownImageUploadResult,
} from './types';

const COMPACT_TOOLBARS: ToolbarNames[] = [
  'title',
  'bold',
  'italic',
  'strikeThrough',
  'quote',
  'unorderedList',
  'orderedList',
  'task',
  0,
  'image',
  'table',
  'codeRow',
  'code',
  'revoke',
  'next',
  'preview',
  'previewOnly',
];

const MARKDOWN_LINK_PATTERN = /^\[([^\]]*)\]\(([^)]*)\)$/;
const BARE_LINK_PATTERN = /^(https?:\/\/|\/\/)[^\s]+$/i;

/**
 * 全局关闭 md-editor-rt 的链接短显扩展。
 *
 * 默认 linkShortener 会把长链接替换成“...”，导致粘贴 URL 后看不到完整内容，
 * 也很难选中原始地址再进入自定义弹窗修改链接文字和地址。
 */
configureMarkdownEditor({
  codeMirrorExtensions: (extensions) => {
    return extensions.filter((extension: CodeMirrorExtension) => {
      return extension.type !== 'linkShortener';
    });
  },
});

/**
 * 通用 Markdown 编辑器。
 *
 * 默认支持：
 * - 单栏编辑
 * - 预览切换
 * - 工具栏图片上传
 * - 粘贴图片自动上传
 */
const KMarkdownEditor = (props: KMarkdownEditorProps) => {
  const [uploading, setUploading] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const editorRef = useRef<ExposeParam | null>(null);

  const value = normalizeMarkdownValue(props.value);
  const height = resolveEditorHeight(props.height);
  const previewEnabled = isPreviewEnabled(props.preview);
  const toolbars = resolveEditorToolbars(props.toolbarPreset);
  const customToolbars = buildCustomToolbars({
    disabled: props.disabled,
    onOpenLinkModal: () => {
      const selectedText = editorRef.current?.getSelectedText() || '';
      const initialLinkValues = resolveInitialLinkValues(selectedText);
      setLinkText(initialLinkValues.text);
      setLinkUrl(initialLinkValues.url);
      setLinkModalOpen(true);
    },
  });

  const emitChange = (nextValue?: string) => {
    const normalizedValue = normalizeMarkdownValue(nextValue);
    props.onChange?.(normalizedValue);
  };

  const uploadSingleImage = async (
    file: File,
  ): Promise<MarkdownImageUploadResult> => {
    if (props.onUploadImage) {
      return props.onUploadImage(file);
    }

    const uploadedImage = await ApiFile.uploadImage(file);
    if (!uploadedImage.url) {
      throw new Error('图片上传成功，但未返回图片地址');
    }

    let altText = file.name;
    if (uploadedImage.filename) {
      altText = uploadedImage.filename;
    }

    return {
      url: uploadedImage.url,
      alt: altText,
      title: altText,
    };
  };

  const uploadImages = async (files: File[]) => {
    setUploading(true);

    try {
      const uploadedImages: MarkdownImageUploadResult[] = [];

      for (const file of files) {
        const uploadedImage = await uploadSingleImage(file);
        uploadedImages.push(uploadedImage);
      }

      return uploadedImages;
    } finally {
      setUploading(false);
    }
  };

  const handleToolbarUpload = async (
    files: File[],
    callback: (urls: string[]) => void,
  ) => {
    try {
      const uploadedImages = await uploadImages(files);
      callback(
        uploadedImages.map((uploadedImage) => {
          return uploadedImage.url;
        }),
      );
    } catch (error) {
      handleUploadError(error);
    }
  };

  const handlePasteCapture = async (
    event: React.ClipboardEvent<HTMLDivElement>,
  ) => {
    if (props.disabled) {
      return;
    }

    const pastedImageFiles = getPastedImageFiles(event);
    if (pastedImageFiles.length === 0) {
      return;
    }

    event.preventDefault();

    let selectionStart = value.length;
    let selectionEnd = value.length;
    const target = event.target;

    if (target instanceof HTMLTextAreaElement) {
      selectionStart = target.selectionStart;
      selectionEnd = target.selectionEnd;
    }

    try {
      const uploadedImages = await uploadImages(pastedImageFiles);
      const markdownImageText = buildMarkdownImageText(uploadedImages);
      const insertedText = `\n${markdownImageText}\n`;
      const nextValue = insertTextAtSelection(
        value,
        insertedText,
        selectionStart,
        selectionEnd,
      );

      emitChange(nextValue);
      message.success('图片已上传并插入');
    } catch (error) {
      handleUploadError(error);
    }
  };

  return (
    <Space
      orientation="vertical"
      size={12}
      style={{ width: '100%', height: '100%' }}
    >
      {uploading && (
        <Typography.Text type="secondary">图片上传中...</Typography.Text>
      )}

      <div
        onPasteCapture={(event) => {
          void handlePasteCapture(event);
        }}
        style={{ width: '100%', flex: 1, minHeight: 0 }}
      >
        <Spin spinning={uploading}>
          {renderEditorContent({
            emitChange,
            editorRef,
            handleToolbarUpload,
            height,
            disabled: props.disabled,
            previewEnabled,
            placeholder: props.placeholder,
            customToolbars,
            toolbars,
            value,
          })}
        </Spin>
      </div>

      <Modal
        title={'插入链接'}
        open={linkModalOpen}
        okText={'插入链接'}
        cancelText={'取消'}
        onCancel={() => {
          setLinkModalOpen(false);
        }}
        onOk={() => {
          const inserted = insertMarkdownLink({
            editor: editorRef.current,
            text: linkText,
            url: linkUrl,
          });
          if (!inserted) {
            return;
          }

          setLinkModalOpen(false);
        }}
        okButtonProps={{ disabled: !linkUrl.trim() }}
      >
        <Space orientation={'vertical'} size={12} style={{ width: '100%' }}>
          <Typography.Text type={'secondary'}>
            选中文本或已有 Markdown 链接后点击工具栏，可在这里直接补充或修改链接。
          </Typography.Text>
          <Input
            value={linkText}
            placeholder={'链接文字'}
            onChange={(event) => {
              setLinkText(event.target.value);
            }}
          />
          <Input
            value={linkUrl}
            placeholder={'链接地址，例如 https://example.com'}
            onChange={(event) => {
              setLinkUrl(event.target.value);
            }}
          />
        </Space>
      </Modal>
    </Space>
  );
};

interface RenderEditorContentProps {
  customToolbars: React.ReactElement[];
  disabled?: boolean;
  emitChange: (nextValue?: string) => void;
  editorRef: React.MutableRefObject<ExposeParam | null>;
  handleToolbarUpload: (
    files: File[],
    callback: (urls: string[]) => void,
  ) => Promise<void>;
  height: number | string;
  placeholder?: string;
  previewEnabled: boolean;
  toolbars?: ToolbarNames[];
  value: string;
}

/**
 * 构造 Markdown 编辑器外层样式。
 *
 * 这里只覆盖最外层容器的边框与圆角，使其直接复用 Ant Design
 * 的容器设计语言，不扩大到工具栏、分栏线和交互态，避免超出本次最小改动范围。
 */
function buildMarkdownEditorStyle(height: number | string) {
  return {
    height,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--ant-colorBorder, #d9d9d9)',
    borderRadius: 'var(--ant-borderRadius, 8px)',
    backgroundColor: 'var(--ant-colorBgContainer, #fff)',
  };
}

function renderEditorContent(props: RenderEditorContentProps) {
  if (props.disabled) {
    return <KMarkdownPreview height={props.height} value={props.value} />;
  }

  return (
    <MdEditor
      ref={props.editorRef}
      modelValue={props.value}
      previewTheme="github"
      language="zh-CN"
      preview={props.previewEnabled}
      placeholder={props.placeholder}
      defToolbars={props.customToolbars}
      style={buildMarkdownEditorStyle(props.height)}
      toolbars={props.toolbars}
      onChange={(nextValue) => {
        props.emitChange(nextValue);
      }}
      onUploadImg={async (files, callback) => {
        await props.handleToolbarUpload(files, callback);
      }}
    />
  );
}

interface BuildCustomToolbarsParams {
  disabled?: boolean;
  onOpenLinkModal: () => void;
}

/**
 * 构造 Markdown 编辑器自定义工具栏。
 *
 * 默认链接弹窗会把 URL 光标选区放在括号内，对已经选中文案再补链接的场景不友好；
 * 这里改为 Ant Design 表单弹窗，明确区分“链接文字”和“链接地址”。
 *
 * @param params 自定义工具栏参数
 * @returns 自定义工具栏元素
 */
function buildCustomToolbars(params: BuildCustomToolbarsParams) {
  return [
    <MarkdownLinkToolbarButton
      key={'link'}
      disabled={params.disabled}
      onOpenLinkModal={params.onOpenLinkModal}
    />,
  ];
}

interface MarkdownLinkToolbarButtonProps {
  disabled?: boolean;
  onOpenLinkModal: () => void;
}

/**
 * Markdown 链接工具栏按钮。
 *
 * md-editor-rt 会通过 cloneElement 给自定义工具栏追加内部属性；单独封装一层可以
 * 避免这些内部属性继续透传到 Ant Design Button 的 DOM 节点上产生未知属性警告。
 *
 * @param props 工具栏按钮参数
 * @returns 链接工具栏按钮
 */
function MarkdownLinkToolbarButton(props: MarkdownLinkToolbarButtonProps) {
  return (
    <Button
      type={'text'}
      size={'small'}
      htmlType={'button'}
      disabled={props.disabled}
      onClick={props.onOpenLinkModal}
    >
      链接
    </Button>
  );
}

interface ResolveInitialLinkValuesResult {
  text: string;
  url: string;
}

/**
 * 从当前选区推导链接弹窗初始值。
 *
 * 选中完整 Markdown 链接时按“编辑已有链接”处理；选中普通文本时只填充链接文字，
 * 让用户只需要补 URL，减少手动拆改 Markdown 语法的成本。
 *
 * @param selectedText 当前编辑器选中的文本
 * @returns 链接弹窗初始值
 */
function resolveInitialLinkValues(
  selectedText: string,
): ResolveInitialLinkValuesResult {
  const normalizedSelectedText = selectedText.trim();
  const matchedLink = normalizedSelectedText.match(MARKDOWN_LINK_PATTERN);

  if (matchedLink) {
    return {
      text: matchedLink[1],
      url: matchedLink[2],
    };
  }

  if (BARE_LINK_PATTERN.test(normalizedSelectedText)) {
    return {
      text: '',
      url: normalizedSelectedText,
    };
  }

  return {
    text: selectedText,
    url: '',
  };
}

interface InsertMarkdownLinkParams {
  editor?: ExposeParam | null;
  text: string;
  url: string;
}

/**
 * 向当前选区插入 Markdown 链接。
 *
 * @param params 插入链接参数
 * @returns 是否成功触发插入
 */
function insertMarkdownLink(params: InsertMarkdownLinkParams) {
  const normalizedText = params.text.trim() || '链接文字';
  const normalizedUrl = params.url.trim();

  if (!normalizedUrl) {
    message.error('请输入链接地址');
    return false;
  }

  const targetValue = `[${normalizedText}](${normalizedUrl})`;

  params.editor?.insert(() => {
    return {
      targetValue,
      select: !normalizedUrl,
      deviationStart: targetValue.length - normalizedUrl.length - 1,
      deviationEnd: -1,
    };
  });

  return Boolean(params.editor);
}

function isPreviewEnabled(preview?: boolean) {
  if (preview === false) {
    return false;
  }

  return true;
}

function resolveEditorToolbars(preset?: KMarkdownEditorProps['toolbarPreset']) {
  if (preset === 'compact') {
    return COMPACT_TOOLBARS;
  }

  return undefined;
}

function handleUploadError(error: unknown) {
  if (error instanceof Error && error.message) {
    message.error(error.message);
    return;
  }

  message.error('图片上传失败');
}

export type {
  KMarkdownEditorProps,
  KMarkdownPreviewProps,
  MarkdownTodoTogglePayload,
  MarkdownImageUploadResult,
} from './types';

export default KMarkdownEditor;
export { default as KMarkdownPreview } from './Preview';
