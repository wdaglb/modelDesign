import { useContext } from 'react';
import { globalModalContext } from '@/components/KModal/context.tsx';
import { OpenProps } from '@/components/KModal/types.ts';

const useKModal = () => {
  const context = useContext(globalModalContext);

  return {
    open<T = any>(props: OpenProps): Promise<T> {
      return new Promise((resolve, reject) => {
        context.pushModal({
          ...props,
          async onOk(res) {
            resolve(res);
          },
          onCancel() {
            reject('KModal cancel');
          },
        });
      });
    },
  };
};

export default useKModal;
