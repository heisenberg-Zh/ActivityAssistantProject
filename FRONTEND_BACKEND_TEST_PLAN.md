# 前后端集成测试计划

## 测试目标

验证微信小程序前端与Spring Boot后端的完整对接，确保所有功能正常工作。

---

## 测试环境

### 前端
- 微信开发者工具
- 环境：Mock模式（暂时使用假数据）
- 配置文件：`utils/config.js`

### 后端
- Spring Boot 应用
- 运行地址：`http://localhost:8082`
- 数据库：MySQL 8.0

---

## 测试功能模块

### 1. 用户认证模块

| 功能 | 前端API | 后端接口 | 状态 |
|------|---------|----------|------|
| 微信登录 | `userAPI.login(code)` | `POST /api/auth/login` | ⏳待测 |
| 获取用户信息 | `userAPI.getProfile()` | `GET /api/user/profile` | ⏳待测 |
| 更新用户信息 | `userAPI.updateProfile(data)` | `PUT /api/user/profile` | ⏳待测 |

**测试页面**：
- `pages/auth/login.js`
- `pages/profile/index.js`

---

### 2. 活动管理模块

| 功能 | 前端API | 后端接口 | 状态 |
|------|---------|----------|------|
| 获取活动列表 | `activityAPI.getList(params)` | `GET /api/activities` | ⏳待测 |
| 获取活动详情 | `activityAPI.getDetail(id)` | `GET /api/activities/{id}` | ⏳待测 |
| 创建活动 | `activityAPI.create(data)` | `POST /api/activities` | ⏳待测 |
| 更新活动 | `activityAPI.update(id, data)` | `PUT /api/activities/{id}` | ⏳待测 |
| 删除活动 | `activityAPI.delete(id)` | `DELETE /api/activities/{id}` | ⏳待测 |
| 我的活动 | `activityAPI.getMyActivities()` | `GET /api/activities/my-activities` | ⏳待测 |

**测试页面**：
- `pages/activities/list.js`（活动列表）
- `pages/activities/detail.js`（活动详情）
- `pages/activities/create.js`（创建活动）
- `pages/my-activities/index.js`（我的活动）
- `pages/home/index.js`（首页活动展示）

---

### 3. 报名管理模块

| 功能 | 前端API | 后端接口 | 状态 |
|------|---------|----------|------|
| 提交报名 | `registrationAPI.create(data)` | `POST /api/registrations` | ⏳待测 |
| 取消报名 | `registrationAPI.cancel(id)` | `DELETE /api/registrations/{id}` | ⏳待测 |
| 获取报名详情 | `registrationAPI.getDetail(id)` | `GET /api/registrations/{id}` | ⏳待测 |
| 我的报名列表 | `registrationAPI.getMyRegistrations()` | `GET /api/registrations/my` | ⏳待测 |
| 活动报名列表 | `registrationAPI.getByActivity(id)` | `GET /api/registrations/activity/{id}` | ⏳待测 |
| 审核报名 | `registrationAPI.approve(id, data)` | `PUT /api/registrations/{id}/approve` | ⏳待测 |

**测试页面**：
- `pages/registration/index.js`（报名页面）
- `pages/my-activities/joined-list.js`（我参与的活动）
- `pages/participants/index.js`（参与者列表）

---

### 4. 签到管理模块

| 功能 | 前端API | 后端接口 | 状态 |
|------|---------|----------|------|
| 提交签到 | `checkinAPI.create(data)` | `POST /api/checkins` | ⏳待测 |
| 获取签到详情 | `checkinAPI.getDetail(id)` | `GET /api/checkins/{id}` | ⏳待测 |
| 我的签到列表 | `checkinAPI.getMyCheckins()` | `GET /api/checkins/my` | ⏳待测 |
| 活动签到列表 | `checkinAPI.getByActivity(id)` | `GET /api/checkins/activity/{id}` | ⏳待测 |

**测试页面**：
- `pages/checkin/index.js`（签到页面）
- `pages/management/index.js`（管理页面）

---

### 5. 统计分析模块

| 功能 | 前端API | 后端接口 | 状态 |
|------|---------|----------|------|
| 活动统计 | `statisticsAPI.getActivityStatistics(id)` | `GET /api/statistics/activities/{id}` | ⏳待测 |
| 用户统计 | `statisticsAPI.getUserStatistics(id)` | `GET /api/statistics/users/{id}` | ⏳待测 |
| 我的统计 | `statisticsAPI.getMyStatistics()` | `GET /api/statistics/my` | ⏳待测 |

**测试页面**：
- `pages/statistics/index.js`（统计首页）
- `pages/statistics/created-detail.js`（我创建的活动统计）
- `pages/statistics/joined-detail.js`（我参与的活动统计）

---

## 测试流程

### 阶段一：接口可达性测试
1. 启动后端服务
2. 使用Postman/curl测试后端接口是否可访问
3. 验证响应格式是否符合前端预期

### 阶段二：前端Mock模式测试
1. 切换到Mock模式（`CURRENT_ENV = 'mock'`）
2. 测试前端页面功能和交互
3. 验证UI和用户体验

### 阶段三：前后端联调测试
1. 切换到Development模式（`CURRENT_ENV = 'development'`）
2. 配置微信开发者工具禁用域名校验
3. 逐个功能模块进行测试
4. 记录问题和修复

### 阶段四：端到端测试
1. 完整业务流程测试
2. 异常场景测试
3. 性能测试

---

## 已知问题

### 数据格式不匹配
- [ ] 前端期望的字段名与后端返回不一致
- [ ] 日期时间格式差异
- [ ] 枚举值定义不统一

### 缺失功能
- [ ] 前端调用了后端未实现的接口
- [ ] 后端接口前端未使用

### 错误处理
- [ ] 网络错误处理
- [ ] 业务错误提示
- [ ] Token过期处理

---

## 测试记录

### 测试日期：待定
### 测试人员：Claude
### 测试结果：待更新

---

## 修复计划

待测试完成后更新。
