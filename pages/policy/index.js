// pages/policy/index.js
Page({
  data: {
    effectiveDate: ''
  },

  onLoad(options) {
    wx.setNavigationBarTitle({
      title: '隐私政策'
    });

    // 设置生效日期为当天
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.setData({
      effectiveDate: `${year}年${month}月${day}日`
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
