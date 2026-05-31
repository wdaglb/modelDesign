import { useState } from 'react';
import { Alert, Form, Typography, Upload, message } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiAssetDevice } from '@/api';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

/**
 * Excel 导入文件最大体积，单位 MB。
 */
const MAX_IMPORT_FILE_SIZE_IN_MB = 10;

/**
 * 设备批量入库导入表单。
 */
const DeviceImportModal = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleDownloadTemplate = async () => {
    try {
      await ApiAssetDevice.downloadImportTemplate();
    } catch {
      message.error('下载导入模板失败，请稍后重试');
    }
  };

  const handleBeforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      message.error('仅支持上传 .xlsx 文件');
      return Upload.LIST_IGNORE;
    }

    if (file.size > MAX_IMPORT_FILE_SIZE_IN_MB * 1024 * 1024) {
      message.error(`导入文件大小不能超过 ${MAX_IMPORT_FILE_SIZE_IN_MB}MB`);
      return Upload.LIST_IGNORE;
    }

    return false;
  };

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      onFinish={async () => {
        const selectedFile = resolveSelectedFile(fileList);
        if (!selectedFile) {
          message.error('请先选择要导入的 Excel 文件');
          return false;
        }

        const result = await ApiAssetDevice.importDevices(selectedFile);
        await queryClient.invalidateQueries({
          queryKey: queryKey.asset.deviceList(),
        });
        message.success(`成功导入 ${result.importedCount} 条设备库存`);
        return result;
      }}
    >
      <Alert
        type={'info'}
        showIcon
        style={{ marginBottom: 16 }}
        message={'导入规则'}
        description={
          <>
            <Typography.Paragraph style={{ marginBottom: 4 }}>
              仅支持 .xlsx 文件；表头需包含设备名称、设备分类、
              资产编号、序列号、所在位置、购置日期、备注。
              设备分类和所在位置按名称精确匹配，
              任意一行错误都会整批失败。
            </Typography.Paragraph>
            <Typography.Text>
              导入前请先
              <Typography.Link
                href={ApiAssetDevice.IMPORT_TEMPLATE_DOWNLOAD_URL}
                onClick={(event) => {
                  event.preventDefault();
                  void handleDownloadTemplate();
                }}
              >
                点击下载模板
              </Typography.Link>
            </Typography.Text>
          </>
        }
      />

      <Form.Item label={'库存导入文件'} required>
        <Upload.Dragger
          accept={'.xlsx'}
          maxCount={1}
          fileList={fileList}
          beforeUpload={handleBeforeUpload}
          onChange={(info) => {
            setFileList(info.fileList.slice(-1));
          }}
          onRemove={() => {
            setFileList([]);
            return true;
          }}
        >
          <p className={'ant-upload-text'}>点击或拖拽 Excel 文件到此区域</p>
          <p className={'ant-upload-hint'}>
            购置日期请使用 YYYY-MM-DD，例如 2026-05-30
          </p>
        </Upload.Dragger>
      </Form.Item>
    </KModal.Form>
  );
};

/**
 * 从 Upload 组件状态中读取真实 File。
 *
 * Ant Design 的 UploadFile 可能只保存展示信息；提交前必须取 originFileObj，
 * 否则后端无法收到 multipart 文件内容。
 *
 * @param fileList 上传组件文件列表
 * @returns 待导入文件
 */
function resolveSelectedFile(fileList: UploadFile[]) {
  if (fileList.length === 0) {
    return undefined;
  }

  const selectedFile = fileList[0].originFileObj;
  if (!selectedFile) {
    return undefined;
  }

  return selectedFile as File;
}

export default DeviceImportModal;
