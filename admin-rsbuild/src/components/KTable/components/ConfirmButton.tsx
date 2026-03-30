import React from 'react';
import { KConfirmButton } from '@/components';
import { KConfirmButtonProps } from '@/components/KConfirmButton';
import { useKTableContext } from '@/components/KTable/context.tsx';

const ConfirmButton = (props: KConfirmButtonProps) => {
  const context = useKTableContext();
  return (
    <KConfirmButton
      {...props}
      onConfirm={async (evt) => {
        await props.onConfirm?.(evt);
        context.refresh();
      }}
    />
  );
};

export default ConfirmButton;
