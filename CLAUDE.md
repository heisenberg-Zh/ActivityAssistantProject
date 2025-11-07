# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

ActivityAssistant 是一个微信小程序活动管理系统，帮助用户创建、管理和参与各类社交活动。项目使用微信小程序原生开发，目前实现了前端界面和基于假数据的交互逻辑。

**项目状态**: 前端 v1 版本已完成，待接入后端 API

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
│   └── settings/       # 设置
├── utils/              # 工具函数
│   └── mock.js        # 假数据定义
├── ui-html/           # HTML 原型文件 (设计参考)
├── app.js             # 小程序入口
├── app.json           # 小程序配置
└── app.wxss           # 全局样式
```

### TabBar 结构
小程序底部导航栏包含 4 个主入口:
1. **首页** (`pages/home/index`) - 活动浏览、分类筛选、快捷入口
2. **活动** (`pages/activities/list`) - 活动列表、搜索和筛选
3. **统计** (`pages/statistics/index`) - 数据统计和可视化
4. **我的** (`pages/profile/index`) - 个人中心、设置

**注意**: 活动详情页 (`pages/activities/detail`) 不使用 tabBar，底部显示"分享"和"报名"操作按钮

### 数据流
- **假数据源**: `utils/mock.js` 提供活动列表和用户数据
- **页面数据**: 各页面从 mock.js 引入假数据模拟交互
- **状态管理**: 使用 Page.data 和 setData 管理页面状态

### 核心页面交互流程

#### 活动创建流程
1. 用户在首页点击"创建活动"按钮
2. 跳转至 `pages/activities/create` 分步骤表单
3. 填写活动信息 (基本信息 → 时间 → 地点 → 人数 → 其他设置 → 自定义字段)
4. 支持保存草稿、复制活动、实时预览
5. 发布后生成分享链接

#### 报名流程
1. 用户浏览活动列表或详情
2. 点击"报名"按钮跳转至 `pages/registration/index`
3. 填写姓名、手机号等自定义字段
4. 提交报名 (本地模拟反馈)

#### 签到流程
1. 用户进入活动详情页点击"签到"
2. 跳转至 `pages/checkin/index`
3. 获取 GPS 位置并验证签到范围
4. 记录签到时间和位置

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

## 待实现功能

### 后端集成
- 接入真实后端 API (活动 CRUD、报名、签到、统计)
- 实现微信登录鉴权和用户信息存储
- 替换 `utils/mock.js` 中的假数据为真实 API 调用
- **用户反馈 API**：提交用户的帮助与反馈内容到后端（`pages/profile/index.js:submitFeedback` 方法）
- **收藏功能 API**：
  - 同步用户收藏数据到服务器（目前使用本地存储 `wx.setStorageSync`）
  - 收藏列表云端同步，支持跨设备访问
  - 相关文件：`pages/favorites/index.js`、`pages/activities/detail.js:toggleFavorite`

### 功能增强
- 微信群内接龙报名功能
- 位置签到的防作弊机制
- 报名审核流程
- 消息通知和提醒

### 优化任务
- 真机/多机型样式适配细化
- 组件化抽取 (活动卡片、徽标、顶部条等)
- 样式变量统一管理
- 国际化和深色模式支持

## 开发注意事项

### 页面导航
- 使用 `wx.navigateTo` 跳转普通页面
- tabBar 页面之间使用 `wx.switchTab`
- 传递参数使用 URL query string 格式: `?id=${id}`

### 数据获取
在接入真实 API 前，所有数据从 `utils/mock.js` 获取:
```javascript
const { activities, participants } = require('../../utils/mock.js');
```

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
