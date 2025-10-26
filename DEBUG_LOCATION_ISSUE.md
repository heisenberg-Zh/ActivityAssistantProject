# 地点选择功能调试指南

## 问题描述

在模拟器中，地点设置时点击"选择活动地点"无反应，后台报错，无法点击下一步。

---

## 调试步骤

### 步骤1：查看控制台日志

1. **打开微信开发者工具**
2. **点击底部的"控制台"标签页**
3. **清空控制台日志**（点击清空按钮）
4. **进入创建活动页面，到达步骤3**
5. **点击"点击选择活动地点"按钮**
6. **观察控制台输出**

**应该看到的日志**：
```
点击选择地点
系统信息: {platform: "devtools", ...}
模拟器环境，使用预设地点选择
显示地点选择器
```

**如果看到错误**，记录错误信息的完整内容。

---

## 常见错误及解决方案

### 错误1：`wx.showActionSheet is not a function`

**原因**：开发者工具版本过低

**解决方案**：
1. 更新微信开发者工具到最新版本
2. 或者使用手动输入方式（代码已自动降级处理）

---

### 错误2：`Cannot read property 'xxx' of undefined`

**原因**：data 数据未正确初始化

**解决方案**：
1. 重新编译项目（Ctrl + B）
2. 清除缓存后重启开发工具

---

### 错误3：点击无反应，无任何日志输出

**原因1**：bindtap 绑定失败

**检查方法**：
1. 打开 `pages/activities/create.wxml`
2. 搜索 `chooseLocation`
3. 确认代码为：`bindtap="chooseLocation"`

**原因2**：编译未生效

**解决方案**：
1. 保存所有文件
2. 重新编译（Ctrl + B）
3. 等待编译完成后再测试

---

## 快速修复方案

如果上述方法都不行，可以使用以下临时方案：

### 方案A：直接使用手动输入

在 `pages/activities/create.js` 的 `chooseLocation` 方法中，直接调用手动输入：

```javascript
// 选择地点
chooseLocation() {
  console.log('点击选择地点');
  // 直接使用手动输入
  this.manualInputLocation();
},
```

### 方案B：使用测试数据

在点击地点选择后，直接填充测试数据：

```javascript
// 选择地点
chooseLocation() {
  console.log('点击选择地点');

  // 使用测试数据
  this.setData({
    'form.place': '北京大学',
    'form.address': '北京市海淀区颐和园路5号',
    'form.latitude': 39.9925,
    'form.longitude': 116.3061
  });

  wx.showToast({ title: '已设置测试地点', icon: 'success' });
},
```

---

## 验证地点是否已设置

即使选择器没有弹出，也可以通过以下方式验证地点是否已设置：

### 方法1：查看页面显示

步骤3的页面上，如果地点已设置，应该显示：
```
📍 北京大学
北京市海淀区颐和园路5号
```

### 方法2：查看 data 数据

在控制台输入：
```javascript
getCurrentPages()[getCurrentPages().length - 1].data.form.place
```

如果返回地点名称（不是空字符串），说明地点已设置成功。

---

## 绕过验证继续测试

如果实在无法选择地点，可以临时修改验证逻辑：

在 `pages/activities/create.js` 的 `validateCurrentStep` 方法中，找到步骤3的验证：

```javascript
case 3: // 地点设置
  if (!form.place || !form.address) {
    wx.showToast({ title: '请选择活动地点', icon: 'none' });
    return false;
  }
  // ... 省略其他代码
  break;
```

**临时注释掉验证**（仅用于调试）：
```javascript
case 3: // 地点设置
  // if (!form.place || !form.address) {
  //   wx.showToast({ title: '请选择活动地点', icon: 'none' });
  //   return false;
  // }

  // 临时使用默认值
  if (!this.data.form.place) {
    this.setData({
      'form.place': '测试地点',
      'form.address': '测试地址',
      'form.latitude': 39.9042,
      'form.longitude': 116.4074
    });
  }
  break;
```

---

## 检查清单

在报告问题前，请确认以下内容：

- [ ] 已重新编译项目
- [ ] 已清除缓存
- [ ] 已保存所有文件
- [ ] 控制台没有红色错误信息
- [ ] 微信开发者工具版本不低于 1.05.2109190
- [ ] 项目配置中已开启 ES6 转 ES5
- [ ] 已查看控制台的完整日志

---

## 需要提供的信息

如果问题仍未解决，请提供以下信息：

1. **微信开发者工具版本号**
   - 帮助 → 关于 → 查看版本号

2. **控制台完整错误信息**
   - 红色错误的完整文本
   - 包括错误堆栈信息

3. **控制台日志**
   - 点击地点选择后的所有日志输出

4. **点击时的现象**
   - 是否有任何反应（如按钮变色、页面闪烁等）
   - 是否弹出任何对话框

5. **项目配置截图**
   - project.config.json 文件内容

---

## 最后更新

- **版本**: v1.0
- **日期**: 2025-10-27
- **状态**: 已添加详细日志和错误处理
