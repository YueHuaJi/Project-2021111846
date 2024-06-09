import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import UserPage from './pages/UserPage';
import DoctorPage from './pages/DoctorPage';
import AdminPage from './pages/AdminPage';
import UserInfoPage from './components/User/UserInfoPage';
import UserAppointmentPage from './components/User/UserAppointmentPage';
import DoctorManagementPage from './components/Admin/DoctorManagement';
import UserManagementPage from './components/Admin/UserManagement';
import AppointmentManagementPage from './components/Admin/AppointmentManagement';
import DoctorAppointmentPage from './components/Doctor/DoctorAppointmentPage';
import DoctorInfoPage from './components/Doctor/DoctorInfoPage';
import RegisterPage from './components/Auth/Register'; // 导入用户注册页面

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/user" element={<UserPage />} />
        <Route path="/doctor" element={<DoctorPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/user/info" element={<UserInfoPage />} />
        <Route path="/user/appointment" element={<UserAppointmentPage />} />
        <Route path="/admin/doctor-management" element={<DoctorManagementPage />} />
        <Route path="/admin/user-management" element={<UserManagementPage />} />
        <Route path="/admin/appointment-management" element={<AppointmentManagementPage />} />
        <Route path="/doctor/appointment-info" element={<DoctorAppointmentPage />} />
        <Route path="/doctor/info" element={<DoctorInfoPage />} />
        <Route path="/register" element={<RegisterPage />} /> {/* 添加用户注册页面的路由 */}
      </Routes>
    </Router>
  );
};

export default App;
