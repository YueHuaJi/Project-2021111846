import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, message } from "antd";
import ProTable from "@ant-design/pro-table";
import { Link } from "react-router-dom";
import "../../styles/admin.css"; // 引入新的样式文件

const { Sider, Content } = Layout;
const token = localStorage.getItem("token");

const AppointmentManagementPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [dataSource, setDataSource] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch(
          "http://121.40.44.68:5000/admin/appointments",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setDataSource(data);
        } else {
          throw new Error("Failed to fetch appointments");
        }
      } catch (error) {
        console.error("Fetch appointments error:", error);
        message.error("获取预约信息失败");
      }
    };

    fetchAppointments();
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (appointmentId) => {
    try {
      const response = await fetch(
        `http://121.40.44.68:5000/admin/appointments/${appointmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete appointment");
      }
      const { success } = await response.json();
      if (success) {
        setDataSource(
          dataSource.filter((item) => item.appointment_id !== appointmentId)
        );
        message.success("删除成功");
      } else {
        throw new Error("Delete operation failed");
      }
    } catch (error) {
      console.error("Delete appointment error:", error);
      message.error("删除失败，请重试");
    }
  };

  const columns = [
    { title: "用户名字", dataIndex: "user_name" },
    { title: "医生名字", dataIndex: "doctor_name" },
    { title: "预约时间", dataIndex: "appointment_time" },
    {
      title: "操作",
      valueType: "option",
      render: (_, record) => (
        <Button
          type="danger"
          onClick={() => handleDelete(record.appointment_id)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ height: "100vh" }}>
      <Sider width={200} className="site-layout-background">
        <Menu mode="vertical" defaultSelectedKeys={["appointment-management"]}>
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
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            width: "100%",
            textAlign: "center",
            color: "white",
          }}
        >
          {currentTime}
        </div>
      </Sider>
      <Layout>
        <Content style={{ padding: "0 24px", minHeight: 280 }}>
          <ProTable
            rowKey="appointment_id"
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

export default AppointmentManagementPage;
