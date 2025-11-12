#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
报名管理API测试脚本
测试阶段3的所有报名管理接口
"""

import requests
import json
from datetime import datetime, timedelta

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

def test_create_activity():
    """创建测试活动"""
    global activity_id
    print_info("创建测试活动...")
    if not token:
        print_error("未登录，跳过测试")
        return False

    try:
        # 构造活动数据（需要审核）
        start_time = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%dT14:00:00")
        end_time = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%dT18:00:00")
        register_deadline = (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%dT23:59:59")

        data = {
            "title": "报名测试活动 - 周末篮球赛",
            "description": "这是用于测试报名功能的活动",
            "type": "运动",
            "startTime": start_time,
            "endTime": end_time,
            "registerDeadline": register_deadline,
            "place": "体育馆",
            "address": "北京市朝阳区体育馆",
            "latitude": 39.9928,
            "longitude": 116.3972,
            "checkinRadius": 500,
            "total": 10,
            "minParticipants": 5,
            "fee": 0.00,
            "feeType": "free",
            "needReview": True,  # 需要审核
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
            "mobile": "13800138000",
            "customData": json.dumps({"球龄": "2年", "T恤尺码": "L"})
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
            print_error(f"创建报名失败: HTTP {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"创建报名异常: {str(e)}")
        return False

def test_get_registration_detail():
    """测试查询报名详情"""
    print_info("测试查询报名详情接口...")
    if not token or not registration_id:
        print_warning("未登录或未创建报名，跳过测试")
        return False

    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/registrations/{registration_id}",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                registration = result["data"]
                print_success(f"查询报名详情成功")
                print_info(f"报名姓名: {registration['name']}")
                print_info(f"报名状态: {registration['status']}")
                return True
            else:
                print_error(f"查询报名详情失败: {result.get('message')}")
                return False
        else:
            print_error(f"查询报名详情失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"查询报名详情异常: {str(e)}")
        return False

def test_get_my_registrations():
    """测试查询我的报名列表"""
    print_info("测试查询我的报名列表接口...")
    if not token:
        print_warning("未登录，跳过测试")
        return False

    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/registrations/my?page=0&size=10",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                total = result["data"]["totalElements"]
                print_success(f"查询我的报名列表成功，共{total}个")
                if result["data"]["content"]:
                    print_info(f"最新报名: {result['data']['content'][0]['activityTitle']}")
                return True
            else:
                print_error(f"查询我的报名列表失败: {result.get('message')}")
                return False
        else:
            print_error(f"查询我的报名列表失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"查询我的报名列表异常: {str(e)}")
        return False

def test_get_activity_registrations():
    """测试查询活动报名列表（组织者）"""
    print_info("测试查询活动报名列表接口...")
    if not token or not activity_id:
        print_warning("未登录或未创建活动，跳过测试")
        return False

    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/registrations/activity/{activity_id}?page=0&size=10",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                total = result["data"]["totalElements"]
                print_success(f"查询活动报名列表成功，共{total}个报名")
                return True
            else:
                print_error(f"查询活动报名列表失败: {result.get('message')}")
                return False
        else:
            print_error(f"查询活动报名列表失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"查询活动报名列表异常: {str(e)}")
        return False

def test_approve_registration():
    """测试审核报名"""
    print_info("测试审核报名接口...")
    if not token or not registration_id:
        print_warning("未登录或未创建报名，跳过测试")
        return False

    try:
        data = {
            "approved": True,
            "note": "审核通过"
        }

        headers = {"Authorization": f"Bearer {token}"}
        response = requests.put(
            f"{BASE_URL}/registrations/{registration_id}/approve",
            json=data,
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                print_success(f"审核报名成功")
                print_info(f"新状态: {result['data']['status']}")
                return True
            else:
                print_error(f"审核报名失败: {result.get('message')}")
                return False
        else:
            print_error(f"审核报名失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"审核报名异常: {str(e)}")
        return False

def test_cancel_registration():
    """测试取消报名"""
    print_info("测试取消报名接口...")
    if not token or not registration_id:
        print_warning("未登录或未创建报名，跳过测试")
        return False

    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.delete(
            f"{BASE_URL}/registrations/{registration_id}",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                print_success(f"取消报名成功")
                return True
            else:
                print_error(f"取消报名失败: {result.get('message')}")
                return False
        else:
            print_error(f"取消报名失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"取消报名异常: {str(e)}")
        return False

def main():
    """主测试流程"""
    print("="*60)
    print("阶段3 - 报名管理模块 API测试")
    print("="*60)
    print()

    results = []

    # 测试登录
    results.append(("用户登录", test_login()))
    print()

    # 测试创建活动（用于报名测试）
    results.append(("创建测试活动", test_create_activity()))
    print()

    # 测试创建报名
    results.append(("创建报名", test_create_registration()))
    print()

    # 测试查询报名详情
    results.append(("查询报名详情", test_get_registration_detail()))
    print()

    # 测试查询我的报名列表
    results.append(("查询我的报名列表", test_get_my_registrations()))
    print()

    # 测试查询活动报名列表
    results.append(("查询活动报名列表", test_get_activity_registrations()))
    print()

    # 测试审核报名
    results.append(("审核报名", test_approve_registration()))
    print()

    # 测试取消报名（最后执行）
    results.append(("取消报名", test_cancel_registration()))
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
