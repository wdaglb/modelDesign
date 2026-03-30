import React from 'react';
import { Button, Checkbox, Col, Form, Input, Row, Select, Space } from 'antd';

import KModal from '@/components/KModal';
import { ApiScheme } from '@/api';

const dataTypeOptions = [
  'bigint',
  'int',
  'varchar',
  'text',
  'decimal',
  'datetime',
  'timestamp',
  'boolean',
].map((item) => ({
  label: item,
  value: item,
}));

const TableDesignForm = () => {
  return (
    <KModal.Form
      layout={'vertical'}
      initialValues={{
        columns: [
          {
            name: 'id',
            text: '主键',
            dataType: 'bigint',
            size: '20',
            notNull: true,
            autoIncrement: true,
            unsigned: true,
          },
        ],
      }}
      onFinish={async (values) => {
        await ApiScheme.submit(values);
      }}
    >
      <Form.Item
        name={'text'}
        label={'表中文名'}
        rules={[{ required: true, message: '请输入表中文名' }]}
      >
        <Input placeholder={'如：用户表'} />
      </Form.Item>

      <Form.Item
        name={'name'}
        label={'表名'}
        rules={[{ required: true, message: '请输入表名' }]}
      >
        <Input placeholder={'如：user'} />
      </Form.Item>

      <Form.Item name={'comment'} label={'备注'}>
        <Input.TextArea placeholder={'请输入备注'} rows={3} />
      </Form.Item>

      <Form.List name={'columns'}>
        {(fields, { add, remove }) => (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            {fields.map((field, index) => (
              <div
                key={field.key}
                style={{
                  padding: 16,
                  border: '1px solid #f0f0f0',
                  borderRadius: 12,
                }}
              >
                <Space
                  align="center"
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <span>字段 {index + 1}</span>
                  {fields.length > 1 && (
                    <Button danger type="link" onClick={() => remove(field.name)}>
                      删除字段
                    </Button>
                  )}
                </Space>

                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      name={[field.name, 'name']}
                      label={'字段名'}
                      rules={[{ required: true, message: '请输入字段名' }]}
                    >
                      <Input placeholder={'如：username'} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name={[field.name, 'text']}
                      label={'字段中文名'}
                      rules={[{ required: true, message: '请输入字段中文名' }]}
                    >
                      <Input placeholder={'如：用户名'} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name={[field.name, 'dataType']}
                      label={'字段类型'}
                      rules={[{ required: true, message: '请选择字段类型' }]}
                    >
                      <Select placeholder={'请选择'} options={dataTypeOptions} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name={[field.name, 'size']} label={'长度'}>
                      <Input placeholder={'如：255'} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name={[field.name, 'defaultValue']} label={'默认值'}>
                      <Input placeholder={'可选'} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name={[field.name, 'comment']} label={'备注'}>
                      <Input placeholder={'请输入字段备注'} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Space wrap size={24}>
                      <Form.Item
                        name={[field.name, 'notNull']}
                        valuePropName="checked"
                        noStyle
                      >
                        <Checkbox>非空</Checkbox>
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'autoIncrement']}
                        valuePropName="checked"
                        noStyle
                      >
                        <Checkbox>自增</Checkbox>
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'unsigned']}
                        valuePropName="checked"
                        noStyle
                      >
                        <Checkbox>无符号</Checkbox>
                      </Form.Item>
                    </Space>
                  </Col>
                </Row>
              </div>
            ))}

            <Button
              block
              type="dashed"
              onClick={() =>
                add({
                  name: '',
                  text: '',
                  dataType: 'varchar',
                  size: '255',
                  notNull: false,
                  autoIncrement: false,
                  unsigned: false,
                })
              }
            >
              添加字段
            </Button>
          </Space>
        )}
      </Form.List>
    </KModal.Form>
  );
};

export default TableDesignForm;
