import { Modal } from 'antd';
import { ModalFuncProps } from 'antd/es/modal/interface';

const Confirm = (props: Omit<ModalFuncProps, 'onOk' | 'onCancel'>) => {
  return new Promise<void>((resolve, reject) => {
    Modal.confirm({
      ...props,
      onOk: () => resolve(),
      onCancel: () => reject('Confirm cancel'),
    });
  });
};

export default Confirm;
