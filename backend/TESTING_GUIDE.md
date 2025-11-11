# 测试指南

## 快速开始

### 前置条件

1. **Java 17** 已安装
2. **Maven** 已安装
3. **MySQL 8.0** 已安装并运行
4. **Python 3.x** 已安装（用于运行测试脚本）
5. 数据库已初始化（执行了 `init-schema.sql` 和 `init-data.sql`）

### 启动后端服务

```bash
# 1. 进入backend目录
cd backend

# 2. 启动Spring Boot应用（开发环境，端口8082）
mvn spring-boot:run
```

等待应用启动完成，看到以下日志表示成功：

```
Started ActivityApplication in X.XXX seconds
```

### 验证服务状态

```bash
# 检查健康状态
curl http://localhost:8082/api/health
```

预期响应：

```json
{
  "status": "UP",
  "timestamp": "2025-11-11T12:00:00"
}
```

### 访问Swagger文档

浏览器打开：http://localhost:8082/swagger-ui.html

---

## 阶段2 - 活动管理模块测试

### 自动化测试

使用Python测试脚本 `test_api.py` 进行自动化测试：

```bash
# 1. 确保后端服务已启动

# 2. 运行测试脚本
python test_api.py
```

测试脚本会自动执行以下测试：

1. ✅ 健康检查测试
2. ✅ 用户登录测试
3. ✅ 创建活动测试
4. ✅ 查询活动列表测试
5. ✅ 查询活动详情测试
6. ✅ 更新活动测试
7. ✅ 发布活动测试
8. ✅ 取消活动测试
9. ✅ 查询我创建的活动测试
10. ✅ 删除活动测试

### 预期输出

```
============================================================
阶段2 - 活动管理模块 API测试
============================================================

ℹ 测试健康检查接口...
✓ 健康检查通过: {'status': 'UP', ...}

ℹ 测试登录接口...
✓ 登录成功，获取Token: eyJhbGciOiJIUzM4NCJ9...
ℹ 用户信息: 张小北

...

============================================================
测试结果汇总
============================================================
✓ 通过 - 健康检查
✓ 通过 - 用户登录
✓ 通过 - 创建活动
...

通过率: 10/10 (100%)
============================================================
```

---

## 手动测试

### 1. 用户登录

```bash
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test_code_dev"
  }'
```

预期响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzM4NCJ9...",
    "userInfo": {
      "id": "u7d3f3169043...",
      "nickname": "张小北",
      "avatar": "/activityassistant_avatar_01.png",
      "mobile": "138****1234",
      "role": "user"
    }
  }
}
```

**保存token用于后续请求！**

### 2. 创建活动

```bash
TOKEN="your_token_here"

curl -X POST http://localhost:8082/api/activities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "周末网球活动",
    "description": "欢迎所有网球爱好者参加",
    "type": "运动",
    "startTime": "2025-12-15T14:00:00",
    "endTime": "2025-12-15T18:00:00",
    "registerDeadline": "2025-12-15T12:00:00",
    "place": "奥体中心网球场",
    "address": "北京市朝阳区奥体中心",
    "latitude": 39.9928,
    "longitude": 116.3972,
    "checkinRadius": 500,
    "total": 20,
    "minParticipants": 10,
    "fee": 50.00,
    "feeType": "AA",
    "needReview": false,
    "isPublic": true
  }'
```

### 3. 查询活动列表

```bash
# 查询所有公开活动（分页）
curl "http://localhost:8082/api/activities?page=0&size=10"

# 按类型筛选
curl "http://localhost:8082/api/activities?type=运动&page=0&size=10"

# 按状态筛选
curl "http://localhost:8082/api/activities?status=published&page=0&size=10"

# 关键字搜索
curl "http://localhost:8082/api/activities?keyword=网球&page=0&size=10"
```

### 4. 查询活动详情

```bash
# 使用数据库中已有的活动ID
curl http://localhost:8082/api/activities/a1
```

### 5. 更新活动

```bash
TOKEN="your_token_here"
ACTIVITY_ID="your_activity_id"

curl -X PUT http://localhost:8082/api/activities/$ACTIVITY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "周末网球活动（已更新）",
    "total": 25
  }'
```

### 6. 发布活动

```bash
TOKEN="your_token_here"
ACTIVITY_ID="your_activity_id"

curl -X POST http://localhost:8082/api/activities/$ACTIVITY_ID/publish \
  -H "Authorization: Bearer $TOKEN"
```

### 7. 取消活动

```bash
TOKEN="your_token_here"
ACTIVITY_ID="your_activity_id"

curl -X POST http://localhost:8082/api/activities/$ACTIVITY_ID/cancel \
  -H "Authorization: Bearer $TOKEN"
```

### 8. 删除活动

```bash
TOKEN="your_token_here"
ACTIVITY_ID="your_activity_id"

curl -X DELETE http://localhost:8082/api/activities/$ACTIVITY_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 9. 查询我创建的活动

```bash
TOKEN="your_token_here"

curl http://localhost:8082/api/activities/my-activities?page=0&size=10 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 数据库检查

### 查看活动数据

```bash
mysql -u activity_user -pActivity@2025 activity_assistant

# 查看所有活动
SELECT id, title, status, organizer_id, total, joined, created_at
FROM activities
WHERE is_deleted = 0;

# 查看活动详情
SELECT * FROM activities WHERE id = 'a1';

# 查看用户创建的活动数量
SELECT organizer_id, COUNT(*) as count
FROM activities
WHERE is_deleted = 0
GROUP BY organizer_id;
```

---

## 常见问题

### 1. 端口被占用

如果端口8082被占用，可以修改 `application-dev.yml` 中的端口配置：

```yaml
server:
  port: 8083  # 修改为其他端口
```

### 2. 数据库连接失败

检查MySQL服务是否启动：

```bash
# Windows
sc query mysql80

# 如果未启动
net start mysql80
```

检查数据库配置：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/activity_assistant?useUnicode=true&characterEncoding=UTF-8&serverTimezone=GMT%2B8&useSSL=false&allowPublicKeyRetrieval=true
    username: activity_user
    password: Activity@2025
```

### 3. 401 Unauthorized

确保请求头中携带了正确的Token：

```bash
Authorization: Bearer eyJhbGciOiJIUzM4NCJ9...
```

### 4. 403 Permission Denied

只有活动的组织者才能修改/删除活动。确保使用创建活动的用户Token。

### 5. 400 Bad Request

检查请求参数是否正确：
- 时间格式：`2025-12-15T14:00:00`
- 结束时间必须晚于开始时间
- 报名截止时间必须早于开始时间

---

## 性能测试（可选）

使用Apache Bench进行性能测试：

```bash
# 测试查询活动列表接口
ab -n 1000 -c 10 http://localhost:8082/api/activities

# 测试查询活动详情接口
ab -n 1000 -c 10 http://localhost:8082/api/activities/a1
```

---

## 下一步

完成阶段2测试后，可以继续开发阶段3报名管理模块。

---

**文档版本**：v1.0
**最后更新**：2025-11-11
