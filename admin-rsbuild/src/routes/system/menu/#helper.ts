import {
  ButtonType,
  ButtonTypeLabel,
  Menu,
} from '@/api/modules/menu.types.ts';
import { ApiMenu } from '@/api';
import { omit } from 'lodash-es';
import { MenuData } from '@/routes/system/menu/#types.ts';

/**
 * 自动批量创建子节点 （创建，修改，删除）
 */
export const autoBatchCreateChildren = async (
  parent: Menu,
  buttons: ButtonType[] = [
    ButtonType.Create,
    ButtonType.Edit,
    ButtonType.Delete,
  ],
) => {
  if (buttons.length === 0) {
    return;
  }
  await Promise.all(
    buttons.map((button, idx) => {
      return ApiMenu.create({
        parentId: parent.id,
        ...omit(parent, ['id', 'parentId']),
        name: parent.name + '/' + button,
        title: ButtonTypeLabel[button],
        nodeType: 1,
        sort: (idx + 1) * 100,
      });
    }),
  );
};
