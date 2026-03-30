import React, { createContext, PropsWithChildren, useState } from 'react';
import { nanoid } from 'nanoid';
import { ModalItem, OpenProps } from '@/components/KModal/types.ts';
import Modal from './Modal.tsx';
import { Modal as AntModal } from 'antd';

/**
 * 全局上下文
 */
interface GlobalContext {
  modals: ModalItem[];
  pushModal: (props: OpenProps) => string;

  openState: Record<string, boolean>;
}

export const globalModalContext = createContext<GlobalContext>(null as any);

export const KModalProvider = (props: PropsWithChildren) => {
  const [modals, setModals] = useState<ModalItem[]>([]);
  const [openState, setOpenState] = useState<Record<string, boolean>>({});
  return (
    <globalModalContext.Provider
      value={{
        modals,
        pushModal: (props) => {
          const id = nanoid();
          setModals([
            ...modals,
            {
              id,
              props: props,
            },
          ]);
          setOpenState({
            ...openState,
            [id]: true,
          });
          return id;
        },
        openState,
      }}
    >
      {props.children}

      {modals.map((modal) => (
        <Modal
          key={modal.id}
          open={openState[modal.id]}
          modal={modal}
          driver={AntModal}
          onClose={() => {
            setOpenState({
              ...openState,
              [modal.id]: false,
            });
          }}
          onDestroy={() => {
            setModals(modals.filter((m) => m.id !== modal.id));
          }}
        />
      ))}
    </globalModalContext.Provider>
  );
};
