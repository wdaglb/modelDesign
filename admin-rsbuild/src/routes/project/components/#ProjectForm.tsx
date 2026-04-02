import React, { useEffect, useState } from 'react';
import { Col, Form, Input, Row, Select } from 'antd';
import KModal from '@/components/KModal';
import { ApiProject } from '@/api';
import {
  DatabaseTypeOptions,
  Project,
  ProjectStatus,
  ProjectStatusOptions,
} from '@/api/modules/project.types';
import { getPinyinInitials } from '@/utils/pinyin';

/**
 * 项目表单属性。
 */
interface ProjectFormProps {
  record?: Project;
}

/**
 * 构造表单初始值。
 *
 * 新建时主动补齐默认状态，保持项目创建入口的最小必填表单。
 *
 * @param record 编辑态项目记录
 * @returns 表单初始值
 */
function buildInitialValues(record?: Project) {
  if (record) {
    return {
      ...record,
      status: record.status,
    };
  }

  return {
    status: ProjectStatus.Planning,
  };
}

/**
 * 项目创建与编辑表单。
 *
 * @param props 组件属性
 * @returns 表单组件
 */
const ProjectForm = (props: ProjectFormProps) => {
  const [form] = Form.useForm();
  const [isAutoCode, setIsAutoCode] = useState(!props.record);
  const isEdit = Boolean(props.record);

  useEffect(() => {
    if (!isEdit && isAutoCode) {
      const name = form.getFieldValue('name');
      if (name) {
        form.setFieldValue('code', getPinyinInitials(name));
      }
    }
  }, [form, isAutoCode, isEdit]);

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      initialValues={buildInitialValues(props.record)}
      onFinish={async (values) => {
        if (props.record) {
          await ApiProject.edit(props.record.id, values);
          return;
        }

        await ApiProject.create(values);
      }}
    >
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            name={'name'}
            label={'项目名称'}
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input
              placeholder={'请输入项目名称'}
              onChange={(event) => {
                if (!isEdit && isAutoCode) {
                  form.setFieldValue(
                    'code',
                    getPinyinInitials(event.target.value),
                  );
                }
              }}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
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
      </Row>

      <Row gutter={12}>
        <Col span={12}>
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
        </Col>

        <Col span={12}>
          <Form.Item
            name={'status'}
            label={'项目状态'}
            rules={[{ required: true, message: '请选择项目状态' }]}
          >
            <Select
              placeholder={'请选择项目状态'}
              options={ProjectStatusOptions}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col span={24}>
          <Form.Item name={'projectGroup'} label={'项目分组'}>
            <Input placeholder={'例如：支付业务组'} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name={'description'} label={'项目概况'}>
        <Input.TextArea
          placeholder={'请输入项目概况'}
          rows={4}
          showCount
          maxLength={1000}
        />
      </Form.Item>

      <Form.Item name={'progressSummary'} label={'当前进展'}>
        <Input.TextArea
          placeholder={'请输入当前进展'}
          rows={4}
          showCount
          maxLength={1000}
        />
      </Form.Item>
    </KModal.Form>
  );
};

export default ProjectForm;
