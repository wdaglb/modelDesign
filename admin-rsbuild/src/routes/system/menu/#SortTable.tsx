import {
  Alert,
  Flex,
  message,
  Modal,
  Space,
  Table,
  TableColumnsType,
  Typography,
} from 'antd';
import React, {
  Key,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { flattenData, TreeData } from '@/utils/tree.ts';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { toTreeData } from '@/utils';
import {
  Menu,
  MenuNodeType,
  MenuNodeTypeLabel,
} from '@/api/modules/menu.types.ts';
import queryKey from '@/constants/queryKey';
import { RequestError } from '@/api/types.ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/routes/system/menu/#useHook.ts';
import { ApiMenu } from '@/api';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import {
  RowContext,
  RowContextProps,
} from '@/routes/system/menu/#context.ts';
import DragHandle from '@/routes/system/menu/components/#DragHandle.tsx';
import { KTable } from '@/components';
import { useKModal } from '@/components/KModal';
import Updater from './#updater';
import { KTableActionRef } from '@/components/KTable/types.ts';
import { useKTableContext } from '@/components/KTable/context.tsx';
import { MenuData } from '@/routes/system/menu/#types.ts';
import { PERMISSION_RESOURCE } from '@/constants/permission.ts';
import Icons from '@/icons';

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string;
}

const Row: React.FC<Readonly<RowProps>> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props['data-row-key'],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: 'pointer',
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  };
  const contextValue = useMemo<RowContextProps>(
    () => ({ setActivatorNodeRef, listeners }),
    [setActivatorNodeRef, listeners],
  );

  return (
    <RowContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </RowContext.Provider>
  );
};

const SortTable = () => {
  const context = useKTableContext();
  const actionRef = useRef<KTableActionRef>(null);
  const modal = useKModal();
  const [selected, setSelected] = useState<Key[]>([]);
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState(false);

  const { isLoading, data, refetch } = useQuery({
    queryKey: queryKey.systemPolicy.list(),
    queryFn: request,
  });

  const swapSort = useMutation({
    mutationFn: ApiMenu.swapSort,
  });

  const { sortIds } = useMemo(() => {
    const ids: number[] = [];
    const scan = (tree: TreeData<Menu, number>[]) => {
      tree.forEach((item) => {
        ids.push(item.id);
        if (item.children && item.children.length > 0) {
          scan(item.children);
        }
      });
    };
    scan(data || []);
    return { sortIds: ids };
  }, [data]);

  const onDragEnd = async (evt: DragEndEvent) => {
    const { active, over } = evt;
    if (over && active.id !== over.id) {
      setUpdating(true);
      try {
        const from = Number(active.id);
        const to = Number(over.id);

        let newData = flattenData(data!);
        const fromIndex = newData.findIndex((item) => item.id === from);
        const toIndex = newData.findIndex((item) => item.id === to);
        if (
          newData[fromIndex].parentId === newData[toIndex].id ||
          newData[fromIndex].id === newData[toIndex].parentId
        ) {
          message.error('不能将父节点拖动到子节点下');
          return;
        }
        if (newData[fromIndex].sort === newData[toIndex].sort) {
          message.error('顺序相同，请先手动配置为不同顺序值');
          return;
        }
        const oldSort = newData[fromIndex].sort;
        newData[fromIndex].sort = newData[toIndex].sort;
        newData[toIndex].sort = oldSort;
        newData = arrayMove(newData, fromIndex, toIndex);
        const treeData = toTreeData<Menu, number>(newData, {
          parentId: 'parentId',
        });

        queryClient.setQueryData(queryKey.systemPolicy.list(), treeData);

        await swapSort.mutateAsync({
          source: from,
          target: to,
        });
      } catch (err) {
        if (err instanceof RequestError) {
          Modal.confirm({
            content: err.message,
            cancelButtonProps: { style: { display: 'none' } },
          });
        }
      } finally {
        setUpdating(false);
      }
    }
  };

  const columns: TableColumnsType<MenuData> = [
    {
      width: 30,
      dataIndex: 'id',
      render: () => <DragHandle />,
    },
    {
      title: '显示名称',
      dataIndex: 'title',
      width: 400,
    },
    {
      title: '菜单标识',
      dataIndex: 'name',
      width: 300,
      render: (_, record) => (
        <Typography.Text copyable>{record.name}</Typography.Text>
      ),
    },
    {
      title: '类型',
      dataIndex: 'nodeType',
      render: (_, record) => MenuNodeTypeLabel[record.nodeType as MenuNodeType],
    },
    {
      title: '排序',
      dataIndex: 'sort',
    },
    {
      title: '操作',
      width: 200,
      render: (_, record) => {
        return (
          <Space>
            {record.nodeType === MenuNodeType.MENU && (
              <KTable.Button
                variant={'filled'}
                color={'magenta'}
                size={'small'}
                permissionCode={PERMISSION_RESOURCE.systemMenuCreate}
                onClick={async (evt) => {
                  evt.stopPropagation();
                  return modal.open({
                    title: '添加子菜单',
                    children: <Updater parent={record} />,
                  });
                }}
              >
                添加子菜单
              </KTable.Button>
            )}

            <KTable.Button
              variant={'filled'}
              color={'blue'}
              size={'small'}
              permissionCode={PERMISSION_RESOURCE.systemMenuEdit}
              onClick={async (evt) => {
                evt.stopPropagation();
                await modal.open({
                  title: '修改菜单信息',
                  children: <Updater record={record} />,
                });
              }}
            >
              编辑
            </KTable.Button>

            <KTable.ConfirmButton
              variant={'filled'}
              color={'danger'}
              size={'small'}
              permissionCode={PERMISSION_RESOURCE.systemMenuDelete}
              onConfirm={async (evt) => {
                evt?.stopPropagation();
                await handleDelete([record.id]);
              }}
            >
              删除
            </KTable.ConfirmButton>
          </Space>
        );
      },
    },
  ];

  const handleDelete = async (ids: number[]) => {
    await ApiMenu.deleted(ids);
    setSelected([]);
    message.success('删除成功');
  };

  useImperativeHandle(actionRef, () => ({
    refresh: refetch,
    getData: () => data as any,
  }));

  useEffect(() => {
    context.register(actionRef);
  }, []);

  return (
    <Flex vertical gap={12}>
      <Alert
        type={'warning'}
        showIcon
        title={'删除父菜单时子菜单也会随之删除'}
      />

      <Flex gap={8}>
        <KTable.Button
          type={'primary'}
          icon={<Icons.Plus />}
          permissionCode={PERMISSION_RESOURCE.systemMenuCreate}
          onClick={async (evt) => {
            evt.stopPropagation();
            return modal.open({
              title: '添加菜单',
              children: <Updater />,
            });
          }}
        >
          添加菜单
        </KTable.Button>

        <KTable.ConfirmButton
          variant={'filled'}
          color={'danger'}
          permissionCode={PERMISSION_RESOURCE.systemMenuDelete}
          disabled={selected.length === 0}
          onConfirm={async () => {
            await ApiMenu.deleted(selected);
            setSelected([]);
          }}
        >
          删除选中
        </KTable.ConfirmButton>
      </Flex>

      <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
        <SortableContext items={sortIds} strategy={verticalListSortingStrategy}>
          <Table
            components={{
              body: {
                row: Row,
              },
            }}
            rowKey={'id'}
            loading={isLoading || updating}
            columns={columns}
            dataSource={data}
            pagination={false}
            rowSelection={{
              selectedRowKeys: selected,
              onChange: setSelected,
            }}
            expandable={{
              expandRowByClick: true,
              expandIconColumnIndex: 3,
            }}
          />
        </SortableContext>
      </DndContext>
    </Flex>
  );
};

export default SortTable;
