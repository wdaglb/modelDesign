import React from 'react';

import BaseUpload from './BaseUpload';
import type { KFileUploadProps, KImageUploadProps } from './types';

/**
 * 普通附件上传组件。
 */
export const KFileUpload = (props: KFileUploadProps) => {
  return <BaseUpload mode="file" {...props} />;
};

/**
 * 图片上传组件。
 */
export const KImageUpload = (props: KImageUploadProps) => {
  return <BaseUpload mode="image" {...props} />;
};

const KUpload = {
  File: KFileUpload,
  Image: KImageUpload,
};

export default KUpload;
