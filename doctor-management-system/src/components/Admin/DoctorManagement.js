import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Form,
  Cascader,
  Input,
  Button,
  Avatar,
  message,
  Modal,
} from "antd";
import ProTable, { EditableProTable } from "@ant-design/pro-table";
import { Link } from "react-router-dom";
import "../../styles/admin.css";

const { Sider, Content } = Layout;
const token = localStorage.getItem("token");

const departments = ["外科", "内科", "妇产科", "儿科"];
const titles = ["主任医师", "副主任医师", "主治医师", "住院医师"];
const genders = ["男", "女"];
const flags = [
  { value: 1, label: "有权限" },
  { value: 0, label: "无权限" },
];

const DoctorManagementPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [dataSource, setDataSource] = useState([]);
  const [editableKeys, setEditableKeys] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch("http://121.40.44.68:5000/admin/doctors", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: null,
        });
        if (response.ok) {
          const result = await response.json();
          console.log("后端返回的数据:", result); // 在这里打印后端返回的数据
          const doctors = result.map((doctor, index) => ({
            employeeId: doctor.employeeId,
            name: doctor.name,
            gender: doctor.gender,
            title: doctor.title,
            department: doctor.department,
            office: doctor.office,
            phone: doctor.phone,
            avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${
              index + 1
            }`,
            flag: doctor.flag,
          }));
          setDataSource([
            ...doctors,
            {
              employeeId: "",
              name: "",
              gender: "",
              title: "",
              department: "",
              office: "",
              phone: "",
              avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${
                doctors.length + 1
              }`,
              flag: 1,
            },
          ]);
          setEditableKeys(
            doctors.map((doctor) => doctor.id).concat(doctors.length + 1)
          );
        } else {
          message.error("获取医生列表失败1");
        }
      } catch (error) {
        console.log(error);
        message.error("获取医生列表失败2");
      }
    };

    fetchDoctors();
  }, []);
  const columns = [
    {
      title: "头像",
      dataIndex: "avatar",
      render: (text) => <Avatar src={text} />,
      editable: false,
    },
    {
      title: "医生工号",
      dataIndex: "employeeId",
    },
    {
      title: "姓名",
      dataIndex: "name",
    },
    {
      title: "性别",
      dataIndex: "gender",
      renderFormItem: () => (
        <Form.Item>
          <Cascader
            options={genders.map((gender) => ({
              value: gender,
              label: gender,
            }))}
            placeholder="请选择性别"
          />
        </Form.Item>
      ),
    },
    {
      title: "职称",
      dataIndex: "title",
      renderFormItem: () => (
        <Form.Item>
          <Cascader
            options={titles.map((title) => ({ value: title, label: title }))}
            placeholder="请选择职称"
          />
        </Form.Item>
      ),
    },
    {
      title: "科室",
      dataIndex: "department",
      renderFormItem: () => (
        <Form.Item>
          <Cascader
            options={departments.map((dep) => ({ value: dep, label: dep }))}
            placeholder="请选择科室"
          />
        </Form.Item>
      ),
    },
    {
      title: "办公室",
      dataIndex: "office",
    },
    {
      title: "工作电话",
      dataIndex: "phone",
    },
    {
      title: "权限",
      dataIndex: "flag",
      renderFormItem: () => (
        <Form.Item>
          <Cascader options={flags} placeholder="请选择权限" />
        </Form.Item>
      ),
      render: (text, record, index) => {
        if (index === dataSource.length - 1) {
          return null; // 隐藏最后一行的权限字段
        }
        return <span>{text ? "有权限" : "无权限"}</span>;
      },
    },
    {
      title: "操作",
      valueType: "option",
      render: (_, record, index) => {
        if (index === dataSource.length - 1) {
          return [
            <Button type="primary" onClick={() => handleEdit({}, true)}>
              添加
            </Button>,
          ];
        }
        return [
          <Button type="danger" onClick={() => handleDelete(record)}>
            删除
          </Button>,
          <Button type="primary" onClick={() => handleEdit(record)}>
            修改
          </Button>,
        ];
      },
    },
  ];

  const handleSave = async (record) => {
    if (
      !record.name ||
      !record.department ||
      !record.office ||
      !record.phone ||
      (isAddMode && (!record.password || !record.confirmPassword))
    ) {
      message.error("请填写所有字段");
      return;
    }

    if (isAddMode && record.password !== record.confirmPassword) {
      message.error("密码不匹配");
      return;
    }

    if (isAddMode) {
      try {
        const response = await fetch(
          "http://121.40.44.68:5000/admin/create_doctor",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              doctor_id: record.employeeId,
              name: record.name,
              gender: record.gender || "未知",
              title: record.title || "医生",
              department: record.department,
              office_number: record.office,
              phone: record.phone,
              password: record.password,
              flag: record.flag ? 1 : 0, // 这里处理 true/false
            }),
          }
        );

        const result = await response.json();
        if (result.id) {
          setDataSource([
            ...dataSource.slice(0, dataSource.length - 1), // 去掉最后一个空行
            {
              employeeId: result.id,
              name: record.name,
              gender: record.gender,
              title: record.title,
              department: record.department,
              office: record.office,
              phone: record.phone,
              avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${dataSource.length}`,
              flag: record.flag,
            },
            {
              employeeId: "",
              name: "",
              gender: "",
              title: "",
              department: "",
              office: "",
              phone: "",
              avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${
                dataSource.length + 1
              }`,
              flag: 1,
            },
          ]);
          setEditableKeys([...editableKeys, result.id]);
          message.success("添加成功");
          setIsModalVisible(false);

          // 延迟3秒刷新页面
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          message.error("添加失败");
        }
      } catch (error) {
        message.error("添加失败");
      }
    } else {
      try {
        const response = await fetch(
          `http://121.40.44.68:5000/admin/doctor/${record.employeeId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ...record,
              flag: record.flag ? 1 : 0, // 这里处理 true/false
            }),
          }
        );

        if (response.ok) {
          message.success("保存成功");
          setIsModalVisible(false);

          // 延迟3秒刷新页面
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          message.error("保存失败");
        }
      } catch (error) {
        message.error("保存失败");
      }
    }
  };

  const handleDelete = async (record) => {
    try {
      const response = await fetch(
        `http://121.40.44.68:5000/admin/doctor/${record.employeeId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setDataSource(
          dataSource.filter((item) => item.employeeId !== record.employeeId)
        );
        message.success("删除成功");
      } else {
        message.error("删除失败");
      }
    } catch (error) {
      message.error("删除失败");
    }
  };

  const handleEdit = (record, isAdd = false) => {
    setCurrentRecord(record);
    setIsModalVisible(true);
    setIsAddMode(isAdd);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setCurrentRecord(null);
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Sider width={200} className="site-layout-background">
        <Menu mode="vertical" defaultSelectedKeys={["doctor-management"]}>
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
          <EditableProTable
            rowKey="id"
            value={dataSource}
            onChange={setDataSource}
            columns={columns}
            recordCreatorProps={false}
            editable={{
              type: "multiple",
              editableKeys,
              onChange: setEditableKeys,
            }}
            scroll={{ y: 800 }}
          />
          <Modal
            title={isAddMode ? "添加医生" : "修改医生信息"}
            visible={isModalVisible}
            onOk={() => {
              handleSave(currentRecord);
              setTimeout(() => {
                window.location.reload();
              }, 3000);
            }}
            onCancel={handleModalCancel}
            okText={isAddMode ? "确定添加" : "确定"}
          >
            {currentRecord && (
              <Form layout="vertical">
                <Form.Item label="医生工号">
                  <Input
                    value={currentRecord.employeeId}
                    onChange={(e) =>
                      setCurrentRecord({
                        ...currentRecord,
                        employeeId: e.target.value,
                      })
                    }
                  />
                </Form.Item>
                <Form.Item label="姓名">
                  <Input
                    value={currentRecord.name}
                    onChange={(e) =>
                      setCurrentRecord({
                        ...currentRecord,
                        name: e.target.value,
                      })
                    }
                  />
                </Form.Item>
                <Form.Item label="性别">
                  <Cascader
                    options={genders.map((gender) => ({
                      value: gender,
                      label: gender,
                    }))}
                    value={[currentRecord.gender]}
                    onChange={(value) =>
                      setCurrentRecord({ ...currentRecord, gender: value[0] })
                    }
                  />
                </Form.Item>
                <Form.Item label="职称">
                  <Cascader
                    options={titles.map((title) => ({
                      value: title,
                      label: title,
                    }))}
                    value={[currentRecord.title]}
                    onChange={(value) =>
                      setCurrentRecord({ ...currentRecord, title: value[0] })
                    }
                  />
                </Form.Item>
                <Form.Item label="科室">
                  <Cascader
                    options={departments.map((dep) => ({
                      value: dep,
                      label: dep,
                    }))}
                    value={[currentRecord.department]}
                    onChange={(value) =>
                      setCurrentRecord({
                        ...currentRecord,
                        department: value[0],
                      })
                    }
                  />
                </Form.Item>
                <Form.Item label="办公室">
                  <Input
                    value={currentRecord.office}
                    onChange={(e) =>
                      setCurrentRecord({
                        ...currentRecord,
                        office: e.target.value,
                      })
                    }
                  />
                </Form.Item>
                <Form.Item label="工作电话">
                  <Input
                    value={currentRecord.phone}
                    onChange={(e) =>
                      setCurrentRecord({
                        ...currentRecord,
                        phone: e.target.value,
                      })
                    }
                  />
                </Form.Item>
                <Form.Item label="权限">
                  <Cascader
                    options={flags}
                    value={[currentRecord.flag]}
                    onChange={(value) =>
                      setCurrentRecord({ ...currentRecord, flag: value[0] })
                    }
                  />
                </Form.Item>
                {isAddMode && (
                  <>
                    <Form.Item label="密码">
                      <Input.Password
                        value={currentRecord.password}
                        onChange={(e) =>
                          setCurrentRecord({
                            ...currentRecord,
                            password: e.target.value,
                          })
                        }
                      />
                    </Form.Item>
                    <Form.Item label="确认密码">
                      <Input.Password
                        value={currentRecord.confirmPassword}
                        onChange={(e) =>
                          setCurrentRecord({
                            ...currentRecord,
                            confirmPassword: e.target.value,
                          })
                        }
                      />
                    </Form.Item>
                  </>
                )}
              </Form>
            )}
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DoctorManagementPage;
