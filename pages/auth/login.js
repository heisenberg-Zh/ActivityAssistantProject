// pages/auth/login.js
const app = getApp();

Page({
  data: {
    canLogin: true,
    isDev: true  // 开发模式标志，生产环境设为false
  },

  /**
   * 开发模式快捷登录（无需微信授权）
   */
  handleDevLogin() {
    console.log('🚀 使用开发模式快捷登录');

    // 模拟用户信息
    const mockUserInfo = {
      nickName: '测试用户',
      avatarUrl: '/activityassistant_avatar_01.png',
      gender: 1,
      country: '中国',
      province: '北京',
      city: '北京'
    };

    const currentUser = {
      id: 'u1',
      name: '张小北',
      avatar: '/activityassistant_avatar_01.png'
    };

    // 存储用户信息到全局数据
    app.globalData.userInfo = mockUserInfo;
    app.globalData.isLoggedIn = true;
    app.globalData.currentUserId = 'u1';
    app.globalData.currentUser = currentUser;

    // 存储到本地存储
    wx.setStorageSync('userInfo', mockUserInfo);
    wx.setStorageSync('isLoggedIn', true);
    wx.setStorageSync('currentUserId', 'u1');
    wx.setStorageSync('currentUser', currentUser);

    console.log('✅ 开发模式登录成功:', currentUser);

    wx.showToast({
      title: '开发登录成功',
      icon: 'success',
      duration: 1500
    });

    // 延迟跳转到首页
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/home/index'
      });
    }, 1500);
  },

  /**
   * 处理微信授权登录按钮点击
   */
  handleLogin() {
    if (!this.data.canLogin) {
      return;
    }

    this.setData({ canLogin: false });

    // 调用微信登录接口
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        console.log('✅ 获取用户信息成功', res);

        const userInfo = res.userInfo;

        // 存储用户信息到全局数据
        app.globalData.userInfo = userInfo;
        app.globalData.isLoggedIn = true;

        // 模拟生成用户ID（实际应从后端获取）
        // 这里使用u1作为默认测试用户
        app.globalData.currentUserId = 'u1';
        app.globalData.currentUser = {
          id: 'u1',
          name: userInfo.nickName || '张小北',
          avatar: userInfo.avatarUrl || '/activityassistant_avatar_01.png'
        };

        // 存储到本地存储
        wx.setStorageSync('userInfo', userInfo);
        wx.setStorageSync('isLoggedIn', true);
        wx.setStorageSync('currentUserId', 'u1');
        wx.setStorageSync('currentUser', app.globalData.currentUser);

        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        });

        // 延迟跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/home/index',
            success: () => {
              this.setData({ canLogin: true });
            }
          });
        }, 1500);
      },
      fail: (err) => {
        console.error('❌ 获取用户信息失败', err);
        wx.showModal({
          title: '提示',
          content: '微信授权失败，开发调试请使用"开发模式登录"按钮',
          showCancel: false
        });
        this.setData({ canLogin: true });
      }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查是否已登录
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    if (isLoggedIn) {
      // 已登录，直接跳转到首页
      wx.switchTab({
        url: '/pages/home/index'
      });
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时的逻辑
  }
});
