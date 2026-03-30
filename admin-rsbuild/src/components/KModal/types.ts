import { DrawerProps } from 'antd';

export interface ModalItem {
  id: string;
  props: OpenProps;
}

export interface OpenProps extends Omit<
  DrawerProps,
  'open' | 'onOk' | 'onCancel' | 'closable'
> {
  onOk?: (res?: any) => Promise<any>;
  onCancel?: () => void;
}
