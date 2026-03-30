import React, { useState } from 'react';

import KModal from '@/components/KModal';

import UserPicker from './index';
import { UserPickerModalProps } from './types';

const UserPickerModal = ({ defaultMode = 'search', onSubmit, ...props }: UserPickerModalProps) => {
  const [userIds, setUserIds] = useState<number[]>([]);

  return (
    <KModal.Form
      layout={'vertical'}
      onFinish={async () => {
        if (!userIds.length) {
          return false;
        }
        await onSubmit(userIds);
      }}
    >
      <UserPicker
        multiple={props.multiple}
        excludeUserIds={props.excludeUserIds}
        defaultMode={defaultMode}
        value={userIds}
        onChange={setUserIds}
      />
    </KModal.Form>
  );
};

export default UserPickerModal;
