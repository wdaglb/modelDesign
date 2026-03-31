import { omit } from 'lodash-es';
import React, { createContext, ReactNode } from 'react';
import { DrawerItem } from '@/components/KDrawer/types.ts';

interface DrawerContext {
  resolve: (res?: any) => void;
  close: () => void;
}

export const drawerContext = createContext<DrawerContext>(null as any);

interface KDrawerRenderProps {
  open: boolean;
  drawer: DrawerItem;
  driver: (props: any) => ReactNode;
  /**
   * 抽屉关闭。
   */
  onClose: () => void;
  /**
   * 抽屉销毁。
   */
  onDestroy: () => void;
}

const Drawer = (props: KDrawerRenderProps) => {
  const { drawer } = props;
  const Driver = props.driver;
  const drawerProps = omit(drawer.props, ['getContainer']);

  return (
    <drawerContext.Provider
      value={{
        async resolve(res) {
          await drawer.props.onOk?.(res);
          props.onClose();
        },
        close() {
          props.onClose();
          drawer.props.onCancel?.();
        },
      }}
    >
      <Driver
        {...drawerProps}
        footer={false}
        open={props.open}
        styles={{
          ...drawerProps.styles,
          body: {
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            ...drawerProps.styles?.body,
          },
        }}
        onClose={() => {
          props.onClose();
          drawer.props.onCancel?.();
        }}
        afterOpenChange={(open: boolean) => {
          drawer.props.afterOpenChange?.(open);
          if (!open) {
            props.onDestroy();
          }
        }}
      />
    </drawerContext.Provider>
  );
};

export default Drawer;
