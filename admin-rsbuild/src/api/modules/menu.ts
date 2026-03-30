import { request, toTreeData } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { Key } from 'react';

import { ApiMenu } from '@/api';

import { Menu } from './menu.types.ts';

/**
 * 获取菜单列表
 */
export const getList = (params?: any) => {
  return request<Menu[]>('/menu/list', {
    params,
  });
};

export const useList = (params?: any) => {
  return useQuery({
    queryKey: ['menuList', params],
    queryFn: async () => {
      const res = await request('/menu/list', { params });
      return toTreeData(res, { parentId: 'parentId' }) as any;
    },
  });
};

/**
 * 创建菜单
 */
export const create = (data: any) => {
  return request<Menu>('/menu/create', {
    method: 'post',
    data,
  });
};

/**
 * 修改菜单信息
 */
export const edit = (id: number, data: any) => {
  return request<Menu>('/menu/edit', {
    method: 'post',
    params: { id },
    data,
  });
};

/**
 * 删除菜单
 */
export const deleted = (ids: Key[]) => {
  return request('/menu/delete', {
    method: 'post',
    data: { ids },
  });
};

/**
 * 调换排序
 */
export const swapSort = (data: { source: number; target: number }) => {
  return request('/menu/swap_sort', {
    method: 'post',
    data,
  });
};
