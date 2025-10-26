# 日期时间选择器使用说明和问题排查

## 问题现象

如果在活动创建页面看到的还是纯文本输入框，请按以下步骤检查和解决。

---

## ✅ 解决方案

### 步骤 1：确认组件文件完整

检查 `components/datetime-picker/` 目录下是否有以下文件：

```
components/datetime-picker/
├── datetime-picker.wxml  ✓
├── datetime-picker.wxss  ✓
├── datetime-picker.js    ✓
└── datetime-picker.json  ✓
```

### 步骤 2：确认页面配置正确

打开 `pages/activities/create.json`，确保包含：

```json
{
  "navigationBarTitleText": "创建活动",
  "usingComponents": {
    "datetime-picker": "/components/datetime-picker/datetime-picker"
  }
}
```

### 步骤 3：重新编译项目

在微信开发者工具中：

1. 点击顶部菜单 **项目** → **重新编译**
2. 或者使用快捷键 `Ctrl + B` (Windows) / `Cmd + B` (Mac)
3. 或者点击工具栏的刷新按钮 🔄

### 步骤 4：清除缓存

如果重新编译后仍然不生效：

1. 点击顶部菜单 **工具** → **清除缓存** → **清除全部缓存**
2. 关闭开发者工具
3. 重新打开项目

### 步骤 5：检查WXML代码

打开 `pages/activities/create.wxml`，第42-87行应该是：

```xml
<view class="section">
  <view class="card shadow-card form-section">
    <text class="section-title">时间与地点</text>

    <!-- 开始时间选择器 -->
    <datetime-picker
      label="活动开始时间"
      required="{{true}}"
      dateValue="{{form.startDate}}"
      timeValue="{{form.startTime}}"
      startDate="{{todayDate}}"
      bindchange="onStartTimeChange"
    />

    <!-- 结束时间选择器 -->
    <datetime-picker
      label="活动结束时间"
      required="{{true}}"
      dateValue="{{form.endDate}}"
      timeValue="{{form.endTime}}"
      startDate="{{form.startDate || todayDate}}"
      bindchange="onEndTimeChange"
    />

    <!-- 报名截止时间选择器 -->
    <datetime-picker
      label="报名截止时间"
      dateValue="{{form.registerDeadlineDate}}"
      timeValue="{{form.registerDeadlineTime}}"
      startDate="{{todayDate}}"
      endDate="{{form.startDate}}"
      bindchange="onRegisterDeadlineChange"
    />

    <view class="form-field">
      <text class="field-label">活动地点 *</text>
      <view class="location-picker" bindtap="chooseLocation">
        <text class="location-icon">📍</text>
        <text class="{{form.place ? 'location-value' : 'location-placeholder'}}">
          {{form.place || '点击选择活动地点'}}
        </text>
      </view>
      <text wx:if="{{form.address}}" class="location-detail">{{form.address}}</text>
    </view>
  </view>
</view>
```

### 步骤 6：检查JS代码

打开 `pages/activities/create.js`，确认包含以下方法：

```javascript
// 在 onLoad 中设置今天的日期
onLoad(options) {
  const today = new Date();
  const todayDate = formatDateTime(today.toISOString(), 'YYYY-MM-DD');
  this.setData({ todayDate });
  // ... 其他代码
}

// 开始时间改变
onStartTimeChange(e) {
  const { date, time } = e.detail;
  this.setData({
    'form.startDate': date || this.data.form.startDate,
    'form.startTime': time || this.data.form.startTime
  });
  // 智能联动
  if (this.data.form.endDate && date && this.data.form.endDate < date) {
    this.setData({ 'form.endDate': date });
  }
}

// 结束时间改变
onEndTimeChange(e) {
  const { date, time } = e.detail;
  this.setData({
    'form.endDate': date || this.data.form.endDate,
    'form.endTime': time || this.data.form.endTime
  });
}

// 报名截止时间改变
onRegisterDeadlineChange(e) {
  const { date, time } = e.detail;
  this.setData({
    'form.registerDeadlineDate': date || this.data.form.registerDeadlineDate,
    'form.registerDeadlineTime': time || this.data.form.registerDeadlineTime
  });
}
```

---

## 🎯 正确的效果应该是

### 视觉效果

当你打开活动创建页面时，应该看到：

```
┌─────────────────────────────────────┐
│ 活动开始时间 *                       │
├─────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐ │
│ │ 📅 选择日期   │  │ 🕐 选择时间  │ │
│ └──────────────┘  └──────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 活动结束时间 *                       │
├─────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐ │
│ │ 📅 选择日期   │  │ 🕐 选择时间  │ │
│ └──────────────┘  └──────────────┘ │
└─────────────────────────────────────┘
```

### 交互效果

1. **点击日期框** → 弹出日历选择器（微信原生）
2. **点击时间框** → 弹出时间滚轮选择器（微信原生）
3. **选择完成** → 显示在对应的框内

**绝对不应该出现**：
- ❌ 文本输入框
- ❌ 键盘输入
- ❌ 纯文本placeholder

---

## 🔍 常见问题排查

### 问题1：看到的还是input输入框

**原因**：可能是缓存或编译问题

**解决**：
1. 重新编译项目
2. 清除缓存
3. 关闭并重启开发工具

### 问题2：点击后没有弹出选择器

**原因**：组件未正确注册或picker组件被禁用

**解决**：
1. 检查 `create.json` 中的 `usingComponents` 配置
2. 确认组件路径正确：`/components/datetime-picker/datetime-picker`
3. 检查 WXML 中是否有 `disabled="{{true}}"` 属性

### 问题3：选择后数据没有更新

**原因**：事件处理方法未正确绑定

**解决**：
1. 检查 WXML 中的 `bindchange` 是否正确
2. 确认 JS 中有对应的处理方法
3. 在控制台查看是否有报错

### 问题4：组件显示不正常

**原因**：样式文件未加载

**解决**：
1. 确认 `datetime-picker.wxss` 文件存在
2. 重新编译项目

---

## 🧪 测试方法

### 快速测试

在微信开发者工具中：

1. 打开 **创建活动** 页面
2. 观察 **时间与地点** 模块
3. 应该看到3个日期时间选择器：
   - 活动开始时间 *
   - 活动结束时间 *
   - 报名截止时间

4. 点击日期框（📅 图标）
   - 应该弹出日历选择器
   - 可以通过点选日期
   - **不应该弹出键盘**

5. 点击时间框（🕐 图标）
   - 应该弹出时间滚轮
   - 可以滚动选择时间
   - **不应该弹出键盘**

### 控制台调试

在 `pages/activities/create.js` 的事件处理方法中添加日志：

```javascript
onStartTimeChange(e) {
  console.log('开始时间改变:', e.detail);
  const { date, time } = e.detail;
  // ... 其他代码
}
```

然后在控制台查看输出，确认事件是否正确触发。

---

## 📱 真机测试

如果在开发工具中正常，但真机有问题：

1. 确保微信版本不低于 **7.0.0**
2. 清除手机微信小程序缓存：
   - 打开微信
   - 我 → 设置 → 通用 → 存储空间
   - 清理缓存
3. 删除小程序后重新扫码进入

---

## 💡 验证组件是否工作的简单方法

在 `pages/activities/create.wxml` 第2行后添加临时测试代码：

```xml
<!-- 临时测试代码 - 请在验证后删除 -->
<view style="padding: 20rpx; background: #fffacd;">
  <text style="color: #ff0000; font-size: 28rpx;">
    组件测试：下方应该看到可点击的日期时间选择器，而不是输入框
  </text>
  <datetime-picker
    label="测试选择器"
    required="{{true}}"
    dateValue=""
    timeValue=""
    bindchange="onTestChange"
  />
</view>
```

在 `pages/activities/create.js` 中添加：

```javascript
onTestChange(e) {
  console.log('测试选择器触发:', e.detail);
  wx.showToast({
    title: `已选择: ${e.detail.date} ${e.detail.time}`,
    icon: 'none'
  });
}
```

如果点击后：
- ✅ 弹出日历/时间选择器 → 组件工作正常
- ❌ 弹出键盘或无反应 → 组件未正确加载

---

## 📞 仍然无法解决？

如果按照以上步骤仍然看到文本输入框，请提供以下信息：

1. 微信开发者工具版本号
2. 控制台是否有报错信息
3. `create.json` 文件内容截图
4. `create.wxml` 42-87行代码截图
5. 页面实际显示效果截图

---

**最后更新**: 2025-10-26
**版本**: v1.0
