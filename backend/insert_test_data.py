import subprocess
import sys

# MySQL连接信息
mysql_bin = r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
user = "activity_user"
password = "Activity@2025"
database = "activity_assistant"

# 测试活动数据
activities = [
    # 1. 公开活动-即将开始
    """
    INSERT INTO activities (
        id, title, description, organizer_id, type, status,
        start_time, end_time, register_deadline,
        place, address, latitude, longitude, checkin_radius,
        total, joined, min_participants,
        fee, fee_type, need_review, is_public, is_deleted,
        organizer_name, organizer_phone, organizer_wechat,
        created_at, updated_at
    ) VALUES (
        'TEST_PUBLIC_UPCOMING',
        '周末篮球友谊赛',
        '欢迎所有篮球爱好者参加，不限水平，重在参与！',
        'u7d3f31690438',
        '运动',
        'published',
        DATE_ADD(NOW(), INTERVAL 3 DAY),
        DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 2 HOUR,
        DATE_ADD(NOW(), INTERVAL 2 DAY),
        '朝阳公园篮球场',
        '北京市朝阳区朝阳公园南路1号',
        39.9289,
        116.4833,
        500,
        20,
        0,
        10,
        0,
        '免费',
        false,
        true,
        false,
        '用户7d3f31',
        '138****1234',
        'user_test_wx',
        NOW(),
        NOW()
    );
    """,
    # 2. 公开活动-进行中
    """
    INSERT INTO activities (
        id, title, description, organizer_id, type, status,
        start_time, end_time, register_deadline,
        place, address, latitude, longitude, checkin_radius,
        total, joined, min_participants,
        fee, fee_type, need_review, is_public, is_deleted,
        organizer_name, organizer_phone, organizer_wechat,
        created_at, updated_at
    ) VALUES (
        'TEST_PUBLIC_ONGOING',
        '编程技术分享会',
        '分享最新的前端开发技术和经验',
        'u7d3f31690438',
        '培训',
        'ongoing',
        DATE_SUB(NOW(), INTERVAL 1 HOUR),
        DATE_ADD(NOW(), INTERVAL 2 HOUR),
        DATE_SUB(NOW(), INTERVAL 1 DAY),
        '中关村创业大街3W咖啡',
        '北京市海淀区中关村大街3号',
        39.9833,
        116.3167,
        300,
        30,
        0,
        10,
        0,
        '免费',
        false,
        true,
        false,
        '用户7d3f31',
        '138****1234',
        'user_test_wx',
        NOW(),
        NOW()
    );
    """,
    # 3. 公开活动-已结束
    """
    INSERT INTO activities (
        id, title, description, organizer_id, type, status,
        start_time, end_time, register_deadline,
        place, address, latitude, longitude, checkin_radius,
        total, joined, min_participants,
        fee, fee_type, need_review, is_public, is_deleted,
        organizer_name, organizer_phone, organizer_wechat,
        created_at, updated_at
    ) VALUES (
        'TEST_PUBLIC_FINISHED',
        '上周羽毛球活动',
        '羽毛球爱好者聚会，已圆满结束',
        'u7d3f31690438',
        '运动',
        'finished',
        DATE_SUB(NOW(), INTERVAL 7 DAY),
        DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 2 HOUR,
        DATE_SUB(NOW(), INTERVAL 8 DAY),
        '奥林匹克体育中心',
        '北京市朝阳区国家体育场南路1号',
        39.9928,
        116.3972,
        500,
        24,
        0,
        10,
        50,
        'AA',
        false,
        true,
        false,
        '用户7d3f31',
        '138****1234',
        'user_test_wx',
        NOW(),
        NOW()
    );
    """,
    # 4. 私密活动-需要审核
    """
    INSERT INTO activities (
        id, title, description, organizer_id, type, status,
        start_time, end_time, register_deadline,
        place, address, latitude, longitude, checkin_radius,
        total, joined, min_participants,
        fee, fee_type, need_review, is_public, is_deleted,
        organizer_name, organizer_phone, organizer_wechat,
        created_at, updated_at
    ) VALUES (
        'TEST_PRIVATE_REVIEW',
        '公司内部培训-产品发布会',
        '仅限公司员工参加，需要审核',
        'u7d3f31690438',
        '会议',
        'published',
        DATE_ADD(NOW(), INTERVAL 5 DAY),
        DATE_ADD(NOW(), INTERVAL 5 DAY) + INTERVAL 3 HOUR,
        DATE_ADD(NOW(), INTERVAL 4 DAY),
        '公司会议室A',
        '北京市海淀区中关村软件园',
        39.9833,
        116.3167,
        200,
        50,
        0,
        20,
        0,
        '免费',
        true,
        false,
        false,
        '用户7d3f31',
        '138****1234',
        'user_test_wx',
        NOW(),
        NOW()
    );
    """,
    # 5. 别人创建的活动
    """
    INSERT INTO activities (
        id, title, description, organizer_id, type, status,
        start_time, end_time, register_deadline,
        place, address, latitude, longitude, checkin_radius,
        total, joined, min_participants,
        fee, fee_type, need_review, is_public, is_deleted,
        organizer_name, organizer_phone, organizer_wechat,
        created_at, updated_at
    ) VALUES (
        'TEST_OTHERS_PUBLIC',
        '周末聚餐活动',
        '朋友聚会，欢迎新朋友加入',
        'u1',
        '聚会',
        'published',
        DATE_ADD(NOW(), INTERVAL 6 DAY),
        DATE_ADD(NOW(), INTERVAL 6 DAY) + INTERVAL 3 HOUR,
        DATE_ADD(NOW(), INTERVAL 5 DAY),
        '三里屯某餐厅',
        '北京市朝阳区三里屯路11号',
        39.9389,
        116.4556,
        300,
        15,
        0,
        5,
        150,
        'AA',
        false,
        true,
        false,
        '张小明',
        '138****1234',
        'zhangxm_wx',
        NOW(),
        NOW()
    );
    """
]

def execute_sql(sql):
    """执行单条SQL语句"""
    try:
        cmd = [
            mysql_bin,
            "-u", user,
            f"-p{password}",
            database,
            "-e", sql
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
        if result.returncode == 0:
            return True, None
        else:
            return False, result.stderr
    except Exception as e:
        return False, str(e)

print("开始插入测试活动数据...")
success_count = 0
for i, sql in enumerate(activities, 1):
    print(f"插入活动 {i}/{len(activities)}...", end=" ")
    success, error = execute_sql(sql)
    if success:
        print("✓")
        success_count += 1
    else:
        print(f"✗ 错误: {error}")

print(f"\n活动数据插入完成: {success_count}/{len(activities)} 成功")

# 验证插入结果
print("\n验证数据...")
verify_sql = "SELECT COUNT(*) as count FROM activities WHERE id LIKE 'TEST_%';"
success, error = execute_sql(verify_sql)
print("活动数据已插入到数据库")
