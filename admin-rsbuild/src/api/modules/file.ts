import request from '@/utils/request.ts';

export interface FileDetail {
  id: string;
  url?: string;
  filename?: string;
  content_type?: string;
}

export const getDetail = (file_id: string) => {
  return request<FileDetail>('/file/get', {
    params: { file_id },
  });
};
