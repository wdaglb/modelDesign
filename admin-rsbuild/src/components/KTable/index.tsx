import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Flex, Table } from 'antd';
import { isArray, omit } from 'lodash-es';
import { usePagination, useWhyDidYouUpdate } from 'ahooks';
import { KTableActionRef, KTableProps } from './types';
import { KTableProvider, useKTableContext } from './context.tsx';
import Button from './components/Button.tsx';
import ConfirmButton from './components/ConfirmButton.tsx';
import { useQuery } from '@tanstack/react-query';

/**
 * 处理结果
 */
const resultHandle = (
  res: any,
): {
  list: any[];
  total: number;
} => {
  if (!res) {
    return {
      list: [],
      total: 0,
    };
  }
  if (isArray(res)) {
    return {
      list: res,
      total: res.length,
    };
  }
  return {
    list: res.items,
    total: res.total,
  };
};

const Component = <R = any,>(props: KTableProps<R>) => {
  const context = useKTableContext();

  const actionRef = useRef<KTableActionRef>(null);
  const resolveRef = props.actionRef || actionRef;

  const [page, setPage] = useState(1);
  const { isLoading, data, isFetching, isPlaceholderData, refetch } = useQuery({
    queryKey: props.queryKey,
    queryFn: () => {
      return props.request?.({
        page,
        ...props.params,
      });
    },
  });

  const dataSource = useMemo(() => {
    return resultHandle(data);
  }, [data]);

  useImperativeHandle(resolveRef, () => ({
    refresh: () => {
      refetch();
    },
    getData: () => {
      // return data?.list ?? [];
      return [];
    },
  }));

  useEffect(() => {
    context.register(resolveRef);
  }, []);

  return (
    <Flex gap={8} vertical style={{ width: '100%' }} align={'stretch'}>
      {props.toolbar}

      <Table<any>
        rowKey={'id'}
        // pagination={false}
        dataSource={dataSource.list}
        {...omit(props, ['request', 'toolbar'])}
      />
    </Flex>
  );
};

export default function KTable<R>(props: KTableProps<R>) {
  return (
    <KTableProvider initialValue={{}}>
      <Component {...props} />
    </KTableProvider>
  );
}

KTable.Button = Button;
KTable.ConfirmButton = ConfirmButton;
