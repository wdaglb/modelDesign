import React from 'react';
import { Button, ButtonProps, message, Popconfirm } from 'antd';
import { omit } from 'lodash-es';

export interface KConfirmButtonProps extends Omit<ButtonProps, 'onClick'> {
  /**
   * 确认提示
   */
  confirmText?: string;
  /**
   * 确认回调
   */
  onConfirm?: (evt?: React.MouseEvent) => Promise<any>;
  /**
   * 取消回调
   */
  onCancel?: (evt?: React.MouseEvent) => any;
  /**
   * 成功提示
   */
  successText?: string;
}

const KConfirmButton = (props: KConfirmButtonProps) => {
  return (
    <Popconfirm
      title={props.confirmText || `确定要执行此操作吗？`}
      onConfirm={async () => {
        const res = await props.onConfirm?.();
        if (typeof res === 'undefined') {
          message.success(props.successText || '操作成功');
        }
      }}
      onCancel={props.onCancel}
    >
      <Button {...omit(props, ['confirmText', 'onConfirm', 'onCancel'])}>
        {props.children}
      </Button>
    </Popconfirm>
  );
};

export default KConfirmButton;
