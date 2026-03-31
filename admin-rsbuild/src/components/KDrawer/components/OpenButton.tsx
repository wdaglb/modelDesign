import { Button, ButtonProps } from 'antd';
import { ReactNode } from 'react';
import { omit } from 'lodash-es';
import { useKDrawer } from '@/components/KDrawer';
import { OpenProps } from '@/components/KDrawer/types.ts';

type OpenButtonProps = Omit<ButtonProps, 'onClick'> &
  Omit<OpenProps, 'children'> & {
    drawer: ReactNode;
  };

const OpenButton = (props: OpenButtonProps) => {
  const drawer = useKDrawer();

  return (
    <Button
      {...omit(props, ['drawer', 'title'])}
      onClick={() => {
        const drawerProps = omit(props, ['drawer']);

        drawer.open({
          ...drawerProps,
          title: props.title || props.children,
          children: props.drawer,
        });
      }}
    />
  );
};

export default OpenButton;
