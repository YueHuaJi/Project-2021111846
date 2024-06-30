import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, message } from "antd";
import ProTable from "@ant-design/pro-table";
import { Link } from "react-router-dom";
import "../../styles/admin.css"; // 引入新的样式文件

const { Sider, Content } = Layout;
const token = localStorage.getItem("token");

const UserManagementPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [dataSource, setDataSource] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://121.40.44.68:5000/admin/users", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setDataSource(data);
        } else {
          message.error("获取用户信息失败");
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
        message.error("获取用户信息失败");
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
      const response = await fetch(
        `http://121.40.44.68:5000/admin/users/${rowKey}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete data");
      }
      const { success } = await response.json();
      if (success) {
        setDataSource(dataSource.filter((item) => item.id !== rowKey));
        message.success("删除成功");

        // 延迟3秒刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        throw new Error("Delete operation failed");
      }
    } catch (error) {
      console.error("Delete data error:", error);
      message.error("删除失败，请重试");
    }
  };

  const columns = [
    { title: "姓名", dataIndex: "name" },
    { title: "性别", dataIndex: "gender" },
    { title: "身份证号", dataIndex: "idNumber" },
    { title: "家庭住址", dataIndex: "address" },
    { title: "电话号码", dataIndex: "phone" },
    { title: "紧急联系人电话号码", dataIndex: "emergencyContact" },
    {
      title: "操作",
      valueType: "option",
      render: (_, record) => (
        <Button type="danger" onClick={() => handleDelete(record.idNumber)}>
          删除
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ height: "100vh" }}>
      <Sider width={200} className="site-layout-background">
        <Menu mode="vertical" defaultSelectedKeys={["user-management"]}>
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
