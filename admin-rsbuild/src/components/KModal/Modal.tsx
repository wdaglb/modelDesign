import { omit } from 'lodash-es';
import React, { createContext, ReactNode } from 'react';
import { ModalItem } from '@/components/KModal/types.ts';

interface ModalContext {
  resolve: (res?: any) => void;
  close: () => void;
}

export const modalContext = createContext<ModalContext>(null as any);

interface ModalProps {
  open: boolean;
  modal: ModalItem;
  driver: (props: any) => ReactNode;
  /**
   * 窗口关闭
   */
  onClose: () => void;
  /**
   * 窗口销毁
   */
  onDestroy: () => void;
}

const Modal = (props: ModalProps) => {
  const { modal } = props;

  const Driver = props.driver;
  return (
    <modalContext.Provider
      value={{
        async resolve(res) {
          await modal.props.onOk?.(res);
          props.onClose();
        },
        close() {
          props.onClose();
          modal.props.onCancel?.();
        },
      }}
    >
      <Driver
        {...omit(modal.props, ['getContainer'])}
        footer={false}
        open={props.open}
        closable={{
          afterClose() {
            props.onDestroy();
          },
        }}
        onOk={async () => {
          props.onClose();
          modal.props.onOk?.();
        }}
        onCancel={() => {
          props.onClose();
          modal.props.onCancel?.();
        }}
      />
    </modalContext.Provider>
  );
};

export default Modal;
