from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS  # 导入CORS
from database import *
from functools import wraps

app = Flask(__name__)
CORS(app)  # 启用CORS

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hospital.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = "secret_key"  # 更改为实际的密钥

jwt = JWTManager(app)
db.init_app(app)

@app.before_first_request
def create_tables():
    db.create_all()
    # 检查管理员用户是否已经存在
    if not Admin.query.first():
        create_admin('admin', 'adminpassword')
        print("Database initialized and admin user created.")
    else:
        print("Admin user already exists.")

    init_tables()

# 用户登录路由
@app.route('/login/user', methods=['POST'])
def login_user():
    """
    用户登录
    前端需要发送的数据格式：(这里需要做前端的输入校验)
    {
        "identity": "用户身份证号或电话号码",  # string
        "password": "用户密码"  # string
    }
    返回数据格式：
    {
        "access_token": "JWT 令牌"  # string
    }
    """
    data = request.get_json()
    user = get_user_by_identity(data['username'])
    if user and check_password_hash(user.password_hash, data['password']):
        access_token = create_access_token(identity={'id': user.id, 'role': 'user'})
        return jsonify(access_token=access_token), 200
    return jsonify({"msg": "Invalid credentials"}), 401

# 医生登录路由
@app.route('/login/doctor', methods=['POST'])
def login_doctor():
    """
    医生登录
    前端需要发送的数据格式：
    {
        "doctor_id": "医生工号",  # int
        "password": "医生密码"  # string
    }
    返回数据格式：
    {
        "access_token": "JWT 令牌"  # string
    }
    """
    data = request.get_json()
    doctor = get_doctor_by_id(data['username'])
    if doctor and check_password_hash(doctor.password_hash, data['password']):
        access_token = create_access_token(identity={'id': doctor.id, 'role': 'doctor'})
        return jsonify(access_token=access_token), 200
    return jsonify({"msg": "Invalid credentials"}), 401

# 管理员登录路由
@app.route('/login/admin', methods=['POST'])
def login_admin():
    """
    管理员登录
    前端需要发送的数据格式：
    {
        "username": "管理员用户名",  # string
        "password": "管理员密码"  # string
    }
    返回数据格式：
    {
        "access_token": "JWT 令牌"  # string
    }
    """
    data = request.get_json()
    admin = get_admin_by_username(data['username'])
    if admin and check_password_hash(admin.password_hash, data['password']):
        access_token = create_access_token(identity={'id': admin.id, 'role': 'admin'})
        return jsonify(access_token=access_token), 200
    return jsonify({"msg": "Invalid credentials"}), 401

# 角色装饰器
def role_required(role):
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorated_view(*args, **kwargs):
            identity = get_jwt_identity()
            if identity['role'] != role:
                return jsonify({"msg": "Permission denied"}), 403
            return fn(*args, **kwargs)
        return decorated_view
    return wrapper


@app.route('/register', methods=['POST'])
def register_user():
    """
    用户注册
    前端需要发送的数据格式：
    {
        "name": "用户姓名",  # string
        "gender": "用户性别",  # string
        "id_card": "用户身份证号",  # string
        "phone_number": "用户电话号码",  # string
        "address": "用户家庭住址",  # string
        "emergency_contact": "紧急联系人电话号码",  # string
        "password": "用户密码"  # string
    }
    返回数据格式：
    {
        "id": "用户身份证号",  # string
        "name": "用户姓名"  # string
    }
    """
    data = request.get_json()
    user = create_user(
        name=data['name'],
        gender=data['gender'],
        id_card=data['idNumber'],
        phone_number=data['phoneNumber'],
        address='',
        emergency_contact='',
        password=data['password']
    )
    return jsonify({'id': user.id, 'name': user.name}), 201

@app.route('/user/doctors_available', methods=['GET'])
@jwt_required()
def available_doctors():
    """
    查询所有可预约医生信息
    返回数据格式：
    [
        {
            "id": "医生工号",  # int
            "name": "医生姓名",  # string
            "gender": "医生性别",  # string
            "title": "医生职称",  # string
            "department": "医生科室",  # string
            "office_number": "办公室门牌号",  # string
            "phone": "工作电话",  # string
            "available_times": [
                {
                    "date": "日期",  # string
                    "slots": [
                        {
                            "period": "时间段",  # string
                            "booked": "已预约人数",  # int
                            "limit": "预约上限",  # int
                            "available": "是否可预约",  # bool           todo
                            "user_booked": "用户是否已预约"  # bool       todo
                        },
                        ...
                    ]
                },
                ...
            ]
        },
        ...
    ]
    """
    identity = get_jwt_identity()
    user_id = identity['id']
    doctors = get_all_doctors()
    result = []
    
    for doctor in doctors:
        schedules = get_doctor_schedule(doctor.id)
        available_times = []
        
        for schedule in schedules:
            # 检查用户是否在当前时间段已经预约了这个医生
            morning_appointment = Appointment.query.filter_by(
                user_id=user_id, doctor_id=doctor.id, appointment_date=datetime.strptime(schedule['date'], "%m月%d日").date(), appointment_period='上午'
            ).first()
            
            afternoon_appointment = Appointment.query.filter_by(
                user_id=user_id, doctor_id=doctor.id, appointment_date=datetime.strptime(schedule['date'], "%m月%d日").date(), appointment_period='下午'
            ).first()
            
            available_times.append({
                'date': schedule['date'],
                'slots': [
                    {
                        'period': '上午',
                        'booked': schedule['morning_booked'],
                        'limit': schedule['morning_limit'],
                        'available': schedule['morning_limit'] - schedule['morning_booked'] > 0,
                        'user_booked': morning_appointment is not None
                    },
                    {
                        'period': '下午',
                        'booked': schedule['afternoon_booked'],
                        'limit': schedule['afternoon_limit'],
                        'available': schedule['afternoon_limit'] - schedule['afternoon_booked'] > 0,
                        'user_booked': afternoon_appointment is not None
                    }
                ]
            })
        
        result.append({
            'id': doctor.id,
            'name': doctor.name,
            'gender': doctor.gender,
            'title': doctor.title,
            'department': doctor.department,
            'office_number': doctor.office_number,
            'phone': doctor.phone,
            'available_times': available_times
        })
    
    return jsonify(result)

@app.route('/user/book', methods=['POST'])
@jwt_required()
def book_appointment():
    """
    用户预约医生
    前端需要发送的数据格式：
    {
        "doctor_id": "医生工号",  # int
        "appointment_date": "预约日期 (YYYY-MM-DD)",  # string
        "appointment_period": "预约时间段（上午/下午）"  # string
    }
    返回数据格式：
    {
        "appointment_id": "预约ID",  # int
        "message": "确认信息"  # string
    }
    """
    identity = get_jwt_identity()
    user_id = identity['id']
    data = request.get_json()
    appointment_date = datetime.strptime(data['appointment_date'], "%m月%d日").date().replace(year=datetime.today().year)
    appointment = book_doctor(
        user_id=user_id,
        doctor_id=data['doctor_id'],
        appointment_date=appointment_date,
        appointment_period=data['appointment_period']
    )
    return jsonify({
        'appointment_id': appointment.id,
        'message': f'Appointment confirmed for {appointment_date.strftime("%m月%d日")} {data["appointment_period"]}'
    }), 201

@app.route('/user/cancel', methods=['POST'])
@jwt_required()
def cancel_booking():
    """
    用户取消预约
    前端需要发送的数据格式：
    {
        "doctor_id": "医生工号",  # int
        "appointment_date": "预约日期 (YYYY-MM-DD)",  # string
        "appointment_period": "预约时间段 (上午/下午)"  # string
    }
    返回数据格式：
    {
        "success": "是否成功"  # bool
    }
    """
    data = request.get_json()
    doctor_id = data.get('doctor_id')
    appointment_date = data.get('appointment_date')
    appointment_period = data.get('appointment_period')
    
    # 获取当前用户身份
    identity = get_jwt_identity()
    user_id = identity['id']
    
    # 查找预约记录
    appointment = Appointment.query.filter_by(
        user_id=user_id,
        doctor_id=doctor_id,
        appointment_date=datetime.strptime(appointment_date, "%m月%d日").date().replace(year=datetime.today().year),
        appointment_period=appointment_period
    ).first()
    
    if appointment:
        success = cancel_appointment(appointment.id)
        return jsonify({'success': success}), 200 if success else 404
    else:
        return jsonify({'success': False, 'msg': 'Appointment not found'}), 404

@app.route('/user/profile', methods=['GET'])
@role_required('user')
def get_user_profile():
    """
    获取当前用户的个人信息
    返回数据格式：
    {
        "id": "身份证号",  # string
        "name": "姓名",  # string
        "gender": "性别",  # string
        "address": "住址",  # string
        "phone_number": "电话号",  # string
        "emergency_contact": "紧急联系人",  # string
    }
    """
    identity = get_jwt_identity()
    user_id = identity['id']
    user = get_user_by_identity(user_id)
    if not user:
        return jsonify({'error': 'user not found'}), 404
    return jsonify({
        'id': user.id,
        'name': user.name,
        'gender': user.gender,
        'address': user.address,
        'phone_number': user.phone_number,
        'emergency_contact': user.emergency_contact,
    }), 200

@app.route('/user/<string:user_id>', methods=['PUT'])
@role_required('user')
def update_user_info(user_id):
    """
    用户更新个人信息
    前端需要发送的数据格式：
    {
        "name": "姓名",  # string
        "gender": "性别",  # string
        "address": "住址",  # string
        "phone_number": "电话号",  # string
        "emergency_contact": "紧急联系人",  # string
        "password": "密码"  # string, optional
    }
    返回数据格式：
    {
        "id": "身份证号",  # string
        "name": "用户姓名"  # string
    }
    """
    data = request.get_json()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.name = data.get('name', user.name)
    user.gender = data.get('gender', user.gender)
    user.address = data.get('address', user.address)
    user.phone_number = data.get('phone_number', user.phone_number)
    user.emergency_contact = data.get('emergency_contact', user.emergency_contact)
    if 'password' in data:
        user.password_hash = generate_password_hash(data['password'])
    db.session.commit()
    
    return jsonify({'id': user.id, 'name': user.name}), 200

@app.route('/doctor/profile', methods=['GET'])
@role_required('doctor')
def get_doctor_profile():
    """
    获取当前医生的个人信息
    返回数据格式：
    {
        "id": "医生工号",  # int
        "name": "医生姓名",  # string
        "gender": "医生性别",  # string
        "title": "医生职称",  # string
        "department": "医生科室",  # string
        "office_number": "办公室门牌号",  # string
        "phone": "工作电话"  # string
    }
    """
    identity = get_jwt_identity()
    doctor_id = identity['id']
    doctor = get_doctor_by_id(doctor_id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
    return jsonify({
        'id': doctor.id,
        'name': doctor.name,
        'gender': doctor.gender,
        'title': doctor.title,
        'department': doctor.department,
        'office': doctor.office_number,
        'phone': doctor.phone
    }), 200

@app.route('/doctor/schedule', methods=['POST'])
@role_required('doctor')
def set_schedule():
    """
    医生设置未来三天的空闲时间和每日最大接待病人数量
    前端需要发送的数据格式：
    {
        "schedules": [
            {
                "date": "日期 (YYYY-MM-DD)",  # string
                "morning_limit": "上午预约人数上限",  # int
                "afternoon_limit": "下午预约人数上限"  # int
            },
            ...
        ]
    }
    返回数据格式：
    {
        "success": "是否成功"  # bool
    }
    """
    identity = get_jwt_identity()
    doctor_id = identity['id']
    data = request.get_json()
    set_doctor_schedule(
        doctor_id=doctor_id,
        schedules=data['schedules']
    )
    return jsonify({'success': True}), 200

@app.route('/doctor/schedule', methods=['GET'])
@role_required('doctor')
def get_schedule():
    """
    医生获取未来三天的预约情况
    返回数据格式：
    [
        {
            "date": "日期",  # string
            "morning_booked": "上午已预约人数",  # int
            "morning_limit": "上午预约人数上限",  # int
            "afternoon_booked": "下午已预约人数",  # int
            "afternoon_limit": "下午预约人数上限"  # int
        },
        ...
    ]
    """
    identity = get_jwt_identity()
    doctor_id = identity['id']
    schedules = get_doctor_schedule(doctor_id)
    return jsonify(schedules), 200

@app.route('/doctor/appointments', methods=['GET'])
@role_required('doctor')
def doctor_appointments():
    """
    医生查询所有预约情况
    返回数据格式：
    [
        {
            "id": "预约ID",  # int
            "user_id": "用户身份证号",  # string
            "user_name": "用户姓名",  # string
            "user_gender": "用户性别",  # string
            "appointment_date": "预约日期",  # string
            "appointment_period": "预约时间段"  # string
        },
        ...
    ]
    """
    identity = get_jwt_identity()
    doctor_id = identity['id']
    appointments = Appointment.query.filter_by(doctor_id=doctor_id).all()
    result = []
    for appointment in appointments:
        user = User.query.get(appointment.user_id)
        result.append({
            'id': appointment.id,
            'user_id': appointment.user_id,
            'user_name': user.name if user else None,
            'user_gender': user.gender if user else None,
            'appointment_date': appointment.appointment_date.strftime("%Y-%m-%d"),
            'appointment_period': appointment.appointment_period
        })
    return jsonify(result)

@app.route('/doctor/<int:doctor_id>', methods=['PUT'])
@role_required('doctor')
def update_doctor_info(doctor_id):
    """
    医生更新个人信息
    前端需要发送的数据格式：
    {
        "name": "医生姓名",  # string
        "gender": "医生性别",  # string
        "title": "医生职称",  # string
        "department": "医生科室",  # string
        "office_number": "办公室门牌号",  # string
        "phone": "工作电话"  # string
    }
    返回数据格式：
    {
        "id": "医生工号",  # int
        "name": "医生姓名"  # string
    }
    """
    data = request.get_json()
    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
    doctor.name = data.get('name', doctor.name)
    doctor.gender = data.get('gender', doctor.gender)
    doctor.title = data.get('title', doctor.title)
    doctor.department = data.get('department', doctor.department)
    doctor.office_number = data.get('office_number', doctor.office_number)
    doctor.phone = data.get('phone', doctor.phone)
    db.session.commit()
    return jsonify({'id': doctor.id, 'name': doctor.name}), 200

@app.route('/doctor/notifications', methods=['GET'])
@role_required('doctor')
def get_notifications():
    """
    医生查询未读通知
    (这里前端要设置一个长轮询，每隔一段时间就发送一次请求，然后服务器返回未读通知)

    返回数据格式：
    [
        {
            "id": "通知ID",  # int
            "message": "通知信息"  # string
        },
        ...
    ]
    """
    doctor_id = get_jwt_identity()['id']
    notifications = Notification.query.filter_by(doctor_id=doctor_id, is_read=False).all()
    result = [{'id': n.id, 'message': n.message} for n in notifications]
    return jsonify(result)

@app.route('/doctor/notifications/read', methods=['POST'])
@role_required('doctor')
def mark_notifications_as_read():
    """
    将通知标记为已读
    前端需要发送的数据格式：
    {
        "notification_ids": ["通知ID1", "通知ID2", ...]  # list of int
    }
    返回数据格式：
    {
        "success": "是否成功"  # bool
    }
    """
    data = request.get_json()
    notification_ids = data.get('notification_ids', [])
    if not notification_ids:
        return jsonify({"success": False, "message": "No notification IDs provided"}), 400

    notifications = Notification.query.filter(Notification.id.in_(notification_ids)).all()
    for notification in notifications:
        notification.is_read = True

    db.session.commit()
    return jsonify({"success": True}), 200

@app.route('/admin/create_doctor', methods=['POST'])
@role_required('admin')
def add_doctor():
    """
    管理员添加医生
    前端需要发送的数据格式：
    {
        "doctor_id": "医生工号",  # int
        "name": "医生姓名",  # string
        "gender": "医生性别",  # string
        "title": "医生职称",  # string
        "department": "医生科室",  # string
        "office_number": "办公室门牌号",  # string
        "phone": "工作电话",  # string
        "password": "医生密码"  # string
    }
    返回数据格式：
    {
        "id": "医生工号",  # int
        "name": "医生姓名"  # string
    }
    """
    data = request.get_json()
    doctor = create_doctor(
        doctor_id=data['doctor_id'],
        name=data['name'],
        gender=data['gender'],
        title=data['title'],
        department=data['department'],
        office_number=data['office_number'],
        phone=data['phone'],
        password=data['password']
    )
    return jsonify({'id': doctor.id, 'name': doctor.name}), 201

@app.route('/admin/doctor/<int:doctor_id>', methods=['DELETE'])
@role_required('admin')
def delete_doctor_route(doctor_id):
    """
    管理员删除医生
    返回数据格式：
    {
        "success": "是否成功"  # bool
    }
    """
    success = delete_doctor(doctor_id)
    return jsonify({'success': success}), 200 if success else 404

@app.route('/admin/doctor/<int:doctor_id>/permissions', methods=['PUT'])
@role_required('admin')
# 这个暂时不做
def update_permissions(doctor_id):
    """
    管理员更新医生权限
    前端需要发送的数据格式：
    {
        "permissions": "权限JSON字符串"
    }
    返回数据格式：
    {
        "id": "医生工号",
        "permissions": "权限JSON字符串"
    }
    """
    data = request.get_json()
    doctor = update_doctor_permissions(doctor_id, data['permissions'])
    if doctor:
        return jsonify({'id': doctor.id, 'permissions': doctor.permissions}), 200
    return jsonify({'error': 'Doctor not found'}), 404

@app.route('/admin/users', methods=['GET'])
@role_required('admin')
def get_users():
    """
    管理员获取所有用户信息
    返回数据格式：
    [
        {
            "id": "用户身份证号",  # string
            "name": "用户姓名",  # string
            "gender": "用户性别",  # string
            "address": "家庭住址",  # string
            "phone_number": "用户电话号码",  # string
            "emergency_contact": "紧急联系人电话号码"  # string
        },
        ...
    ]
    """
    users = get_all_users()
    result = [
        {
            'idNumber': user.id,
            'name': user.name or "",  # 确保返回字符串
            'gender': user.gender or "",  # 确保返回字符串
            'address': user.address or "",  # 确保返回字符串
            'phone': user.phone_number or "",  # 确保返回字符串
            'emergencyContact': user.emergency_contact or ""  # 确保返回字符串
        } for user in users
    ]
    return jsonify(result)

@app.route('/admin/users/<string:user_id>', methods=['DELETE'])
@role_required('admin')
def delete_user_route(user_id):
    """
    管理员删除用户
    返回数据格式：
    {
        "success": "是否成功"  # bool
    }
    """
    success = delete_user(user_id)
    return jsonify({'success': success}), 200 if success else 404

@app.route('/admin/doctors', methods=['GET'])
@role_required('admin')
def get_doctors():
    """
    管理员获取所有医生信息
    返回数据格式：
    [
        {
            "id": "医生工号",  # int
            "avatar": "医生头像（二进制数据）",  # bytes (base64 encoded in JSON)，或者空字符串
            "name": "医生姓名",  # string
            "department": "医生科室",  # string
            "office_number": "办公室门牌号",  # string
            "phone": "工作电话"  # string
        },
        ...
    ]
    """
    print("asdfgh")
    doctors = get_all_doctors()
    result = [
        {
            'employeeId': doctor.id,
            'name': doctor.name or "",  # 确保返回字符串
            'gender': doctor.gender or "",  # 确保返回字符串
            'title': doctor.title or "", # 确保返回字符串
            'department': doctor.department or "",  # 确保返回字符串
            'office': doctor.office_number or "",  # 确保返回字符串
            'phone': doctor.phone or ""  ,# 确保返回字符串
            'avatar': doctor.avatar if doctor.avatar else "",  # 返回二进制数据，前端需要处理显示，为空则返回空字符串
        } for doctor in doctors
    ]
    return jsonify(result)

@app.route('/admin/appointments', methods=['GET'])
@role_required('admin')
def get_appointments():
    """
    管理员获取所有预约信息
    返回数据格式：
    [
        {
            "appointment_id": "预约ID",  # int
            "user_name": "用户姓名",  # string
            "doctor_name": "医生姓名",  # string
            "appointment_time": "预约时间",  # string
        },
        ...
    ]
    """
    appointments = get_all_appointments()
    result = []
    for appointment in appointments:
        user = User.query.get(appointment.user_id)
        doctor = Doctor.query.get(appointment.doctor_id)
        result.append({
            'appointment_id': appointment.id,
            'user_name': user.name if user else "",  # 确保返回字符串
            'doctor_name': doctor.name if doctor else "",  # 确保返回字符串
            'appointment_time': appointment.appointment_date.strftime("%Y-%m-%d") + " " + appointment.appointment_period
        })

    return jsonify(result)

@app.route('/admin/appointments/<int:appointment_id>', methods=['DELETE'])
@role_required('admin')
def delete_appointment_route(appointment_id):
    """
    管理员删除预约
    返回数据格式：
    {
        "success": "是否成功"  # bool
    }
    """
    success = delete_appointment(appointment_id)
    return jsonify({'success': success}), 200 if success else 404

@app.route('/admin/doctor/<int:doctor_id>', methods=['PUT'])
@role_required('admin')
def update_doctor_info_by_admin_route(doctor_id):
    """
    管理员修改医生信息
    前端需要发送的数据格式：
    {
        "name": "医生姓名",  # string
        "gender": "医生性别",  # string
        "title": "医生职称",  # string
        "department": "医生科室",  # string
        "office_number": "办公室门牌号",  # string
        "phone": "工作电话",  # string
        "password": "医生密码"  # string, optional
    }
    返回数据格式：
    {
        "id": "医生工号",  # int
        "name": "医生姓名"  # string
    }
    """
    data = request.get_json()
    doctor = update_doctor_info_by_admin(
        doctor_id=data["employeeId"],
        name=data['name'],
        gender=data['gender'],
        title=data['title'],
        department=data['department'],
        office_number=data['office'],
        phone=data['phone']
        # password=data.get('password')  # Optional
    )
    if doctor:
        return jsonify({'id': doctor.id, 'name': doctor.name}), 200
    return jsonify({'error': 'Doctor not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)
