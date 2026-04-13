import request from '@/utils/request';

export interface SchemeColumn {
  name: string;
  text: string;
  dataType: string;
  size?: string;
  defaultValue?: string;
  notNull: boolean;
  autoIncrement: boolean;
  unsigned: boolean;
  comment?: string;
}

export interface SchemeSubmitParams {
  id?: string;
  text: string;
  name: string;
  comment?: string;
  columns: SchemeColumn[];
}

export const submit = (data: SchemeSubmitParams) => {
  return request('/scheme/submit', {
    method: 'post',
    data,
  });
};
