import type { ReactNode } from 'react';

import type { FileDetail } from '@/api/modules/file';

/**
 * 上传模式。
 */
export type KUploadMode = 'file' | 'image';

/**
 * 上传组件公共属性。
 */
export interface KUploadBaseProps {
  /**
   * 当前文件 ID。
   */
  value?: string;

  /**
   * 值变化回调。
   */
  onChange?: (fileId?: string) => void;

  /**
   * 上传成功回调。
   */
  onUploaded?: (fileDetail: FileDetail) => void;

  /**
   * 是否在移除时调用删除接口。
   */
  deleteOnRemove?: boolean;

  /**
   * 是否禁用。
   */
  disabled?: boolean;

  /**
   * 上传按钮文案。
   */
  buttonText?: string;

  /**
   * 提示内容。
   */
  tips?: ReactNode;

  /**
   * 最大文件大小，单位 MB。
   */
  maxSizeInMb?: number;
}

/**
 * 普通附件上传属性。
 */
export interface KFileUploadProps extends KUploadBaseProps {}

/**
 * 图片上传属性。
 */
export interface KImageUploadProps extends KUploadBaseProps {}
