import { useEffect } from 'react';
import { Skeleton } from 'antd';

import { CardWrapper, CardHeader } from './#login-form.styled';

interface LoginSkeletonProps {
  onReady: () => void;
}

/** 过渡骨架屏：模拟密码表单布局，加载完成后通知切换 */
function LoginSkeleton(props: LoginSkeletonProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      props.onReady();
    }, 600);

    return () => {
      clearTimeout(timer);
    };
  }, [props.onReady]);

  return (
    <CardWrapper>
      <CardHeader>
        <Skeleton.Input active size="small" style={{ width: 120, marginBottom: 12 }} />
        <Skeleton.Input active size="default" style={{ width: 180, marginBottom: 10 }} />
        <Skeleton.Input active size="small" style={{ width: 300 }} />
      </CardHeader>

      <div style={{ marginBottom: 18 }}>
        <Skeleton.Input active size="small" style={{ width: 80, marginBottom: 8 }} />
        <Skeleton.Input active block size="large" />
      </div>

      <div style={{ marginBottom: 18 }}>
        <Skeleton.Input active size="small" style={{ width: 80, marginBottom: 8 }} />
        <Skeleton.Input active block size="large" />
      </div>

      <Skeleton.Button active block size="large" style={{ height: 46 }} />
    </CardWrapper>
  );
}

export default LoginSkeleton;
