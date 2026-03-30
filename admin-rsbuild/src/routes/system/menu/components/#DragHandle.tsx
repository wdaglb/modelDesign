import React, { useContext } from 'react';
import { RowContext } from '../#context';
import { Button } from 'antd';
import Icons from '@/icons';

const DragHandle = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
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
