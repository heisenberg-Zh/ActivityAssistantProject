const app = getApp();

Page({
  data: {
    submitting: false
  },

  onLoad() {
    this.hasResponded = false;
  },

  agreePrivacy() {
    if (this.data.submitting) {
      return;
    }

    this.setData({ submitting: true });
    this.hasResponded = true;
    app.completePrivacyAuthorization && app.completePrivacyAuthorization(true);
    wx.showToast({ title: '已同意', icon: 'success', duration: 1500 });
    wx.navigateBack({ delta: 1 });
  },

  disagreePrivacy() {
    if (this.data.submitting) {
      return;
    }

    this.setData({ submitting: true });
    this.hasResponded = true;
    app.completePrivacyAuthorization && app.completePrivacyAuthorization(false);
    wx.showToast({ title: '已取消', icon: 'none', duration: 1500 });
    wx.navigateBack({ delta: 1 });
  },

  viewPrivacyContract() {
    if (typeof wx.openPrivacyContract === 'function') {
      wx.openPrivacyContract({
        fail: () => {
          wx.showToast({ title: '无法打开隐私政策', icon: 'none' });
        }
      });
    } else {
      wx.showToast({ title: '请在设置中查看隐私政策', icon: 'none' });
    }
  },

  onUnload() {
    if (!this.hasResponded && app.completePrivacyAuthorization) {
      app.completePrivacyAuthorization(false);
    }
  }
});
