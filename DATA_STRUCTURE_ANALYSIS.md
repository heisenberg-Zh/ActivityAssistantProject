# 前后端数据结构对比分析

## 🔍 发现的问题

### 1. 活动模块（Activity）

#### ❌ 字段名不匹配

| 功能 | 前端字段 | 后端字段 | 问题 |
|------|---------|----------|------|
| 活动描述 | `desc` | `description` | **字段名不一致** |

#### ⚠️ 前端独有字段（Mock数据中存在，但后端未返回）

| 字段 | 说明 | 影响 |
|------|------|------|
| `banner` | 横幅颜色（如'blue'） | 前端UI展示可能异常 |
| `tags` | 标签数组 | 无法显示活动标签 |
| `requirements` | 活动要求说明 | 缺失活动要求信息 |
| `date` | 格式化日期字符串（如'12月23日 19:00'） | 需要前端手动格式化 |
| `timeRange` | 时间范围字符串（如'12月23日 19:00-22:00'） | 需要前端手动格式化 |
| `hasGroups` | 是否有分组（布尔值） | 后端有groups字段，但需解析JSON |
| `recurringGroupId` | 周期性活动组ID | 后端缺失此字段 |

#### ✅ 后端独有字段（额外提供）

| 字段 | 说明 | 价值 |
|------|------|------|
| `organizerAvatar` | 组织者头像 | 增强UI展示 |
| `administrators` | 管理员列表（JSON） | 权限管理 |
| `updatedAt` | 更新时间 | 数据追踪 |
| `isOrganizer` | 当前用户是否为组织者 | 前端权限判断 |
| `isAdmin` | 当前用户是否为管理员 | 前端权限判断 |
| `isRegistered` | 当前用户是否已报名 | 前端状态判断 |

#### 📅 日期时间格式差异

- **后端**: `LocalDateTime` 类型（如 `2025-12-23T19:00:00`）
- **前端**: 字符串（如 `'2025-12-23 19:00'`）
- **影响**: 需要前端解析和格式化

---

### 2. 报名模块（Registration）

**待检查**：需要对比 `RegistrationVO` 和前端Mock数据

---

### 3. 签到模块（Checkin）

**待检查**：需要对比 `CheckinVO` 和前端Mock数据

---

### 4. 统计模块（Statistics）

**待检查**：需要对比统计VO和前端期望格式

---

## 🛠️ 修复方案

### 方案一：修改后端（推荐）✅

**优点**：前端代码无需大改，兼容现有Mock数据
**缺点**：需要修改后端代码和数据库

#### 需要修改的地方：

1. **ActivityVO** 添加别名或新增字段：
   ```java
   @JsonProperty("desc")
   public String getDescription() {
       return description;
   }
   ```

2. **添加衍生字段**：
   - `date`: 从 `startTime` 格式化得到
   - `timeRange`: 从 `startTime` 和 `endTime` 计算
   - `hasGroups`: 解析 `groups` JSON判断
   - `tags`: 新增字段或从其他数据衍生

3. **添加缺失字段**：
   - `banner`: 活动横幅颜色
   - `requirements`: 活动要求说明
   - `recurringGroupId`: 周期性活动组ID

---

### 方案二：修改前端（备选）

**优点**：后端保持RESTful规范
**缺点**：需要修改多处前端代码

#### 需要修改的地方：

1. 更新 `utils/mock.js` 中的字段名
2. 更新所有使用 `activity.desc` 的页面
3. 添加日期格式化工具函数
4. 更新页面中的字段引用

---

### 方案三：中间层适配（最佳）⭐

**优点**：解耦前后端，灵活适配
**缺点**：增加一层转换逻辑

#### 实现方式：

在 `utils/api.js` 的 `request` 函数中添加数据转换层：

```javascript
// 响应数据转换
function transformResponse(data, url) {
  // 如果是活动相关接口，转换字段
  if (url.includes('/api/activities')) {
    if (Array.isArray(data)) {
      return data.map(transformActivity);
    } else if (data.id) {
      return transformActivity(data);
    }
  }
  return data;
}

function transformActivity(activity) {
  return {
    ...activity,
    // 添加前端需要的字段
    desc: activity.description,
    date: formatDate(activity.startTime),
    timeRange: formatTimeRange(activity.startTime, activity.endTime),
    hasGroups: !!activity.groups && activity.groups !== '[]',
    // 保留后端字段，向前兼容
    description: activity.description
  };
}
```

---

## 📊 测试建议

### 测试用例

1. **获取活动列表**
   - 验证字段名是否正确
   - 验证日期格式是否可解析
   - 验证必需字段是否存在

2. **创建活动**
   - 验证前端发送的字段名后端是否识别
   - 验证日期格式后端是否可解析

3. **获取活动详情**
   - 验证完整字段是否返回
   - 验证JSON字段是否可解析

---

## 🎯 优先级

| 问题 | 优先级 | 影响范围 |
|------|--------|----------|
| `desc` vs `description` 字段名不匹配 | 🔴 高 | 所有活动展示页面 |
| 日期格式化问题 | 🟡 中 | 活动列表、详情、创建 |
| 缺失 `tags`、`requirements` 字段 | 🟢 低 | 活动详情页部分功能 |
| 缺失 `banner` 字段 | 🟢 低 | UI美化功能 |

---

## ✅ 下一步行动

1. ☐ 实现中间层适配方案（推荐）
2. ☐ 测试活动列表、详情、创建功能
3. ☐ 检查报名、签到、统计模块的数据结构
4. ☐ 生成完整的字段映射文档
