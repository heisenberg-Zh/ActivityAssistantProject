# 地点选择模式切换功能文档

## 📋 功能概述

**实现日期**: 2025-11-16
**需求来源**: 用户反馈

## 🎯 功能说明

在创建活动的第3步"地点设置"中，新增了**定位模式切换**功能，支持在测试模式和真实定位模式之间自由切换：

- **测试模式（默认）**: 使用预设地点列表，适用于开发调试和模拟器测试
- **真实定位模式**: 使用微信原生GPS定位API，适用于真机测试和生产环境

## 💡 使用场景

### 测试模式 (默认)
- ✅ 开发阶段快速测试
- ✅ 模拟器中无法使用GPS时
- ✅ 不需要真实位置数据的场景
- ✅ 避免权限配置问题

### 真实定位模式
- ✅ 真机测试
- ✅ 需要真实GPS坐标的场景
- ✅ 生产环境发布
- ✅ 需要实际地图位置的活动

## 🛠️ 技术实现

### 1. 数据结构

在 `pages/activities/create.js` 的 `data` 对象中添加了模式标志：

```javascript
data: {
  mode: 'create',
  activityId: '',
  // ... 其他字段 ...

  // 地点选择模式
  useRealLocation: false, // false=测试模式(预设地点), true=真实定位模式

  // ... 其他字段 ...
}
```

### 2. 模式切换方法

**toggleLocationMode()** - 切换定位模式并给予用户反馈

```javascript
toggleLocationMode() {
  const useRealLocation = !this.data.useRealLocation;
  this.setData({ useRealLocation });
  wx.showToast({
    title: useRealLocation ? '已切换到真实定位' : '已切换到测试模式',
    icon: 'success',
    duration: 2000
  });
}
```

### 3. 地点选择逻辑

**chooseLocation()** - 根据当前模式选择不同的定位方式

```javascript
chooseLocation() {
  console.log('点击选择地点，当前模式:', this.data.useRealLocation ? '真实定位' : '测试模式');

  if (this.data.useRealLocation) {
    // 真实定位模式 - 使用微信原生API
    this.useRealLocationPicker();
  } else {
    // 测试模式 - 使用预设地点列表
    this.showLocationPicker();
  }
}
```

### 4. 真实GPS定位实现

**useRealLocationPicker()** - 调用微信原生定位API

```javascript
useRealLocationPicker() {
  console.log('使用真实GPS定位');

  wx.chooseLocation({
    success: (res) => {
      console.log('选择地点成功:', res);

      this.setData({
        'form.place': res.name,
        'form.address': res.address,
        'form.latitude': res.latitude,
        'form.longitude': res.longitude
      });

      wx.showToast({
        title: '已选择：' + res.name,
        icon: 'success',
        duration: 2000
      });

      this.checkCanPublish();
    },
    fail: (err) => {
      // 错误处理：取消、权限、隐私协议等
      this.handleLocationError(err);
    }
  });
}
```

### 5. 错误处理机制

针对不同的错误场景提供友好提示：

#### 场景1: 用户取消选择
```javascript
if (err.errMsg && err.errMsg.includes('cancel')) {
  console.log('用户取消选择地点');
  return; // 静默处理，不显示错误提示
}
```

#### 场景2: 位置权限未授予
```javascript
else if (err.errMsg && err.errMsg.includes('authorize')) {
  wx.showModal({
    title: '需要位置权限',
    content: '请在设置中允许小程序访问您的位置信息',
    confirmText: '去设置',
    success: (modalRes) => {
      if (modalRes.confirm) {
        wx.openSetting({
          success: (settingRes) => {
            if (settingRes.authSetting['scope.userLocation']) {
              wx.showToast({ title: '权限已开启，请重新选择', icon: 'success' });
            }
          }
        });
      }
    }
  });
}
```

#### 场景3: 隐私协议未配置
```javascript
else if (err.errMsg && err.errMsg.includes('privacy')) {
  wx.showModal({
    title: '位置权限未开启',
    content: '真实定位功能需要位置权限。您可以：\n1. 在设置中开启位置权限\n2. 或切换到测试模式使用预设地点',
    confirmText: '切换测试模式',
    cancelText: '我知道了',
    success: (modalRes) => {
      if (modalRes.confirm) {
        // 自动切换到测试模式
        this.setData({ useRealLocation: false });
        wx.showToast({ title: '已切换到测试模式', icon: 'success' });
      }
    }
  });
}
```

### 6. UI界面实现

在 `pages/activities/create.wxml` 第3步中添加了模式切换开关：

```xml
<!-- 定位模式切换开关 -->
<view class="option-row" style="margin-bottom: 24rpx; padding: 20rpx; background: #f0f9ff; border-radius: 16rpx; border-left: 4rpx solid #3b82f6;">
  <view class="option-label">
    <text class="text-md text-gray-800">{{useRealLocation ? '🌍 真实定位模式' : '🧪 测试模式'}}</text>
    <text class="text-xs text-gray-500">
      {{useRealLocation ? '使用手机GPS定位，适用于真实环境' : '使用预设地点列表，适用于开发测试'}}
    </text>
  </view>
  <switch checked="{{useRealLocation}}" bindchange="toggleLocationMode" color="#3b82f6" />
</view>
```

**视觉效果**:
- 浅蓝色背景 (`#f0f9ff`)
- 左侧蓝色边框强调 (`border-left: 4rpx solid #3b82f6`)
- 图标动态变化：🧪 测试模式 / 🌍 真实定位模式
- 说明文字根据模式动态显示

## 📊 模式对比

| 特性 | 测试模式 | 真实定位模式 |
|------|---------|-------------|
| **数据源** | 预设地点列表 | 微信GPS定位 |
| **权限需求** | 无 | 需要位置权限 |
| **适用环境** | 开发/模拟器 | 真机/生产 |
| **地点数量** | 6个预设地点 | 无限制 |
| **坐标精度** | 固定坐标 | 实时GPS |
| **网络要求** | 无 | 需要网络 |
| **配置难度** | 简单 | 需配置权限 |

## 🧪 测试场景

### 场景1: 开发环境测试
1. 打开微信开发者工具
2. 进入创建活动页面第3步
3. 确认默认为测试模式（开关关闭）
4. 点击"点击选择活动地点"
5. 从预设列表中选择一个地点
6. 验证地点信息正确填充

**预期结果**:
- ✅ 显示6个预设地点供选择
- ✅ 选择后地点名称和地址正确显示
- ✅ 坐标数据正确保存

### 场景2: 真实定位测试
1. 真机打开小程序
2. 进入创建活动页面第3步
3. 打开"真实定位模式"开关
4. 点击"点击选择活动地点"
5. 微信调起地图选择器
6. 选择一个实际地点

**预期结果**:
- ✅ 调起微信原生地图
- ✅ 显示当前位置和周边地点
- ✅ 选择后返回真实GPS坐标

### 场景3: 权限被拒绝
1. 真机关闭位置权限
2. 打开"真实定位模式"
3. 点击"点击选择活动地点"
4. 系统提示权限问题

**预期结果**:
- ✅ 显示权限提示弹窗
- ✅ 提供"去设置"按钮
- ✅ 提供"切换测试模式"选项

### 场景4: 模式切换
1. 在测试模式下选择地点A
2. 切换到真实定位模式
3. 选择地点B
4. 再切换回测试模式
5. 选择地点C

**预期结果**:
- ✅ 每次切换显示提示
- ✅ 地点信息正确更新
- ✅ 不会丢失已选择的数据

## 🚨 注意事项

### 1. 位置权限配置

真实定位模式需要在 `app.json` 中配置位置权限：

```json
{
  "permission": {
    "scope.userLocation": {
      "desc": "你的位置信息将用于活动签到和地点选择"
    }
  },
  "requiredPrivateInfos": [
    "chooseLocation",
    "getLocation"
  ]
}
```

### 2. 微信开发者工具设置

开发阶段需要在微信开发者工具中：
1. 打开"详情" → "本地设置"
2. 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"
3. 勾选"不校验隐私接口调用"

### 3. 真机测试要求

- 手机开启GPS定位服务
- 微信APP允许访问位置
- 小程序授予位置权限

### 4. 测试地点列表

当前预设的6个测试地点：

| 序号 | 地点名称 | 地址 | 用途 |
|------|---------|------|------|
| 1 | 北京大学 | 北京市海淀区颐和园路5号 | 教育机构 |
| 2 | 清华大学 | 北京市海淀区清华园1号 | 教育机构 |
| 3 | 中关村创业大街 | 北京市海淀区中关村大街 | 商业区 |
| 4 | 国家图书馆 | 北京市海淀区中关村南大街33号 | 公共设施 |
| 5 | 鸟巢（国家体育场） | 北京市朝阳区国家体育场南路1号 | 体育场馆 |
| 6 | 手动输入 | - | 自定义地点 |

## 📂 相关文件清单

### 修改的文件

| 文件路径 | 修改内容 | 行数 |
|---------|---------|------|
| `pages/activities/create.js` | 添加模式切换和真实定位逻辑 | 699-799 |
| `pages/activities/create.wxml` | 添加模式切换开关UI | 144-153 |

**具体修改**:

1. **create.js** (新增方法):
   - `toggleLocationMode()` - 切换模式
   - `useRealLocationPicker()` - 真实GPS定位
   - 修改 `chooseLocation()` - 模式分支逻辑

2. **create.wxml** (新增UI):
   - 模式切换开关
   - 动态图标和说明文字

### 相关文件（未修改）

| 文件路径 | 说明 |
|---------|------|
| `pages/activities/create.wxss` | 使用现有样式，无需修改 |
| `app.json` | 位置权限已配置（之前已添加） |

## 🔍 调试技巧

### 1. 查看当前模式

在控制台查看当前使用的模式：

```javascript
console.log('当前定位模式:', this.data.useRealLocation ? '真实定位' : '测试模式');
```

### 2. 模拟权限被拒绝

在微信开发者工具中：
1. 工具 → 项目详情 → 本地设置
2. 取消勾选"不校验隐私接口调用"
3. 测试权限提示流程

### 3. 查看选择的地点数据

```javascript
console.log('选中的地点:', {
  place: this.data.form.place,
  address: this.data.form.address,
  latitude: this.data.form.latitude,
  longitude: this.data.form.longitude
});
```

## 🎨 UI效果展示

### 测试模式（默认）

```
┌─────────────────────────────────────────┐
│ 地点设置                                 │
├─────────────────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│ ┃ 🧪 测试模式              [ OFF ]  ┃   │
│ ┃ 使用预设地点列表，适用于开发测试   ┃   │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│                                         │
│ 活动地点 *                              │
│ 📍 点击选择活动地点                     │
└─────────────────────────────────────────┘
```

### 真实定位模式

```
┌─────────────────────────────────────────┐
│ 地点设置                                 │
├─────────────────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│ ┃ 🌍 真实定位模式          [ ON ]   ┃   │
│ ┃ 使用手机GPS定位，适用于真实环境    ┃   │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│                                         │
│ 活动地点 *                              │
│ 📍 北京大学                             │
│ 北京市海淀区颐和园路5号                 │
└─────────────────────────────────────────┘
```

## 📝 后续优化建议

### 1. 缓存最近使用的地点

```javascript
// 保存最近使用的地点
saveRecentLocation(location) {
  let recentLocations = wx.getStorageSync('recent_locations') || [];
  recentLocations.unshift(location);
  recentLocations = recentLocations.slice(0, 5); // 只保留最近5个
  wx.setStorageSync('recent_locations', recentLocations);
}

// 在地点选择器中显示最近使用的地点
showLocationPicker() {
  const recentLocations = wx.getStorageSync('recent_locations') || [];
  // 在预设地点前显示最近使用的地点
}
```

### 2. 地点搜索功能

在真实定位模式下，允许用户搜索地点而不是只能从地图选择：

```javascript
searchLocation(keyword) {
  // 调用微信地图搜索API
  wx.request({
    url: 'https://apis.map.qq.com/ws/place/v1/search',
    data: { keyword, region: '北京' },
    success: (res) => {
      // 显示搜索结果供用户选择
    }
  });
}
```

### 3. 地点收藏功能

允许用户收藏常用地点：

```javascript
addFavoriteLocation(location) {
  let favorites = wx.getStorageSync('favorite_locations') || [];
  favorites.push({ ...location, id: Date.now() });
  wx.setStorageSync('favorite_locations', favorites);
}
```

### 4. 地点精度优化

在真实定位模式下，显示定位精度提示：

```javascript
wx.getLocation({
  type: 'gcj02',
  accuracy: 'best',
  success: (res) => {
    console.log('定位精度:', res.accuracy, '米');
    if (res.accuracy > 100) {
      wx.showToast({
        title: `定位精度较低（${res.accuracy}米），建议重新定位`,
        icon: 'none'
      });
    }
  }
});
```

## 🚀 发布检查清单

发布到生产环境前，请确认以下事项：

- [ ] `app.json` 中已配置位置权限
- [ ] 隐私协议中已说明位置使用用途
- [ ] 默认模式设置为测试模式 (`useRealLocation: false`)
- [ ] 真实定位功能在真机上测试通过
- [ ] 权限被拒绝的错误处理已测试
- [ ] 模式切换功能正常
- [ ] 预设地点列表正确
- [ ] 控制台日志已清理（生产环境可选）

## 📚 参考文档

- [微信小程序 - wx.chooseLocation API](https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.chooseLocation.html)
- [微信小程序 - 获取位置权限](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/authorize.html)
- [微信小程序 - 隐私保护指引](https://developers.weixin.qq.com/miniprogram/dev/framework/user-privacy/)

---

**文档版本**: v1.0
**创建日期**: 2025-11-16
**维护人员**: 开发团队
