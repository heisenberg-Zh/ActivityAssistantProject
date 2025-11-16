# 创建活动页面 - 错误提示优化文档

## 📋 优化概述

**优化日期**: 2025-11-16
**优化目标**: 提升创建活动时的用户体验,让用户能清楚了解哪些内容需要修改

## ✨ 新增功能

### 1. 报名截止时间实时校验

**功能位置**: 步骤2 - 时间设置

**校验规则**:
1. ✅ 报名截止时间不能早于或等于当前时间
2. ✅ 报名截止时间不能晚于或等于活动开始时间

**用户体验**:
- 当用户选择报名截止时间后,**立即进行校验**
- 如果时间无效,弹窗提示具体原因
- 自动清空无效的时间,要求用户重新选择

**示例弹窗**:
```
标题: 报名截止时间无效
内容: 报名截止时间不能晚于或等于活动开始时间，请重新选择。
按钮: [确定]
```

### 2. 发布时参数校验失败友好提示

**功能位置**: 步骤7 - 点击发布按钮

**错误解析能力**:
- ✅ 解析后端返回的参数校验错误
- ✅ 将英文字段名转换为中文名称
- ✅ 列出所有错误项和具体原因
- ✅ 提供"返回修改"按钮快速跳转到第一步

**字段名映射**:
| 英文字段名 | 中文显示名称 |
|-----------|------------|
| title | 活动标题 |
| type | 活动类型 |
| startTime | 开始时间 |
| endTime | 结束时间 |
| registerDeadline | 报名截止时间 |
| place | 地点名称 |
| address | 详细地址 |
| total | 总人数上限 |
| ... | ... |

**示例弹窗**:
```
标题: 参数校验失败
内容: 请修改以下内容后重试：

• 活动标题: 活动标题长度不能超过200个字符
• 开始时间: 开始时间不能为空
• 总人数上限: 总人数上限至少为1

按钮: [我知道了] [返回修改]
```

### 3. 网络错误友好提示

**错误类型1 - 网络请求失败**:
```
标题: 操作失败
内容: 网络请求失败，请检查网络连接后重试
按钮: [确定]
```

**错误类型2 - 未知错误**:
```
标题: 操作失败
内容: 未知错误，请重试
按钮: [确定]
```

## 🔧 技术实现

### 新增方法

#### 1. `validateRegisterDeadline()`
```javascript
// 校验报名截止时间
validateRegisterDeadline() {
  const { form } = this.data;

  if (!form.registerDeadlineDate || !form.registerDeadlineTime) {
    return true; // 未设置则不校验
  }

  const registerDeadline = parseDate(`${form.registerDeadlineDate} ${form.registerDeadlineTime}`);
  const now = new Date();

  // 1. 不能早于当前时间
  if (registerDeadline <= now) {
    // 弹窗提示...
    return false;
  }

  // 2. 不能晚于活动开始时间
  if (form.startDate && form.startTime) {
    const activityStart = parseDate(`${form.startDate} ${form.startTime}`);
    if (registerDeadline >= activityStart) {
      // 弹窗提示...
      return false;
    }
  }

  return true;
}
```

#### 2. `showErrorDialog(result)`
```javascript
/**
 * 显示错误信息弹窗
 * 解析后端返回的参数校验错误，友好展示给用户
 */
showErrorDialog(result) {
  const { code, message, data } = result;

  // 字段名到中文名称的映射
  const fieldNameMap = {
    'title': '活动标题',
    'type': '活动类型',
    'startTime': '开始时间',
    // ... 更多字段映射
  };

  // 如果有详细的字段错误信息（参数校验失败）
  if (code === 400 && data && typeof data === 'object') {
    const errorList = [];

    for (const [field, error] of Object.entries(data)) {
      const fieldName = fieldNameMap[field] || field;
      errorList.push(`• ${fieldName}: ${error}`);
    }

    if (errorList.length > 0) {
      const errorContent = errorList.join('\n');

      wx.showModal({
        title: '参数校验失败',
        content: `请修改以下内容后重试：\n\n${errorContent}`,
        showCancel: true,
        cancelText: '我知道了',
        confirmText: '返回修改',
        confirmColor: '#3b82f6',
        success: (res) => {
          if (res.confirm) {
            this.setCurrentStep(1); // 跳转到第一步
          }
        }
      });
      return;
    }
  }

  // 通用错误提示
  wx.showModal({
    title: message || '操作失败',
    content: typeof data === 'string' ? data : '请检查输入内容后重试',
    showCancel: false
  });
}
```

### 修改方法

#### `publish()` 方法改进
```javascript
try {
  // ... 调用后端API

  if (result.code === 0) {
    // 成功处理...
  } else {
    // ✨ 新增: 调用友好的错误提示方法
    this.showErrorDialog(result);
  }
} catch (err) {
  wx.hideLoading();
  console.error('操作失败:', err);

  // ✨ 新增: 解析并展示错误信息
  if (err && err.data) {
    this.showErrorDialog(err.data);
  } else if (err && err.errMsg) {
    wx.showModal({
      title: '操作失败',
      content: err.errMsg || '网络请求失败，请检查网络连接后重试',
      showCancel: false
    });
  } else {
    wx.showModal({
      title: '操作失败',
      content: '未知错误，请重试',
      showCancel: false
    });
  }
}
```

#### `onRegisterDeadlineChange()` 方法改进
```javascript
onRegisterDeadlineChange(e) {
  const { date, time } = e.detail;
  this.setData({
    'form.registerDeadlineDate': date || this.data.form.registerDeadlineDate,
    'form.registerDeadlineTime': time || this.data.form.registerDeadlineTime
  });

  // ✨ 新增: 实时校验报名截止时间
  this.validateRegisterDeadline();

  this.checkCanPublish();
}
```

## 📱 用户操作流程

### 场景1: 报名截止时间设置错误

1. 用户在步骤2选择报名截止时间
2. 选择了晚于活动开始时间的时间
3. **立即弹窗提示**: "报名截止时间不能晚于或等于活动开始时间"
4. 用户点击"确定"
5. 报名截止时间自动清空,用户重新选择正确的时间

### 场景2: 点击发布时参数校验失败

1. 用户填写活动信息并点击"发布"按钮
2. 后端返回参数校验失败,包含多个错误字段
3. **弹窗展示所有错误**:
   ```
   参数校验失败

   请修改以下内容后重试：

   • 活动标题: 活动标题长度不能超过200个字符
   • 总人数上限: 总人数上限至少为1

   [我知道了]  [返回修改]
   ```
4. 用户点击"返回修改"
5. 自动跳转到步骤1,用户修改错误内容
6. 重新填写并发布成功

### 场景3: 网络请求失败

1. 用户点击"发布"按钮
2. 网络异常导致请求失败
3. **弹窗提示**: "网络请求失败，请检查网络连接后重试"
4. 用户检查网络后重新尝试

## 🎯 优化效果

### 优化前
- ❌ 报名截止时间无校验,发布时才发现错误
- ❌ 参数校验失败只显示"参数校验失败",不知道哪里错了
- ❌ 网络错误只显示"操作失败,请重试",不知道具体原因

### 优化后
- ✅ 报名截止时间**实时校验**,立即发现问题
- ✅ 参数校验失败**列出所有错误项**,清楚知道哪里需要修改
- ✅ 提供**"返回修改"按钮**,快速跳转到对应步骤
- ✅ 网络错误**区分原因**,给出明确指引

## 🚀 后续优化建议

### 1. 步骤内联错误提示
在每个输入框下方实时显示错误提示,而不是等到发布时才弹窗。

**示例**:
```
[输入框: 活动标题]
⚠️ 标题长度不能超过200个字符 (当前已输入210个字符)
```

### 2. 错误字段高亮
当参数校验失败时,自动跳转到对应步骤并高亮显示错误字段。

### 3. 自动保存草稿
当发生错误时,自动保存当前输入内容为草稿,避免用户重复填写。

### 4. 智能提示
根据历史错误,提供智能提示。例如用户经常忘记填写联系方式,在步骤1就弹窗提醒。

---

**文档版本**: v1.0
**最后更新**: 2025-11-16
**维护人员**: 开发团队
