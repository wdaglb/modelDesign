import { Button, ButtonProps } from 'antd';
import { OpenProps } from '@/components/KModal/types.ts';
import { ReactNode } from 'react';
import { useKModal } from '@/components/KModal';
import { omit } from 'lodash-es';

type OpenButtonProps = Omit<ButtonProps, 'onClick'> &
  Omit<OpenProps, 'children'> & {
    modal: ReactNode;
  };

const OpenButton = (props: OpenButtonProps) => {
  const modal = useKModal();
  return (
    <Button
      {...omit(props, ['modal', 'title'])}
      onClick={() => {
        modal.open({
          ...props,
          title: props.title || props.children,
          children: props.modal,
        });
      }}
    />
  );
};

export default OpenButton;
