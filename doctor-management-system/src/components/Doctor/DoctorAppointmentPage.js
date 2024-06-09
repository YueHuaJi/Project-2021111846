import React, { useState, useEffect } from 'react';
import { Layout, Menu, Table, Button, Modal, Form, InputNumber, message, Input } from 'antd';
import { Link } from 'react-router-dom';
import '../../styles/doctor.css'; // 引入新的样式文件

const { Sider, Content } = Layout;
const token = localStorage.getItem('token');

const DoctorAppointmentPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [appointments, setAppointments] = useState([]);
  const [quotaData, setQuotaData] = useState([]);
  const [editableKeys, setEditableKeys] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 获取医生的配额信息
    const fetchSchedule = async () => {
      try {
        const response = await fetch('http://localhost:5000/doctor/schedule', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const scheduleData = await response.json();
        console.log('获取的配额数据:', scheduleData); // 添加日志记录

        // 处理配额数据
        const quota = [];
        scheduleData.forEach((item, index) => {
          const formattedDate = item.date;  // 直接使用后端提供的日期
          quota.push(
            { id: index * 2 + 1, timeSlot: `${formattedDate} 上午`, quota: item.morning_limit },
            { id: index * 2 + 2, timeSlot: `${formattedDate} 下午`, quota: item.afternoon_limit }
          );
        });
        setQuotaData(quota);
        setEditableKeys(quota.map((item) => item.id));

      } catch (error) {
        message.error('获取配额信息失败');
      }
    };

    fetchSchedule();
  }, []);

  useEffect(() => {
    // 获取医生的预约信息
    const fetchAppointments = async () => {
      try {
        const response = await fetch('http://localhost:5000/doctor/appointments', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const appointmentsData = await response.json();
        console.log('获取的预约数据:', appointmentsData); // 添加日志记录
  
        // 将获取到的预约信息设置到状态中
        const formattedAppointments = appointmentsData.map((item) => ({
          id: item.appointment_id,
          timeSlot: item.appointment_date + ' ' + item.appointment_period,  // 直接使用后端提供的预约时间
          userName: item.user_name,
          userGender: item.user_gender,
          userID: item.user_id,
        }));

        setAppointments(formattedAppointments);
      } catch (error) {
        message.error('获取预约信息失败');
      }
    };
  
    fetchAppointments();
  }, []);

  const showEditModal = (record) => {
    setCurrentRecord(record);
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const updatedData = quotaData.map(item => {
        if (item.id === currentRecord.id) {
          return { ...item, ...currentRecord };
        }
        return item;
      });

      // 准备要发送到后端的数据格式
      const schedules = [];
      updatedData.forEach(item => {
        const datePart = item.timeSlot.split(' ')[0]; // 提取日期部分
        const periodPart = item.timeSlot.split(' ')[1]; // 提取上午/下午部分

        // 查找是否已经有该日期的记录
        const existingSchedule = schedules.find(schedule => schedule.date === datePart);

        if (existingSchedule) {
          // 如果有，更新对应的上午或下午的配额
          if (periodPart === '上午') {
            existingSchedule.morning_limit = item.quota;
          } else {
            existingSchedule.afternoon_limit = item.quota;
          }
        } else {
          // 如果没有，创建新的记录
          const newSchedule = {
            date: datePart,
            morning_limit: periodPart === '上午' ? item.quota : null,
            afternoon_limit: periodPart === '下午' ? item.quota : null
          };
          schedules.push(newSchedule);
        }
      });

      const dataToSubmit = {
        schedules: schedules
      };

      console.log('提交的数据:', dataToSubmit); // 日志记录提交的数据
  
      // 发送 POST 请求到后端 API 端点
      const response = await fetch('http://localhost:5000/doctor/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSubmit)
      });
  
      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      // 解析响应数据
      const responseData = await response.json();
  
      // 请求成功，处理响应
      if (responseData.success) {
        setQuotaData(updatedData);
        message.success('预约名额设置成功');
        setIsModalVisible(false);
      } else {
        message.error('预约名额设置失败');
      }
    } catch (error) {
      message.error('预约名额设置失败，请稍后重试');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleFormChange = (changedValues) => {
    setCurrentRecord({ ...currentRecord, ...changedValues });
  };

  const columnsQuota = [
    { title: '时间段', dataIndex: 'timeSlot', editable: false },
    {
      title: '预约名额',
      dataIndex: 'quota',
      render: (_, record) => record.quota,
    },
    {
      title: '操作',
      dataIndex: 'operation',
      render: (_, record) => (
        <Button type="primary" onClick={() => showEditModal(record)}>
          修改
        </Button>
      ),
    },
  ];

  const columnsAppointments = [
    { title: '预约时间段', dataIndex: 'timeSlot', key: 'timeSlot' },
    { title: '用户姓名', dataIndex: 'userName', key: 'userName' },
    { title: '用户性别', dataIndex: 'userGender', key: 'userGender' },
    { title: '身份证号', dataIndex: 'userID', key: 'userID' },
  ];

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={200} className="site-layout-background">
        <Menu mode="vertical" defaultSelectedKeys={['appointment-info']}>
          <Menu.Item key="appointment-info">
            <Link to="/doctor/appointment-info">预约信息</Link>
          </Menu.Item>
          <Menu.Item key="doctor-info">
            <Link to="/doctor/info">医生信息</Link>
          </Menu.Item>
        </Menu>
        <div style={{ position: 'absolute', bottom: '20px', width: '100%', textAlign: 'center', color: 'white' }}>
          {currentTime}
        </div>
      </Sider>
      <Layout>
        <Content style={{ padding: '0 24px', minHeight: 280 }}>
          <Table
            rowKey="id"
            columns={columnsQuota}
            dataSource={quotaData}
            pagination={false}
          />
          <Modal
            title="修改预约名额"
            visible={isModalVisible}
            onOk={handleModalOk}
            onCancel={handleModalCancel}
            okText="确认修改"
            cancelText="取消"
          >
            {currentRecord && (
              <Form
                layout="vertical"
                initialValues={currentRecord}
                onValuesChange={(_, allValues) => handleFormChange(allValues)}
              >
                <Form.Item label="时间段" name="timeSlot">
                  <Input disabled value={currentRecord.timeSlot} />
                </Form.Item>
                <Form.Item label="预约名额" name="quota">
                  <InputNumber min={0} max={20} value={currentRecord.quota} />
                </Form.Item>
              </Form>
            )}
          </Modal>
          <Table
            rowKey="id"
            dataSource={appointments}
            columns={columnsAppointments}
            pagination={false}
            scroll={{ y: 400 }}
          />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DoctorAppointmentPage;
