import React, { useState } from 'react';
import { Space, Spin, Typography, message } from 'antd';
import { MdEditor } from 'md-editor-rt';
import type { ToolbarNames } from 'md-editor-rt';
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
  'link',
  'image',
  'table',
  'codeRow',
  'code',
  'revoke',
  'next',
  'preview',
  'previewOnly',
];

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

  const value = normalizeMarkdownValue(props.value);
  const height = resolveEditorHeight(props.height);
  const previewEnabled = isPreviewEnabled(props.preview);
  const toolbars = resolveEditorToolbars(props.toolbarPreset);

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
      direction="vertical"
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
            handleToolbarUpload,
            height,
            disabled: props.disabled,
            previewEnabled,
            placeholder: props.placeholder,
            toolbars,
            value,
          })}
        </Spin>
      </div>
    </Space>
  );
};

interface RenderEditorContentProps {
  disabled?: boolean;
  emitChange: (nextValue?: string) => void;
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
      modelValue={props.value}
      previewTheme="github"
      language="zh-CN"
      preview={props.previewEnabled}
      placeholder={props.placeholder}
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
