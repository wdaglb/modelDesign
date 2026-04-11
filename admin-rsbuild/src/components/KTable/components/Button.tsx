import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import React, { PropsWithChildren } from 'react';
import { useKTableContext } from '@/components/KTable/context.tsx';
import usePermission from '@/hooks/usePermission.ts';
import { useBoolean } from 'ahooks';

export interface ButtonProps extends PropsWithChildren {
  onClick?: (evt: React.MouseEvent) => Promise<any>;
  permissionCode?: string;
}

type ExtButtonProps = Omit<AntButtonProps, 'loading'>;

const Button = (props: ButtonProps & ExtButtonProps) => {
  const ctx = useKTableContext();
  const { hasButtonPermission } = usePermission();
  const [loading, { toggle }] = useBoolean(false);
  const { onClick, permissionCode, ...restProps } = props;

  if (!hasButtonPermission(permissionCode)) {
    return null;
  }

  return (
    <AntButton
      {...restProps}
      loading={loading}
      onClick={async (evt) => {
        toggle();
        try {
          await onClick?.(evt);
          ctx.refresh();
        } finally {
          toggle();
        }
      }}
    />
  );
};

export default Button;
