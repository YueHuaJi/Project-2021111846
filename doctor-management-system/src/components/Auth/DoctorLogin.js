import React from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import "../../styles/styles.css"; // 导入样式

const DoctorLogin = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    console.log("Success:", values);
    // Add authentication logic here
    try {
      const response = await fetch("http://121.40.44.68:5000/login/doctor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        // 登录成功，获取后端返回的令牌等信息
        const data = await response.json(); // 解析后端返回的 JSON 数据
        const { access_token } = data;
        // 将令牌保存到本地存储
        localStorage.setItem("token", access_token);
        // 跳转到医生管理页面
        navigate("/doctor/appointment-info"); // 修改导航路径
      } else {
        // 登录失败，显示错误消息
        message.error("用户名或密码错误");
      }
    } catch (error) {
      console.error("登录失败:", error);
      message.error("登录失败，请重试");
    }
  };

  return (
    <Form
      name="doctor_login"
      initialValues={{ remember: true }}
      onFinish={onFinish}
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: "请输入工号!" }]}
      >
        <Input placeholder="工号" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "请输入密码!" }]}
      >
        <Input.Password placeholder="密码" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          登录
        </Button>
      </Form.Item>
    </Form>
  );
};

export default DoctorLogin;
