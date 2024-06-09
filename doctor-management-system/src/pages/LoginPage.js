import React from 'react';
import { Tabs } from 'antd';
import UserLogin from '../components/Auth/UserLogin';
import DoctorLogin from '../components/Auth/DoctorLogin';
import AdminLogin from '../components/Auth/AdminLogin';
import '../styles/styles.css'; // 导入样式

const { TabPane } = Tabs;

const LoginPage = () => {
  return (
    <div className="centered-form">
      <div className="title">圣马家沟医院预约管理系统</div>
      <div className="centered-form-container">
        <Tabs defaultActiveKey="user">
          <TabPane tab="用户登录" key="user">
            <UserLogin />
          </TabPane>
          <TabPane tab="医生登录" key="doctor">
            <DoctorLogin />
          </TabPane>
          <TabPane tab="管理员登录" key="admin">
            <AdminLogin />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default LoginPage;
