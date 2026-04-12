import request from '@/utils/request';
import * as ApiFileAccessConfig from './file-access-config';

const API_PREFIX = '/api';

/**
 * 文件类型。
 */
export type FileType = 'IMAGE' | 'FILE';

/**
 * 文件详情。
 */
export interface FileDetail {
  /**
   * 文件 ID。
   */
  id: string;

  /**
   * 原图地址。
   */
  url?: string;

  /**
   * 缩略图地址。
   */
  thumbnailUrl?: string;

  /**
   * 下载地址。
   */
  downloadUrl?: string;

  /**
   * 文件名。
   */
  filename?: string;

  /**
   * 内容类型。
   */
  contentType?: string;

  /**
   * 文件大小。
   */
  size?: number;

  /**
   * 文件类型。
   */
  fileType?: FileType;

  /**
   * 创建时间。
   */
  createdAt?: string;
}

/**
 * 删除文件请求参数。
 */
export interface DeleteFileParams {
  /**
   * 文件 ID 列表。
   */
  ids: string[];
}

/**
 * 规范化文件访问地址。
 *
 * 图片地址优先使用租户配置的访问域名拼接；
 * 当租户未配置访问域名时，继续回退到 `/api` 代理。
 */
export const normalizeFileAccessUrl = (
  url?: string,
  accessDomain?: string | null,
) => {
  if (!url) {
    return url;
  }

  if (/^(https?:)?\/\//.test(url)) {
    return url;
  }

  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  if (!url.startsWith('/')) {
    return url;
  }

  if (accessDomain) {
    return `${accessDomain}${url}`;
  }

  if (url.startsWith(`${API_PREFIX}/`)) {
    return url;
  }

  return `${API_PREFIX}${url}`;
};

/**
 * 规范化文件详情中的访问地址字段。
 */
const normalizeFileDetail = async (fileDetail: FileDetail) => {
  const accessDomain = await ApiFileAccessConfig.getCurrentAccessDomain();

  return {
    ...fileDetail,
    url: normalizeFileAccessUrl(fileDetail.url, accessDomain),
    thumbnailUrl: normalizeFileAccessUrl(fileDetail.thumbnailUrl, accessDomain),
    downloadUrl: normalizeFileAccessUrl(fileDetail.downloadUrl),
  };
};

/**
 * 创建上传表单。
 */
const createUploadFormData = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return formData;
};

/**
 * 获取文件详情。
 */
export const getDetail = (id: string) => {
  return request<FileDetail>('/system/file/get', {
    params: { id },
  }).then((fileDetail) => {
    return normalizeFileDetail(fileDetail);
  });
};

/**
 * 上传普通附件。
 */
export const uploadFile = (file: File) => {
  return request<FileDetail>('/system/file/upload', {
    method: 'post',
    data: createUploadFormData(file),
  }).then((fileDetail) => {
    return normalizeFileDetail(fileDetail);
  });
};

/**
 * 上传图片。
 */
export const uploadImage = (file: File) => {
  return request<FileDetail>('/system/file/image/upload', {
    method: 'post',
    data: createUploadFormData(file),
  }).then((fileDetail) => {
    return normalizeFileDetail(fileDetail);
  });
};

/**
 * 删除文件。
 */
export const deleteFile = (data: DeleteFileParams) => {
  return request<number>('/system/file/delete', {
    method: 'post',
    data,
  });
};
