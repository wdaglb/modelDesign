import React from 'react';
import { KConfirmButton } from '@/components';
import { KConfirmButtonProps } from '@/components/KConfirmButton';
import { useKTableContext } from '@/components/KTable/context.tsx';
import usePermission from '@/hooks/usePermission.ts';

interface ConfirmButtonProps extends KConfirmButtonProps {
  permissionCode?: string;
}

const ConfirmButton = (props: ConfirmButtonProps) => {
  const context = useKTableContext();
  const { hasButtonPermission } = usePermission();
  const { permissionCode, onConfirm, ...restProps } = props;

  if (!hasButtonPermission(permissionCode)) {
    return null;
  }

  return (
    <KConfirmButton
      {...restProps}
      onConfirm={async (evt) => {
        await onConfirm?.(evt);
        context.refresh();
      }}
    />
  );
};

export default ConfirmButton;
