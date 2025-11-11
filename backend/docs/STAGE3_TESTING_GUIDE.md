# 阶段3报名管理模块测试指南

**版本**: v1.0
**创建日期**: 2025-11-11
**适用阶段**: 阶段3 - 报名管理模块

---

## 📋 测试前准备

### 1. 环境要求

- **Java**: JDK 17 或更高版本
- **Maven**: 3.6+ (用于构建和运行)
- **MySQL**: 8.0+ (数据库服务)
- **Python**: 3.x (用于运行测试脚本)
- **Python依赖**: requests库

### 2. 安装Maven

如果您的系统还没有安装Maven，请按以下步骤安装：

#### Windows系统

1. 下载Maven: https://maven.apache.org/download.cgi
2. 解压到任意目录，例如: `C:\Program Files\Apache\maven`
3. 添加环境变量:
   - `MAVEN_HOME`: Maven解压路径
   - 在PATH中添加: `%MAVEN_HOME%\bin`
4. 验证安装: 打开新的命令行窗口，运行 `mvn -version`

#### 或者使用IDE

如果您使用IntelliJ IDEA或Eclipse等IDE：
- 直接在IDE中打开backend项目
- IDE会自动下载Maven依赖
- 可以直接在IDE中运行Spring Boot应用

### 3. 数据库准备

确保MySQL服务正在运行，并且已经：
- 创建了 `activity_assistant` 数据库
- 运行了 `scripts/init-schema.sql` 建表脚本
- 运行了 `scripts/init-data.sql` 测试数据脚本

### 4. 安装Python依赖

```bash
pip install requests
```

---

## 🚀 启动后端服务

### 方法1: 使用Maven命令行

```bash
cd backend
mvn spring-boot:run
```

### 方法2: 使用IDE

1. 在IDE中打开项目
2. 找到 `src/main/java/com/activityassistant/ActivityAssistantApplication.java`
3. 右键点击，选择"Run"或"Debug"

### 方法3: 构建并运行jar

```bash
cd backend
mvn clean package
java -jar target/activity-assistant-0.0.1-SNAPSHOT.jar
```

### 验证启动成功

启动成功后，您应该看到类似的日志输出：

```
Started ActivityAssistantApplication in 5.123 seconds
```

然后访问以下URL验证：
- 健康检查: http://localhost:8082/api/health
- Swagger文档: http://localhost:8082/swagger-ui.html

---

## 🧪 运行测试脚本

### 1. 确保后端服务已启动

在运行测试前，确保后端服务在 `http://localhost:8082` 上运行。

### 2. 运行报名管理测试

```bash
cd backend
python test_registration_api.py
```

### 3. 预期输出

测试脚本将执行以下8个测试用例：

```
============================================================
阶段3 - 报名管理模块 API测试
============================================================

ℹ 测试登录接口...
✓ 登录成功，获取Token: eyJhbGciOiJIUzM4NCJ9...
ℹ 用户信息: 测试用户

ℹ 创建测试活动...
✓ 创建测试活动成功，活动ID: xxx-xxx-xxx
✓ 活动已发布

ℹ 测试创建报名接口...
✓ 创建报名成功，报名ID: xxx-xxx-xxx
ℹ 报名状态: pending

ℹ 测试查询报名详情接口...
✓ 查询报名详情成功
ℹ 报名姓名: 测试用户
ℹ 报名状态: pending

ℹ 测试查询我的报名列表接口...
✓ 查询我的报名列表成功，共1个
ℹ 最新报名: 报名测试活动 - 周末篮球赛

ℹ 测试查询活动报名列表接口...
✓ 查询活动报名列表成功，共1个报名

ℹ 测试审核报名接口...
✓ 审核报名成功
ℹ 新状态: approved

ℹ 测试取消报名接口...
✓ 取消报名成功

============================================================
测试结果汇总
============================================================
✓ 通过 - 用户登录
✓ 通过 - 创建测试活动
✓ 通过 - 创建报名
✓ 通过 - 查询报名详情
✓ 通过 - 查询我的报名列表
✓ 通过 - 查询活动报名列表
✓ 通过 - 审核报名
✓ 通过 - 取消报名

通过率: 8/8 (100%)
============================================================
```

---

## 🔍 手动测试接口

### 使用curl测试

#### 1. 登录获取Token

```bash
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"test_code_dev\"}"
```

保存返回的token用于后续请求。

#### 2. 创建活动

```bash
curl -X POST http://localhost:8082/api/activities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "测试活动",
    "description": "这是一个测试活动",
    "type": "运动",
    "startTime": "2025-12-01T14:00:00",
    "endTime": "2025-12-01T18:00:00",
    "registerDeadline": "2025-11-30T23:59:59",
    "place": "体育馆",
    "address": "北京市朝阳区",
    "latitude": 39.9928,
    "longitude": 116.3972,
    "total": 10,
    "fee": 0,
    "feeType": "free",
    "needReview": true,
    "isPublic": true
  }'
```

保存返回的activity_id。

#### 3. 发布活动

```bash
curl -X POST http://localhost:8082/api/activities/{activity_id}/publish \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 4. 创建报名

```bash
curl -X POST http://localhost:8082/api/registrations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "activityId": "YOUR_ACTIVITY_ID",
    "name": "张三",
    "mobile": "13800138000"
  }'
```

保存返回的registration_id。

#### 5. 查询报名详情

```bash
curl -X GET http://localhost:8082/api/registrations/{registration_id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 6. 查询我的报名列表

```bash
curl -X GET "http://localhost:8082/api/registrations/my?page=0&size=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 7. 查询活动报名列表（组织者）

```bash
curl -X GET "http://localhost:8082/api/registrations/activity/{activity_id}?page=0&size=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 8. 审核报名

```bash
curl -X PUT http://localhost:8082/api/registrations/{registration_id}/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "approved": true,
    "note": "审核通过"
  }'
```

#### 9. 取消报名

```bash
curl -X DELETE http://localhost:8082/api/registrations/{registration_id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 使用Postman测试

1. 导入Swagger文档: http://localhost:8082/v3/api-docs
2. 或者手动创建以下请求集合

**Collection: ActivityAssistant - 报名管理**

- POST `/api/auth/login` - 登录
- POST `/api/activities` - 创建活动
- POST `/api/activities/{id}/publish` - 发布活动
- POST `/api/registrations` - 创建报名
- GET `/api/registrations/{id}` - 查询报名详情
- GET `/api/registrations/my` - 查询我的报名
- GET `/api/registrations/activity/{activityId}` - 查询活动报名列表
- PUT `/api/registrations/{id}/approve` - 审核报名
- DELETE `/api/registrations/{id}` - 取消报名

---

## ✅ 测试检查清单

### 功能测试

- [ ] 用户可以成功报名参加活动
- [ ] 防止重复报名（同一用户不能报名同一活动两次）
- [ ] 报名截止时间限制生效
- [ ] 活动人数上限限制生效
- [ ] 组织者可以审核报名（通过/拒绝）
- [ ] 用户可以取消自己的报名
- [ ] 活动的已报名人数自动更新
- [ ] 需要审核模式正常工作（报名后状态为pending）
- [ ] 无需审核模式正常工作（报名后自动approved）

### 权限测试

- [ ] 非组织者无法审核报名
- [ ] 非组织者无法查看活动的报名列表
- [ ] 用户只能取消自己的报名
- [ ] 未登录用户无法访问任何报名接口

### 数据一致性测试

- [ ] 报名通过后，活动的joined字段增加1
- [ ] 取消报名后，活动的joined字段减少1
- [ ] 删除活动时，相关报名记录自动删除（级联删除）

### 错误处理测试

- [ ] 报名不存在的活动返回404
- [ ] 报名已删除的活动返回错误
- [ ] 报名未发布的活动返回错误
- [ ] 超过截止时间报名返回错误
- [ ] 活动已满员时报名返回错误

---

## 🐛 常见问题

### 1. 端口8082被占用

**错误**: `Port 8082 is already in use`

**解决**:
```bash
# 查找占用进程
netstat -ano | findstr :8082

# 杀死进程
taskkill /PID <进程ID> /F
```

### 2. 数据库连接失败

**错误**: `Unable to connect to MySQL`

**检查**:
- MySQL服务是否启动
- 数据库名称是否正确（activity_assistant）
- 用户名密码是否正确（application.yml中的配置）

### 3. Token过期

**错误**: `Token has expired`

**解决**: 重新登录获取新的token（token有效期7天）

### 4. Python依赖缺失

**错误**: `ModuleNotFoundError: No module named 'requests'`

**解决**:
```bash
pip install requests
```

### 5. Maven构建失败

**错误**: `Failed to execute goal`

**解决**:
```bash
# 清理并重新构建
mvn clean install

# 跳过测试构建
mvn clean install -DskipTests
```

---

## 📊 测试数据

测试脚本使用的测试数据：

**用户**:
- 使用开发模式登录（code="test_code_dev"）
- 自动创建的测试用户: userId="u7d3f31690438"

**活动**:
- 标题: "报名测试活动 - 周末篮球赛"
- 类型: 运动
- 总人数: 10人
- 需要审核: true

**报名**:
- 姓名: "测试用户"
- 手机: "13800138000"
- 自定义数据: {"球龄": "2年", "T恤尺码": "L"}

---

## 📝 测试报告模板

测试完成后，可以使用以下模板记录测试结果：

```markdown
# 阶段3报名管理模块测试报告

**测试日期**: 2025-11-XX
**测试人员**: XXX
**测试环境**: Windows 10 / Java 17 / MySQL 8.0

## 测试结果

| 测试用例 | 预期结果 | 实际结果 | 状态 |
|---------|---------|---------|------|
| 用户登录 | 返回token | XXX | ✓ 通过 |
| 创建报名 | 创建成功 | XXX | ✓ 通过 |
| 查询报名详情 | 返回详情 | XXX | ✓ 通过 |
| 查询报名列表 | 返回列表 | XXX | ✓ 通过 |
| 审核报名 | 状态变为approved | XXX | ✓ 通过 |
| 取消报名 | 状态变为cancelled | XXX | ✓ 通过 |
| 防重复报名 | 返回409错误 | XXX | ✓ 通过 |
| 人数限制 | 返回错误提示 | XXX | ✓ 通过 |

## 发现的问题

(记录测试中发现的任何问题)

## 建议

(提出改进建议)
```

---

## 🎯 下一步

阶段3测试通过后，即可进入阶段4的开发：
- **阶段4**: 签到 + 统计模块
- 实现签到功能（GPS位置验证）
- 实现活动统计和用户统计功能

---

**文档版本**: v1.0
**最后更新**: 2025-11-11
**维护者**: Claude AI
