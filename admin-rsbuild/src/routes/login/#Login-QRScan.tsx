import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  CardDescription,
  CardEyebrow,
  CardHeader,
  CardTitle,
  CardWrapper,
} from './#login-form.styled';

interface LoginQRScanProps {
  onSwitchToPassword: () => void;
  onLoginSuccess: () => void;
}

const QR_TIMEOUT_MS = 60_000;

/** Mock: 模拟获取 QR 码 */
async function fetchQRCode(): Promise<{ qrUrl: string; token: string }> {
  return {
    qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=mock-login-${Date.now()}`,
    token: `qr-token-${Date.now()}`,
  };
}

/** Mock: 模拟轮询扫描状态 */
async function checkQRStatus(_token: string): Promise<{ scanned: boolean }> {
  return { scanned: false };
}

/** QR 扫描登录面板：展示二维码 + 轮询扫描状态 + 超时处理 */
function LoginQRScan(props: LoginQRScanProps) {
  const [expired, setExpired] = useState(false);
  const [startTime] = useState(() => Date.now());

  const qrQuery = useQuery({
    queryKey: ['login-qr-code'],
    queryFn: fetchQRCode,
    refetchInterval: (query) => {
      if (query.state.data?.scanned) {
        return false;
      }
      if (Date.now() - startTime > QR_TIMEOUT_MS) {
        setExpired(true);
        return false;
      }
      return 3000;
    },
    retry: 0,
  });

  const statusQuery = useQuery({
    queryKey: ['login-qr-status', qrQuery.data?.token],
    queryFn: () => checkQRStatus(qrQuery.data!.token),
    enabled: !!qrQuery.data?.token && !expired,
    refetchInterval: 3000,
  });

  if (statusQuery.data?.scanned) {
    props.onLoginSuccess();
  }

  return (
    <CardWrapper>
      <CardHeader>
        <CardEyebrow>QR SCAN</CardEyebrow>
        <CardTitle>扫码登录</CardTitle>
        <CardDescription>
          请使用移动端 App 扫描下方二维码完成登录。
        </CardDescription>
      </CardHeader>

      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        {expired && (
          <div>
            <p>二维码已过期</p>
            <button
              type="button"
              onClick={() => {
                setExpired(false);
                qrQuery.refetch();
              }}
            >
              重新生成
            </button>
          </div>
        )}

        {!expired && qrQuery.data && (
          <img
            src={qrQuery.data.qrUrl}
            alt="登录二维码"
            width={200}
            height={200}
          />
        )}

        {!expired && qrQuery.isLoading && <p>加载二维码中...</p>}

        {qrQuery.isError && (
          <div>
            <p>加载失败</p>
            <button type="button" onClick={() => qrQuery.refetch()}>
              重试
            </button>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button type="button" onClick={props.onSwitchToPassword}>
          返回密码登录
        </button>
      </div>
    </CardWrapper>
  );
}

export default LoginQRScan;
