import { useQuery } from '@tanstack/react-query';

import { ApiMenu } from '@/api';
import queryKey from '@/constants/queryKey';
import { Menu } from '@/api/modules/menu.types.ts';
import { toTreeData } from '@/utils';

export const request = async (params?: any) => {
  const res = await ApiMenu.getList(params);
  return toTreeData<Menu, number>(res, {
    parentId: 'parentId',
  });
};

export const useData = () => {
  return useQuery({
    queryKey: queryKey.systemPolicy.list(),
    queryFn: request,
  });
};
