import { createZustandContext } from 'zustand-context';
import { create } from 'zustand/react';
import { KTableActionRef } from '@/components/KTable/types.ts';
import { RefObject } from 'react';

interface Context {
  refresh: () => void;
  getData: () => any[];
  actionRef?: RefObject<KTableActionRef | null>;
  register: (actionRef: RefObject<KTableActionRef | null>) => void;
}

export const [KTableProvider, useKTableContext] = createZustandContext(() =>
  create<Context>((set, get) => {
    return {
      refresh: () => {
        get().actionRef?.current?.refresh();
      },
      getData: () => {
        return get().actionRef?.current?.getData() || [];
      },
      register(ref) {
        set({ actionRef: ref });
      },
    };
  }),
);
