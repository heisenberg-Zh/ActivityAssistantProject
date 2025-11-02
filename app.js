// app.js
const { API_CONFIG, WX_CONFIG } = require('./utils/config.js');

App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    currentUserId: null,
    currentUser: null,
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
      const isLoggedIn = wx.getStorageSync('isLoggedIn');
      const currentUserId = wx.getStorageSync('currentUserId');
      const currentUser = wx.getStorageSync('currentUser');

      // 确保 isLoggedIn 是布尔值
      const loggedIn = isLoggedIn === true || isLoggedIn === 'true';

      if (userInfo && loggedIn) {
        this.globalData.userInfo = userInfo;
        this.globalData.isLoggedIn = true;
        this.globalData.currentUserId = currentUserId || 'u1';
        this.globalData.currentUser = currentUser || {
          id: 'u1',
          name: '张小北',
          avatar: '/activityassistant_avatar_01.png'
        };
        console.log('✅ 用户信息已加载:', this.globalData.currentUser);
      } else {
        console.log('⚠️ 用户未登录');
      }
    } catch (err) {
      console.error('❌ 加载用户信息失败:', err);
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    return this.globalData.isLoggedIn;
  },

  // 要求登录
  requireLogin() {
    if (!this.checkLoginStatus()) {
      wx.navigateTo({
        url: '/pages/auth/login'
      });
      return false;
    }
    return true;
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
    this.globalData.isLoggedIn = false;
    this.globalData.currentUserId = null;
    this.globalData.currentUser = null;
    try {
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('isLoggedIn');
      wx.removeStorageSync('currentUserId');
      wx.removeStorageSync('currentUser');
      wx.removeStorageSync('user_token');
    } catch (err) {
      console.error('清除用户信息失败:', err);
    }
  }
});
