// app.js
const { API_CONFIG, WX_CONFIG } = require('./utils/config.js');
const scheduler = require('./utils/scheduler.js');
const notification = require('./utils/notification.js');
const { setSecureStorage, getSecureStorage } = require('./utils/security.js');
const { cleanCorruptedStorage, checkStorageHealth } = require('./utils/storage-cleaner.js');

App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    currentUserId: null,
    currentUser: null,
    apiBase: API_CONFIG.baseUrl,
    useMock: API_CONFIG.useMock,
    appId: WX_CONFIG.appId,
    // 系统信息
    statusBarHeight: 0,
    navigationBarHeight: 44,
    systemInfo: null
  },

  onLaunch() {
    console.log('====== 小程序启动 ======');

    // 打印环境配置信息
    console.log('当前环境:', API_CONFIG.env);
    console.log('API地址:', API_CONFIG.baseUrl);

    // 清理损坏的存储数据
    try {
      const cleanedCount = cleanCorruptedStorage();
      if (cleanedCount > 0) {
        console.log(`🧹 已清理 ${cleanedCount} 个损坏的存储项`);
      }
    } catch (err) {
      console.error('清理存储时出错:', err);
    }

    // 获取系统信息
    this.getSystemInfo();

    // 检查更新
    this.checkForUpdate();

    // 初始化用户信息（从本地读取）
    this.initUserInfo();

    // 【核心】静默登录 - 保持登录状态
    this.silentLogin();

    // 检查定时任务
    this.checkScheduledTasks();
  },

  onShow() {
    console.log('====== 小程序唤醒 ======');

    // 每次小程序显示时检查定时任务
    this.checkScheduledTasks();

    // 【核心】检查登录状态，如有需要则续期
    this.checkAndRefreshLogin();
  },

  // 获取系统信息
  getSystemInfo() {
    try {
      // 使用新的API替代已废弃的 wx.getSystemInfoSync
      const windowInfo = wx.getWindowInfo();
      const deviceInfo = wx.getDeviceInfo();

      // 保留向后兼容性：合并为 systemInfo 对象
      const systemInfo = {
        ...windowInfo,
        ...deviceInfo
      };

      this.globalData.systemInfo = systemInfo;
      this.globalData.statusBarHeight = windowInfo.statusBarHeight || 0;
      console.log('系统状态栏高度:', this.globalData.statusBarHeight);
    } catch (err) {
      console.error('获取系统信息失败:', err);
    }
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
      // 尝试读取用户信息（兼容旧数据）
      let userInfo = null;
      let currentUserId = null;
      let currentUser = null;

      // 安全读取用户信息
      try {
        userInfo = getSecureStorage('userInfo');
      } catch (err) {
        console.warn('读取userInfo失败，尝试清理:', err);
        wx.removeStorageSync('userInfo');
      }

      try {
        currentUserId = getSecureStorage('currentUserId');
      } catch (err) {
        console.warn('读取currentUserId失败，尝试清理:', err);
        wx.removeStorageSync('currentUserId');
      }

      try {
        currentUser = getSecureStorage('currentUser');
      } catch (err) {
        console.warn('读取currentUser失败，尝试清理:', err);
        wx.removeStorageSync('currentUser');
      }

      const isLoggedIn = wx.getStorageSync('isLoggedIn'); // 登录状态不加密

      // 确保 isLoggedIn 是布尔值
      const loggedIn = isLoggedIn === true || isLoggedIn === 'true';

      if (userInfo && loggedIn) {
        this.globalData.userInfo = userInfo;
        this.globalData.isLoggedIn = true;
        this.globalData.currentUserId = currentUserId || 'u1';
        this.globalData.currentUser = currentUser || {
          id: 'u1',
          name: '张小匠',
          avatar: '/activityassistant_avatar_01.png'
        };
        console.log('✅ 用户信息已加载:', this.globalData.currentUser);
      } else {
        // 初始化默认用户（开发环境）
        console.log('⚠️ 用户未登录，使用默认用户');
        this.globalData.isLoggedIn = false;
        this.globalData.currentUserId = 'u1';
        this.globalData.currentUser = {
          id: 'u1',
          name: '张小匠',
          avatar: '/activityassistant_avatar_01.png'
        };
      }
    } catch (err) {
      console.error('❌ 加载用户信息失败:', err);
      // 降级处理：使用默认用户
      this.globalData.isLoggedIn = false;
      this.globalData.currentUserId = 'u1';
      this.globalData.currentUser = {
        id: 'u1',
        name: '张小匠',
        avatar: '/activityassistant_avatar_01.png'
      };
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    return this.globalData.isLoggedIn;
  },

  /**
   * 静默登录 - 在小程序启动时自动登录
   * 适用场景：
   * 1. 首次打开小程序（未登录）
   * 2. 曾经登录过但Token已过期
   * 3. 微信登录态有效，自动续期
   */
  async silentLogin() {
    try {
      console.log('🔐 开始静默登录检查...');

      // 检查是否已有Token
      const token = wx.getStorageSync('token');
      const isLoggedIn = wx.getStorageSync('isLoggedIn');

      if (!token || !isLoggedIn) {
        console.log('💡 未登录或Token丢失，尝试自动登录');
        await this.performSilentLogin();
        return;
      }

      // 有Token，检查微信登录态是否有效
      console.log('💡 检查微信登录态...');
      wx.checkSession({
        success: async () => {
          console.log('✅ 微信登录态有效，Token可继续使用');
          // 微信登录态有效，Token也可以继续使用
          this.globalData.isLoggedIn = true;
        },
        fail: async () => {
          console.log('⚠️ 微信登录态已过期，重新静默登录');
          // 微信登录态失效，需要重新登录
          await this.performSilentLogin();
        }
      });
    } catch (err) {
      console.error('❌ 静默登录检查失败:', err);
    }
  },

  /**
   * 检查并刷新登录状态 - 在小程序onShow时调用
   * 避免频繁刷新，使用节流机制
   */
  async checkAndRefreshLogin() {
    try {
      // 节流：距离上次检查少于30秒，跳过
      const now = Date.now();
      if (this._lastLoginCheck && (now - this._lastLoginCheck) < 30000) {
        return;
      }
      this._lastLoginCheck = now;

      const token = wx.getStorageSync('token');
      if (!token) {
        console.log('💡 onShow: 未登录，尝试静默登录');
        await this.performSilentLogin();
        return;
      }

      // 检查微信登录态
      wx.checkSession({
        success: () => {
          console.log('✅ onShow: 微信登录态有效');
        },
        fail: async () => {
          console.log('⚠️ onShow: 微信登录态失效，重新登录');
          await this.performSilentLogin();
        }
      });
    } catch (err) {
      console.error('❌ onShow登录检查失败:', err);
    }
  },

  /**
   * 执行静默登录
   * 核心逻辑：调用wx.login获取code，然后调用后端登录接口
   */
  async performSilentLogin() {
    try {
      console.log('🔄 执行静默登录...');

      // 第一步：获取微信登录code
      const code = await this.getWxLoginCode();
      console.log('✅ 获取到微信code');

      // 第二步：调用后端登录API
      const response = await this.callLoginAPI(code);

      if (response.code === 0 && response.data) {
        const { token, userInfo } = response.data;

        // 第三步：保存登录信息
        wx.setStorageSync('token', token);
        wx.setStorageSync('isLoggedIn', true);

        try {
          setSecureStorage('userInfo', {
            nickName: userInfo.nickname,
            avatarUrl: userInfo.avatar,
            id: userInfo.id
          });
          setSecureStorage('currentUserId', userInfo.id);
          setSecureStorage('currentUser', {
            id: userInfo.id,
            name: userInfo.nickname,
            avatar: userInfo.avatar
          });
        } catch (err) {
          // 加密存储失败，使用普通存储
          wx.setStorageSync('userInfo', {
            nickName: userInfo.nickname,
            avatarUrl: userInfo.avatar,
            id: userInfo.id
          });
          wx.setStorageSync('currentUserId', userInfo.id);
          wx.setStorageSync('currentUser', {
            id: userInfo.id,
            name: userInfo.nickname,
            avatar: userInfo.avatar
          });
        }

        // 第四步：更新全局数据
        this.globalData.isLoggedIn = true;
        this.globalData.currentUserId = userInfo.id;
        this.globalData.userInfo = {
          nickName: userInfo.nickname,
          avatarUrl: userInfo.avatar,
          id: userInfo.id
        };
        this.globalData.currentUser = {
          id: userInfo.id,
          name: userInfo.nickname,
          avatar: userInfo.avatar
        };

        console.log('✅ 静默登录成功:', userInfo.nickname || userInfo.id);
      } else {
        console.warn('⚠️ 静默登录失败:', response.message);
        // 失败不影响使用，允许游客模式
      }
    } catch (err) {
      console.error('❌ 静默登录异常:', err);
      // 异常不影响使用，允许游客模式
    }
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
      // 使用加密存储保存用户信息
      setSecureStorage('userInfo', userInfo);
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
      // 清除所有用户相关的存储
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('isLoggedIn');
      wx.removeStorageSync('currentUserId');
      wx.removeStorageSync('currentUser');
      wx.removeStorageSync('token');
    } catch (err) {
      console.error('清除用户信息失败:', err);
    }
  },

  // 获取微信登录code
  getWxLoginCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            resolve(res.code);
          } else {
            reject(new Error('获取微信code失败'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  // 调用登录API
  callLoginAPI(code) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.apiBase}/api/auth/login`,
        method: 'POST',
        data: { code },
        header: {
          'content-type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`登录失败: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  // 检查定时任务
  checkScheduledTasks() {
    console.log('[定时任务] 开始检查定时任务...');

    // 检查并执行到期的任务
    const executedTasks = scheduler.checkAndExecuteTasks((activityId) => {
      console.log('[定时任务] 执行任务:', activityId);
      this.publishScheduledActivity(activityId);
    });

    if (executedTasks.length > 0) {
      console.log('[定时任务] 已执行', executedTasks.length, '个任务');
    } else {
      console.log('[定时任务] 当前无到期任务');
    }

    // 清理旧任务（保留最近7天的记录）
    scheduler.cleanupOldTasks(7);
  },

  // 发布预发布活动
  async publishScheduledActivity(activityId) {
    console.log('[定时发布] 开始发布活动:', activityId);

    try {
      // 导入 activityAPI
      const { activityAPI } = require('./utils/api.js');

      // 获取活动详情（确认活动存在）
      const detailResult = await activityAPI.getDetail(activityId);

      if (detailResult.code !== 0 || !detailResult.data) {
        console.error('[定时发布] 活动不存在:', activityId);
        scheduler.updateTaskStatus(activityId, 'failed', '活动不存在');
        notification.sendPublishFailedNotification(activityId, '未知活动', '活动不存在');
        return;
      }

      const activity = detailResult.data;
      console.log('[定时发布] 活动信息:', activity.title);

      // 调用发布API
      const publishResult = await activityAPI.publish(activityId);

      if (publishResult.code === 0) {
        console.log('[定时发布] 发布成功:', activity.title);

        // 更新任务状态为已发布
        scheduler.updateTaskStatus(activityId, 'published');

        // 发送成功通知
        notification.sendPublishSuccessNotification(activityId, activity.title);
      } else {
        console.error('[定时发布] 发布失败:', publishResult.message);

        // 更新任务状态为失败
        scheduler.updateTaskStatus(activityId, 'failed', publishResult.message || '发布失败');

        // 发送失败通知
        notification.sendPublishFailedNotification(activityId, activity.title, publishResult.message || '发布失败');
      }
    } catch (err) {
      console.error('[定时发布] 发布异常:', err);
      scheduler.updateTaskStatus(activityId, 'failed', err.message || '未知错误');
      notification.sendPublishFailedNotification(activityId, '未知活动', err.message || '未知错误');
    }
  }
});
