import { useQuery } from '@tanstack/react-query';

import { ApiFile } from '@/api';

const useFileUrl = (file_id?: string) => {
  const { data } = useQuery({
    queryKey: ['fileDetail', file_id],
    queryFn: () => ApiFile.getDetail(file_id!),
    enabled: !!file_id,
    staleTime: 5 * 60 * 1000,
  });

  return data?.url;
};

export default useFileUrl;
