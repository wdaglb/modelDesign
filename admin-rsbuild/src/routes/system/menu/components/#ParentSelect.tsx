import React, { useEffect, useMemo, useState } from 'react';
import { TreeSelect } from 'antd';

import { useData } from '../#useHook';

const ROOT_ID = 0;

const findExpandPath = (
  nodes: Array<Record<string, any>>,
  targetId?: number,
  parents: number[] = [],
): number[] => {
  if (targetId == null) {
    return [];
  }
  for (const node of nodes) {
    if (node.id === targetId) {
      return parents;
    }
    if (node.children?.length) {
      const result = findExpandPath(node.children, targetId, [...parents, node.id]);
      if (result.length) {
        return result;
      }
    }
  }
  return [];
};

/**
 * 父级选择
 */
const ParentSelect = (props: {
  value?: number;
  onChange?: (value: number) => void;
}) => {
  const { data, isLoading } = useData();
  const treeData = useMemo(
    () => [
      {
        id: ROOT_ID,
        title: '根节点',
        children: data ?? [],
      },
    ],
    [data],
  );
  const autoExpandedKeys = useMemo(
    () => findExpandPath(treeData, props.value),
    [props.value, treeData],
  );
  const [treeExpandedKeys, setTreeExpandedKeys] = useState<number[]>(autoExpandedKeys);

  useEffect(() => {
    setTreeExpandedKeys(autoExpandedKeys);
  }, [autoExpandedKeys]);

  return (
    <TreeSelect
      treeData={treeData}
      loading={isLoading}
      showSearch={{
        treeNodeFilterProp: 'title',
      }}
      fieldNames={{ label: 'title', value: 'id' }}
      value={props.value}
      treeExpandedKeys={treeExpandedKeys}
      onTreeExpand={(keys) => setTreeExpandedKeys(keys as number[])}
      onOpenChange={(open) => {
        if (open) {
          setTreeExpandedKeys(autoExpandedKeys);
        }
      }}
      onChange={props.onChange}
    />
  );
};

export default ParentSelect;
