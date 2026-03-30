import { memo } from 'react';
import { Outlet } from '@tanstack/react-router';
import { Layout as AntLayout } from 'antd';
import Side from './components/Side.tsx';

function Layout() {
  return (
    <AntLayout>
      <AntLayout>
        <Side />

        <AntLayout.Content style={{ overflow: 'initial' }}>
          <Outlet />
        </AntLayout.Content>
      </AntLayout>
    </AntLayout>
    // <ProLayout
    //   title={process.env.TITLE}
    //   logo={logo}
    //   menu={{
    //     request: async () => {
    //       const res = await ApiPassport.getCurrentPermission();
    //       return res.menus.map((item) => ({
    //         key: item.name,
    //         path: item.name,
    //         name: item.title,
    //       }));
    //     },
    //   }}
    //   menuProps={{
    //     selectedKeys: [location.pathname],
    //     onClick: (menu) => {
    //       router.navigate({
    //         to: menu.key,
    //       });
    //     },
    //   }}
    // >
    //   <Outlet />
    // </ProLayout>
  );
}

export default memo(Layout);
