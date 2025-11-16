# 活动海报上传功能修复文档

## 🐛 问题描述

**问题位置**: 创建活动 - 步骤7（活动预览） - 上传活动海报

**错误信息**:
```
{
  errMsg: "chooseMedia:fail api scope is not declared in the privacy agreement",
  errno: 112
}
```

**问题原因**:
- 使用了 `wx.chooseMedia` API
- 该 API 需要在微信小程序隐私协议中声明才能使用
- 未配置隐私协议导致调用失败

## ✅ 解决方案

### 修改方案
使用 `wx.chooseImage` 替代 `wx.chooseMedia`

**理由**:
1. ✅ `wx.chooseImage` 是较旧的稳定 API，无需隐私协议声明
2. ✅ 功能完全满足需求（选择图片）
3. ✅ 兼容性更好，适合开发调试阶段使用

### 修改内容

**修改文件**: `pages/activities/create.js`

**修改前** (第1094-1108行):
```javascript
// 上传海报
uploadPoster() {
  wx.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFiles[0].tempFilePath;
      this.setData({ 'form.poster': tempFilePath });
      wx.showToast({ title: '海报已选择', icon: 'success' });
    },
    fail: (err) => {
      console.error('选择图片失败:', err);
      wx.showToast({ title: '选择图片失败', icon: 'none' });
    }
  });
}
```

**修改后** (第1145-1189行):
```javascript
// 上传海报
uploadPoster() {
  // 使用 wx.chooseImage 替代 wx.chooseMedia，避免隐私协议问题
  wx.chooseImage({
    count: 1, // 最多可以选择的图片张数
    sizeType: ['compressed'], // 压缩图，节省空间
    sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机
    success: (res) => {
      // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
      const tempFilePath = res.tempFilePaths[0];

      console.log('海报已选择:', tempFilePath);

      // 保存到表单数据
      this.setData({
        'form.poster': tempFilePath
      });

      wx.showToast({
        title: '海报已选择',
        icon: 'success',
        duration: 2000
      });
    },
    fail: (err) => {
      console.error('选择图片失败:', err);

      // 友好的错误提示
      let errorMsg = '选择图片失败';

      if (err.errMsg && err.errMsg.includes('cancel')) {
        errorMsg = '已取消选择';
      } else if (err.errMsg && err.errMsg.includes('permission')) {
        errorMsg = '请允许访问相册权限';
      } else if (err.errMsg && err.errMsg.includes('privacy')) {
        errorMsg = '请在小程序设置中允许访问相册';
      }

      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });
    }
  });
}
```

### 主要改进点

1. **API 替换**: `wx.chooseMedia` → `wx.chooseImage`
2. **路径获取**: `res.tempFiles[0].tempFilePath` → `res.tempFilePaths[0]`
3. **友好提示**: 增加了详细的错误类型判断和提示
4. **调试日志**: 添加 `console.log` 记录选择的图片路径

## 📱 使用方法

### 用户操作流程
1. 创建活动，填写完所有步骤
2. 进入步骤7 - 活动预览
3. 找到"活动海报"模块
4. 点击"上传海报"按钮
5. 选择相册或拍照
6. 选择图片
7. 看到提示"海报已选择"
8. 预览区域显示选择的图片

### 支持的图片来源
- ✅ 手机相册
- ✅ 拍照

### 图片处理
- 自动压缩（`sizeType: ['compressed']`）
- 节省存储空间和上传流量

## 🧪 测试验证

### 测试步骤
1. 打开微信开发者工具
2. 进入"创建活动"页面
3. 填写基本信息到步骤7
4. 点击"上传海报"按钮
5. 选择一张图片

### 预期结果
- ✅ 弹出图片选择器
- ✅ 可以选择相册或拍照
- ✅ 选择图片后显示"海报已选择"
- ✅ 图片路径保存到 `form.poster`
- ✅ 预览区域显示图片缩略图

### 错误处理测试
1. **取消选择**: 点击取消 → 提示"已取消选择"
2. **权限拒绝**: 拒绝相册权限 → 提示"请允许访问相册权限"
3. **隐私限制**: 隐私设置限制 → 提示"请在小程序设置中允许访问相册"

## 📊 API 对比

| 特性 | wx.chooseMedia | wx.chooseImage |
|-----|---------------|----------------|
| **发布时间** | 基础库 2.10.0+ | 基础库 1.0.0+ |
| **隐私协议** | ✅ 需要声明 | ❌ 无需声明 |
| **媒体类型** | 图片 + 视频 | 仅图片 |
| **返回格式** | `res.tempFiles[0].tempFilePath` | `res.tempFilePaths[0]` |
| **兼容性** | 较新 | 更好 |
| **适用场景** | 需要选择视频 | 仅选择图片 |

## 🔮 后续优化建议

### 1. 图片预览功能
当前只保存了图片路径，可以增加预览功能：
```javascript
// 在 WXML 中添加
<image wx:if="{{form.poster}}" src="{{form.poster}}" mode="aspectFit" />
```

### 2. 图片上传到服务器
目前只是临时路径，需要将图片上传到后端：
```javascript
wx.uploadFile({
  url: 'https://your-server.com/upload',
  filePath: tempFilePath,
  name: 'poster',
  success: (res) => {
    const imageUrl = JSON.parse(res.data).url;
    this.setData({ 'form.poster': imageUrl });
  }
});
```

### 3. 图片裁剪功能
允许用户裁剪图片到合适尺寸：
```javascript
wx.chooseImage({
  count: 1,
  sizeType: ['compressed'],
  sourceType: ['album', 'camera'],
  success: (res) => {
    // 跳转到图片裁剪页面
    wx.navigateTo({
      url: `/pages/crop/index?src=${res.tempFilePaths[0]}`
    });
  }
});
```

### 4. 支持多张图片
扩展为支持多张活动照片：
```javascript
wx.chooseImage({
  count: 9, // 最多9张
  sizeType: ['compressed'],
  sourceType: ['album', 'camera'],
  success: (res) => {
    const posters = this.data.form.posters || [];
    this.setData({
      'form.posters': [...posters, ...res.tempFilePaths]
    });
  }
});
```

### 5. 图片大小限制
检查图片大小，避免过大的图片：
```javascript
success: (res) => {
  wx.getFileInfo({
    filePath: res.tempFilePaths[0],
    success: (fileInfo) => {
      if (fileInfo.size > 5 * 1024 * 1024) { // 5MB
        wx.showToast({ title: '图片过大，请选择小于5MB的图片', icon: 'none' });
      } else {
        // 正常处理...
      }
    }
  });
}
```

## 🔗 相关文档

- [微信官方文档 - wx.chooseImage](https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.chooseImage.html)
- [微信官方文档 - wx.chooseMedia](https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.chooseMedia.html)
- [微信官方文档 - 隐私协议指引](https://developers.weixin.qq.com/miniprogram/dev/framework/user-privacy/)

## 📝 注意事项

### 隐私协议配置
如果将来需要使用 `wx.chooseMedia`（例如需要选择视频），需要配置隐私协议：

1. 在微信公众平台配置隐私协议
2. 在 `app.json` 中添加隐私声明：
```json
{
  "permission": {
    "scope.album": {
      "desc": "用于上传活动海报"
    }
  }
}
```

3. 在用户首次使用时弹窗提示：
```javascript
wx.getPrivacySetting({
  success: res => {
    if (!res.needAuthorization) {
      // 不需要授权，直接使用
      wx.chooseMedia({...});
    } else {
      // 需要授权，弹窗提示
      wx.showModal({
        title: '需要授权',
        content: '需要访问您的相册以上传活动海报',
        success: modalRes => {
          if (modalRes.confirm) {
            wx.chooseMedia({...});
          }
        }
      });
    }
  }
});
```

---

**文档版本**: v1.0
**修复日期**: 2025-11-16
**维护人员**: 开发团队
