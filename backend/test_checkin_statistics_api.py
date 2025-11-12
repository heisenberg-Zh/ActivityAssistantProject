#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
签到和统计API测试脚本
测试阶段4的所有签到和统计接口
"""

import requests
import json
from datetime import datetime, timedelta
from decimal import Decimal

# API基础URL
BASE_URL = "http://localhost:8082/api"

# 颜色输出
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.END}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.END}")

# 全局变量存储token、活动ID和报名ID
token = None
activity_id = None
registration_id = None
checkin_id = None

# 活动地点坐标（体育馆）
ACTIVITY_LAT = 39.9928
ACTIVITY_LNG = 116.3972

# 签到坐标（距离活动地点约100米，在范围内）
CHECKIN_LAT = 39.9918  # 大约100米远
CHECKIN_LNG = 116.3972

def test_login():
    """测试登录接口并获取token"""
    global token
    print_info("测试登录接口...")
    try:
        data = {"code": "test_code_dev"}
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=data,
            timeout=5
        )
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                token = result["data"]["token"]
                print_success(f"登录成功，获取Token: {token[:20]}...")
                print_info(f"用户信息: {result['data']['userInfo']['nickname']}")
                return True
            else:
                print_error(f"登录失败: {result.get('message')}")
                return False
        else:
            print_error(f"登录失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"登录异常: {str(e)}")
        return False

def test_create_and_publish_activity():
    """创建并发布测试活动"""
    global activity_id
    print_info("创建并发布测试活动...")
    if not token:
        print_error("未登录，跳过测试")
        return False

    try:
        # 构造活动数据（需要审核）
        start_time = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%dT14:00:00")
        end_time = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%dT18:00:00")
        register_deadline = (datetime.now() + timedelta(hours=23)).strftime("%Y-%m-%dT23:59:59")

        data = {
            "title": "签到测试活动 - 周末运动会",
            "description": "这是用于测试签到功能的活动",
            "type": "运动",
            "startTime": start_time,
            "endTime": end_time,
            "registerDeadline": register_deadline,
            "place": "体育馆",
            "address": "北京市朝阳区体育馆",
            "latitude": ACTIVITY_LAT,
            "longitude": ACTIVITY_LNG,
            "checkinRadius": 500,  # 签到范围500米
            "total": 10,
            "minParticipants": 5,
            "fee": 0.00,
            "feeType": "free",
            "needReview": False,  # 无需审核，自动通过
            "isPublic": True
        }

        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{BASE_URL}/activities",
            json=data,
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                activity_id = result["data"]["id"]
                print_success(f"创建测试活动成功，活动ID: {activity_id}")
                # 发布活动
                response = requests.post(
                    f"{BASE_URL}/activities/{activity_id}/publish",
                    headers=headers,
                    timeout=5
                )
                if response.status_code == 200:
                    print_success("活动已发布")
                return True
            else:
                print_error(f"创建活动失败: {result.get('message')}")
                return False
        else:
            print_error(f"创建活动失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"创建活动异常: {str(e)}")
        return False

def test_create_registration():
    """测试创建报名"""
    global registration_id
    print_info("测试创建报名接口...")
    if not token or not activity_id:
        print_warning("未登录或未创建活动，跳过测试")
        return False

    try:
        data = {
            "activityId": activity_id,
            "name": "测试用户",
            "mobile": "13800138000"
        }

        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{BASE_URL}/registrations",
            json=data,
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                registration_id = result["data"]["id"]
                print_success(f"创建报名成功，报名ID: {registration_id}")
                print_info(f"报名状态: {result['data']['status']}")
                return True
            else:
                print_error(f"创建报名失败: {result.get('message')}")
                return False
        else:
            print_error(f"创建报名失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"创建报名异常: {str(e)}")
        return False

def test_create_checkin():
    """测试创建签到"""
    global checkin_id
    print_info("测试创建签到接口...")
    if not token or not activity_id:
        print_warning("未登录或未创建活动，跳过测试")
        return False

    try:
        data = {
            "activityId": activity_id,
            "latitude": CHECKIN_LAT,
            "longitude": CHECKIN_LNG,
            "address": "北京市朝阳区体育馆附近"
        }

        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{BASE_URL}/checkins",
            json=data,
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                checkin_id = result["data"]["id"]
                print_success(f"签到成功，签到ID: {checkin_id}")
                print_info(f"距离: {result['data']['distance']}米")
                print_info(f"是否迟到: {result['data']['isLate']}")
                print_info(f"是否有效: {result['data']['isValid']}")
                return True
            else:
                print_error(f"签到失败: {result.get('message')}")
                return False
        else:
            print_error(f"签到失败: HTTP {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"签到异常: {str(e)}")
        return False

def test_get_checkin_detail():
    """测试查询签到详情"""
    print_info("测试查询签到详情接口...")
    if not token or not checkin_id:
        print_warning("未登录或未签到，跳过测试")
        return False

    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/checkins/{checkin_id}",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                checkin = result["data"]
                print_success(f"查询签到详情成功")
                print_info(f"签到时间: {checkin['checkinTime']}")
                print_info(f"距离: {checkin['distance']}米")
                return True
            else:
                print_error(f"查询签到详情失败: {result.get('message')}")
                return False
        else:
            print_error(f"查询签到详情失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"查询签到详情异常: {str(e)}")
        return False

def test_get_my_checkins():
    """测试查询我的签到列表"""
    print_info("测试查询我的签到列表接口...")
    if not token:
        print_warning("未登录，跳过测试")
        return False

    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/checkins/my?page=0&size=10",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                total = result["data"]["totalElements"]
                print_success(f"查询我的签到列表成功，共{total}个")
                if result["data"]["content"]:
                    print_info(f"最新签到: {result['data']['content'][0]['activityTitle']}")
                return True
            else:
                print_error(f"查询我的签到列表失败: {result.get('message')}")
                return False
        else:
            print_error(f"查询我的签到列表失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"查询我的签到列表异常: {str(e)}")
        return False

def test_get_activity_checkins():
    """测试查询活动签到列表（组织者）"""
    print_info("测试查询活动签到列表接口...")
    if not token or not activity_id:
        print_warning("未登录或未创建活动，跳过测试")
        return False

    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/checkins/activity/{activity_id}?page=0&size=10",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                total = result["data"]["totalElements"]
                print_success(f"查询活动签到列表成功，共{total}个签到")
                return True
            else:
                print_error(f"查询活动签到列表失败: {result.get('message')}")
                return False
        else:
            print_error(f"查询活动签到列表失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"查询活动签到列表异常: {str(e)}")
        return False

def test_get_activity_statistics():
    """测试查询活动统计"""
    print_info("测试查询活动统计接口...")
    if not token or not activity_id:
        print_warning("未登录或未创建活动，跳过测试")
        return False

    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/statistics/activities/{activity_id}",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                stats = result["data"]
                print_success(f"查询活动统计成功")
                print_info(f"报名统计 - 总数: {stats['registrationStats']['total']}, "
                          f"已通过: {stats['registrationStats']['approved']}")
                print_info(f"签到统计 - 总数: {stats['checkinStats']['total']}, "
                          f"签到率: {stats['checkinStats']['rate']}%")
                return True
            else:
                print_error(f"查询活动统计失败: {result.get('message')}")
                return False
        else:
            print_error(f"查询活动统计失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"查询活动统计异常: {str(e)}")
        return False

def test_get_user_statistics():
    """测试查询用户统计"""
    print_info("测试查询用户统计接口...")
    if not token:
        print_warning("未登录，跳过测试")
        return False

    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/statistics/my",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                stats = result["data"]
                print_success(f"查询用户统计成功")
                print_info(f"创建活动数: {stats['createdActivities']}")
                print_info(f"参与活动数: {stats['participatedActivities']}")
                print_info(f"签到数: {stats['totalCheckins']}")
                print_info(f"签到率: {stats['checkinRate']}%")
                return True
            else:
                print_error(f"查询用户统计失败: {result.get('message')}")
                return False
        else:
            print_error(f"查询用户统计失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"查询用户统计异常: {str(e)}")
        return False

def main():
    """主测试流程"""
    print("="*60)
    print("阶段4 - 签到和统计模块 API测试")
    print("="*60)
    print()

    results = []

    # 测试登录
    results.append(("用户登录", test_login()))
    print()

    # 测试创建活动并发布
    results.append(("创建并发布活动", test_create_and_publish_activity()))
    print()

    # 测试创建报名
    results.append(("创建报名", test_create_registration()))
    print()

    # 测试创建签到
    results.append(("创建签到", test_create_checkin()))
    print()

    # 测试查询签到详情
    results.append(("查询签到详情", test_get_checkin_detail()))
    print()

    # 测试查询我的签到列表
    results.append(("查询我的签到列表", test_get_my_checkins()))
    print()

    # 测试查询活动签到列表
    results.append(("查询活动签到列表", test_get_activity_checkins()))
    print()

    # 测试查询活动统计
    results.append(("查询活动统计", test_get_activity_statistics()))
    print()

    # 测试查询用户统计
    results.append(("查询用户统计", test_get_user_statistics()))
    print()

    # 汇总结果
    print("="*60)
    print("测试结果汇总")
    print("="*60)
    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✓ 通过" if result else "✗ 失败"
        color = Colors.GREEN if result else Colors.RED
        print(f"{color}{status}{Colors.END} - {name}")

    print()
    print(f"通过率: {passed}/{total} ({passed*100//total}%)")
    print("="*60)

if __name__ == "__main__":
    main()
