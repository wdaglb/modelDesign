import React, { useEffect, useState } from 'react';
import { Col, Form, Input, Row, Select } from 'antd';
import KModal from '@/components/KModal';
import { ApiProject } from '@/api';
import { Project, DatabaseTypeOptions } from '@/api/modules/project.types';
import { getPinyinInitials } from '@/utils/pinyin';

interface ProjectFormProps {
  record?: Project;
}

const ProjectForm = (props: ProjectFormProps) => {
  const [form] = Form.useForm();
  const [isAutoCode, setIsAutoCode] = useState(!props.record);
  const isEdit = !!props.record;

  useEffect(() => {
    if (!isEdit && isAutoCode) {
      const name = form.getFieldValue('name');
      if (name) {
        form.setFieldValue('code', getPinyinInitials(name));
      }
    }
  }, [form, isEdit, isAutoCode]);

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      initialValues={props.record}
      onFinish={async (values) => {
        if (props.record) {
          await ApiProject.edit(props.record.id, values);
        } else {
          await ApiProject.create(values);
        }
      }}
    >
      <Row gutter={12}>
        <Col span={8}>
          <Form.Item
            name={'dbType'}
            label={'数据库类型'}
            rules={[{ required: true, message: '请选择数据库类型' }]}
          >
            <Select
              placeholder={'请选择数据库类型'}
              options={DatabaseTypeOptions}
              disabled={isEdit}
            />
          </Form.Item>
        </Col>

        <Col span={16}>
          <Form.Item
            name={'name'}
            label={'名称'}
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input
              placeholder={'请输入名称'}
              onChange={(e) => {
                if (!isEdit && isAutoCode) {
                  form.setFieldValue('code', getPinyinInitials(e.target.value));
                }
              }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name={'code'}
        label={'项目编号'}
        rules={[{ required: true, message: '请输入项目编号' }]}
      >
        <Input
          placeholder={'自动生成，可手动修改'}
          disabled={isEdit}
          onChange={() => {
            if (!isEdit) {
              setIsAutoCode(false);
            }
          }}
        />
      </Form.Item>

      <Form.Item name={'description'} label={'描述'}>
        <Input.TextArea placeholder={'请输入描述'} rows={4} />
      </Form.Item>
    </KModal.Form>
  );
};

export default ProjectForm;
