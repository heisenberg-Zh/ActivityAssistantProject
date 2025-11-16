# 状态修复后的测试验证指南

## 快速测试步骤

### 1. 启动后端服务

```bash
cd E:\project\ActivityAssistantProject\backend
mvn spring-boot:run
```

服务启动后访问：http://localhost:8082/actuator/health

### 2. 可用的测试活动

以下活动已可以正常报名（status = published 或 ongoing）：

| Activity ID | 标题 | 状态 | 说明 |
|------------|------|------|------|
| `1c1905f0-ab07-40e5-b79d-2b66dffda512` | Weekend Badminton Updated | published | 可报名 |
| `a0` | 周六羽毛球联赛 | published | 可报名（含4个分组） |
| `a1` | 周末网球活动 | ongoing | 可报名（进行中） |
| `a1b` | 周末聚餐活动 | published | 可报名 |
| `a2` | 产品设计沙龙 | published | 可报名 |
| `private1` | 私密网球训练营 | published | 私密活动，需权限 |
| `a3` | 周末登山活动 | published | 可报名 |

### 3. 测试用户

使用已存在的测试用户进行登录和报名：

| User ID | 昵称 | 手机号 |
|---------|------|--------|
| `u1` | 张小北 | 138****1234 |
| `u2` | 李小雅 | 139****5678 |
| `u3` | 王小文 | 136****9012 |
| `u4` | 赵小海 | 137****3456 |
| `u5` | 李晓峰 | 135****7890 |
| `u6` | 王晨 | 134****2345 |

## 详细测试场景

### 场景1：正常报名流程

**测试目标**：验证 published 状态活动可以正常报名

**测试步骤**：
1. 打开微信开发者工具，启动前端项目
2. 登录（使用用户 u1: 张小北）
3. 浏览活动列表，选择状态为 "已发布" 的活动
4. 进入活动详情页，点击 "报名" 按钮
5. 填写报名信息，点击 "确认报名"

**预期结果**：
- ✅ 报名成功，显示成功提示
- ✅ 活动已报名人数 +1
- ✅ "我的活动" 中可以看到该活动

**API调用**：
```bash
POST http://localhost:8082/api/registrations
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "activityId": "a1b",
  "name": "张小北",
  "mobile": "138****1234",
  "customData": {}
}
```

### 场景2：进行中活动报名

**测试目标**：验证 ongoing 状态活动可以报名

**测试活动**：`a1` - 周末网球活动（状态：进行中）

**测试步骤**：
1. 找到状态为 "进行中" 的活动 (a1)
2. 进入活动详情页
3. 点击 "报名" 按钮
4. 填写信息并确认报名

**预期结果**：
- ✅ 报名成功（不再报错 "活动未发布"）

### 场景3：已结束活动报名（应失败）

**测试目标**：验证 finished 状态活动不能报名

**测试活动**：任意 status = finished 的历史活动（如 h1, h2...）

**预期结果**：
- ❌ 报名失败
- 错误信息：`"活动已结束，无法报名"`

### 场景4：待发布活动报名（应失败）

**测试目标**：验证 pending 状态活动不能报名

**测试活动**：`scheduled1`, `scheduled2`, `scheduled3`（预发布活动）

**预期结果**：
- ❌ 报名失败
- 错误信息：`"活动未发布，无法报名"`

### 场景5：分组活动报名

**测试目标**：验证带分组的活动报名功能

**测试活动**：`a0` - 周六羽毛球联赛（4个分组）

**测试步骤**：
1. 进入活动详情页
2. 选择一个分组（如 "A组-新手入门"）
3. 填写该分组要求的自定义字段
4. 提交报名

**预期结果**：
- ✅ 报名成功
- ✅ 报名记录包含 groupId

### 场景6：重复报名检测

**测试目标**：验证同一用户不能重复报名同一活动

**测试步骤**：
1. 对某活动报名成功后
2. 再次尝试报名同一活动

**预期结果**：
- ❌ 报名失败
- 错误信息：`"您已报名此活动，不能重复报名"`

### 场景7：人数限制检测

**测试目标**：验证活动人数满后不能报名

**准备**：
- 找一个 total 较小的活动
- 用多个用户报名直到人数满

**预期结果**：
- ❌ 最后一个用户报名失败
- 错误信息：`"活动人数已满，无法报名"`

## API测试（使用 curl 或 Postman）

### 1. 获取Token（登录）

```bash
POST http://localhost:8082/api/auth/login
Content-Type: application/json

{
  "code": "MOCK_CODE_FOR_U1"
}
```

**响应示例**：
```json
{
  "token": "eyJhbGciOiJIUzM4NCJ9...",
  "user": {
    "id": "u1",
    "nickname": "张小北",
    "mobile": "138****1234"
  }
}
```

### 2. 查询活动列表（验证状态）

```bash
GET http://localhost:8082/api/activities?status=published&page=0&size=10
```

### 3. 创建报名

```bash
POST http://localhost:8082/api/registrations
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "activityId": "a1b",
  "name": "张小北",
  "mobile": "138****1234",
  "customData": {
    "饮食偏好": "不吃辣"
  }
}
```

### 4. 查询我的报名

```bash
GET http://localhost:8082/api/registrations/my?page=0&size=10
Authorization: Bearer YOUR_TOKEN
```

## 常见错误排查

### 错误1: "活动未发布，无法报名"

**可能原因**：
- 活动状态不是 published 或 ongoing
- 数据库状态未更新成功

**排查步骤**：
```sql
-- 查询活动状态
SELECT id, title, status FROM activities WHERE id = '活动ID';

-- 如果状态不对，手动更新
UPDATE activities SET status = 'published' WHERE id = '活动ID';
```

### 错误2: "Invalid token"

**可能原因**：
- Token 过期
- Token 格式错误

**解决方案**：
- 重新登录获取新 Token

### 错误3: 端口占用

**错误信息**：`Port 8082 is already in use`

**解决方案**：
```bash
# Windows
netstat -ano | findstr :8082
taskkill /F /PID <PID>

# 或修改端口
# 编辑 application.yml，修改 server.port
```

## 验证清单

- [ ] 后端服务正常启动（端口 8082）
- [ ] 数据库连接正常
- [ ] 活动状态已统一为英文枚举
- [ ] published 状态活动可以报名
- [ ] ongoing 状态活动可以报名
- [ ] pending 状态活动不能报名
- [ ] finished 状态活动不能报名
- [ ] cancelled 状态活动不能报名
- [ ] 重复报名被阻止
- [ ] 人数限制生效
- [ ] 分组活动报名正常
- [ ] 前后端联调成功

## 回滚方案

如果修复后出现新问题，可以回滚：

1. **回滚代码**：
```bash
cd E:\project\ActivityAssistantProject
git checkout backend/src/main/java/com/activityassistant/service/RegistrationService.java
```

2. **回滚数据库**（不推荐，因为已经统一状态）：
```sql
-- 如果需要，可以手动恢复某些活动的状态
UPDATE activities SET status = '原状态' WHERE id = '活动ID';
```

## 联系与支持

如有问题，请查看：
- 修复总结：`backend/docs/STATUS_FIX_SUMMARY.md`
- API文档：http://localhost:8082/swagger-ui.html
- 日志文件：`backend/logs/`
