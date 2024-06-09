import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Form, Input, Button, message, Modal } from 'antd';
import ProTable from '@ant-design/pro-table';
import { Link } from 'react-router-dom';
import '../../styles/user.css'; // 引入新的样式文件

const { Sider, Content } = Layout;

const UserInfoPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/user/profile', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          // 将用户信息转换为初始数据格式
          const initialData = [
            { id: 1, key: 'name', title: '姓名', value: data.name },
            { id: 2, key: 'gender', title: '性别', value: data.gender },
            { id: 3, key: 'idNumber', title: '身份证号', value: data.id },
            { id: 4, key: 'address', title: '家庭住址', value: data.address },
            { id: 5, key: 'phoneNumber', title: '电话号码', value: data.phone_number },
            { id: 6, key: 'emergencyContact', title: '紧急联系人电话号码', value: data.emergency_contact },
          ];
          setDataSource(initialData);
          form.setFieldsValue(data); // 设置表单初始值
        } else {
          console.error('获取用户信息失败');
        }
      } catch (error) {
        console.error('获取用户信息时发生错误:', error);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    // 清理定时器
    return () => clearInterval(interval);
  }, [form]);

  const columns = [
    {
      title: '信息项',
      dataIndex: 'title',
    },
    {
      title: '内容',
      dataIndex: 'value',
    },
  ];

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      console.log('values:', values);
      const response = await fetch(`http://localhost:5000/user/${values.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: values.name,
          gender: values.gender,
          address: values.address,
          phone_number: values.phone_number,
          emergency_contact: values.emergency_contact,
        }),
      });
      if (response.ok) {
        message.success('用户信息已更新');
        setIsModalVisible(false);
        setDataSource(dataSource.map(item => ({
          ...item,
          value: values[item.key],
        })));
      } else {
        message.error('更新用户信息失败');
        console.error('更新用户信息失败');
      }
    } catch (error) {
      message.error('更新用户信息失败');
      console.error('更新用户信息时发生错误:', error);
    }
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={200} className="site-layout-background">
        <Menu mode="vertical" defaultSelectedKeys={['user-info']}>
          <Menu.Item key="appointment">
            <Link to="/user/appointment">预约页面</Link>
          </Menu.Item>
          <Menu.Item key="user-info">
            <Link to="/user/info">用户信息</Link>
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
            loading={loading}
            search={false}
            pagination={false}
          />
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Button type="primary" onClick={() => setIsModalVisible(true)}>修改</Button>
          </div>
          <Modal
            title="修改用户信息"
            visible={isModalVisible}
            onOk={handleSave}
            onCancel={() => setIsModalVisible(false)}
            okText="保存"
            cancelText="取消"
          >
            <Form form={form} layout="vertical">
              <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input />
              </Form.Item>
              <Form.Item label="性别" name="gender" rules={[{ required: true, message: '请输入性别' }]}>
                <Input />
              </Form.Item>
              <Form.Item label="身份证号" name="id" rules={[{ required: false, message: '请输入身份证号' }]}>
                <Input disabled />
              </Form.Item>
              <Form.Item label="家庭住址" name="address" rules={[{ required: true, message: '请输入家庭住址' }]}>
                <Input />
              </Form.Item>
              <Form.Item label="电话号码" name="phone_number" rules={[{ required: true, message: '请输入电话号码' }]}>
                <Input />
              </Form.Item>
              <Form.Item label="紧急联系人电话号码" name="emergency_contact" rules={[{ required: true, message: '请输入紧急联系人电话号码' }]}>
                <Input />
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default UserInfoPage;
