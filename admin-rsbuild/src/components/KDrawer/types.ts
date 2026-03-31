import { DrawerProps } from 'antd';

export interface DrawerItem {
  id: string;
  props: OpenProps;
}

export interface OpenProps extends Omit<DrawerProps, 'open' | 'onClose'> {
  onOk?: (res?: any) => Promise<any>;
  onCancel?: () => void;
}
