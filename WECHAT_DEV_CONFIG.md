# 微信小程序开发配置指南

## 问题：request:fail url not in domain list

### 错误原因

微信小程序出于安全考虑，默认只允许访问已在**微信公众平台**配置的合法域名（HTTPS）。

在开发阶段，后端服务通常运行在本地（如 `http://localhost:8082`），但该地址不在微信的域名白名单中，导致网络请求失败。

---

## 解决方案

### 方案一：配置微信开发者工具（推荐 ✅）

**适用场景**：本地开发、调试

**操作步骤**：

1. 打开**微信开发者工具**
2. 点击右上角 **"详情"** 按钮
3. 进入 **"本地设置"** 标签页
4. 勾选以下选项：
   ```
   ☑ 不校验合法域名、web-view(业务域名)、TLS 版本以及 HTTPS 证书
   ```

5. 重新编译小程序

**注意事项**：
- ⚠️ 此设置**仅在开发者工具中生效**
- 真机预览/正式版需要配置合法域名
- 每次打开项目可能需要重新勾选

---

### 方案二：切换到 Mock 模式

**适用场景**：后端未准备好、离线开发

**操作步骤**：

1. 打开 `utils/config.js` 文件
2. 修改 `CURRENT_ENV` 为 `'mock'`：
   ```javascript
   const CURRENT_ENV = 'mock'; // 使用假数据
   ```
3. 保存并重新编译

**特点**：
- ✅ 无需后端服务
- ✅ 无需配置域名
- ⚠️ 使用 `utils/mock.js` 中的假数据

---

### 方案三：配置生产域名（正式发布）

**适用场景**：真机预览、正式发布

**操作步骤**：

1. **准备 HTTPS 域名**
   - 购买域名并配置 SSL 证书
   - 后端服务部署到该域名（必须是 HTTPS）

2. **在微信公众平台配置**
   - 登录 [微信公众平台](https://mp.weixin.qq.com/)
   - 进入 **开发 > 开发管理 > 开发设置**
   - 在 **服务器域名** 中添加：
     ```
     request 合法域名: https://your-domain.com
     ```

3. **修改小程序配置**
   - 打开 `utils/config.js`
   - 修改生产环境域名：
     ```javascript
     production: {
       baseUrl: 'https://your-domain.com',  // 替换为实际域名
       useMock: false
     }
     ```
   - 修改 `CURRENT_ENV` 为 `'production'`：
     ```javascript
     const CURRENT_ENV = 'production';
     ```

---

## 环境配置说明

项目支持三种运行环境，可在 `utils/config.js` 中切换：

### 1. development（开发环境）⭐ 默认

```javascript
const CURRENT_ENV = 'development';
```

**特点**：
- API地址：`http://localhost:8082`
- 需要本地后端服务运行
- 需要在开发者工具中**禁用域名校验**

---

### 2. production（生产环境）

```javascript
const CURRENT_ENV = 'production';
```

**特点**：
- API地址：`https://your-domain.com`（需替换为实际域名）
- 需要在微信公众平台配置合法域名
- 适用于真机预览和正式发布

---

### 3. mock（Mock模式）

```javascript
const CURRENT_ENV = 'mock';
```

**特点**：
- 使用本地假数据（`utils/mock.js`）
- 无需后端服务
- 无需域名配置
- 适合前端独立开发

---

## 快速切换环境

修改 `utils/config.js` 第 11 行：

```javascript
// 开发环境（本地后端）
const CURRENT_ENV = 'development';

// Mock模式（假数据）
const CURRENT_ENV = 'mock';

// 生产环境（线上后端）
const CURRENT_ENV = 'production';
```

保存后重新编译即可。

---

## 调试技巧

### 查看当前环境

小程序启动时，控制台会输出环境信息：

```
====== 环境配置 ======
当前环境: development
API地址: http://localhost:8082
使用Mock: false
环境说明: 开发环境（需在微信开发者工具中禁用域名校验）
====================
```

### 常见错误

| 错误信息 | 原因 | 解决方案 |
|---------|------|----------|
| `request:fail url not in domain list` | 未配置域名白名单 | 方案一：禁用域名校验<br>方案二：切换到 Mock 模式 |
| `request:fail -1:net::ERR_CONNECTION_REFUSED` | 后端服务未启动 | 启动后端服务或切换到 Mock 模式 |
| `request:fail timeout` | 请求超时 | 检查网络连接和后端服务状态 |

---

## 推荐开发流程

### 阶段一：前端开发（Mock 模式）

```javascript
const CURRENT_ENV = 'mock';
```

- 使用假数据进行前端开发
- 无需后端支持

### 阶段二：联调开发（Development 模式）

```javascript
const CURRENT_ENV = 'development';
```

1. 启动本地后端服务（`http://localhost:8082`）
2. 在微信开发者工具中**禁用域名校验**
3. 前后端联调

### 阶段三：真机测试（Production 模式）

```javascript
const CURRENT_ENV = 'production';
```

1. 后端部署到 HTTPS 域名
2. 在微信公众平台配置合法域名
3. 真机预览测试

---

## 相关文档

- [微信小程序官方文档 - 网络请求](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html)
- [项目后端启动指南](backend/docs/BACKEND_STARTUP_GUIDE.md)
- [API 安全规范](API_SECURITY_SPEC.md)

---

## 常见问题 FAQ

**Q: 为什么每次打开项目都要重新勾选"不校验合法域名"？**
A: 这是微信开发者工具的安全机制，建议每次启动项目时检查该选项。

**Q: 真机预览时无法访问 localhost 怎么办？**
A: 真机无法访问本地服务，需要切换到生产环境或使用 Mock 模式。

**Q: 如何快速在 Mock 和真实 API 之间切换？**
A: 修改 `utils/config.js` 中的 `CURRENT_ENV` 变量即可。

**Q: 生产环境必须使用 HTTPS 吗？**
A: 是的，微信小程序强制要求使用 HTTPS 协议。
