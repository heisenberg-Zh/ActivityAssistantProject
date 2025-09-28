# ActivityAssistant 小程序前端

本目录已完成微信小程序前端结构与主要页面，基于 `ui-html/` 原型转为 WXML/WXSS 并以假数据联通基本交互。

## 快速开始
- 打开微信开发者工具，选择“导入项目”，项目路径选此目录。
- 使用 `project.config.json` 中的 `appid`（可按需替换为你的测试 AppID）。
- 启动后默认进入 `首页`（tabBar）。

## 主要页面
- 首页：`pages/home/index`
- 活动列表：`pages/activities/list`
- 活动详情：`pages/activities/detail`
- 创建活动：`pages/activities/create`
- 报名：`pages/registration/index`
- 签到：`pages/checkin/index`
- 数据统计：`pages/statistics/index`（tabBar）
- 个人中心：`pages/profile/index`（tabBar）
- 我的活动：`pages/my-activities/index`
- 消息中心：`pages/messages/index`
- 设置：`pages/settings/index`

## 数据与资源
- 假数据：`utils/mock.js`
- 头像资源：根目录下 `activityassistant_avatar_*.png`

## 已实现
- 原型主要布局与样式的等价替换（不依赖 Tailwind/FontAwesome）
- 基础导航与 tabBar
- 列表/详情/报名/签到/统计/个人中心/消息/设置页面
- 报名表单的基础校验与提交反馈（本地模拟）
- 分享/跳转等基础交互

## 待扩展
- 接入真实后端 API（活动列表/详情/报名/签到/统计）
- 登录鉴权与用户信息存储（微信登录）
- 真机/多机型样式适配细化
- 组件化抽取（活动卡片、徽标、顶部条等）与样式变量
- 国际化与深色模式

