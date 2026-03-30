import { omit } from 'lodash-es';

export interface TreeData<T, K> {
  id: K;
  parentId: K;
  children?: TreeData<T, K>[];
  [key: string]: any;
}

interface FieldName {
  id: string;
  parentId: string;
  children: string;
}

/**
 * 将数据转换为树结构
 * @param data
 * @param fieldNames
 * @returns
 */
const toTreeData = <T = any, K = number>(
  data: TreeData<T, K>[],
  fieldNames?: Partial<FieldName>,
) => {
  const result: TreeData<T, K>[] = [];
  const id = fieldNames?.id || 'id';
  const parentId = fieldNames?.parentId || 'parentId';
  const keys: Record<any, TreeData<T, K>> = {};
  data.forEach((item) => {
    keys[item[id]] = item;
  });
  data.forEach((item) => {
    const obj = keys[item[parentId]];
    if (obj) {
      if (!obj.children) {
        obj.children = [];
      }
      obj?.children?.push(item);
    } else {
      result.push(item);
    }
  });

  return result;
};

/**
 * 将树结构数据转换为扁平数据
 * @param data
 * @param fieldNames
 * @returns
 */
export const flattenData = <T = any, K = number>(
  data: TreeData<T, K>[],
  fieldNames?: Partial<FieldName>,
) => {
  const result: T[] = [];
  const children = fieldNames?.children || 'children';
  data.forEach((item) => {
    result.push(
      omit(
        {
          ...item,
        },
        ['children'],
      ) as T,
    );
    if (item[children]) {
      result.push(...flattenData(item[children], fieldNames));
    }
  });
  return result;
};

export default toTreeData;
