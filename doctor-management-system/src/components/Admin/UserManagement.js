import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, message } from 'antd';
import ProTable from '@ant-design/pro-table';
import { Link } from 'react-router-dom';
import '../../styles/admin.css'; // 引入新的样式文件

const { Sider, Content } = Layout;
const token = localStorage.getItem('token');

// const initialUsers = [
//   { id: 1, name: '张三', gender: '男', idNumber: '123456789012345678', address: '黑龙江省哈尔滨市道里区', phone: '12345678901', emergencyContact: '98765432101', password: 'password1' },
//   { id: 2, name: '李四', gender: '女', idNumber: '234567890123456789', address: '黑龙江省哈尔滨市道外区', phone: '12345678902', emergencyContact: '98765432102', password: 'password2' },
//   { id: 3, name: '王五', gender: '男', idNumber: '345678901234567890', address: '黑龙江省哈尔滨市南岗区', phone: '12345678903', emergencyContact: '98765432103', password: 'password3' },
//   { id: 4, name: '赵六', gender: '女', idNumber: '456789012345678901', address: '黑龙江省哈尔滨市香坊区', phone: '12345678904', emergencyContact: '98765432104', password: 'password4' },
//   { id: 5, name: '孙七', gender: '男', idNumber: '567890123456789012', address: '黑龙江省哈尔滨市群里区', phone: '12345678905', emergencyContact: '98765432105', password: 'password5' },
//   { id: 6, name: '周八', gender: '女', idNumber: '678901234567890123', address: '黑龙江省哈尔滨市松北区', phone: '12345678906', emergencyContact: '98765432106', password: 'password6' },
//   { id: 7, name: '吴九', gender: '男', idNumber: '789012345678901234', address: '黑龙江省哈尔滨市平房区', phone: '12345678907', emergencyContact: '98765432107', password: 'password7' },
//   { id: 8, name: '郑十', gender: '女', idNumber: '890123456789012345', address: '黑龙江省哈尔滨市呼兰区', phone: '12345678908', emergencyContact: '98765432108', password: 'password8' },
//   { id: 9, name: '冯十一', gender: '男', idNumber: '901234567890123456', address: '黑龙江省哈尔滨市阿城区', phone: '12345678909', emergencyContact: '98765432109', password: 'password9' },
//   { id: 10, name: '陈十二', gender: '女', idNumber: '012345678901234567', address: '黑龙江省哈尔滨市道里区', phone: '12345678910', emergencyContact: '98765432110', password: 'password10' },
// ];

const UserManagementPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [dataSource, setDataSource] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/admin/users', {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setDataSource(data);
        } else {
          message.error('获取用户信息失败');
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        message.error('获取用户信息失败');
      }
    };

    fetchUsers();
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (rowKey) => {
    try {
      const response = await fetch(`http://localhost:5000/admin/users/${rowKey}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to delete data');
      }
      const { success } = await response.json();
      if (success) {
        setDataSource(dataSource.filter((item) => item.id !== rowKey));
        message.success('删除成功');
      } else {
        throw new Error('Delete operation failed');
      }
    } catch (error) {
      console.error('Delete data error:', error);
      message.error('删除失败，请重试');
    }
  };

  const columns = [
    { title: '姓名', dataIndex: 'name' },
    { title: '性别', dataIndex: 'gender' },
    { title: '身份证号', dataIndex: 'idNumber' },
    { title: '家庭住址', dataIndex: 'address' },
    { title: '电话号码', dataIndex: 'phone' },
    { title: '紧急联系人电话号码', dataIndex: 'emergencyContact' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => (
        <Button type="danger" onClick={() => handleDelete(record.idNumber)}>删除</Button>
      ),
    },
  ];

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={200} className="site-layout-background">
        <Menu mode="vertical" defaultSelectedKeys={['user-management']}>
          <Menu.Item key="doctor-management">
            <Link to="/admin/doctor-management">医生管理</Link>
          </Menu.Item>
          <Menu.Item key="user-management">
            <Link to="/admin/user-management">用户管理</Link>
          </Menu.Item>
          <Menu.Item key="appointment-management">
            <Link to="/admin/appointment-management">预约管理</Link>
          </Menu.Item>
        </Menu>
        <div style={{ position: 'absolute', bottom: '20px', width: '100%', textAlign: 'center', color: 'white' }}>
          {currentTime}
        </div>
      </Sider>
      <Layout>
        <Content style={{ padding: '0 24px', minHeight: 280 }}>
          <ProTable
            rowKey="id"
            dataSource={dataSource}
            columns={columns}
            search={false}
            pagination={false}
            scroll={{ y: 900 }} // 设置表格的滚动高度
          />
        </Content>
      </Layout>
    </Layout>
  );
};

export default UserManagementPage;
