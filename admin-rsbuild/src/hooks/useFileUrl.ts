import { useQuery } from '@tanstack/react-query';

import { ApiFile } from '@/api';

/**
 * 获取文件展示地址。
 */
const useFileUrl = (fileId?: string) => {
  const { data } = useQuery({
    queryKey: ['fileDetail', fileId],
    queryFn: () => ApiFile.getDetail(fileId!),
    enabled: !!fileId,
    staleTime: 5 * 60 * 1000,
  });

  if (data?.thumbnailUrl) {
    return data.thumbnailUrl;
  }

  return data?.url;
};

export default useFileUrl;
