import React, { useContext } from 'react';
import { Button } from 'antd';

import { PERMISSION_RESOURCE } from '@/constants/permission.ts';
import usePermission from '@/hooks/usePermission.ts';
import { RowContext } from '@/routes/system/menu/#context';
import Icons from '@/icons';

const DragHandle = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  const { hasButtonPermission } = usePermission();

  if (!hasButtonPermission(PERMISSION_RESOURCE.systemMenuSort)) {
    return null;
  }

  return (
    <Button
      type={'text'}
      size={'small'}
      icon={<Icons.DragHorizontal />}
      style={{ cursor: 'move' }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};

export default DragHandle;
