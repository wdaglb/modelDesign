import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import React, { PropsWithChildren, useContext, useState } from 'react';
import { useKTableContext } from '@/components/KTable/context.tsx';
import { useBoolean } from 'ahooks';

export interface ButtonProps extends PropsWithChildren {
  onClick?: (evt: React.MouseEvent) => Promise<any>;
}

type ExtButtonProps = Omit<AntButtonProps, 'loading'>;

const Button = (props: ButtonProps & ExtButtonProps) => {
  const ctx = useKTableContext();
  const [loading, { toggle }] = useBoolean(false);
  return (
    <AntButton
      {...props}
      loading={loading}
      onClick={async (evt) => {
        toggle();
        try {
          await props.onClick?.(evt);
          ctx.refresh();
        } finally {
          toggle();
        }
      }}
    />
  );
};

export default Button;
