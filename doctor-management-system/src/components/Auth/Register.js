import React from "react";
import { Form, Input, Button, Select, message } from "antd";
import { useNavigate } from "react-router-dom";
import "../../styles/styles.css"; // 导入样式

const { Option } = Select;

const UserRegister = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    console.log("Success:", values);
    // 添加注册逻辑
    try {
      console.log(values);
      const response = await fetch("http://121.40.44.68:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Registration successful:", data);
        // 注册成功后跳转到登录页面
        navigate("/");
      } else {
        console.error("Registration failed:", response.statusText);
      }
    } catch (error) {
      console.error("Registration failed:", error.message);
    }
  };

  return (
    <div className="centered-form">
      <div className="centered-form-container">
        <Form
          name="user_register"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: "请输入姓名!" }]}
          >
            <Input placeholder="姓名" />
          </Form.Item>
          <Form.Item
            name="gender"
            rules={[{ required: true, message: "请选择性别!" }]}
          >
            <Select placeholder="性别">
              <Option value="男">男</Option>
              <Option value="女">女</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="idNumber"
            rules={[{ required: true, message: "请输入身份证号!" }]}
          >
            <Input placeholder="身份证号" />
          </Form.Item>
          <Form.Item
            name="phoneNumber"
            rules={[{ required: true, message: "请输入电话号码!" }]}
          >
            <Input placeholder="电话号码" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "请输入密码!" }]}
          >
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Form.Item
            name="confirm"
            dependencies={["password"]}
            rules={[
              { required: true, message: "请确认密码!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次输入的密码不一致!"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="确认密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              注册
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default UserRegister;
