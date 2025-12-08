# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 重要：项目当前阶段和开发原则

### 项目状态
**当前阶段**: 🟢 **生产环境** - 已部署上线运行

### 核心开发原则（必须严格遵守）

#### 1. ❌ 禁止使用假数据
- **所有功能必须通过后端 API 调用数据库**
- **禁止使用 `utils/mock.js` 中的假数据**
- **禁止使用本地存储 Mock 数据**
- **禁止在代码中硬编码测试数据**

#### 2. ✅ 测试数据管理
- 如需测试数据，必须通过数据库脚本插入
- 使用后端 API 获取真实数据
- 不能为了测试方便而临时使用假数据

#### 3. 🔧 功能完善要求
- 发现功能不完善时，**必须完善后端功能**
- **不能用假数据绕过问题**
- 不确定如何处理时，**先与用户确认再执行**

#### 4. 📝 代码审查要点
- 排查所有使用 `require('../../utils/mock.js')` 的地方
- 排查所有使用 `wx.setStorageSync` 存储业务数据的地方
- 确保所有 API 调用都配置为 `production` 模式（连接生产环境后端）

### 遗留问题待清理
以下功能当前仍使用假数据或本地存储，需要逐步清理：
- ⚠️ `utils/mock.js` - 假数据文件（待废弃）
- ⚠️ 收藏功能 - 使用本地存储（需改为 API）
- ⚠️ 部分页面可能仍引用 mock 数据（需全面排查）

## 项目概述

ActivityAssistant 是一个微信小程序活动管理系统，帮助用户创建、管理和参与各类社交活动。项目采用前后端分离架构：
- **前端**: 微信小程序原生开发
- **后端**: Spring Boot + MySQL + Redis

**技术栈**:
- 前端：微信小程序原生框架
- 后端：Spring Boot 3.2.1、Spring Security、JWT、MySQL 8.0、Redis

## 开发环境

### 工具要求
- 微信开发者工具
- AppID: `wx92bf60c1218c0abc` (可替换为自己的测试 AppID)

### 启动项目
1. 打开微信开发者工具
2. 选择"导入项目"
3. 项目路径选择此目录
4. 启动后默认进入首页

## 代码架构

### 目录结构
```
ActivityAssistantProject/
├── pages/               # 小程序页面
│   ├── home/           # 首页 (tabBar)
│   ├── activities/     # 活动相关页面
│   │   ├── list        # 活动列表 (tabBar)
│   │   ├── detail      # 活动详情
│   │   └── create      # 创建活动
│   ├── registration/   # 报名页面
│   ├── checkin/        # 签到页面
│   ├── statistics/     # 数据统计 (tabBar)
│   ├── profile/        # 个人中心 (tabBar)
│   ├── my-activities/  # 我的活动
│   ├── messages/       # 消息中心
│   ├── management/     # 活动管理（管理员/白名单/黑名单/评价）
│   └── settings/       # 设置
├── utils/              # 工具函数
│   ├── api.js         # API 请求封装（连接后端）
│   ├── config.js      # 环境配置
│   ├── security.js    # 安全工具（XSS防护等）
│   ├── formatter.js   # 数据格式化
│   └── mock.js        # ⚠️ 假数据（待废弃，仅用于参考）
├── backend/           # 后端服务（Spring Boot）
├── ui-html/          # HTML 原型文件 (设计参考)
├── app.js            # 小程序入口
├── app.json          # 小程序配置
└── app.wxss          # 全局样式
```

**重要说明**: `utils/mock.js` 文件已不再使用，所有数据均通过 `utils/api.js` 从后端获取。

### TabBar 结构
小程序底部导航栏包含 4 个主入口:
1. **首页** (`pages/home/index`) - 活动浏览、分类筛选、快捷入口
2. **活动** (`pages/activities/list`) - 活动列表、搜索和筛选
3. **统计** (`pages/statistics/index`) - 数据统计和可视化
4. **我的** (`pages/profile/index`) - 个人中心、设置

**注意**: 活动详情页 (`pages/activities/detail`) 不使用 tabBar，底部显示"分享"和"报名"操作按钮

### 数据流架构
```
微信小程序前端
    ↓ HTTP/HTTPS请求 (utils/api.js)
后端 API (Spring Boot)
    ↓ JPA/Hibernate
MySQL 数据库
    ↓ 缓存层
Redis (Session/Cache)
```

**关键组件**:
- `utils/api.js` - 统一的 API 请求封装，处理认证、错误、重试
- `utils/config.js` - 环境配置，控制 API 地址和 Mock 模式
- JWT Token - 存储在 `wx.getStorageSync('token')`，每次请求自动携带

### 核心页面交互流程

#### 活动创建流程
1. 用户在首页点击"创建活动"按钮
2. 跳转至 `pages/activities/create` 分步骤表单
3. 填写活动信息 (基本信息 → 时间 → 地点 → 人数 → 其他设置 → 自定义字段)
4. 支持保存草稿、复制活动、实时预览
5. 调用 `activityAPI.create()` 发布活动并返回活动ID

#### 报名流程
1. 用户浏览活动列表或详情
2. 点击"报名"按钮跳转至 `pages/registration/index`
3. 填写姓名、手机号等自定义字段
4. 调用 `registrationAPI.register()` 提交报名
5. 后端验证权限、白/黑名单、人数限制后返回结果

#### 签到流程
1. 用户进入活动详情页点击"签到"
2. 跳转至 `pages/checkin/index`
3. 使用 `wx.getLocation()` 获取 GPS 位置
4. 后端验证签到时间、地理位置范围
5. 记录签到时间和位置坐标

## UI 设计规范

### 活动卡片布局
- 所有活动卡片遵循统一布局标准
- 横幅图片高度约为原设计的 40%
- 状态徽标和 CTA 按钮尺寸统一
- 应用于: 首页、活动列表、报名页、我的活动

### 颜色主题
- 主色: `#3b82f6` (蓝色)
- 次要色: `#8a8a8a` (灰色)
- 背景色: `#f7f8fa` (浅灰)
- 导航栏: `#ffffff` (白色)

### 资源文件
- 头像资源: 根目录下 `activityassistant_avatar_*.png` (4 张)
- 轮播图: 使用真实活动场景图片 (含网球场景)

## 已实现功能

### 核心功能模块
- ✅ 微信登录与JWT认证
- ✅ 活动创建、编辑、删除、查询
- ✅ 活动报名、审核、取消
- ✅ 活动签到（位置验证）
- ✅ 活动管理员管理
- ✅ 白名单/黑名单管理
- ✅ 活动评价系统
- ✅ 消息通知系统
- ✅ 用户反馈系统
- ✅ 数据统计和可视化

### 待完善功能

#### 高优先级
- ⚠️ **收藏功能云端同步**: 目前使用本地存储，需改为后端API
  - 相关文件：`pages/favorites/index.js`、`pages/activities/detail.js`
  - 需要实现：收藏API、跨设备同步

#### 功能增强（按需开发）
- 微信群内接龙报名功能
- 位置签到的防作弊增强
- 消息推送优化
- 国际化和深色模式支持

## 开发注意事项

### 页面导航
- 使用 `wx.navigateTo` 跳转普通页面
- tabBar 页面之间使用 `wx.switchTab`
- 传递参数使用 URL query string 格式: `?id=${id}`

### API 调用规范
所有数据必须通过 `utils/api.js` 中封装的 API 方法获取：

```javascript
// 正确示例：调用后端API
const { activityAPI } = require('../../utils/api.js');

// 获取活动列表
const result = await activityAPI.getList({ page: 0, size: 20 });
if (result.code === 0) {
  this.setData({ activities: result.data.content });
}
```

**禁止的做法**:
```javascript
// ❌ 错误：不要使用mock数据
const { activities } = require('../../utils/mock.js');

// ❌ 错误：不要硬编码测试数据
const activities = [{ id: 'test', title: 'Test Activity' }];
```

### 数据存储规范
- **Token**: 使用 `wx.setStorageSync('token', token)` 存储JWT
- **用户信息**: 使用 `wx.setStorageSync('userInfo', userInfo)` 存储基本用户信息
- **业务数据**: ❌ 禁止使用本地存储，必须通过 API 获取

### 分享功能
每个页面可实现 `onShareAppMessage` 方法支持微信分享:
```javascript
onShareAppMessage() {
  return { title: '活动助手', path: '/pages/home/index' };
}
```

### 位置服务
签到功能需使用微信 API 获取地理位置:
- `wx.getLocation` - 获取当前位置
- 需在 `app.json` 中声明位置权限

## 相关文档

- **需求文档**: `plan.md` - 详细的产品需求和技术规格
- **项目说明**: `README.md` - 快速开始和功能概览
- **UI 原型**: `ui-html/` - HTML 原型参考文件
- **API安全规范**: `API_SECURITY_SPEC.md` - 后端API权限校验和安全规范（必读）

## 安全注意事项

### 前端安全措施
本项目前端已实现以下安全措施：
- **XSS防护**: 使用 `utils/security.js` 中的 `sanitizeInput` 和 `escapeHtml` 对用户输入进行清理
- **手机号验证**: 使用严格的正则表达式防止SQL注入
- **防重复提交**: 部分接口使用防抖和节流机制
- **本地存储加密**: 敏感信息使用 `setSecureStorage` 加密存储

### 后端开发要求
**重要**: 前端的安全措施仅是第一道防线，**后端必须独立实现所有安全校验**。详见 `API_SECURITY_SPEC.md`

关键要求：
1. 所有API请求必须进行Token认证
2. 权限校验必须在后端执行，不能信任前端传递的角色标识
3. 用户ID必须从Token中获取，不能信任前端传递的userId
4. 所有用户输入必须进行XSS和SQL注入防护
5. 敏感信息（联系方式）必须脱敏返回，仅授权用户可查看完整信息
6. 实现请求限流防止API滥用

## 网络配置与环境切换

### 环境配置说明

项目支持三种运行环境，在 `utils/config.js` 中配置：

**当前环境**: 🟢 **`production`（生产环境）** - 已部署上线

```javascript
// utils/config.js
const CURRENT_ENV = 'production';  // ✅ 当前生产环境配置
```

### 环境模式说明

1. **production（生产环境）** - ✅ **当前使用中**
   - API地址：`https://aap.hnsgj.com/hdtj-api`
   - 连接生产环境后端服务
   - 已在微信公众平台配置合法域名
   - **用途**：正式发布运行
   - **注意**：任何对生产环境的修改都需谨慎测试

2. **development（开发环境）** - 仅用于本地开发
   - API地址：`http://localhost:8082`
   - 连接本地后端服务
   - **重要**：需在微信开发者工具中**禁用域名校验**（详情 > 本地设置 > 不校验合法域名）
   - **用途**：开发和测试阶段
   - **切换方式**：修改 `utils/config.js` 中 `CURRENT_ENV = 'development'`

3. **mock（Mock模式）** - ❌ **已禁用，仅供参考**
   - ~~使用本地假数据（`utils/mock.js`）~~
   - ~~无需后端服务，无需域名配置~~
   - **注意**: 项目已上线运行，**严禁使用 Mock 模式**
   - **用途**：仅作为历史参考，不得在开发中使用

### 环境切换流程

**从生产切换到开发环境**（仅用于本地调试）：
1. 修改 `utils/config.js`：`CURRENT_ENV = 'development'`
2. 确保本地后端服务正在运行（`http://localhost:8082`）
3. 在微信开发者工具中禁用域名校验
4. ⚠️ **完成调试后必须改回 `production`**

**从开发切换回生产环境**：
1. 修改 `utils/config.js`：`CURRENT_ENV = 'production'`
2. 提交代码前务必确认环境配置正确
3. 测试后再发布更新

### 域名校验设置

**生产环境**（当前）：
- 使用 HTTPS 域名：`https://aap.hnsgj.com/hdtj-api`
- 已在微信公众平台配置合法域名
- 真机和模拟器均可正常访问

**开发环境**（本地调试时）：
1. 打开微信开发者工具
2. 点击右上角"详情"按钮
3. 进入"本地设置"选项卡
4. ✅ 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"

### 常见网络错误解决

**错误：`request:fail url not in domain list`**

解决方案：
1. **生产环境**：确认 `utils/config.js` 中 `CURRENT_ENV = 'production'`
2. **开发环境**：在微信开发者工具中禁用域名校验（见上方设置）
3. ❌ **禁止**：切换到 Mock 模式

**错误：生产环境无法连接后端**

排查步骤：
1. 检查 `utils/config.js` 是否为 `production` 模式
2. 检查后端服务是否正常运行
3. 检查微信公众平台的服务器域名配置
4. 检查 HTTPS 证书是否有效

详细配置指南参见：`WECHAT_DEV_CONFIG.md`
