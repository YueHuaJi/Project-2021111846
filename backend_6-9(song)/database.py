from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import json
from datetime import datetime, timedelta

# 初始化 SQLAlchemy 对象
db = SQLAlchemy()

# 定义医生信息表的模型类
class Doctor(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # 医生工号，主键
    avatar = db.Column(db.LargeBinary, nullable=True)  # 医生头像，二进制数据，可以为空
    name = db.Column(db.String(50), nullable=False)  # 医生姓名，不允许为空
    gender = db.Column(db.String(10), nullable=False)  # 医生性别，不允许为空
    title = db.Column(db.String(50), nullable=False)  # 医生职称，不允许为空
    department = db.Column(db.String(50), nullable=False)  # 医生科室，不允许为空
    office_number = db.Column(db.String(20), nullable=False)  # 办公室门牌号，不允许为空
    phone = db.Column(db.String(15), nullable=False)  # 工作电话，不允许为空
    password_hash = db.Column(db.String(128), nullable=False)  # 医生密码的哈希值，不允许为空
    permissions = db.Column(db.Text, nullable=True)  # 医生权限，JSON 字符串，可以为空

# 定义医生预约管理时间表的模型类
class DoctorSchedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # ID，主键
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)  # 医生工号，外键
    date = db.Column(db.Date, nullable=False)  # 预约日期，不允许为空
    morning_booked = db.Column(db.Integer, nullable=False, default=0)  # 上午已预约人数，不允许为空
    morning_limit = db.Column(db.Integer, nullable=False)  # 上午预约人数上限，不允许为空
    afternoon_booked = db.Column(db.Integer, nullable=False, default=0)  # 下午已预约人数，不允许为空
    afternoon_limit = db.Column(db.Integer, nullable=False)  # 下午预约人数上限，不允许为空

# 定义用户信息表的模型类
class User(db.Model):
    id = db.Column(db.String(18), primary_key=True)  # 用户身份证号，主键
    name = db.Column(db.String(50), nullable=False)  # 用户姓名，不允许为空
    gender = db.Column(db.String(10), nullable=False)  # 用户性别，不允许为空
    phone_number = db.Column(db.String(15), unique=True, nullable=False)  # 用户电话号码，唯一且不允许为空
    address = db.Column(db.String(100), nullable=False)  # 家庭住址，不允许为空
    emergency_contact = db.Column(db.String(15), nullable=False)  # 紧急联系人电话号码，不允许为空
    password_hash = db.Column(db.String(128), nullable=False)  # 用户密码的哈希值，不允许为空

# 定义预约表的模型类
class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # 预约ID，主键
    user_id = db.Column(db.String(18), db.ForeignKey('user.id'), nullable=False)  # 用户身份证号，外键
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)  # 医生工号，外键
    appointment_date = db.Column(db.Date, nullable=False)  # 预约日期，不允许为空
    appointment_period = db.Column(db.String(10), nullable=False)  # 预约时间段（上午/下午），不允许为空

# 定义管理员表的模型类
class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # 管理员ID，主键
    username = db.Column(db.String(50), unique=True, nullable=False)  # 管理员用户名，唯一且不允许为空
    password_hash = db.Column(db.String(128), nullable=False)  # 管理员密码的哈希值，不允许为空

# 定义通知表的模型类
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)


# 数据库辅助函数

def get_doctor_schedule(doctor_id):
    """获取未来三天医生的预约情况"""
    today = datetime.today().date()
    schedules = DoctorSchedule.query.filter_by(doctor_id=doctor_id).filter(DoctorSchedule.date >= today).filter(DoctorSchedule.date <= today + timedelta(days=2)).all()
    result = []
    for schedule in schedules:
        result.append({
            'date': schedule.date.strftime("%m月%d日"),
            'morning_booked': schedule.morning_booked,
            'morning_limit': schedule.morning_limit,
            'afternoon_booked': schedule.afternoon_booked,
            'afternoon_limit': schedule.afternoon_limit
        })
    return result


def book_doctor(user_id, doctor_id, appointment_date, appointment_period):
    """预约医生"""
    appointment = Appointment(user_id=user_id, doctor_id=doctor_id, appointment_date=appointment_date, appointment_period=appointment_period)
    db.session.add(appointment)
    db.session.commit()
    update_doctor_schedule(doctor_id, appointment_date, appointment_period)
    create_notification(doctor_id, f'You have a new appointment on {appointment_date.strftime("%m月%d日")} {appointment_period}')
    return appointment

def update_doctor_schedule(doctor_id, appointment_date, appointment_period):
    """更新医生预约时间表"""
    schedule = DoctorSchedule.query.filter_by(doctor_id=doctor_id, date=appointment_date).first()
    if schedule:
        if appointment_period == '上午':
            schedule.morning_booked += 1
        else:
            schedule.afternoon_booked += 1
        db.session.commit()

def cancel_appointment(appointment_id):
    """取消预约"""
    appointment = Appointment.query.get(appointment_id)
    if appointment:
        db.session.delete(appointment)
        db.session.commit()
        update_doctor_schedule_on_cancel(appointment.doctor_id, appointment.appointment_date, appointment.appointment_period)
        return True
    return False

def update_doctor_schedule_on_cancel(doctor_id, appointment_date, appointment_period):
    """更新医生预约时间表（取消预约）"""
    schedule = DoctorSchedule.query.filter_by(doctor_id=doctor_id, date=appointment_date).first()
    if schedule:
        if appointment_period == '上午':
            schedule.morning_booked -= 1
        else:
            schedule.afternoon_booked -= 1
        db.session.commit()

def set_doctor_schedule(doctor_id, schedules):
    """设置医生的空闲时间和每日最大接待病人数量"""
    for schedule_data in schedules:
        date = datetime.strptime(schedule_data['date'], "%m月%d日").date().replace(year=datetime.today().year)        
        schedule = DoctorSchedule.query.filter_by(doctor_id=doctor_id, date=date).first()
        if not schedule:
            schedule = DoctorSchedule(
                doctor_id=doctor_id,
                date=date,
                morning_limit=schedule_data['morning_limit'],
                afternoon_limit=schedule_data['afternoon_limit']
            )
            db.session.add(schedule)
        else:
            schedule.morning_limit = schedule_data['morning_limit']
            schedule.afternoon_limit = schedule_data['afternoon_limit']
    db.session.commit()

def get_doctor_appointments(doctor_id, date):
    """获取医生在指定日期的预约情况"""
    date_str = date.strftime("%Y-%m-%d")
    appointments = Appointment.query.filter_by(doctor_id=doctor_id).filter(Appointment.appointment_time.like(f'{date_str}%')).all()
    return appointments


def create_user(name, gender, id_card, phone_number, address, emergency_contact, password):
    """创建用户"""
    password_hash = generate_password_hash(password)
    user = User(name=name, gender=gender, id=id_card, phone_number=phone_number, address=address, emergency_contact=emergency_contact, password_hash=password_hash)
    db.session.add(user)
    db.session.commit()
    return user

def create_doctor(doctor_id, name, gender, title, department, office_number, phone, password):
    """创建医生"""
    password_hash = generate_password_hash(password)
    doctor = Doctor(id=doctor_id, name=name, gender=gender, title=title, department=department, office_number=office_number, phone=phone, password_hash=password_hash)
    db.session.add(doctor)
    db.session.commit()
    return doctor

def delete_doctor(doctor_id):
    """删除医生"""
    doctor = Doctor.query.get(doctor_id)
    if doctor:
        db.session.delete(doctor)
        db.session.commit()
        return True
    return False

def update_doctor_permissions(doctor_id, permissions):
    """更新医生权限"""
    doctor = Doctor.query.get(doctor_id)
    if doctor:
        doctor.permissions = json.dumps(permissions)
        db.session.commit()
        return doctor
    return None

# 删除用户
def delete_user(user_id):
    """删除用户"""
    user = User.query.get(user_id)
    if user:
        db.session.delete(user)
        db.session.commit()
        return True
    return False

# 删除预约
def delete_appointment(appointment_id):
    """删除预约"""
    appointment = Appointment.query.get(appointment_id)
    if appointment:
        db.session.delete(appointment)
        db.session.commit()
        return True
    return False

def create_admin(username, password):
    """创建管理员"""
    password_hash = generate_password_hash(password)
    admin = Admin(username=username, password_hash=password_hash)
    db.session.add(admin)
    db.session.commit()
    return admin

def get_all_users():
    """获取所有用户信息"""
    return User.query.all()

def get_all_doctors():
    """获取所有医生信息"""
    return Doctor.query.all()

def get_all_appointments():
    """获取所有预约信息"""
    return Appointment.query.all()

def get_user_by_identity(identity):
    """根据身份证号或电话号码获取用户"""
    return User.query.filter((User.id == identity) | (User.phone_number == identity)).first()

def get_doctor_by_id(doctor_id):
    """根据工号获取医生"""
    return Doctor.query.get(doctor_id)

def get_admin_by_username(username):
    """根据用户名获取管理员"""
    return Admin.query.filter_by(username=username).first()

def create_notification(doctor_id, message):
    """创建通知消息"""
    notification = Notification(doctor_id=doctor_id, message=message)
    db.session.add(notification)
    db.session.commit()
    return notification

def update_doctor_info_by_admin(doctor_id, name, gender, title, department, office_number, phone, password=None):
    """管理员修改医生信息"""
    doctor = Doctor.query.get(doctor_id)
    if doctor:
        doctor.name = name
        doctor.gender = gender
        doctor.title = title
        doctor.department = department
        doctor.office_number = office_number
        doctor.phone = phone
        if password:
            doctor.password_hash = generate_password_hash(password)
        db.session.commit()
        return doctor
    return None


def init_tables():
    """初始化数据库表"""
    # 初始化医生信息
    initial_doctors = [
        {
            'doctor_id': 1,
            'name': '张医生',
            'gender': '男',
            'title': '全科医生',
            'department': '全科医学',
            'office_number': '101',
            'phone': '1234567890',
            'password': 'password123'
        },
        {
            'doctor_id': 2,
            'name': '李医生',
            'gender': '女',
            'title': '内科医生',
            'department': '内科',
            'office_number': '102',
            'phone': '1234567891',
            'password': 'password123'
        },
        {
            'doctor_id': 3,
            'name': '王医生',
            'gender': '男',
            'title': '外科医生',
            'department': '外科',
            'office_number': '103',
            'phone': '1234567892',
            'password': 'password123'
        },
        {
            'doctor_id': 4,
            'name': '赵医生',
            'gender': '女',
            'title': '儿科医生',
            'department': '儿科',
            'office_number': '104',
            'phone': '1234567893',
            'password': 'password123'
        },
        {
            'doctor_id': 5,
            'name': '刘医生',
            'gender': '男',
            'title': '皮肤科医生',
            'department': '皮肤科',
            'office_number': '105',
            'phone': '1234567894',
            'password': 'password123'
        }
    ]
    if not Doctor.query.first():
        for doctor in initial_doctors:
            if not Doctor.query.get(doctor['doctor_id']):
                create_doctor(
                    doctor_id=doctor['doctor_id'],
                    name=doctor['name'],
                    gender=doctor['gender'],
                    title=doctor['title'],
                    department=doctor['department'],
                    office_number=doctor['office_number'],
                    phone=doctor['phone'],
                    password=doctor['password']
                )
                print(f"Doctor {doctor['name']} created.")
            else:
                print(f"Doctor {doctor['name']} already exists.")

    # 初始化用户信息
    initial_users = [
        {
            'name': '张三',
            'gender': '男',
            'id_card': '123456789012345678',
            'phone_number': '1234567890',
            'address': '北京市朝阳区',
            'emergency_contact': '1234567890',
            'password': 'password123'
        },
        {
            'name': '李四',
            'gender': '女',
            'id_card': '234567890123456789',
            'phone_number': '1234567891',
            'address': '北京市海淀区',
            'emergency_contact': '1234567891',
            'password': 'password123'
        },
        {
            'name': '王五',
            'gender': '男',
            'id_card': '345678901234567890',
            'phone_number': '1234567892',
            'address': '北京市丰台区',
            'emergency_contact': '1234567892',
            'password': 'password123'
        },
        {
            'name': '赵六',
            'gender': '女',
            'id_card': '456789012345678901',
            'phone_number': '1234567893',
            'address': '北京市东城区',
            'emergency_contact': '1234567893',
            'password': 'password123'
        },
        {
            'name': '刘七',
            'gender': '男',
            'id_card': '567890123456789012',
            'phone_number': '1234567894',
            'address': '北京市西城区',
            'emergency_contact': '1234567894',
            'password': 'password123'
        }
    ]
    if not User.query.first():
        for user in initial_users:
            if not User.query.get(user['id_card']):
                create_user(
                    name=user['name'],
                    gender=user['gender'],
                    id_card=user['id_card'],
                    phone_number=user['phone_number'],
                    address=user['address'],
                    emergency_contact=user['emergency_contact'],
                    password=user['password']
                )
                print(f"User {user['name']} created.")
            else:
                print(f"User {user['name']} already exists.")
    # 初始化医生预约管理时间表
    today = datetime.today().date()
    initial_schedules = [
        {
            'doctor_id': 1,
            'schedules': [
                {'date': (today + timedelta(days=i)).strftime("%Y-%m-%d"), 'morning_limit': 10, 'afternoon_limit': 10} for i in range(3)
            ]
        },
        {
            'doctor_id': 2,
            'schedules': [
                {'date': (today + timedelta(days=i)).strftime("%Y-%m-%d"), 'morning_limit': 8, 'afternoon_limit': 8} for i in range(3)
            ]
        },
        {
            'doctor_id': 3,
            'schedules': [
                {'date': (today + timedelta(days=i)).strftime("%Y-%m-%d"), 'morning_limit': 5, 'afternoon_limit': 5} for i in range(3)
            ]
        },
        {
            'doctor_id': 4,
            'schedules': [
                {'date': (today + timedelta(days=i)).strftime("%Y-%m-%d"), 'morning_limit': 7, 'afternoon_limit': 7} for i in range(3)
            ]
        },
        {
            'doctor_id': 5,
            'schedules': [
                {'date': (today + timedelta(days=i)).strftime("%Y-%m-%d"), 'morning_limit': 6, 'afternoon_limit': 6} for i in range(3)
            ]
        }
    ]
    if not DoctorSchedule.query.first():
        for schedule in initial_schedules:
            set_doctor_schedule(schedule['doctor_id'], schedule['schedules'])

    # 初始化预约信息
    initial_appointments = [
        {'user_id': '123456789012345678', 'doctor_id': 1, 'appointment_date': today + timedelta(days=1), 'appointment_period': '上午'},
        {'user_id': '234567890123456789', 'doctor_id': 2, 'appointment_date': today + timedelta(days=2), 'appointment_period': '下午'},
        {'user_id': '345678901234567890', 'doctor_id': 3, 'appointment_date': today + timedelta(days=1), 'appointment_period': '上午'},
        {'user_id': '456789012345678901', 'doctor_id': 4, 'appointment_date': today + timedelta(days=2), 'appointment_period': '下午'},
        {'user_id': '567890123456789012', 'doctor_id': 5, 'appointment_date': today + timedelta(days=1), 'appointment_period': '上午'}
    ]
    if not Appointment.query.first():
        for appointment in initial_appointments:
            book_doctor(
                user_id=appointment['user_id'],
                doctor_id=appointment['doctor_id'],
                appointment_date=appointment['appointment_date'],
                appointment_period=appointment['appointment_period']
            )