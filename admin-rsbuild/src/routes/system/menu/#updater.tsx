import React, { useMemo } from 'react';
import { Flex, Form, Input, InputNumber, Radio } from 'antd';

import { ApiMenu } from '@/api';
import {
  MenuNodeType,
  MenuNodeTypeOptions,
} from '@/api/modules/menu.types.ts';
import KModal from '@/components/KModal';
import { autoBatchCreateChildren } from '@/routes/system/menu/#helper.ts';
import ParentSelect from '@/routes/system/menu/components/#ParentSelect.tsx';

import { MenuData } from '@/routes/system/menu/#types.ts';

interface UpdaterProps {
  record?: MenuData;
  /**
   * 上级
   */
  parent?: MenuData;
}

const Updater = (props: UpdaterProps) => {
  const [form] = Form.useForm();
  const initialValues = useMemo(() => {
    if (props.record) {
      return props.record;
    }
    return {
      nodeType: MenuNodeType.MENU,
      iconType: 'none',
      sort: 100,
      name: props.parent ? `${props.parent.name}/` : undefined,
      parentId: props.parent?.id ?? 0,
    };
  }, [props.parent, props.record]);

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      initialValues={initialValues}
      onFinish={async (values) => {
        let res;
        if (props.record) {
          res = await ApiMenu.edit(props.record.id, values);
        } else {
          res = await ApiMenu.create(values);
        }
        if (res.nodeType === MenuNodeType.MENU) {
          await autoBatchCreateChildren(res);
        }
      }}
    >
      <Form.Item name={'parentId'} label={'所属上级'}>
        <ParentSelect />
      </Form.Item>

      <Form.Item name={'nodeType'} label={'类型'} rules={[{ required: true }]}>
        <Radio.Group optionType={'button'} options={MenuNodeTypeOptions} />
      </Form.Item>

      <Form.Item
        name={'name'}
        label={'菜单标识'}
        rules={[
          { required: true },
          {
            validator: (_, value) => {
              if (!value) {
                return Promise.resolve();
              }
              if (!value.startsWith('/')) {
                return Promise.reject(new Error('标识必须以/开头'));
              }
              if (value.endsWith('/')) {
                return Promise.reject(new Error('标识不能以/结尾'));
              }
              return Promise.resolve();
            },
          },
        ]}
        extra={'标识必须唯一'}
      >
        <Input placeholder={'请输入'} autoFocus />
      </Form.Item>

      <Form.Item name={'title'} label={'显示名称'} rules={[{ required: true }]}>
        <Input placeholder={'请输入'} />
      </Form.Item>

      <Flex gap={8}>
        <Form.Item name={'iconType'} label={'图标类型'}>
          <Radio.Group
            options={[
              { label: '无', value: 'none' },
              { label: 'Iconify', value: 'iconify' },
            ]}
          />
        </Form.Item>

        <Form.Item shouldUpdate noStyle>
          {(form) => {
            const type = form.getFieldValue('iconType');
            if (type === 'iconify') {
              return (
                <Form.Item
                  shouldUpdate
                  name={'iconValue'}
                  label={'图标'}
                  extra={
                    <>
                      详见
                      <a
                        target={'_blank'}
                        href={'https://icon-sets.iconify.design/'}
                      >
                        iconify
                      </a>
                    </>
                  }
                >
                  <Input />
                </Form.Item>
              );
            }
            return null;
          }}
        </Form.Item>
      </Flex>

      <Form.Item name={'sort'} label={'排序'} extra={'值越小越靠前'}>
        <InputNumber min={0} style={{ width: 200 }} />
      </Form.Item>
    </KModal.Form>
  );
};

export default Updater;
