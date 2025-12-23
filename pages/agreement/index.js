// pages/agreement/index.js
Page({
  data: {
  },

  onLoad(options) {
    wx.setNavigationBarTitle({
      title: '用户协议'
    });
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        // 如果没有上一页，跳转到登录页
        wx.redirectTo({
          url: '/pages/auth/login'
        });
      }
    });
  }
});
