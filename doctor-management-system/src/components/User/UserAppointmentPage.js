import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  List,
  Avatar,
  Collapse,
  Button,
  Modal,
  message,
} from "antd";
import { Link } from "react-router-dom";
import "../../styles/user.css"; // 引入新的样式文件

const { Sider, Content } = Layout;
const { Panel } = Collapse;

const departments = ["外科", "内科", "妇产科", "儿科"];
const token = localStorage.getItem("token");

const UserAppointmentPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [selectedDepartment, setSelectedDepartment] = useState("外科");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointments, setAppointments] = useState({});
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const fetchAvailableDoctors = async () => {
      try {
        const response = await fetch(
          "http://121.40.44.68:5000/user/doctors_available",
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
          console.log("获取的医生信息:", data); // 打印从后端获取的数据
          setDoctors(data);
        } else {
          console.error("获取可预约医生信息失败:", response.statusText);
        }
      } catch (error) {
        console.error("获取可预约医生信息失败:", error.message);
      }
    };

    fetchAvailableDoctors();

    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredDoctors = doctors.filter(
    (doctor) => doctor.department === selectedDepartment
  );

  const showModal = (time, doctor, isBooked) => {
    setSelectedTime(time);
    setSelectedDoctor(doctor);
    if (isBooked) {
      setIsCancelModalVisible(true);
    } else {
      setIsModalVisible(true);
    }
  };

  const handleOk = async () => {
    if (!selectedDoctor) {
      console.error("未选择医生");
      return;
    }

    const [appointmentDate, appointmentPeriod] = selectedTime.split(" ");

    try {
      const response = await fetch("http://121.40.44.68:5000/user/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          appointment_date: appointmentDate,
          appointment_period: appointmentPeriod,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("预约成功:", data);
        message.success(data.message);
        setAppointments({ ...appointments, [selectedTime]: true });
        setIsModalVisible(false);
        setTimeout(() => {
          window.location.reload(); // 3秒后刷新页面
        }, 3000);
      } else {
        const data = await response.json();
        message.error(data.msg || "预约失败");
      }
    } catch (error) {
      console.error("预约失败:", error.message);
      message.error("预约失败，请稍后再试");
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsCancelModalVisible(false);
  };

  const handleCancelOk = async () => {
    if (!selectedDoctor || !selectedTime) {
      console.error("未选择医生或预约时间");
      return;
    }

    const [appointmentDate, appointmentPeriod] = selectedTime.split(" ");

    try {
      const response = await fetch("http://121.40.44.68:5000/user/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          appointment_date: appointmentDate,
          appointment_period: appointmentPeriod,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          message.success("取消预约成功");
          const updatedAppointments = { ...appointments };
          delete updatedAppointments[selectedTime];
          setAppointments(updatedAppointments);
          setIsCancelModalVisible(false);
          setTimeout(() => {
            window.location.reload(); // 3秒后刷新页面
          }, 3000);
        } else {
          message.error("取消预约失败");
          console.error("取消预约失败:", data.msg);
        }
      } else {
        console.error("取消预约失败:", response.statusText);
      }
    } catch (error) {
      console.error("取消预约失败:", error.message);
    }
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Sider width={200} className="site-layout-background">
        <Menu mode="vertical" defaultSelectedKeys={["appointment"]}>
          <Menu.Item key="appointment">
            <Link to="/user/appointment">预约页面</Link>
          </Menu.Item>
          <Menu.Item key="user-info">
            <Link to="/user/info">用户信息</Link>
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
          <div className="user-appointment-title">预约页面</div>
          <div style={{ display: "flex" }}>
            <div style={{ width: "20%", paddingRight: "24px" }}>
              <Menu
                mode="vertical"
                defaultSelectedKeys={["外科"]}
                onClick={(e) => setSelectedDepartment(e.key)}
              >
                {departments.map((department) => (
                  <Menu.Item key={department}>{department}</Menu.Item>
                ))}
              </Menu>
            </div>
            <div style={{ width: "80%" }}>
              <List
                itemLayout="vertical"
                size="large"
                pagination={{
                  onChange: (page) => {
                    console.log(page);
                  },
                  pageSize: 3,
                }}
                dataSource={filteredDoctors}
                renderItem={(doctor) => {
                  const times = doctor.available_times.flatMap((timeSlot) =>
                    timeSlot.slots.map((slot) => ({
                      date: timeSlot.date,
                      period: slot.period,
                      limit: slot.limit,
                      booked: slot.booked,
                      user_booked: slot.user_booked,
                    }))
                  );

                  return (
                    <List.Item key={doctor.name}>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${doctor.name}`}
                          />
                        }
                        title={<a href="#">{doctor.name}</a>}
                        description={`职称: ${doctor.title} 办公电话: ${doctor.phone} 办公室: ${doctor.office}`}
                      />
                      <Collapse>
                        <Panel header="预约时间" key="1">
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              justifyContent: "space-between",
                            }}
                          >
                            {times.map((time, index) => {
                              const fullTime = `${time.date} ${time.period}`;
                              const isBooked = time.user_booked;
                              console.log(
                                `时间段: ${fullTime}, 是否已预约: ${isBooked}`
                              ); // 打印每个时间段的状态
                              return (
                                <Button
                                  key={index}
                                  type="primary"
                                  style={{
                                    marginBottom: "10px",
                                    width: "45%",
                                    backgroundColor: isBooked ? "red" : "",
                                  }}
                                  onClick={() => {
                                    showModal(fullTime, doctor, isBooked);
                                  }}
                                >
                                  {isBooked
                                    ? "已预约"
                                    : `${fullTime} 剩余名额: ${
                                        time.limit - time.booked
                                      }`}
                                </Button>
                              );
                            })}
                          </div>
                        </Panel>
                      </Collapse>
                    </List.Item>
                  );
                }}
              />
            </div>
          </div>
        </Content>
      </Layout>
      <Modal
        title="预约"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <p>您选择了 {selectedTime} 的预约时间</p>
        <p>请填写相关信息以完成预约。</p>
      </Modal>
      <Modal
        title="取消预约"
        visible={isCancelModalVisible}
        onOk={handleCancelOk}
        onCancel={handleCancel}
      >
        <p>您确定要取消 {selectedTime} 的预约吗？</p>
      </Modal>
    </Layout>
  );
};

export default UserAppointmentPage;
