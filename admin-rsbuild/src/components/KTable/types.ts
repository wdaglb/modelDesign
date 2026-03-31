import { TableProps } from 'antd';
import { ReactNode, Ref, RefObject } from 'react';
import { QueryKey } from '@tanstack/react-query';

export interface KTableActionRef {
  refresh: () => void;
  getData: () => any[];
}

export interface List<R> {
  items: R[];
  total: number;
}

export interface KTableProps<R> extends TableProps<R> {
  /**
   * 请求，自动处理分页或数组
   */
  request?: (params?: any) => Promise<R[] | List<R>>;
  /**
   * 工具栏
   */
  toolbar?: ReactNode;
  actionRef?: RefObject<KTableActionRef | null>;
  queryKey: QueryKey;

  /**
   * 请求参数
   */
  params?: any;
}
