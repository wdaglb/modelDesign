import { useContext } from 'react';
import { globalDrawerContext } from '@/components/KDrawer/context.tsx';
import { OpenProps } from '@/components/KDrawer/types.ts';

const useKDrawer = () => {
  const context = useContext(globalDrawerContext);

  return {
    open<T = any>(props: OpenProps): Promise<T> {
      return new Promise((resolve, reject) => {
        context.pushDrawer({
          ...props,
          async onOk(res) {
            resolve(res);
          },
          onCancel() {
            reject('KDrawer cancel');
          },
        });
      });
    },
  };
};

export default useKDrawer;
