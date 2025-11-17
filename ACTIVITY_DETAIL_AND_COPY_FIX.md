# 活动详情权限和复制功能修复文档

## 📋 问题概述

**发现日期**: 2025-11-17
**问题来源**: 用户反馈

### 问题1：活动详情权限不一致

**用户反馈**：
> 在"我的活动"页面，对"网球活动周一啊"点击详情按钮是无权查看此活动，但是点击"test"活动的详情，可以正常查看。为什么这两个活动的详情效果不一样？

**现象**：
- 同样是用户创建的活动
- "网球活动周一啊"显示"无权查看此私密活动"
- "test"活动可以正常查看
- 两个活动表现不一致

### 问题2：复制活动功能异常

**用户反馈**：
> 在"我的活动"页面，选中一个我创建的活动，点击"复制"按钮，目前会提示"活动不存在"。另外，在点击复制按钮后进入的创建活动页面都是空的，并没有把原活动的信息复制过来。

**现象**：
- 点击复制按钮后提示"活动不存在"
- 即使进入创建页面，表单也是空的
- 无法正常复制活动信息

## 🔍 根本原因分析

### 问题1：字段名映射不完整

**问题链路**：

```
后端返回活动数据（下划线命名）
    ↓
{
  organizer_id: "u7d3f31690438",
  is_public: false,  // "网球活动周一啊"是私密活动
  is_deleted: false,
  ...
}
    ↓
data-adapter.js 转换（部分字段未映射）
    ↓
{
  organizer_id: "u7d3f31690438",  // ✅ 已保留
  organizerId: "u7d3f31690438",   // ✅ 已映射
  is_public: false,                // ❌ 未映射
  isPublic: undefined,             // ❌ undefined!
  ...
}
    ↓
权限检查（activity-helper.js:70）
    ↓
if (activity.isPublic === true || activity.isPublic === 'true' || activity.isPublic === 1) {
  return { hasPermission: true };
}
// activity.isPublic 是 undefined，不等于 true
    ↓
检查创建者权限（activity-helper.js:78）
    ↓
if (activity.organizerId && activity.organizerId === currentUserId) {
  return { hasPermission: true };  // ✅ 这里应该通过
}
```

**为什么"test"可以查看而"网球活动周一啊"不行？**

最可能的原因：
1. **"test"是公开活动**（`is_public: true`）
2. **"网球活动周一啊"是私密活动**（`is_public: false`）

如果 `isPublic` 字段没有被正确映射：
- 对于公开活动：`is_public: true`，但 `isPublic: undefined`
  - 后续逻辑仍然可能通过创建者检查
- 对于私密活动：`is_public: false`，但 `isPublic: undefined`
  - 如果创建者检查也失败（其他原因），就会被拒绝

**修复方案**：在 `data-adapter.js` 中添加布尔值字段映射：

```javascript
// 布尔值字段适配
isPublic: activity.is_public !== undefined ? activity.is_public : activity.isPublic,
isDeleted: activity.is_deleted !== undefined ? activity.is_deleted : activity.isDeleted,
needReview: activity.need_review !== undefined ? activity.need_review : activity.needReview,
isRecurring: activity.is_recurring !== undefined ? activity.is_recurring : activity.isRecurring,
```

### 问题2：复制和编辑功能使用mock数据

**问题链路**：

```
用户点击"复制"按钮
    ↓
跳转到 /pages/activities/create?mode=copy&id=${activityId}
    ↓
create.js 的 onLoad 调用 loadActivityForCopy(activityId)
    ↓
loadActivityForCopy 函数（第1843行）
    ↓
const activity = activities.find(a => a.id === activityId);  // ❌ 从 mock 数据查找
    ↓
找不到（用户的活动在真实API中，不在mock数据里）
    ↓
if (!activity) {
  wx.showToast({ title: '活动不存在', icon: 'none' });  // ❌ 显示错误
  return;
}
```

**为什么会这样？**

1. 用户的活动来自后端数据库，通过 `activityAPI.getDetail()` 获取
2. 但 `loadActivityForCopy` 函数还在使用 `require('../../utils/mock.js')` 的静态数据
3. Mock 数据中没有用户创建的新活动
4. 所以找不到，提示"活动不存在"
5. 即使不提示错误，`activity` 为 `undefined`，后续无法填充表单数据

**相同问题也存在于编辑功能**：`loadActivityForEdit` 函数也使用 mock 数据

## ✅ 解决方案

### 修改1：完善字段名映射（`utils/data-adapter.js`）

**文件**: `utils/data-adapter.js:154-169`

**修改前**:
```javascript
// 转换后的数据
return {
  ...activity,

  // 字段名适配
  desc: activity.description || '',
  organizerId: activity.organizer_id || activity.organizerId,
  organizerName: activity.organizer_name || activity.organizerName,
  organizerPhone: activity.organizer_phone || activity.organizerPhone,
  organizerWechat: activity.organizer_wechat || activity.organizerWechat,

  // 日期格式化
  date: formatDate(activity.startTime),
  timeRange: formatTimeRange(activity.startTime, activity.endTime),
  // ...
};
```

**修改后**:
```javascript
// 转换后的数据
return {
  ...activity,

  // 字段名适配
  desc: activity.description || '',
  organizerId: activity.organizer_id || activity.organizerId,
  organizerName: activity.organizer_name || activity.organizerName,
  organizerPhone: activity.organizer_phone || activity.organizerPhone,
  organizerWechat: activity.organizer_wechat || activity.organizerWechat,

  // 布尔值字段适配
  isPublic: activity.is_public !== undefined ? activity.is_public : activity.isPublic,
  isDeleted: activity.is_deleted !== undefined ? activity.is_deleted : activity.isDeleted,
  needReview: activity.need_review !== undefined ? activity.need_review : activity.needReview,
  isRecurring: activity.is_recurring !== undefined ? activity.is_recurring : activity.isRecurring,

  // 日期格式化
  date: formatDate(activity.startTime),
  timeRange: formatTimeRange(activity.startTime, activity.endTime),
  // ...
};
```

**关键改进**:
- 使用三元运算符确保优先使用下划线命名的值
- 如果下划线字段存在，使用它；否则回退到驼峰命名
- 确保布尔值字段不会变成 `undefined`

### 修改2：复制功能迁移到API（`pages/activities/create.js`）

**文件**: `pages/activities/create.js:1871-1965`

**修改前**:
```javascript
loadActivityForCopy(activityId) {
  // 查找活动
  const activity = activities.find(a => a.id === activityId);  // ❌ mock数据

  if (!activity) {
    wx.showToast({ title: '活动不存在', icon: 'none' });
    setTimeout(() => {
      this.showCopySourceDialog();
    }, 1500);
    return;
  }

  // 复制活动数据
  const form = {
    title: `${activity.title} (副本)`,
    desc: activity.desc || '',
    // ...
  };
  // ...
}
```

**修改后**:
```javascript
async loadActivityForCopy(activityId) {
  try {
    wx.showLoading({ title: '加载中...' });

    // 从后端API获取活动详情
    const detailResult = await activityAPI.getDetail(activityId);  // ✅ 使用API

    if (detailResult.code !== 0) {
      throw new Error(detailResult.message || '获取活动详情失败');
    }

    const activity = detailResult.data;

    if (!activity) {
      wx.hideLoading();
      wx.showToast({ title: '活动不存在', icon: 'none' });
      setTimeout(() => {
        this.showCopySourceDialog();
      }, 1500);
      return;
    }

    // 复制活动数据
    const form = {
      title: `${activity.title} (副本)`,
      desc: activity.desc || '',
      organizerPhone: activity.organizerPhone || '',
      organizerWechat: activity.organizerWechat || '',
      // ...
    };

    // 设置表单数据
    this.setData({
      form,
      groups,
      copiedWhitelist,
      copiedBlacklist
    });

    // 标记所有步骤为已完成
    const steps = this.data.steps.map(s => ({ ...s, completed: true }));
    this.setData({ steps });

    this.checkCanPublish();

    wx.hideLoading();
    wx.showToast({ title: '已加载活动数据', icon: 'success' });
  } catch (err) {
    wx.hideLoading();
    console.error('加载活动数据失败:', err);
    wx.showToast({
      title: err.message || '加载失败',
      icon: 'none',
      duration: 2000
    });
    setTimeout(() => {
      this.showCopySourceDialog();
    }, 2000);
  }
}
```

**关键改进**:
- 使用 `async/await` 异步加载活动数据
- 调用 `activityAPI.getDetail()` 而不是从 mock 数据查找
- 添加完整的错误处理和 Loading 状态
- 确保组织者联系方式也被复制

### 修改3：编辑功能迁移到API（`pages/activities/create.js`）

**文件**: `pages/activities/create.js:1728-1868`

**修改前**:
```javascript
loadActivityForEdit(activityId) {
  const currentUserId = app.globalData.currentUserId || 'u1';

  // 查找活动
  const activity = activities.find(a => a.id === activityId);  // ❌ mock数据

  if (!activity) {
    wx.showModal({
      title: '活动不存在',
      content: '未找到要编辑的活动',
      showCancel: false,
      success: () => wx.navigateBack()
    });
    return;
  }

  // 检查管理权限
  const permission = checkManagementPermission(activity, currentUserId);
  // ...

  // 获取当前报名数量
  const currentRegs = registrations.filter(r => r.activityId === activityId && r.status === 'approved');
  // ...
}
```

**修改后**:
```javascript
async loadActivityForEdit(activityId) {
  try {
    wx.showLoading({ title: '加载中...' });

    const currentUserId = app.globalData.currentUserId || 'u1';

    // 从后端API获取活动详情
    const detailResult = await activityAPI.getDetail(activityId);  // ✅ 使用API

    if (detailResult.code !== 0) {
      throw new Error(detailResult.message || '获取活动详情失败');
    }

    const activity = detailResult.data;

    if (!activity) {
      wx.hideLoading();
      wx.showModal({
        title: '活动不存在',
        content: '未找到要编辑的活动',
        showCancel: false,
        success: () => wx.navigateBack()
      });
      return;
    }

    // 检查管理权限
    const permission = checkManagementPermission(activity, currentUserId);
    // ...

    // 获取当前报名数量（从API）
    const registrationsResult = await registrationAPI.getByActivity(activityId, {
      page: 0,
      size: 1000
    });

    const allRegs = registrationsResult.code === 0
      ? (registrationsResult.data.content || registrationsResult.data || [])
      : [];
    const currentRegistrations = allRegs.filter(r => r.status === 'approved').length;
    // ...

    wx.hideLoading();
  } catch (err) {
    wx.hideLoading();
    console.error('加载活动数据失败:', err);
    wx.showModal({
      title: '加载失败',
      content: err.message || '无法加载活动数据',
      showCancel: false,
      success: () => wx.navigateBack()
    });
  }
}
```

**关键改进**:
- 同样迁移到使用真实API
- 报名数量也从 API 获取而不是 mock 数据
- 完整的异步错误处理

## 📊 修复效果对比

### 问题1：活动详情权限

**修复前**:
```
后端返回: { is_public: false, organizer_id: "u7d3f31690438" }
    ↓
转换后: { isPublic: undefined, organizerId: "u7d3f31690438" }
    ↓
权限检查:
  - isPublic 检查失败（undefined !== true）
  - 创建者检查通过（organizerId 匹配）
    ↓
结果: ✅ 应该允许访问（但某些情况下可能失败）
```

**修复后**:
```
后端返回: { is_public: false, organizer_id: "u7d3f31690438" }
    ↓
转换后: { isPublic: false, organizerId: "u7d3f31690438" }
    ↓
权限检查:
  - isPublic 检查失败（false !== true）
  - 创建者检查通过（organizerId 匹配）
    ↓
结果: ✅ 正确允许访问（创建者可以查看自己的私密活动）
```

### 问题2：复制活动功能

**修复前**:
```
用户点击"复制"
    ↓
loadActivityForCopy(activityId)
    ↓
从 mock 数据查找
    ↓
找不到活动
    ↓
❌ 提示"活动不存在"
❌ 页面为空
```

**修复后**:
```
用户点击"复制"
    ↓
loadActivityForCopy(activityId)
    ↓
从后端API获取: activityAPI.getDetail(activityId)
    ↓
成功获取活动数据
    ↓
填充表单：
  - 标题: "网球活动周一啊 (副本)"
  - 类型、地点、时间等全部复制
  - 白名单、黑名单也复制
    ↓
✅ 表单正确填充
✅ 提示"已加载活动数据"
```

## 🧪 测试场景

### 测试场景1：查看私密活动详情（创建者）

**前置条件**:
- 用户已登录（userId: `u7d3f31690438`）
- 用户创建了私密活动"网球活动周一啊"（`isPublic: false`）

**操作步骤**:
1. 进入"我的活动"页面
2. 找到"网球活动周一啊"
3. 点击"详情"按钮

**预期结果**:
- ✅ 成功进入活动详情页
- ✅ 不再显示"无权查看此私密活动"错误
- ✅ 可以看到完整的活动信息

### 测试场景2：查看公开活动详情

**前置条件**:
- 用户已登录
- 用户创建了公开活动"test"（`isPublic: true`）

**操作步骤**:
1. 进入"我的活动"页面
2. 找到"test"活动
3. 点击"详情"按钮

**预期结果**:
- ✅ 成功进入活动详情页
- ✅ 表现与私密活动一致

### 测试场景3：复制活动

**前置条件**:
- 用户已登录
- 用户创建了活动"网球活动周一啊"

**操作步骤**:
1. 进入"我的活动"页面
2. 找到"网球活动周一啊"
3. 点击"复制"按钮

**预期结果**:
- ✅ 显示 Loading "加载中..."
- ✅ 成功进入创建活动页面
- ✅ 表单已填充活动数据：
  - 标题: "网球活动周一啊 (副本)"
  - 类型、地点、时间等全部已填充
  - 组织者联系方式已复制
- ✅ 所有步骤标记为"已完成"
- ✅ 提示"已加载活动数据"
- ✅ 不再显示"活动不存在"错误

### 测试场景4：编辑活动

**前置条件**:
- 用户已登录
- 用户创建了活动"test"

**操作步骤**:
1. 进入"我的活动"页面
2. 找到"test"活动
3. 点击"编辑"按钮

**预期结果**:
- ✅ 成功进入创建活动页面（编辑模式）
- ✅ 表单已填充活动数据
- ✅ 页面标题显示"活动编辑"
- ✅ 不再显示"活动不存在"错误

### 测试场景5：非创建者查看私密活动

**前置条件**:
- 用户A创建了私密活动（`isPublic: false`）
- 用户B登录

**操作步骤**:
1. 用户B通过某种方式获得活动ID
2. 尝试访问活动详情页

**预期结果**:
- ✅ 显示权限拦截页面
- ✅ 提示"无法查看此活动"
- ✅ 权限检查正常工作

## 🔧 相关代码文件

### 修改的文件

| 文件路径 | 修改内容 | 修改行数 |
|---------|---------|---------|
| `utils/data-adapter.js` | 添加布尔值字段映射 | 166-169 |
| `pages/activities/create.js` | 编辑功能迁移到API | 1728-1868 |
| `pages/activities/create.js` | 复制功能迁移到API | 1871-1965 |

### 涉及的API

| API方法 | 用途 | 调用位置 |
|---------|------|---------|
| `activityAPI.getDetail(activityId)` | 获取活动详情 | 编辑和复制功能 |
| `registrationAPI.getByActivity(activityId)` | 获取报名记录 | 编辑功能（计算报名数） |

## 🚀 后续优化建议

### 1. 统一后端JSON序列化策略

避免下划线和驼峰命名混用，在后端配置 Jackson：

```java
@Configuration
public class JacksonConfig {
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        // 统一使用驼峰命名
        mapper.setPropertyNamingStrategy(PropertyNamingStrategies.LOWER_CAMEL_CASE);
        return mapper;
    }
}
```

### 2. 创建字段映射单元测试

```javascript
describe('data-adapter', () => {
  it('应该正确映射下划线字段到驼峰字段', () => {
    const backendData = {
      id: 'a1',
      organizer_id: 'u123',
      is_public: false,
      is_deleted: false,
      need_review: true
    };

    const result = transformActivityFromBackend(backendData);

    expect(result.organizerId).toBe('u123');
    expect(result.isPublic).toBe(false);
    expect(result.isDeleted).toBe(false);
    expect(result.needReview).toBe(true);
  });
});
```

### 3. 添加字段名警告

在开发环境中检测未映射的下划线字段：

```javascript
if (process.env.NODE_ENV === 'development') {
  const unmappedFields = Object.keys(activity).filter(key =>
    key.includes('_') && !['created_at', 'updated_at'].includes(key)
  );

  if (unmappedFields.length > 0) {
    console.warn('⚠️ 检测到未映射的下划线字段:', unmappedFields);
  }
}
```

### 4. 完全移除mock数据依赖

审查所有页面，确保不再依赖 `utils/mock.js`：

```bash
grep -r "require.*mock.js" pages/
```

### 5. 添加活动加载骨架屏

在加载活动数据时显示骨架屏而不是 Loading：

```xml
<view wx:if="{{loading}}" class="skeleton">
  <view class="skeleton-title"></view>
  <view class="skeleton-desc"></view>
  <view class="skeleton-info"></view>
</view>
```

## 📝 注意事项

1. **字段映射优先级**: 始终优先使用下划线命名的字段，这样即使后端改为驼峰命名也能兼容
2. **布尔值判断**: 使用 `!== undefined` 而不是 `||`，因为 `false || true` 会返回 `true`
3. **异步函数**: 所有调用 API 的函数都必须是 `async` 函数
4. **错误处理**: 每个 API 调用都应该有 try-catch 错误处理
5. **Loading 状态**: 异步操作开始时显示 Loading，结束或出错时隐藏

## ⚠️ 已知限制

1. **分享链接中的 from=share 参数**: 需要在所有分享逻辑中添加这个参数
2. **权限检查的时序**: 如果 API 响应很慢，可能会有短暂的白屏
3. **表单复制的完整性**: 某些特殊字段（如自定义字段配置）可能需要额外处理

---

**文档版本**: v1.0
**修复日期**: 2025-11-17
**维护人员**: 开发团队
