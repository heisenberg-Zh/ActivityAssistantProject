# 前后端集成测试指南

**项目名称**：ActivityAssistant 活动助手
**创建日期**：2025-11-11
**测试版本**：v1.0
**状态**：✅ 前端代码已完成，待后端启动测试

---

## 📋 前置条件检查

### 1. 环境准备

- ✅ Java 17 已安装
- ✅ Maven 已安装（用户已解决）
- ✅ MySQL 8.0+ 已运行
- ✅ 微信开发者工具已安装
- ✅ 数据库已初始化

### 2. 代码修改完成情况

| 模块 | 文件 | 状态 | 说明 |
|------|------|------|------|
| **前端配置** | utils/config.js | ✅ 已完成 | baseUrl改为localhost:8082，useMock=false |
| **API模块** | utils/api.js | ✅ 已完成 | 24个API接口全部封装 |
| **首页** | pages/home/index.js | ✅ 已完成 | 使用activityAPI和registrationAPI |
| **活动列表** | pages/activities/list.js | ✅ 已完成 | 使用activityAPI和registrationAPI |
| **活动详情** | pages/activities/detail.js | ✅ 已完成 | 使用activityAPI、registrationAPI、userAPI |
| **我的活动** | pages/my-activities/index.js | ✅ 已完成 | 使用activityAPI和registrationAPI |

**所有主要页面已完成真实API集成！** 🎉

---

## 🚀 第一步：启动后端服务

### 方式一：使用命令行（推荐）

由于您已解决Maven问题，请在**CMD或PowerShell**中执行：

```bash
# 进入后端目录
cd E:\project\ActivityAssistantProject\backend

# 启动后端服务
mvn spring-boot:run
```

**注意**：不要在Git Bash中运行，应在Windows CMD或PowerShell中运行。

### 方式二：使用IDE

如果您使用IntelliJ IDEA或其他IDE：

1. 打开项目：`E:\project\ActivityAssistantProject\backend`
2. 找到主类：`ActivityAssistantApplication.java`
3. 右键 > Run 'ActivityAssistantApplication'

### 等待启动完成

启动成功的标志：

```
Started ActivityAssistantApplication in 3.456 seconds
Tomcat started on port(s): 8082 (http)
```

### 验证后端启动成功

在浏览器或使用curl测试：

```bash
# 方法1：浏览器访问
http://localhost:8082/api/health

# 方法2：使用curl
curl http://localhost:8082/api/health

# 应返回：
{"status":"UP","version":"1.0.0"}
```

---

## 🧪 第二步：运行后端API测试

在后端启动成功后，运行Python测试脚本验证所有API正常：

```bash
cd E:\project\ActivityAssistantProject\backend

# 测试基础接口（用户、活动）
python test_api.py

# 测试报名接口
python test_registration_api.py

# 测试签到和统计接口
python test_checkin_statistics_api.py
```

**预期结果**：所有测试应该通过 ✓

---

## 📱 第三步：启动前端微信小程序

### 1. 打开微信开发者工具

- 启动微信开发者工具
- 点击"导入项目"
- 项目目录选择：`E:\project\ActivityAssistantProject`
- AppID：`wx92bf60c1218c0abc`（或使用您自己的）

### 2. 检查前端配置

打开微信开发者工具的调试器，确认：

```javascript
// 在Console中检查
getApp().globalData.apiBase
// 应返回："http://localhost:8082"

getApp().globalData.useMock
// 应返回：false
```

### 3. 启用本地服务器访问

在微信开发者工具中：

1. 点击右上角"详情"
2. 选择"本地设置"
3. 勾选 ✓ "不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"

**这一步非常重要！否则无法访问localhost:8082**

---

## ✅ 第四步：前后端集成测试

### 测试用例列表

按以下顺序进行测试：

#### 1. 首页测试 （pages/home/index.js）

**测试步骤**：
1. 在微信开发者工具中，点击底部TabBar的"首页"
2. 观察页面是否显示活动列表

**检查点**：
- ✅ 页面显示"加载中..."提示
- ✅ 活动列表成功加载并显示
- ✅ 轮播图显示前5个活动
- ✅ 可以切换类别筛选（全部/聚会/培训/户外/运动）
- ✅ 控制台没有错误信息

**调试方法**：
- 打开Console，查看API请求日志：
  ```
  [Mock API] GET /api/activities { status: 'published', ... }
  成功加载活动: XX个
  ```
- 打开Network标签，查看HTTP请求：
  ```
  GET http://localhost:8082/api/activities?status=published&page=0&size=50
  Status: 200
  ```

#### 2. 活动列表测试 （pages/activities/list.js）

**测试步骤**：
1. 点击底部TabBar的"活动"
2. 观察活动列表加载情况

**检查点**：
- ✅ 活动列表成功加载
- ✅ 可以使用顶部筛选器（全部/进行中/即将开始等）
- ✅ 可以使用搜索框搜索活动
- ✅ 显示"已报名"标签（如果用户已报名）
- ✅ 点击活动卡片可以跳转到详情页

#### 3. 活动详情测试 （pages/activities/detail.js）

**测试步骤**：
1. 从首页或活动列表点击任意活动
2. 进入活动详情页

**检查点**：
- ✅ 活动详情信息正确显示（标题、时间、地点、费用等）
- ✅ 组织者信息显示
- ✅ 参与者头像列表显示
- ✅ 报名进度条显示
- ✅ 如果未报名，显示"报名"按钮
- ✅ 如果已报名，显示"已报名"或"取消报名"按钮
- ✅ 可以点击地图导航

**特别注意**：
- 如果页面显示"活动不存在"，检查后端是否有对应活动数据
- 如果显示"加载失败"，检查Network标签的错误信息

#### 4. 我的活动测试 （pages/my-activities/index.js）

**测试步骤**：
1. 点击底部TabBar的"我的"（或从首页进入）
2. 点击"我的活动"

**检查点**：
- ✅ 显示"我创建的"活动列表
- ✅ 显示"我参加的"活动列表
- ✅ 草稿活动显示（如果有本地草稿）
- ✅ 可以切换筛选标签（全部/预发布/草稿/我创建的/我参加的）
- ✅ 每个活动显示对应的操作按钮

#### 5. 报名功能测试

**测试步骤**：
1. 进入任意活动详情页
2. 点击"报名"按钮
3. 填写报名表单并提交

**检查点**：
- ✅ 报名表单正确显示
- ✅ 表单验证工作正常（姓名、手机号必填）
- ✅ 提交后显示"报名成功"提示
- ✅ 页面刷新后显示"已报名"状态
- ✅ 在"我的活动"中可以看到新报名的活动

**API请求检查**：
```
POST http://localhost:8082/api/registrations
Body: { activityId, name, mobile, ... }
Response: { code: 0, data: { id, status: 'approved', ... } }
```

#### 6. 登录功能测试

**测试步骤**：
1. 清除本地存储（模拟未登录状态）
2. 刷新小程序

**检查点**：
- ✅ 自动调用登录接口（使用test_code_dev）
- ✅ Token成功保存到本地存储
- ✅ 用户信息成功加载
- ✅ 后续API请求自动携带Token

**调试方法**：
```javascript
// Console中检查
wx.getStorageSync('token')
// 应返回类似："eyJhbGciOiJIUzM4NCJ9..."

wx.getStorageSync('userInfo')
// 应返回用户信息对象
```

---

## 🐛 常见问题排查

### 问题1：页面显示"加载失败，请稍后重试"

**可能原因**：
- 后端服务未启动
- 前端配置的baseUrl不正确
- 跨域问题

**排查步骤**：
1. 检查后端是否运行：
   ```bash
   curl http://localhost:8082/api/health
   ```
2. 检查微信开发者工具是否启用本地服务器
3. 查看Console的错误信息
4. 查看Network标签的请求状态

### 问题2：请求返回401未授权

**原因**：Token无效或未携带Token

**解决方法**：
1. 清除本地存储并重新登录：
   ```javascript
   // Console中执行
   wx.clearStorageSync();
   ```
2. 刷新小程序
3. 检查是否自动登录成功

### 问题3：活动列表为空

**可能原因**：
- 数据库没有数据
- API请求参数不正确

**解决方法**：
1. 检查数据库：
   ```sql
   USE activity_assistant;
   SELECT COUNT(*) FROM activities WHERE status = 'published';
   ```
2. 检查API请求日志：
   ```
   GET /api/activities?status=published&page=0&size=50
   ```
3. 如果数据库为空，运行测试脚本创建数据：
   ```bash
   python backend/test_api.py
   ```

### 问题4：Cannot read property 'content' of undefined

**原因**：后端返回的数据结构与前端期望不一致

**解决方法**：
- 检查API返回的数据结构
- 前端代码已做兼容处理：
  ```javascript
  const activities = activitiesResult.data.content || activitiesResult.data || [];
  ```

### 问题5：微信开发者工具提示"不在以下request合法域名列表中"

**解决方法**：
- 点击"详情" > "本地设置"
- 勾选"不校验合法域名..."

---

## 📊 测试结果记录表

使用此表格记录测试结果：

| 测试项目 | 预期结果 | 实际结果 | 状态 | 备注 |
|---------|---------|---------|------|------|
| 后端启动 | 8082端口正常监听 | | ⬜ | |
| 健康检查 | 返回UP状态 | | ⬜ | |
| 登录接口 | 返回token和用户信息 | | ⬜ | |
| 首页加载 | 显示活动列表 | | ⬜ | |
| 活动列表 | 显示所有活动 | | ⬜ | |
| 活动详情 | 显示完整信息 | | ⬜ | |
| 我的活动 | 显示我创建/参加的活动 | | ⬜ | |
| 报名功能 | 成功创建报名记录 | | ⬜ | |
| 筛选功能 | 正确筛选活动 | | ⬜ | |
| 搜索功能 | 正确搜索活动 | | ⬜ | |

**填写说明**：
- ✅ 通过
- ❌ 失败
- ⚠️ 部分通过
- ⬜ 未测试

---

## 🎯 完整测试流程（快速版）

```bash
# 1. 启动后端（CMD/PowerShell）
cd E:\project\ActivityAssistantProject\backend
mvn spring-boot:run
# 等待启动完成...

# 2. 验证后端（新窗口）
curl http://localhost:8082/api/health
# 应返回：{"status":"UP","version":"1.0.0"}

# 3. 运行测试脚本（新窗口）
cd E:\project\ActivityAssistantProject\backend
python test_api.py
python test_registration_api.py
python test_checkin_statistics_api.py
# 所有测试应该通过 ✓

# 4. 启动前端
# 打开微信开发者工具
# 导入项目：E:\project\ActivityAssistantProject
# 启用"不校验合法域名"
# 点击编译运行

# 5. 测试前端页面
# - 首页：查看活动列表
# - 活动列表：筛选和搜索
# - 活动详情：查看详细信息
# - 我的活动：查看我的活动
# - 报名：测试报名流程
```

---

## 📝 测试数据说明

### 后端测试数据（数据库）

根据`init-data.sql`，数据库包含：
- **7个测试用户**（u7d3f31690438等）
- **5个测试活动**（不同状态和类型）
- **若干报名记录**
- **若干签到记录**

### 默认测试账号

前端默认使用的测试账号：
- 用户ID：`u1`（在app.js中配置）
- 登录code：`test_code_dev`（后端mock登录）

### 创建更多测试数据

如需更多测试数据，可以：

1. 运行Python测试脚本（会创建新活动）：
   ```bash
   python test_api.py
   ```

2. 在前端创建活动：
   - 进入"首页"
   - 点击"创建活动"
   - 填写表单并发布

3. 直接在数据库插入数据：
   ```sql
   -- 使用init-data.sql作为模板
   ```

---

## 🎉 成功标准

测试通过的标准：

1. ✅ 后端服务启动成功（端口8082）
2. ✅ 所有Python测试脚本通过
3. ✅ 前端首页成功加载活动列表
4. ✅ 活动详情页正确显示信息
5. ✅ 报名功能正常工作
6. ✅ "我的活动"正确显示用户相关活动
7. ✅ 无严重Console错误（允许warn级别）

---

## 📚 相关文档

- **后端启动指南**：`backend/docs/BACKEND_STARTUP_GUIDE.md`
- **前后端集成报告**：`FRONTEND_BACKEND_INTEGRATION_REPORT.md`
- **API规范文档**：`backend/docs/API_SPECIFICATION.md`
- **数据库设计**：`backend/docs/DATABASE_DESIGN.md`

---

## 📞 问题反馈

如测试过程中遇到问题：

1. **查看Console错误信息**
2. **查看Network请求详情**
3. **检查后端日志**
4. **参考"常见问题排查"部分**
5. **检查相关文档**

---

**文档维护**：Claude AI
**最后更新**：2025-11-11 19:00
**版本**：v1.0

🎉 **前端代码已全部完成，准备开始测试！**
