import type { UploadFile } from 'antd';
import { Upload, message } from 'antd';

import type { FileDetail } from '@/api/modules/file';

import type { KUploadMode } from './types';

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp';
const FILE_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.zip,.rar,.7z';

const IMAGE_EXTENSION_SET = new Set(['jpg', 'jpeg', 'png', 'webp']);
const FILE_EXTENSION_SET = new Set([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'md',
  'csv',
  'zip',
  'rar',
  '7z',
]);

/**
 * 获取接收文件类型配置。
 */
export const getAccept = (mode: KUploadMode) => {
  if (mode === 'image') {
    return IMAGE_ACCEPT;
  }
  return FILE_ACCEPT;
};

/**
 * 获取默认提示文案。
 */
export const getDefaultTips = (mode: KUploadMode, maxSizeInMb: number) => {
  if (mode === 'image') {
    return `支持 jpg、jpeg、png、webp，大小不超过 ${maxSizeInMb}MB`;
  }
  return `支持 office 文档、文本与压缩包，大小不超过 ${maxSizeInMb}MB`;
};

/**
 * 校验待上传文件。
 */
export const validateUploadFile = (
  file: File,
  mode: KUploadMode,
  maxSizeInMb: number,
) => {
  const extension = resolveExtension(file.name);
  if (!extension) {
    message.error('文件扩展名不能为空');
    return Upload.LIST_IGNORE;
  }

  if (mode === 'image') {
    if (!IMAGE_EXTENSION_SET.has(extension)) {
      message.error('图片上传仅支持 jpg、jpeg、png、webp');
      return Upload.LIST_IGNORE;
    }
  }

  if (mode === 'file') {
    if (!FILE_EXTENSION_SET.has(extension)) {
      message.error('附件上传仅支持文档、文本和压缩包');
      return Upload.LIST_IGNORE;
    }
  }

  if (file.size > maxSizeInMb * 1024 * 1024) {
    message.error(`上传文件大小不能超过 ${maxSizeInMb}MB`);
    return Upload.LIST_IGNORE;
  }

  return true;
};

/**
 * 将文件详情转换为上传列表项。
 */
export const toUploadFileItem = (
  fileDetail: FileDetail,
  mode: KUploadMode,
): UploadFile => {
  let fileUrl = fileDetail.downloadUrl;
  if (mode === 'image') {
    fileUrl = fileDetail.url;
  }

  const uploadFileItem: UploadFile = {
    uid: fileDetail.id,
    name: fileDetail.filename || fileDetail.id,
    status: 'done',
  };

  if (fileUrl) {
    uploadFileItem.url = fileUrl;
  }

  if (mode === 'image') {
    let thumbUrl = fileDetail.thumbnailUrl;
    if (!thumbUrl) {
      thumbUrl = fileDetail.url;
    }
    if (thumbUrl) {
      uploadFileItem.thumbUrl = thumbUrl;
    }
  }

  return uploadFileItem;
};

/**
 * 获取预览地址。
 */
export const getPreviewUrl = (fileDetail?: FileDetail) => {
  if (!fileDetail) {
    return '';
  }
  if (fileDetail.url) {
    return fileDetail.url;
  }
  if (fileDetail.downloadUrl) {
    return fileDetail.downloadUrl;
  }
  return '';
};

/**
 * 解析扩展名。
 */
const resolveExtension = (filename: string) => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex < 0) {
    return '';
  }
  if (lastDotIndex === filename.length - 1) {
    return '';
  }
  return filename.slice(lastDotIndex + 1).toLowerCase();
};
