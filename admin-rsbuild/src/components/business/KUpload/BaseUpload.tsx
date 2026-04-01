import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Space, Typography, Upload, message } from 'antd';
import type { UploadFile, UploadProps } from 'antd';

import { ApiFile } from '@/api';

import { getAccept, getDefaultTips, getPreviewUrl, toUploadFileItem, validateUploadFile } from './helpers';
import type { KUploadBaseProps, KUploadMode } from './types';

interface BaseUploadProps extends KUploadBaseProps {
  /**
   * 上传模式。
   */
  mode: KUploadMode;
}

/**
 * 上传基础组件。
 */
const BaseUpload = (props: BaseUploadProps) => {
  const maxSizeInMb = getMaxSizeInMb(props.maxSizeInMb);
  const [uploadingFileList, setUploadingFileList] = useState<UploadFile[]>([]);

  const { data: fileDetail } = useQuery({
    queryKey: ['fileDetail', props.value],
    queryFn: async () => {
      if (!props.value) {
        return undefined;
      }
      return ApiFile.getDetail(props.value);
    },
    enabled: Boolean(props.value),
    staleTime: 5 * 60 * 1000,
  });

  const fileList = buildFileList(fileDetail, uploadingFileList, props.mode);
  const buttonText = getButtonText(props.mode, props.buttonText);
  const uploadTips = getTipsNode(props.mode, maxSizeInMb, props.tips);
  const listType = getListType(props.mode);

  const handleBeforeUpload: UploadProps['beforeUpload'] = (file) => {
    return validateUploadFile(file as File, props.mode, maxSizeInMb);
  };

  const handleCustomRequest: UploadProps['customRequest'] = async (options) => {
    const currentFile = options.file as File;
    const pendingUploadFile: UploadFile = {
      uid: String(Date.now()),
      name: currentFile.name,
      status: 'uploading',
      percent: 0,
    };

    setUploadingFileList([pendingUploadFile]);

    try {
      let fileDetailResponse;
      if (props.mode === 'image') {
        fileDetailResponse = await ApiFile.uploadImage(currentFile);
      } else {
        fileDetailResponse = await ApiFile.uploadFile(currentFile);
      }

      setUploadingFileList([]);
      props.onChange?.(fileDetailResponse.id);
      props.onUploaded?.(fileDetailResponse);
      options.onSuccess?.(fileDetailResponse);
      message.success('上传成功');
    } catch (error) {
      setUploadingFileList([]);
      options.onError?.(error as Error);
    }
  };

  const handleRemove: UploadProps['onRemove'] = async () => {
    if (!props.value) {
      props.onChange?.(undefined);
      return true;
    }

    try {
      if (shouldDeleteOnRemove(props.deleteOnRemove)) {
        await ApiFile.deleteFile({
          ids: [props.value],
        });
        message.success('删除成功');
      }
    } catch {
      return false;
    }

    props.onChange?.(undefined);
    return true;
  };

  const handlePreview: UploadProps['onPreview'] = async () => {
    const previewUrl = getPreviewUrl(fileDetail);
    if (!previewUrl) {
      return;
    }
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Upload
        accept={getAccept(props.mode)}
        maxCount={1}
        disabled={props.disabled}
        fileList={fileList}
        listType={listType}
        beforeUpload={handleBeforeUpload}
        customRequest={handleCustomRequest}
        onRemove={handleRemove}
        onPreview={handlePreview}
        showUploadList={{
          showPreviewIcon: props.mode === 'image',
          showRemoveIcon: !props.disabled,
        }}
      >
        {renderUploadTrigger(props.mode, buttonText, props.disabled, fileList)}
      </Upload>

      <Typography.Text type="secondary">{uploadTips}</Typography.Text>
    </Space>
  );
};

const buildFileList = (
  fileDetail: Awaited<ReturnType<typeof ApiFile.getDetail>> | undefined,
  uploadingFileList: UploadFile[],
  mode: KUploadMode,
) => {
  if (uploadingFileList.length > 0) {
    return uploadingFileList;
  }
  if (!fileDetail) {
    return [];
  }
  return [toUploadFileItem(fileDetail, mode)];
};

const getMaxSizeInMb = (maxSizeInMb?: number) => {
  if (!maxSizeInMb) {
    return 20;
  }
  return maxSizeInMb;
};

const shouldDeleteOnRemove = (deleteOnRemove?: boolean) => {
  if (deleteOnRemove === false) {
    return false;
  }
  return true;
};

const getButtonText = (mode: KUploadMode, buttonText?: string) => {
  if (buttonText) {
    return buttonText;
  }
  if (mode === 'image') {
    return '上传图片';
  }
  return '上传附件';
};

const getTipsNode = (
  mode: KUploadMode,
  maxSizeInMb: number,
  tips?: React.ReactNode,
) => {
  if (tips) {
    return tips;
  }
  return getDefaultTips(mode, maxSizeInMb);
};

const getListType = (mode: KUploadMode): UploadProps['listType'] => {
  if (mode === 'image') {
    return 'picture-card';
  }
  return 'text';
};

const renderUploadTrigger = (
  mode: KUploadMode,
  buttonText: string,
  disabled: boolean | undefined,
  fileList: UploadFile[],
) => {
  if (disabled) {
    return null;
  }

  if (fileList.length > 0) {
    return null;
  }

  if (mode === 'image') {
    return (
      <div style={{ padding: 8 }}>
        <div style={{ fontSize: 24, lineHeight: 1 }}>+</div>
        <div style={{ marginTop: 8 }}>{buttonText}</div>
      </div>
    );
  }

  return <Button>{buttonText}</Button>;
};

export default BaseUpload;
