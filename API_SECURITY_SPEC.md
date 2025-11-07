# API 安全规范文档

## 📋 文档说明

本文档规定了 ActivityAssistant 项目后端 API 必须实现的安全规范和权限校验机制。前端已实现基础校验，但**后端必须对所有请求进行独立的权限和数据校验**，不能信任前端传递的任何数据。

---

## 🔐 1. 认证与授权机制

### 1.1 用户认证

**要求：所有API请求必须携带有效的认证Token**

```
请求头：
Authorization: Bearer {token}
```

**后端实现要点：**
- 使用 JWT 或类似机制生成 Token
- Token 应包含：用户ID、角色、过期时间等
- Token 过期时间建议：7天
- 刷新Token机制：提供 `/api/auth/refresh` 接口

### 1.2 权限级别定义

| 角色 | 说明 | 权限范围 |
|-----|------|---------|
| `user` | 普通用户 | 基本操作（报名、签到、查看公开活动） |
| `organizer` | 活动组织者 | 管理自己创建的活动 |
| `admin` | 活动管理员 | 协助管理指定活动 |
| `super_admin` | 超级管理员 | 管理所有活动和用户 |

---

## 🛡️ 2. 关键接口权限校验规范

### 2.1 活动管理接口

#### POST `/api/activities` - 创建活动

**权限要求：**
- 已登录用户

**后端校验：**
```javascript
// 1. 验证用户身份
if (!req.user || !req.user.id) {
  return res.status(401).json({ code: 401, message: '未登录' });
}

// 2. XSS过滤（使用后端库，如 xss-clean）
const sanitized = {
  title: sanitize(req.body.title),
  desc: sanitize(req.body.desc),
  place: sanitize(req.body.place)
};

// 3. 数据验证
if (!sanitized.title || sanitized.title.length < 2) {
  return res.status(400).json({ code: 400, message: '标题至少2个字符' });
}

// 4. 设置创建者为当前用户（不能信任前端传递的organizerId）
activity.organizerId = req.user.id;

// 5. 敏感字段服务端强制设置
activity.createdAt = new Date();
activity.status = 'pending'; // 初始状态由后端控制
```

#### PUT `/api/activities/:id` - 更新活动

**权限要求：**
- 活动创建者 OR 活动管理员 OR 超级管理员

**后端校验：**
```javascript
// 1. 查询活动
const activity = await Activity.findById(req.params.id);
if (!activity) {
  return res.status(404).json({ code: 404, message: '活动不存在' });
}

// 2. 权限校验（关键！）
const isCreator = activity.organizerId === req.user.id;
const isAdmin = activity.administrators.includes(req.user.id);
const isSuperAdmin = req.user.role === 'super_admin';

if (!isCreator && !isAdmin && !isSuperAdmin) {
  return res.status(403).json({ code: 403, message: '无权限编辑此活动' });
}

// 3. 限制可编辑字段
// 已有报名的活动，某些字段不允许修改
const hasRegistrations = activity.joined > 0;
if (hasRegistrations) {
  const restrictedFields = ['total', 'needReview', 'hasGroups'];
  restrictedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      delete req.body[field]; // 删除不允许修改的字段
    }
  });
}

// 4. 防止修改创建者
delete req.body.organizerId; // 创建者不可更改
```

#### DELETE `/api/activities/:id` - 删除活动

**权限要求：**
- 仅活动创建者 OR 超级管理员

**后端校验：**
```javascript
const activity = await Activity.findById(req.params.id);

const isCreator = activity.organizerId === req.user.id;
const isSuperAdmin = req.user.role === 'super_admin';

if (!isCreator && !isSuperAdmin) {
  return res.status(403).json({ code: 403, message: '仅创建者可删除活动' });
}

// 软删除（不实际删除数据库记录）
activity.isDeleted = true;
activity.deletedAt = new Date();
await activity.save();
```

### 2.2 报名管理接口

#### POST `/api/registrations` - 提交报名

**权限要求：**
- 已登录用户

**后端校验：**
```javascript
// 1. 验证活动是否存在
const activity = await Activity.findById(req.body.activityId);
if (!activity || activity.isDeleted) {
  return res.status(404).json({ code: 404, message: '活动不存在' });
}

// 2. 权限校验：私密活动需要验证访问权限
if (!activity.isPublic) {
  const hasPermission = await checkActivityViewPermission(
    activity,
    req.user.id,
    req.query.fromShare
  );
  if (!hasPermission) {
    return res.status(403).json({ code: 403, message: '无权查看此私密活动' });
  }
}

// 3. 验证是否在报名期限内
const now = new Date();
if (now > new Date(activity.registerDeadline)) {
  return res.status(400).json({ code: 400, message: '报名已截止' });
}

// 4. 验证是否已满员
if (activity.joined >= activity.total) {
  return res.status(400).json({ code: 400, message: '活动已满员' });
}

// 5. 防止重复报名
const existingReg = await Registration.findOne({
  activityId: req.body.activityId,
  userId: req.user.id,
  status: { $ne: 'cancelled' }
});
if (existingReg) {
  return res.status(400).json({ code: 400, message: '您已报名，请勿重复报名' });
}

// 6. 黑名单校验
if (activity.blacklist && activity.blacklist.includes(req.user.id)) {
  return res.status(403).json({ code: 403, message: '您已被加入黑名单，无法报名' });
}

// 7. 白名单自动通过
let status = activity.needReview ? 'pending' : 'approved';
if (activity.whitelist && activity.whitelist.includes(req.user.id)) {
  status = 'approved';
}

// 8. 设置用户ID（不能信任前端传递的userId）
registration.userId = req.user.id;
registration.status = status;
```

#### PUT `/api/registrations/:id/approve` - 审核报名

**权限要求：**
- 活动创建者 OR 活动管理员

**后端校验：**
```javascript
const registration = await Registration.findById(req.params.id);
if (!registration) {
  return res.status(404).json({ code: 404, message: '报名记录不存在' });
}

const activity = await Activity.findById(registration.activityId);

// 权限校验
const isCreator = activity.organizerId === req.user.id;
const isAdmin = activity.administrators.includes(req.user.id);

if (!isCreator && !isAdmin) {
  return res.status(403).json({ code: 403, message: '无权限审核报名' });
}

// 更新状态
registration.status = req.body.approved ? 'approved' : 'rejected';
registration.reviewedBy = req.user.id;
registration.reviewedAt = new Date();
await registration.save();
```

### 2.3 签到接口

#### POST `/api/checkins` - 提交签到

**权限要求：**
- 已登录用户
- 必须已报名且审核通过

**后端校验：**
```javascript
// 1. 验证用户是否已报名
const registration = await Registration.findOne({
  activityId: req.body.activityId,
  userId: req.user.id,
  status: 'approved'
});

if (!registration) {
  return res.status(403).json({ code: 403, message: '您未报名此活动' });
}

// 2. 验证是否在签到时间窗口内
const activity = await Activity.findById(req.body.activityId);
const now = new Date();
const startTime = new Date(activity.startTime);
const timeWindow = 30 * 60 * 1000; // 30分钟

if (Math.abs(now - startTime) > timeWindow) {
  return res.status(400).json({ code: 400, message: '不在签到时间范围内' });
}

// 3. 防止重复签到
const existingCheckin = await Checkin.findOne({
  activityId: req.body.activityId,
  userId: req.user.id
});

if (existingCheckin) {
  return res.status(400).json({ code: 400, message: '您已签到' });
}

// 4. GPS位置验证（服务端强制验证）
const distance = calculateDistance(
  req.body.latitude,
  req.body.longitude,
  activity.latitude,
  activity.longitude
);

if (distance > activity.checkinRadius) {
  // 记录异常签到
  checkin.isValid = false;
  checkin.distance = distance;
  checkin.note = '距离超出签到范围';
}

// 5. 设置用户ID
checkin.userId = req.user.id;
checkin.checkinTime = new Date();
```

---

## 🔒 3. 数据安全规范

### 3.1 输入验证和清理

**所有用户输入必须进行以下处理：**

1. **XSS防护**
   ```javascript
   const xss = require('xss-clean');
   app.use(xss());
   ```

2. **SQL/NoSQL注入防护**
   ```javascript
   // 使用参数化查询
   const user = await User.findOne({ phone: req.body.phone }); // ✅ 正确
   // 避免字符串拼接
   const user = await User.findOne(`phone = ${req.body.phone}`); // ❌ 错误
   ```

3. **长度限制**
   ```javascript
   const limits = {
     title: 50,
     desc: 500,
     name: 20,
     mobile: 11,
     address: 200
   };
   ```

4. **类型验证**
   ```javascript
   // 使用 joi 或类似库
   const schema = Joi.object({
     title: Joi.string().min(2).max(50).required(),
     total: Joi.number().integer().min(1).max(10000).required()
   });
   ```

### 3.2 敏感信息保护

**后端必须实现的保护措施：**

1. **联系方式脱敏**
   ```javascript
   // 返回给前端时脱敏
   activity.organizerPhone = maskPhone(activity.organizerPhone);
   activity.organizerWechat = maskWechat(activity.organizerWechat);

   // 仅有权限的用户可以查看完整信息
   if (isCreator || isAdmin || hasRegistered) {
     activity.organizerPhone = activity._organizerPhone; // 原始值
   }

   function maskPhone(phone) {
     if (!phone || phone.length < 11) return phone;
     return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
   }
   ```

2. **用户隐私**
   ```javascript
   // 报名列表中不显示手机号
   registrations.forEach(reg => {
     delete reg.mobile; // 或脱敏
     delete reg.idCard;
     delete reg.address;
   });
   ```

3. **Token安全**
   ```javascript
   // Token存储在httpOnly cookie中（推荐）
   res.cookie('token', token, {
     httpOnly: true,
     secure: true, // 仅HTTPS
     sameSite: 'strict',
     maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
   });
   ```

### 3.3 Rate Limiting（请求限流）

**防止API滥用：**

```javascript
const rateLimit = require('express-rate-limit');

// 通用限流
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 最多100次请求
});

// 敏感操作限流
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5 // 登录最多5次
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
```

---

## 📝 4. API响应规范

### 4.1 统一响应格式

```javascript
// 成功响应
{
  "code": 0,
  "data": { ... },
  "message": "success"
}

// 错误响应
{
  "code": 400,
  "data": null,
  "message": "错误描述",
  "errors": ["具体错误1", "具体错误2"] // 可选
}
```

### 4.2 HTTP状态码规范

| 状态码 | 说明 | 使用场景 |
|-------|------|---------|
| 200 | 成功 | 请求处理成功 |
| 201 | 已创建 | 资源创建成功 |
| 400 | 请求错误 | 参数验证失败 |
| 401 | 未认证 | Token无效或过期 |
| 403 | 无权限 | 权限不足 |
| 404 | 未找到 | 资源不存在 |
| 409 | 冲突 | 重复操作（如重复报名） |
| 429 | 请求过多 | 触发限流 |
| 500 | 服务器错误 | 内部错误 |

---

## 🧪 5. 安全测试检查清单

后端开发完成后，必须通过以下安全测试：

- [ ] **认证测试**：未登录用户无法访问需要认证的接口
- [ ] **权限测试**：普通用户无法访问管理员接口
- [ ] **XSS测试**：输入 `<script>alert('XSS')</script>` 后是否被转义
- [ ] **SQL注入测试**：输入 `' OR '1'='1` 后是否被拦截
- [ ] **CSRF测试**：是否有CSRF Token验证
- [ ] **重复提交测试**：快速连续点击按钮，是否产生多条记录
- [ ] **越权测试**：用户A是否能修改用户B的数据
- [ ] **敏感信息测试**：非授权用户是否能看到脱敏后的联系方式
- [ ] **限流测试**：短时间大量请求是否被限制

---

## 🚨 6. 关键安全警告

### ⚠️ 绝对禁止的操作

1. **禁止信任前端传递的用户ID**
   ```javascript
   // ❌ 错误：直接使用前端传递的userId
   const userId = req.body.userId;

   // ✅ 正确：从Token中获取
   const userId = req.user.id;
   ```

2. **禁止在前端校验权限后直接操作**
   ```javascript
   // ❌ 错误：前端已校验权限，后端不再校验
   if (req.body.isAdmin) { // 前端传递的isAdmin标识
     // 执行管理员操作
   }

   // ✅ 正确：后端独立校验
   const user = await User.findById(req.user.id);
   if (user.role === 'admin') {
     // 执行管理员操作
   }
   ```

3. **禁止返回敏感信息**
   ```javascript
   // ❌ 错误：返回用户密码字段
   const user = await User.findById(id);
   res.json({ code: 0, data: user }); // user包含password字段

   // ✅ 正确：排除敏感字段
   const user = await User.findById(id).select('-password -salt');
   res.json({ code: 0, data: user });
   ```

---

## 📚 7. 推荐的安全库和工具

```json
{
  "dependencies": {
    "express-rate-limit": "^6.7.0",    // 请求限流
    "helmet": "^7.0.0",                 // 安全HTTP头
    "xss-clean": "^0.1.1",              // XSS防护
    "express-validator": "^7.0.1",      // 输入验证
    "joi": "^17.9.0",                   // 数据验证
    "bcrypt": "^5.1.0",                 // 密码加密
    "jsonwebtoken": "^9.0.0",           // JWT认证
    "cors": "^2.8.5"                    // CORS配置
  }
}
```

---

## 📞 联系与反馈

如有安全问题或疑问，请联系技术负责人。

**最后更新**: 2025-01-XX
**文档版本**: v1.0
