// pages/auth/login.js
const { API_CONFIG } = require('../../utils/config.js');
const { setSecureStorage } = require('../../utils/security.js');
const app = getApp();

const PRIVACY_CONSENT_KEY = 'privacyConsent';
const AGREEMENT_VERSION = '2025-12-30';
const POLICY_VERSION = '2025-12-30';

Page({
  data: {
    canLogin: true,
    isDev: false,  // 生产环境：禁用开发模式登录
    privacyConsent: false
  },

  ensurePrivacyConsent() {
    if (this.data.privacyConsent === true) return true;
    wx.showToast({
      title: '请先阅读并同意《用户协议》和《隐私政策》',
      icon: 'none'
    });
    return false;
  },

  togglePrivacyConsent() {
    const next = !this.data.privacyConsent;
    this.setData({ privacyConsent: next });

    if (next) {
      wx.setStorageSync(PRIVACY_CONSENT_KEY, {
        accepted: true,
        agreementVersion: AGREEMENT_VERSION,
        policyVersion: POLICY_VERSION,
        acceptedAt: new Date().toISOString()
      });
    } else {
      wx.removeStorageSync(PRIVACY_CONSENT_KEY);
    }
  },

  /**
   * 开发模式快捷登录（无需微信授权）
   * 优先调用后端API，失败时自动降级为纯前端Mock模式
   */
  async handleDevLogin() {
    console.log('🚀 使用开发模式快捷登录');

    try {
      if (!this.ensurePrivacyConsent()) {
        return;
      }

      // 显示加载提示
      wx.showLoading({
        title: '登录中...',
        mask: true
      });

      // 尝试调用后端登录API
      console.log('📡 尝试调用后端登录API（开发模式）');
      const loginResult = await this.callBackendLogin('test_code_dev');
      console.log('✅ 开发模式登录成功（后端）:', loginResult);

      // 保存token和用户信息
      this.saveLoginInfo(loginResult);

      // 关闭加载提示
      wx.hideLoading();

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

    } catch (error) {
      console.warn('⚠️ 后端登录失败，尝试使用纯前端Mock模式:', error);

      // 自动降级为纯前端Mock模式
      try {
        this.handleMockLogin();
      } catch (mockError) {
        console.error('❌ Mock登录也失败了:', mockError);
        wx.hideLoading();

        wx.showModal({
          title: '登录失败',
          content: '开发登录失败\n\n可能原因：\n1. 微信开发者工具未禁用域名校验\n2. 后端服务未启动\n\n已自动切换到离线模式',
          showCancel: false,
          confirmText: '我知道了'
        });
      }
    }
  },

  /**
   * 纯前端Mock登录（无需后端，供离线开发使用）
   */
  handleMockLogin() {
    console.log('🎭 使用纯前端Mock模式登录');

    if (!this.ensurePrivacyConsent()) {
      wx.hideLoading();
      return;
    }

    // 模拟的token和用户信息
    const mockToken = 'mock_token_' + Date.now();
    const mockUser = {
      id: 'u1',
      userId: 'u1',
      nickname: 'Test User',
      avatar: '/activityassistant_avatar_01.png',
      role: 'organizer'
    };

    // 保存mock数据
    wx.setStorageSync('token', mockToken);
    wx.setStorageSync('isLoggedIn', true);

    try {
      setSecureStorage('userInfo', {
        nickName: mockUser.nickname,
        avatarUrl: mockUser.avatar,
        id: mockUser.id
      });
      setSecureStorage('currentUserId', mockUser.id);
      setSecureStorage('currentUser', {
        id: mockUser.id,
        name: mockUser.nickname,
        avatar: mockUser.avatar
      });
    } catch (err) {
      console.warn('加密存储失败，使用普通存储:', err);
      wx.setStorageSync('userInfo', {
        nickName: mockUser.nickname,
        avatarUrl: mockUser.avatar,
        id: mockUser.id
      });
      wx.setStorageSync('currentUserId', mockUser.id);
      wx.setStorageSync('currentUser', {
        id: mockUser.id,
        name: mockUser.nickname,
        avatar: mockUser.avatar
      });
    }

    // 更新全局数据
    app.globalData.isLoggedIn = true;
    app.globalData.currentUserId = mockUser.id;
    app.globalData.userInfo = {
      nickName: mockUser.nickname,
      avatarUrl: mockUser.avatar,
      id: mockUser.id
    };
    app.globalData.currentUser = {
      id: mockUser.id,
      name: mockUser.nickname,
      avatar: mockUser.avatar
    };

    console.log('✅ Mock登录成功（纯前端模式）');

    // 关闭加载提示
    wx.hideLoading();

    wx.showToast({
      title: '开发登录成功（离线）',
      icon: 'success',
      duration: 2000
    });

    // 延迟跳转到首页
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/home/index'
      });
    }, 2000);
  },

  /**
   * 处理微信授权登录按钮点击
   * 完整流程：wx.login获取code -> 发送到后端 -> 保存token和用户信息 -> 跳转首页
   */
  async handleLogin() {
    if (!this.data.canLogin) {
      return;
    }

    if (!this.ensurePrivacyConsent()) {
      return;
    }

    this.setData({ canLogin: false });

    try {
      // 显示加载提示
      wx.showLoading({
        title: '登录中...',
        mask: true
      });

      // 第一步：调用 wx.login 获取临时登录凭证code
      console.log('📱 步骤1: 调用 wx.login 获取code');
      const loginCode = await this.getWxLoginCode();
      console.log('✅ 获取到code:', loginCode);

      // 第二步：将code发送到后端进行登录认证
      console.log('🔐 步骤2: 调用后端登录API');
      const loginResult = await this.callBackendLogin(loginCode);
      console.log('✅ 后端登录成功:', loginResult);

      // 第三步：保存token和用户信息
      console.log('💾 步骤3: 保存用户信息和token');
      this.saveLoginInfo(loginResult);

      // 关闭加载提示
      wx.hideLoading();

      // 第四步：显示成功提示并跳转
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      });

      console.log('✅ 微信授权登录完成');

      // 延迟跳转到首页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/home/index',
          success: () => {
            this.setData({ canLogin: true });
          }
        });
      }, 1500);

    } catch (error) {
      console.error('❌ 登录失败:', error);
      wx.hideLoading();

      // 根据不同错误显示不同提示
      let errorMessage = '登录失败，请重试';

      if (error.type === 'wx_login_fail') {
        errorMessage = '微信登录失败，请检查网络连接';
      } else if (error.type === 'backend_error') {
        errorMessage = error.message || '服务器错误，请稍后重试';
      } else if (error.type === 'network_error') {
        errorMessage = '网络连接失败，请检查网络设置';
      }

      wx.showModal({
        title: '登录失败',
        content: errorMessage + '\n\n开发调试可使用"开发模式登录"按钮',
        showCancel: false,
        confirmText: '我知道了'
      });

      this.setData({ canLogin: true });
    }
  },

  /**
   * 获取微信登录code
   */
  getWxLoginCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            resolve(res.code);
          } else {
            reject({
              type: 'wx_login_fail',
              message: '获取微信登录凭证失败'
            });
          }
        },
        fail: (err) => {
          console.error('wx.login 调用失败:', err);
          reject({
            type: 'wx_login_fail',
            message: err.errMsg || '微信登录调用失败'
          });
        }
      });
    });
  },

  /**
   * 调用后端登录API
   */
  callBackendLogin(code) {
    return new Promise((resolve, reject) => {
      const apiBase = API_CONFIG.baseUrl;
      const loginUrl = `${apiBase}/api/auth/login`;

      console.log('📡 发送登录请求:', loginUrl);

      wx.request({
        url: loginUrl,
        method: 'POST',
        data: { code },
        header: {
          'content-type': 'application/json'
        },
        timeout: 10000,
        success: (res) => {
          console.log('📥 后端响应:', res);

          if (res.statusCode === 200) {
            const responseData = res.data;

            // 检查响应格式
            if (responseData.code === 0 && responseData.data) {
              resolve(responseData.data);
            } else {
              reject({
                type: 'backend_error',
                message: responseData.message || '登录失败'
              });
            }
          } else {
            reject({
              type: 'backend_error',
              message: `服务器错误 (${res.statusCode})`
            });
          }
        },
        fail: (err) => {
          console.error('❌ 请求失败:', err);
          reject({
            type: 'network_error',
            message: err.errMsg || '网络请求失败'
          });
        }
      });
    });
  },

  /**
   * 保存登录信息
   */
  saveLoginInfo(loginData) {
    const { token, userInfo } = loginData;  // 修正：后端返回 userInfo 而不是 user

    console.log('保存用户信息:', {
      userId: userInfo.id,  // 修正：后端返回 id 而不是 userId
      nickname: userInfo.nickname
    });

    // 保存token
    wx.setStorageSync('token', token);
    wx.setStorageSync('isLoggedIn', true);

    // 保存用户信息（使用加密存储）
    const userId = userInfo.id;  // 修正：直接使用 id
    const userInfoStorage = {
      nickName: userInfo.nickname,
      avatarUrl: userInfo.avatar,
      id: userId
    };

    try {
      setSecureStorage('userInfo', userInfoStorage);
      setSecureStorage('currentUserId', userId);
      setSecureStorage('currentUser', {
        id: userId,
        name: userInfo.nickname,
        avatar: userInfo.avatar
      });
    } catch (err) {
      console.warn('加密存储失败，使用普通存储:', err);
      wx.setStorageSync('userInfo', userInfoStorage);
      wx.setStorageSync('currentUserId', userId);
      wx.setStorageSync('currentUser', {
        id: userId,
        name: userInfo.nickname,
        avatar: userInfo.avatar
      });
    }

    // 更新全局数据
    app.globalData.isLoggedIn = true;
    app.globalData.currentUserId = userId;
    app.globalData.userInfo = userInfoStorage;
    app.globalData.currentUser = {
      id: userId,
      name: userInfo.nickname,
      avatar: userInfo.avatar
    };

    console.log('✅ 用户信息保存成功');
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 初始化隐私协议同意状态（仅在版本未变更时记住勾选）
    try {
      const stored = wx.getStorageSync(PRIVACY_CONSENT_KEY);
      const consent = stored && typeof stored === 'string' ? JSON.parse(stored) : stored;
      const ok = consent
        && consent.accepted === true
        && consent.agreementVersion === AGREEMENT_VERSION
        && consent.policyVersion === POLICY_VERSION;
      this.setData({ privacyConsent: !!ok });
      if (!ok) {
        wx.removeStorageSync(PRIVACY_CONSENT_KEY);
      }
    } catch (err) {
      wx.removeStorageSync(PRIVACY_CONSENT_KEY);
      this.setData({ privacyConsent: false });
    }

    // 允许游客访问登录页，不强制跳转
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    if (isLoggedIn) {
      console.log('已登录用户访问登录页，可能需要切换账号');
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时的逻辑
  },

  /**
   * 返回上一页（游客模式）
   */
  goBack() {
    // 检查页面栈
    const pages = getCurrentPages();

    if (pages.length > 1) {
      // 有历史页面，返回上一页
      wx.navigateBack({
        delta: 1
      });
    } else {
      // 没有历史页面，跳转到首页
      wx.switchTab({
        url: '/pages/home/index'
      });
    }
  },

  /**
   * 查看用户协议
   */
  viewAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/index'
    });
  },

  /**
   * 查看隐私政策
   */
  viewPolicy() {
    wx.navigateTo({
      url: '/pages/policy/index'
    });
  }
});
