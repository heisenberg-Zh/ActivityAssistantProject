#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
活动管理API测试脚本
测试阶段2的所有活动管理接口
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

# 全局变量存储token和活动ID
token = None
activity_id = None

def test_health():
    """测试健康检查接口"""
    print_info("测试健康检查接口...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success(f"健康检查通过: {response.json()}")
            return True
        else:
            print_error(f"健康检查失败: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"健康检查异常: {str(e)}")
        return False

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
    """测试创建活动接口"""
    global activity_id
    print_info("测试创建活动接口...")
    if not token:
        print_error("未登录，跳过测试")
        return False

    try:
        # 构造活动数据
        start_time = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%dT14:00:00")
        end_time = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%dT18:00:00")
        register_deadline = (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%dT23:59:59")

        data = {
            "title": "API测试活动 - 周末网球赛",
            "description": "这是通过API创建的测试活动",
            "type": "运动",
            "startTime": start_time,
            "endTime": end_time,
            "registerDeadline": register_deadline,
            "place": "奥体中心网球场",
            "address": "北京市朝阳区奥体中心",
            "latitude": 39.9928,
            "longitude": 116.3972,
            "checkinRadius": 500,
            "total": 20,
            "minParticipants": 10,
            "fee": 50.00,
            "feeType": "AA",
            "needReview": False,
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
                print_success(f"创建活动成功，活动ID: {activity_id}")
                print_info(f"活动标题: {result['data']['title']}")
                print_info(f"活动状态: {result['data']['status']}")
                return True
            else:
                print_error(f"创建活动失败: {result.get('message')}")
                return False
        else:
            print_error(f"创建活动失败: HTTP {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"创建活动异常: {str(e)}")
        return False

def test_get_activity_list():
    """测试查询活动列表接口"""
    print_info("测试查询活动列表接口...")
    try:
        params = {
            "page": 0,
            "size": 10,
            "status": "published"
        }
        response = requests.get(
            f"{BASE_URL}/activities",
            params=params,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                content = result["data"]["content"]
                total = result["data"]["totalElements"]
                print_success(f"查询活动列表成功，共{total}个活动")
                if content:
                    print_info(f"第一个活动: {content[0]['title']}")
                return True
            else:
                print_error(f"查询活动列表失败: {result.get('message')}")
                return False
        else:
            print_error(f"查询活动列表失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"查询活动列表异常: {str(e)}")
        return False

def test_get_activity_detail():
    """测试查询活动详情接口"""
    print_info("测试查询活动详情接口...")
    if not activity_id:
        print_warning("未创建活动，使用数据库中的测试活动")
        # 使用数据库中已有的活动ID
        test_id = "a1"
    else:
        test_id = activity_id

    try:
        response = requests.get(
            f"{BASE_URL}/activities/{test_id}",
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                activity = result["data"]
                print_success(f"查询活动详情成功")
                print_info(f"活动标题: {activity['title']}")
                print_info(f"组织者: {activity.get('organizerName', 'N/A')}")
                print_info(f"报名情况: {activity['joined']}/{activity['total']}")
                return True
            else:
                print_error(f"查询活动详情失败: {result.get('message')}")
                return False
        else:
            print_error(f"查询活动详情失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"查询活动详情异常: {str(e)}")
        return False

def test_update_activity():
    """测试更新活动接口"""
    print_info("测试更新活动接口...")
    if not token or not activity_id:
        print_warning("未登录或未创建活动，跳过测试")
        return False

    try:
        data = {
            "title": "API测试活动 - 周末网球赛（已更新）",
            "description": "这是通过API更新的测试活动",
            "total": 25
        }

        headers = {"Authorization": f"Bearer {token}"}
        response = requests.put(
            f"{BASE_URL}/activities/{activity_id}",
            json=data,
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                print_success(f"更新活动成功")
                print_info(f"新标题: {result['data']['title']}")
                print_info(f"新人数上限: {result['data']['total']}")
                return True
            else:
                print_error(f"更新活动失败: {result.get('message')}")
                return False
        else:
            print_error(f"更新活动失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"更新活动异常: {str(e)}")
        return False

def test_publish_activity():
    """测试发布活动接口"""
    print_info("测试发布活动接口...")
    if not token or not activity_id:
        print_warning("未登录或未创建活动，跳过测试")
        return False

    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{BASE_URL}/activities/{activity_id}/publish",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                print_success(f"发布活动成功")
                print_info(f"活动状态: {result['data']['status']}")
                return True
            else:
                print_error(f"发布活动失败: {result.get('message')}")
                return False
        else:
            print_error(f"发布活动失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"发布活动异常: {str(e)}")
        return False

def test_cancel_activity():
    """测试取消活动接口"""
    print_info("测试取消活动接口...")
    if not token or not activity_id:
        print_warning("未登录或未创建活动，跳过测试")
        return False

    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{BASE_URL}/activities/{activity_id}/cancel",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                print_success(f"取消活动成功")
                print_info(f"活动状态: {result['data']['status']}")
                return True
            else:
                print_error(f"取消活动失败: {result.get('message')}")
                return False
        else:
            print_error(f"取消活动失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"取消活动异常: {str(e)}")
        return False

def test_delete_activity():
    """测试删除活动接口"""
    print_info("测试删除活动接口...")
    if not token or not activity_id:
        print_warning("未登录或未创建活动，跳过测试")
        return False

    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.delete(
            f"{BASE_URL}/activities/{activity_id}",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                print_success(f"删除活动成功")
                return True
            else:
                print_error(f"删除活动失败: {result.get('message')}")
                return False
        else:
            print_error(f"删除活动失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"删除活动异常: {str(e)}")
        return False

def test_my_activities():
    """测试查询我创建的活动接口"""
    print_info("测试查询我创建的活动接口...")
    if not token:
        print_warning("未登录，跳过测试")
        return False

    try:
        headers = {"Authorization": f"Bearer {token}"}
        params = {"page": 0, "size": 10}
        response = requests.get(
            f"{BASE_URL}/activities/my-activities",
            params=params,
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                total = result["data"]["totalElements"]
                print_success(f"查询我创建的活动成功，共{total}个")
                return True
            else:
                print_error(f"查询我创建的活动失败: {result.get('message')}")
                return False
        else:
            print_error(f"查询我创建的活动失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"查询我创建的活动异常: {str(e)}")
        return False

def main():
    """主测试流程"""
    print("="*60)
    print("阶段2 - 活动管理模块 API测试")
    print("="*60)
    print()

    results = []

    # 测试健康检查
    results.append(("健康检查", test_health()))
    print()

    # 测试登录
    results.append(("用户登录", test_login()))
    print()

    # 测试创建活动
    results.append(("创建活动", test_create_activity()))
    print()

    # 测试查询活动列表
    results.append(("查询活动列表", test_get_activity_list()))
    print()

    # 测试查询活动详情
    results.append(("查询活动详情", test_get_activity_detail()))
    print()

    # 测试更新活动
    results.append(("更新活动", test_update_activity()))
    print()

    # 测试发布活动
    results.append(("发布活动", test_publish_activity()))
    print()

    # 测试取消活动
    results.append(("取消活动", test_cancel_activity()))
    print()

    # 测试查询我创建的活动
    results.append(("查询我创建的活动", test_my_activities()))
    print()

    # 测试删除活动（最后执行）
    results.append(("删除活动", test_delete_activity()))
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
