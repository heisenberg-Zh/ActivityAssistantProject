# 我的活动页面问题修复文档

## 📋 问题概述

**发现日期**: 2025-11-17
**问题来源**: 用户反馈

### 问题描述

在"我的活动"页面，每个活动卡片右下角的按钮存在两个问题：

1. **"查看统计"按钮无响应**
   - 点击后跳转到全局统计页面（TabBar），而不是该活动的统计
   - 功能不符合用户预期

2. **"详情"按钮权限校验错误**
   - 点击后提示"无权查看此私密活动"
   - 但"我的活动"页面显示的应该都是用户有权查看的活动（已报名或自己创建的）
   - 权限校验逻辑存在缺陷

## 🔍 根本原因分析

### 问题1：查看统计按钮跳转错误

**文件**: `pages/my-activities/index.js:218-221`

```javascript
case 'stats':
  // 跳转到统计页面
  wx.navigateTo({ url: '/pages/statistics/index' });
  break;
```

**问题分析**:
- `/pages/statistics/index` 是全局统计页面（TabBar），显示的是用户所有活动的聚合统计
- 用户期望的是查看**当前活动**的详细统计（报名人数、审核状态等）
- 应该跳转到活动管理页面，在那里可以看到单个活动的统计信息

### 问题2：详情页权限校验缺陷

**文件**: `pages/activities/detail.js:85-92`

**原始代码**:
```javascript
const permissionCheck = checkActivityViewPermission(
  detail,
  currentUserId,
  [], // ❌ 问题：传入的是空数组！
  this.data.fromShare
);
```

**问题分析**:
- 权限检查函数 `checkActivityViewPermission` 需要用户的报名记录来判断是否有权查看私密活动
- 但是传入的 `userRegistrations` 参数是**空数组**
- 导致即使用户已报名该私密活动，权限检查函数也无法识别，最终拒绝访问

**权限检查逻辑**（`utils/activity-helper.js:56-114`）:

权限检查的优先级顺序：
1. 活动已删除 → 拒绝访问
2. 活动公开 → 允许访问 ✅
3. 用户是创建者 → 允许访问 ✅
4. 用户是管理员 → 允许访问 ✅
5. 通过分享链接访问 → 允许访问 ✅
6. 用户已报名且审核通过 → 允许访问 ❌（因为传入空数组，此检查失效）
7. 其他情况 → 拒绝访问

## ✅ 解决方案

### 修复1：查看统计按钮跳转到管理页面

**修改文件**: `pages/my-activities/index.js`

**修改内容**:
```javascript
case 'stats':
  // 跳转到活动管理页面查看统计
  wx.navigateTo({ url: `/pages/management/index?id=${id}` });
  break;
```

**修复效果**:
- 点击"查看统计"后，跳转到该活动的管理页面
- 在管理页面可以查看该活动的详细报名统计、审核状态、参与人员等信息
- 符合用户预期

### 修复2：修复详情页权限校验

**修改文件**: `pages/activities/detail.js`

**修改内容**:
```javascript
// ========== 权限检查 ==========
// 获取当前用户的报名记录（从活动报名列表中筛选）
const allRegistrations = registrationsResult.code === 0
  ? (registrationsResult.data.content || registrationsResult.data || [])
  : [];
const currentUserRegistrations = allRegistrations.filter(r => r.userId === currentUserId);

console.log('当前用户的报名记录:', currentUserRegistrations);

// 检查用户是否有权查看此活动（私密活动等）
const permissionCheck = checkActivityViewPermission(
  detail,
  currentUserId,
  currentUserRegistrations, // ✅ 传入当前用户的真实报名记录
  this.data.fromShare
);
```

**同时优化了代码复用**:
```javascript
// 获取参与者列表（使用前面已获取的报名记录）
const activityRegs = allRegistrations.filter(r => r.status === 'approved');
```

**修复效果**:
- 权限检查函数能够正确识别用户的报名状态
- 用户已报名的私密活动可以正常查看详情
- 避免了重复请求数据，提升性能

## 📊 影响范围分析

### 修复前受影响的场景

#### 场景1：我创建的活动
- **状态**: ✅ 正常（通过创建者检查）
- **权限检查通过**: `activity.organizerId === currentUserId`

#### 场景2：我参加的公开活动
- **状态**: ✅ 正常（通过公开活动检查）
- **权限检查通过**: `activity.isPublic === true`

#### 场景3：我参加的私密活动
- **状态**: ❌ 被拒绝（报名检查失效）
- **问题**: 传入空数组导致无法识别报名记录
- **修复后**: ✅ 正常（通过报名检查）

### 所有跳转到详情页的入口

通过代码搜索，找到以下页面会跳转到详情页：

| 页面 | 文件路径 | 是否受影响 | 修复后状态 |
|------|---------|-----------|-----------|
| 活动列表页 | `pages/activities/list.js` | ✅ 可能（私密已报名活动） | ✅ 已修复 |
| 首页 | `pages/home/index.js` | ❌ 不受影响（只显示公开活动） | ✅ 正常 |
| 收藏页 | `pages/favorites/index.js` | ✅ 可能（收藏的私密已报名活动） | ✅ 已修复 |
| 我的活动页 | `pages/my-activities/index.js` | ✅ **是（主要问题场景）** | ✅ 已修复 |

## 🧪 测试场景

### 测试场景1：我创建的私密活动
**前置条件**:
- 活动创建者是当前用户
- 活动 `isPublic = false`

**操作**: 在"我的活动"页面点击该活动的"详情"按钮

**预期结果**:
- ✅ 成功进入活动详情页
- ✅ 可以查看所有信息
- ✅ 显示管理按钮

### 测试场景2：我报名的私密活动（审核通过）
**前置条件**:
- 活动 `isPublic = false`
- 当前用户已报名，状态 `status = 'approved'`

**操作**: 在"我的活动"页面点击该活动的"详情"按钮

**预期结果**:
- ✅ 成功进入活动详情页
- ✅ 可以查看所有信息
- ✅ 显示"已报名"状态

### 测试场景3：我报名的私密活动（待审核）
**前置条件**:
- 活动 `isPublic = false`
- 当前用户已报名，状态 `status = 'pending'`

**操作**: 在"我的活动"页面点击该活动的"详情"按钮

**预期结果**:
- ✅ 成功进入活动详情页
- ✅ 显示"待审核"状态

### 测试场景4：查看活动统计
**前置条件**:
- 活动状态为"已结束"
- 当前用户是活动创建者

**操作**: 在"我的活动"页面点击该活动的"查看统计"按钮

**预期结果**:
- ✅ 跳转到活动管理页面
- ✅ 显示该活动的报名统计、参与成员等信息

## 🔧 相关代码文件

### 修改的文件

| 文件路径 | 修改内容 | 修改行数 |
|---------|---------|---------|
| `pages/my-activities/index.js` | 修改"查看统计"按钮跳转目标 | 218-221 |
| `pages/activities/detail.js` | 修复权限检查的报名记录传参 | 85-144 |

### 权限检查相关文件

| 文件路径 | 作用 |
|---------|------|
| `utils/activity-helper.js` | 定义权限检查函数 `checkActivityViewPermission` |
| `pages/activities/detail.js` | 调用权限检查函数，渲染详情页 |

## 🚀 后续优化建议

### 1. 统一权限检查参数

建议在所有调用权限检查的地方，都传入完整的用户报名记录，避免遗漏：

```javascript
// 标准调用模式
const permissionCheck = checkActivityViewPermission(
  activity,
  currentUserId,
  userRegistrations, // 必须传入完整的报名记录
  fromShare
);
```

### 2. 增加权限检查日志

在权限检查失败时，记录更详细的日志，方便调试：

```javascript
if (!permissionCheck.hasPermission) {
  console.error('[权限拒绝]', {
    activityId: detail.id,
    activityTitle: detail.title,
    isPublic: detail.isPublic,
    organizerId: detail.organizerId,
    currentUserId: currentUserId,
    reason: permissionCheck.reason,
    userRegistrations: currentUserRegistrations
  });
}
```

### 3. 优化"查看统计"按钮显示逻辑

目前"查看统计"按钮在所有已结束的活动上都会显示，建议优化为：
- 仅对创建者显示"查看统计"
- 参与者显示"查看详情"或"评价"

```javascript
if (role === 'created') {
  if (activity.status === '已结束') {
    actions.push({ label: '查看统计', action: 'stats', type: 'primary' });
    actions.push({ label: '详情', action: 'detail', type: 'secondary' });
  }
} else if (role === 'joined') {
  if (activity.status === '已结束') {
    actions.push({ label: '评价', action: 'review', type: 'primary' });
    actions.push({ label: '详情', action: 'detail', type: 'secondary' });
  }
}
```

### 4. 添加单元测试

为权限检查函数添加单元测试，覆盖所有场景：

```javascript
describe('checkActivityViewPermission', () => {
  it('应允许创建者查看私密活动', () => {
    const result = checkActivityViewPermission(
      { id: 'a1', isPublic: false, organizerId: 'u1' },
      'u1',
      [],
      false
    );
    expect(result.hasPermission).toBe(true);
  });

  it('应允许已报名用户查看私密活动', () => {
    const result = checkActivityViewPermission(
      { id: 'a1', isPublic: false, organizerId: 'u2' },
      'u1',
      [{ activityId: 'a1', userId: 'u1', status: 'approved' }],
      false
    );
    expect(result.hasPermission).toBe(true);
  });

  it('应拒绝未报名用户查看私密活动', () => {
    const result = checkActivityViewPermission(
      { id: 'a1', isPublic: false, organizerId: 'u2' },
      'u1',
      [],
      false
    );
    expect(result.hasPermission).toBe(false);
  });
});
```

## 📝 修复执行记录

**执行时间**: 2025-11-17
**执行人**: Claude Code
**影响文件**: 2个
**修改行数**: ~20行
**测试状态**: 待验证

## ⚠️ 注意事项

1. **权限检查的性能**：每次进入详情页都会获取活动的所有报名记录，对于报名人数多的活动可能影响性能。建议后端优化为只返回当前用户的报名状态。

2. **缓存考虑**：如果启用缓存，需要确保用户报名状态变化后及时更新缓存，避免权限判断错误。

3. **分享链接场景**：通过分享链接访问私密活动时，目前设置为允许访问。这可能存在安全风险，建议后端控制分享链接的有效期和访问次数。

4. **管理页面权限**：点击"查看统计"跳转到管理页面，需要确保管理页面也有相应的权限检查。

---

**文档版本**: v1.0
**修复日期**: 2025-11-17
**维护人员**: 开发团队
