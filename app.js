// app.js
const { API_CONFIG, WX_CONFIG } = require('./utils/config.js');

App({
  globalData: {
    userInfo: null,
    apiBase: API_CONFIG.baseUrl,
    useMock: API_CONFIG.useMock,
    appId: WX_CONFIG.appId
  },

  onLaunch() {
    console.log('ActivityAssistant app launched');

    // 检查更新
    this.checkForUpdate();

    // 初始化用户信息
    this.initUserInfo();
  },

  // 检查小程序更新
  checkForUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();

      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          console.log('发现新版本');
        }
      });

      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });

      updateManager.onUpdateFailed(() => {
        console.error('新版本下载失败');
      });
    }
  },

  // 初始化用户信息
  initUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.globalData.userInfo = userInfo;
        console.log('用户信息已加载');
      }
    } catch (err) {
      console.error('加载用户信息失败:', err);
    }
  },

  // 设置用户信息
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
    try {
      wx.setStorageSync('userInfo', userInfo);
    } catch (err) {
      console.error('保存用户信息失败:', err);
    }
  },

  // 清除用户信息
  clearUserInfo() {
    this.globalData.userInfo = null;
    try {
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('user_token');
    } catch (err) {
      console.error('清除用户信息失败:', err);
    }
  }
});
