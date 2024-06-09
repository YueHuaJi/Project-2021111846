import React from 'react';
import { Layout, Menu } from 'antd';
import { Link } from 'react-router-dom';

const { Header, Content, Sider } = Layout;

const AdminPage = () => {
  return (
    <Layout>
      <Header className="header">
        <div className="logo" />
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['2']}>
          <Menu.Item key="1">nav 1</Menu.Item>
          <Menu.Item key="2">nav 2</Menu.Item>
          <Menu.Item key="3">nav 3</Menu.Item>
        </Menu>
      </Header>
      <Layout>
        <Sider width={200} className="site-layout-background">
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            style={{ height: '100%', borderRight: 0 }}
          >
            <Menu.Item key="1">
              <Link to="/admin/doctor-management">医生管理</Link>
            </Menu.Item>
            <Menu.Item key="2">
              <Link to="/admin/user-management">用户管理</Link>
            </Menu.Item>
            <Menu.Item key="3">
              <Link to="/admin/appointment-management">预约管理</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content
            className="site-layout-background"
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
            }}
          >
            <h2>欢迎管理员</h2>
            <p>请选择左侧菜单中的一个选项。</p>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AdminPage;
