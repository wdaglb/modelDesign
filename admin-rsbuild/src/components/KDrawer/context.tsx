import React, { createContext, PropsWithChildren, useState } from 'react';
import { Drawer as AntDrawer } from 'antd';
import { nanoid } from 'nanoid';
import Drawer from './Drawer.tsx';
import { DrawerItem, OpenProps } from '@/components/KDrawer/types.ts';

/**
 * 全局抽屉上下文。
 */
interface GlobalContext {
  drawers: DrawerItem[];
  pushDrawer: (props: OpenProps) => string;
  openState: Record<string, boolean>;
}

export const globalDrawerContext = createContext<GlobalContext>(null as any);

export const KDrawerProvider = (props: PropsWithChildren) => {
  const [drawers, setDrawers] = useState<DrawerItem[]>([]);
  const [openState, setOpenState] = useState<Record<string, boolean>>({});

  return (
    <globalDrawerContext.Provider
      value={{
        drawers,
        pushDrawer: (drawerProps) => {
          const id = nanoid();

          setDrawers([
            ...drawers,
            {
              id,
              props: drawerProps,
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

      {drawers.map((drawer) => (
        <Drawer
          key={drawer.id}
          open={openState[drawer.id]}
          drawer={drawer}
          driver={AntDrawer}
          onClose={() => {
            setOpenState({
              ...openState,
              [drawer.id]: false,
            });
          }}
          onDestroy={() => {
            setDrawers(drawers.filter((item) => item.id !== drawer.id));
          }}
        />
      ))}
    </globalDrawerContext.Provider>
  );
};
