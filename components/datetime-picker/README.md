# 日期时间选择器组件 (datetime-picker)

一个可视化的日期时间选择器组件，用于替代手动输入日期时间的方式。

## 功能特性

✅ 日期选择（通过微信 picker 组件）
✅ 时间选择（通过微信 picker 组件）
✅ 日期范围限制
✅ 必填标记
✅ 错误提示显示
✅ 禁用状态支持
✅ 优雅的视觉设计

## 使用方法

### 1. 在页面 JSON 中引入组件

```json
{
  "usingComponents": {
    "datetime-picker": "/components/datetime-picker/datetime-picker"
  }
}
```

### 2. 在 WXML 中使用组件

```xml
<!-- 基础用法 -->
<datetime-picker
  label="活动开始时间"
  required="{{true}}"
  dateValue="{{startDate}}"
  timeValue="{{startTime}}"
  bindchange="onTimeChange"
/>

<!-- 完整配置 -->
<datetime-picker
  label="活动结束时间"
  required="{{true}}"
  dateValue="{{endDate}}"
  timeValue="{{endTime}}"
  startDate="{{minDate}}"
  endDate="{{maxDate}}"
  disabled="{{false}}"
  error="{{errorMsg}}"
  bindchange="onTimeChange"
  binddatechange="onDateChange"
  bindtimechange="onTimeChange"
/>
```

### 3. 在 JS 中处理事件

```javascript
Page({
  data: {
    startDate: '2025-12-20',
    startTime: '18:00',
    minDate: '2025-01-01',
    maxDate: '2025-12-31'
  },

  // 日期时间都改变时触发
  onTimeChange(e) {
    const { date, time } = e.detail;
    this.setData({
      startDate: date,
      startTime: time
    });
  },

  // 只有日期改变时触发
  onDateChange(e) {
    const { date } = e.detail;
    console.log('选择的日期:', date);
  },

  // 只有时间改变时触发
  onTimeChange(e) {
    const { time } = e.detail;
    console.log('选择的时间:', time);
  }
});
```

## 组件属性

| 属性名 | 类型 | 默认值 | 必填 | 说明 |
|--------|------|--------|------|------|
| label | String | '选择日期时间' | 否 | 标签文本 |
| required | Boolean | false | 否 | 是否必填，显示红色星号 |
| dateValue | String | '' | 否 | 日期初始值，格式 YYYY-MM-DD |
| timeValue | String | '' | 否 | 时间初始值，格式 HH:mm |
| startDate | String | '1900-01-01' | 否 | 最小可选日期 |
| endDate | String | '2100-12-31' | 否 | 最大可选日期 |
| disabled | Boolean | false | 否 | 是否禁用 |
| error | String | '' | 否 | 错误提示文本 |

## 组件事件

| 事件名 | 说明 | 返回参数 |
|--------|------|----------|
| bindchange | 日期或时间改变时触发 | { date, time } |
| binddatechange | 只有日期改变时触发 | { date } |
| bindtimechange | 只有时间改变时触发 | { time } |

## 样式定制

组件使用独立的 wxss 文件，可以通过以下方式定制样式：

```css
/* 在页面 wxss 中覆盖组件样式 */
.datetime-picker .picker-input {
  background: #your-color;
  border-color: #your-color;
}
```

## 使用示例

### 示例 1：活动创建页面

```xml
<!-- 开始时间 -->
<datetime-picker
  label="活动开始时间"
  required="{{true}}"
  dateValue="{{form.startDate}}"
  timeValue="{{form.startTime}}"
  startDate="{{todayDate}}"
  bindchange="onStartTimeChange"
/>

<!-- 结束时间 -->
<datetime-picker
  label="活动结束时间"
  required="{{true}}"
  dateValue="{{form.endDate}}"
  timeValue="{{form.endTime}}"
  startDate="{{form.startDate || todayDate}}"
  bindchange="onEndTimeChange"
/>
```

```javascript
Page({
  data: {
    todayDate: '2025-10-26',
    form: {
      startDate: '',
      startTime: '09:00',
      endDate: '',
      endTime: '18:00'
    }
  },

  onStartTimeChange(e) {
    const { date, time } = e.detail;
    this.setData({
      'form.startDate': date || this.data.form.startDate,
      'form.startTime': time || this.data.form.startTime
    });
  },

  onEndTimeChange(e) {
    const { date, time } = e.detail;
    this.setData({
      'form.endDate': date || this.data.form.endDate,
      'form.endTime': time || this.data.form.endTime
    });
  }
});
```

### 示例 2：带验证的日期选择

```xml
<datetime-picker
  label="报名截止时间"
  dateValue="{{deadline}}"
  timeValue="{{deadlineTime}}"
  startDate="{{todayDate}}"
  endDate="{{activityStartDate}}"
  error="{{deadlineError}}"
  bindchange="onDeadlineChange"
/>
```

```javascript
Page({
  data: {
    deadline: '',
    deadlineTime: '09:00',
    deadlineError: ''
  },

  onDeadlineChange(e) {
    const { date, time } = e.detail;

    // 验证截止时间必须早于活动开始时间
    const deadlineDateTime = new Date(`${date} ${time}`);
    const startDateTime = new Date(`${this.data.activityStartDate} ${this.data.activityStartTime}`);

    if (deadlineDateTime >= startDateTime) {
      this.setData({
        deadlineError: '报名截止时间必须早于活动开始时间'
      });
    } else {
      this.setData({
        deadline: date,
        deadlineTime: time,
        deadlineError: ''
      });
    }
  }
});
```

## 注意事项

1. **日期格式**: 日期必须是 `YYYY-MM-DD` 格式，时间必须是 `HH:mm` 格式
2. **范围限制**: `startDate` 和 `endDate` 用于限制可选日期范围
3. **事件处理**: 建议使用 `bindchange` 事件处理日期时间的同步更新
4. **默认时间**: 可以预设默认时间值，如 `timeValue="09:00"`
5. **联动效果**: 结束时间的 `startDate` 可以绑定为开始时间的日期，实现联动

## 版本历史

- **v1.0.0** (2025-10-26)
  - 初始版本发布
  - 支持日期时间可视化选择
  - 支持范围限制和错误提示
