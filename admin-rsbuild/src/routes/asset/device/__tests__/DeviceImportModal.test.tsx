import React from 'react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import DeviceImportModal from '../#DeviceImportModal';

const { mockDownloadImportTemplate } = vi.hoisted(() => {
  return {
    mockDownloadImportTemplate: vi.fn(),
  };
});

vi.mock('@/api', () => {
  return {
    ApiAssetDevice: {
      IMPORT_TEMPLATE_DOWNLOAD_URL: '/api/asset/device/import/template',
      downloadImportTemplate: mockDownloadImportTemplate,
    },
  };
});

vi.mock('@/components/KModal', () => {
  return {
    default: {
      Form: (props: any) => {
        return <form>{props.children}</form>;
      },
    },
  };
});

describe('DeviceImportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show template download url and trigger template download', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    mockDownloadImportTemplate.mockResolvedValue(undefined);

    render(
      <QueryClientProvider client={queryClient}>
        <DeviceImportModal />
      </QueryClientProvider>,
    );

    const templateLink = screen.getByRole('link', { name: '点击下载模板' });

    /**
     * 弹窗里隐藏后端地址，避免用户误以为需要复制链接；
     * 点击时仍走封装方法，用当前登录 token 下载模板。
     */
    expect(templateLink.getAttribute('href')).toBe(
      '/api/asset/device/import/template',
    );

    await user.click(templateLink);

    expect(mockDownloadImportTemplate).toHaveBeenCalledTimes(1);
  });
});
