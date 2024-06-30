import React, { useState, useEffect } from "react";
import {
  Table,
  Layout,
  Menu,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
} from "antd";
import { useNavigate } from "react-router-dom";
import "../../styles/doctor.css"; // 导入样式

const { Sider, Content } = Layout;
const { Option } = Select;
const token = localStorage.getItem("token");

const departments = ["外科", "内科", "妇产科", "儿科"];
const genders = ["男", "女"];

const DoctorInfoPage = () => {
  const navigate = useNavigate();
  const [dataSource, setDataSource] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [editFlag, setEditFlag] = useState(false); // 默认设置为 false

  useEffect(() => {
    // 在组件加载时获取医生个人信息作为初始数据源
    const getDoctorData = async () => {
      if (!token) {
        message.error("请先登录");
        navigate("/login"); // 重定向到登录页面
        return;
      }

      try {
        const response = await fetch(
          "http://121.40.44.68:5000/doctor/profile",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("后端返回的数据:", data); // 打印后端返回的数据
          setDataSource([data]); // 将获取到的数据设置为 dataSource
          setEditFlag(data.flag); // 设置 editFlag
        } else {
          if (response.status === 403) {
            message.error("权限不足，请重新登录");
            navigate("/login"); // 重定向到登录页面
          } else {
            console.error("获取医生个人信息失败:", response.statusText);
          }
        }
      } catch (error) {
        console.error("获取医生个人信息失败:", error.message);
      }
    };
    getDoctorData();
  }, [navigate]);

  const columns = [
    {
      title: "姓名",
      dataIndex: "name",
    },
    {
      title: "性别",
      dataIndex: "gender",
    },
    {
      title: "职称",
      dataIndex: "title",
    },
    {
      title: "科室",
      dataIndex: "department",
    },
    {
      title: "办公室",
      dataIndex: "office",
    },
    {
      title: "办公电话",
      dataIndex: "phone",
    },
  ];

  const showEditModal = () => {
    setCurrentRecord(dataSource[0]);
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const response = await fetch(
        `http://121.40.44.68:5000/doctor/${currentRecord.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: currentRecord.name,
            gender: currentRecord.gender,
            title: currentRecord.title,
            department: currentRecord.department,
            office: currentRecord.office,
            phone: currentRecord.phone,
          }),
        }
      );

      if (response.ok) {
        const updatedDoctor = await response.json();
        setDataSource([updatedDoctor]); // 更新 dataSource
        message.success("修改成功");
        setIsModalVisible(false);

        // 延迟3秒刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        message.error("修改失败");
      }
    } catch (error) {
      message.error("修改失败");
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleFormChange = (changedValues) => {
    setCurrentRecord({ ...currentRecord, ...changedValues });
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Sider width={200} className="site-layout-background">
        <Menu mode="vertical" defaultSelectedKeys={["doctor-info"]}>
          <Menu.Item key="appointment-info">
            <button
              className="link-button"
              onClick={() => navigate("/doctor/appointment-info")}
            >
              预约信息
            </button>
          </Menu.Item>
          <Menu.Item key="doctor-info">
            <button
              className="link-button"
              onClick={() => navigate("/doctor/info")}
            >
              医生信息
            </button>
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Content style={{ padding: "0 24px", minHeight: 280 }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            pagination={false}
          />
          <Button
            type={editFlag ? "primary" : "default"}
            onClick={editFlag ? showEditModal : null}
            style={{
              marginTop: 16,
              backgroundColor: editFlag ? "" : "gray",
              color: editFlag ? "" : "white",
              cursor: editFlag ? "pointer" : "not-allowed",
            }}
          >
            {editFlag ? "修改" : "缺少权限"}
          </Button>
          <Modal
            title="修改医生信息"
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
                <Form.Item label="姓名" name="name">
                  <Input />
                </Form.Item>
                <Form.Item label="性别" name="gender">
                  <Select>
                    {genders.map((gender) => (
                      <Option key={gender} value={gender}>
                        {gender}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="职称" name="title">
                  <Input />
                </Form.Item>
                <Form.Item label="科室" name="department">
                  <Select>
                    {departments.map((dep) => (
                      <Option key={dep} value={dep}>
                        {dep}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="办公室" name="office">
                  <Input />
                </Form.Item>
                <Form.Item label="办公电话" name="phone">
                  <Input />
                </Form.Item>
              </Form>
            )}
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DoctorInfoPage;
