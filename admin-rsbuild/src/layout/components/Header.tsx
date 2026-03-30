import styles from '../index.module.less';
import logo from '../../assets/svg/logo.svg';
import { Avatar, Dropdown, Layout as AntLayout } from 'antd';
import { useNavigate } from '@tanstack/react-router';
import { CSSProperties } from 'react';

function Header(props: { style?: CSSProperties }) {
  const navigate = useNavigate();

  const handleUserAction = (key: string) => {
    switch (key) {
      case 'logout':
        navigate({ to: '/login' });
        break;
      default:
        break;
    }
  };
  return (
    <AntLayout.Header className={styles.header} style={props.style}>
      <div className={styles.logo}>
        <img src={logo} className={styles.img} />
        {process.env.TITLE}
      </div>

      <div>
        <div className={styles.headerBox}>
          <Dropdown
            menu={{
              items: [{ label: '注销登录', key: 'logout' }],
              onClick: ({ key }) => {
                handleUserAction(key);
              },
            }}
          >
            <div>
              <Avatar>超</Avatar>
              超级管理员
            </div>
          </Dropdown>
        </div>
      </div>
    </AntLayout.Header>
  );
}

export default Header;
