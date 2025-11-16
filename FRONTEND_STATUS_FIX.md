# 前端状态判断修复指南

## 问题概述

前端代码中存在多处使用中文状态进行判断的代码，需要更新以支持后端返回的英文状态枚举。

## 已修复

### ✅ utils/formatter.js

**状态翻译函数已更新**，新增对后端状态的支持：
- `pending` → 待发布
- `published` → 报名中
- `ongoing` → 进行中
- `finished` → 已结束
- `cancelled` → 已取消

## 需要修复的文件

### 1. pages/my-activities/index.js

**问题代码（第141-199行）**：
- 使用中文状态判断：`activity.status === '预发布'`、`'进行中'`、`'即将开始'`、`'已结束'`

**修复方案**：
有两种方式：
1. **推荐**：导入formatter，先翻译状态再判断
2. **或者**：同时支持中英文状态判断

**示例修复**：

```javascript
// 在文件顶部导入
const { translateActivityStatus } = require('../../utils/formatter.js');

// 修改判断逻辑
const translatedStatus = translateActivityStatus(activity.status);

if (translatedStatus === '待发布' || translatedStatus === '预发布') {
  // 预发布状态的活动
  actions.push({ label: '手动发布', action: 'publishNow', type: 'primary' });
  // ...
} else if (translatedStatus === '进行中') {
  actions.push({ label: '管理', action: 'manage', type: 'primary' });
  // ...
} else if (translatedStatus === '报名中' || translatedStatus === '即将开始') {
  actions.push({ label: '编辑', action: 'edit', type: 'primary' });
  // ...
}
```

### 2. pages/my-activities/created-list.js & joined-list.js

**问题代码（第34-40行）**：
```javascript
let statusClass = 'ended';
if (activity.status === '进行中') {
  statusClass = 'ongoing';
} else if (activity.status === '即将开始') {
  statusClass = 'upcoming';
}
```

**修复方案**：

```javascript
// 在文件顶部导入
const { translateActivityStatus } = require('../../utils/formatter.js');

// 在数据处理中
onLoad: function() {
  // ...
  activities.forEach(activity => {
    const translatedStatus = translateActivityStatus(activity.status);

    let statusClass = 'ended';
    if (translatedStatus === '进行中') {
      statusClass = 'ongoing';
    } else if (translatedStatus === '报名中' || translatedStatus === '即将开始') {
      statusClass = 'upcoming';
    }

    activity.statusClass = statusClass;
    activity.displayStatus = translatedStatus; // 用于显示
  });
}
```

### 3. pages/statistics/index.js

**问题代码（第157行）**：
```javascript
const completedCount = filteredActivities.filter(a => a.status === '已结束').length;
```

**修复方案**：

```javascript
// 在文件顶部导入
const { translateActivityStatus } = require('../utils/formatter.js');

// 修改判断逻辑
const completedCount = filteredActivities.filter(a => {
  const translatedStatus = translateActivityStatus(a.status);
  return translatedStatus === '已结束';
}).length;
```

### 4. WXML 文件中的状态判断

**问题文件**：
- `pages/activities/list.wxml:29`
- `pages/favorites/index.wxml:21`
- `pages/my-activities/index.wxml:21`
- `pages/management/index.wxml:31`

**问题代码示例**：
```html
<view class="badge {{ item.status === '进行中' ? 'badge--ok' : (item.status === '即将开始' ? 'badge--info' : 'badge--muted') }}">
  {{item.status}}
</view>
```

**修复方案A（推荐）**：在 JS 中预处理状态

```javascript
// 在 .js 文件中处理数据时
activities.forEach(activity => {
  const { translateActivityStatus, formatActivityStatus } = require('../../utils/formatter.js');

  activity.displayStatus = translateActivityStatus(activity.status);
  const statusFormat = formatActivityStatus(activity.status);

  // 设置样式类
  if (activity.displayStatus === '进行中') {
    activity.statusClass = 'badge--ok';
  } else if (activity.displayStatus === '报名中' || activity.displayStatus === '即将开始') {
    activity.statusClass = 'badge--info';
  } else {
    activity.statusClass = 'badge--muted';
  }
});
```

然后在 WXML 中简化：
```html
<view class="badge {{item.statusClass}}">
  {{item.displayStatus}}
</view>
```

**修复方案B**：使用 WXS 处理（更灵活）

创建 `utils/status.wxs`:
```javascript
var statusMap = {
  'pending': '待发布',
  'published': '报名中',
  'ongoing': '进行中',
  'finished': '已结束',
  'cancelled': '已取消'
};

function translate(status) {
  return statusMap[status] || status;
}

function getClass(status) {
  var translated = translate(status);
  if (translated === '进行中') return 'badge--ok';
  if (translated === '报名中' || translated === '即将开始') return 'badge--info';
  return 'badge--muted';
}

module.exports = {
  translate: translate,
  getClass: getClass
};
```

在 WXML 中使用：
```html
<wxs src="../../utils/status.wxs" module="status" />

<view class="badge {{status.getClass(item.status)}}">
  {{status.translate(item.status)}}
</view>
```

## 修复优先级

### 高优先级（影响核心功能）
1. ✅ `utils/formatter.js` - 已修复
2. 🔧 `pages/my-activities/index.js` - 影响操作按钮显示
3. 🔧 `pages/statistics/index.js` - 影响统计数据准确性

### 中优先级（影响用户体验）
4. 🔧 `pages/my-activities/created-list.js`
5. 🔧 `pages/my-activities/joined-list.js`
6. 🔧 各个 WXML 文件中的状态显示

## 测试清单

### 功能测试
- [ ] 活动列表状态显示正确（中文）
- [ ] 活动详情状态显示正确
- [ ] "我的活动"中不同状态的操作按钮正确
- [ ] 统计页面数据计算正确
- [ ] 状态筛选功能正常
- [ ] 状态颜色标识正确

### 兼容性测试
- [ ] 后端返回英文状态能正常显示为中文
- [ ] 旧数据（如有中文状态）仍能正常显示
- [ ] 各种状态切换正常

## 建议的开发流程

1. **第一阶段**：修复工具函数和核心逻辑
   - ✅ 完成 formatter.js 更新
   - 修复 my-activities/index.js
   - 修复 statistics/index.js

2. **第二阶段**：修复列表页面
   - 修复 created-list.js 和 joined-list.js
   - 测试列表显示

3. **第三阶段**：修复视图层
   - 创建 status.wxs（推荐）
   - 或在各个页面的 JS 中预处理状态
   - 更新所有 WXML 文件

4. **第四阶段**：全面测试
   - 执行测试清单
   - 修复发现的问题

## 注意事项

1. **向后兼容**：修复时保持对旧中文状态的兼容，避免线上数据显示异常
2. **统一管理**：建议所有状态处理都通过 formatter.js，避免散落在各处
3. **性能优化**：状态翻译在数据获取时处理一次，避免在渲染时重复调用
4. **类型安全**：在 formatter.js 中添加状态常量，避免硬编码字符串

## 示例：完整修复一个页面

以 `pages/activities/list.js` 为例：

```javascript
// 在页面顶部导入
const { translateActivityStatus, formatActivityStatus } = require('../../utils/formatter.js');

// 在获取数据后处理
Page({
  data: {
    activities: []
  },

  onLoad() {
    this.loadActivities();
  },

  loadActivities() {
    // 假设从API获取数据
    api.getActivities().then(res => {
      const activities = res.data.map(activity => {
        // 翻译状态
        const displayStatus = translateActivityStatus(activity.status);
        const statusFormat = formatActivityStatus(activity.status);

        return {
          ...activity,
          displayStatus,      // 显示用的中文状态
          statusClass: this.getStatusClass(displayStatus),  // CSS类名
          statusColor: statusFormat.color  // 颜色值
        };
      });

      this.setData({ activities });
    });
  },

  getStatusClass(displayStatus) {
    if (displayStatus === '进行中') return 'badge--ok';
    if (displayStatus === '报名中' || displayStatus === '即将开始') return 'badge--info';
    return 'badge--muted';
  }
});
```

对应的 WXML：
```html
<view wx:for="{{activities}}" wx:key="id">
  <view class="badge {{item.statusClass}}">
    {{item.displayStatus}}
  </view>
</view>
```

## 总结

本次修复确保前端能正确处理后端返回的英文状态枚举，同时保持良好的用户体验（显示中文）。核心思路是：
1. 后端统一使用英文状态
2. 前端通过 formatter 翻译为中文显示
3. 所有状态判断都基于翻译后的中文，保持代码一致性
