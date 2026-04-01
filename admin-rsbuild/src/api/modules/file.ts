import request from '@/utils/request.ts';

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
  });
};

/**
 * 上传普通附件。
 */
export const uploadFile = (file: File) => {
  return request<FileDetail>('/system/file/upload', {
    method: 'post',
    data: createUploadFormData(file),
  });
};

/**
 * 上传图片。
 */
export const uploadImage = (file: File) => {
  return request<FileDetail>('/system/file/image/upload', {
    method: 'post',
    data: createUploadFormData(file),
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
