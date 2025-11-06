// app.js
const { API_CONFIG, WX_CONFIG } = require('./utils/config.js');
const scheduler = require('./utils/scheduler.js');
const notification = require('./utils/notification.js');

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
    console.log('ActivityAssistant app launched');

    // 获取系统信息
    this.getSystemInfo();

    // 检查更新
    this.checkForUpdate();

    // 初始化用户信息
    this.initUserInfo();

    // 检查定时任务
    this.checkScheduledTasks();
  },

  onShow() {
    console.log('App onShow - 检查定时任务');
    // 每次小程序显示时检查定时任务
    this.checkScheduledTasks();
  },

  // 获取系统信息
  getSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.systemInfo = systemInfo;
      this.globalData.statusBarHeight = systemInfo.statusBarHeight || 0;
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

  // 模拟发布预发布活动
  publishScheduledActivity(activityId) {
    console.log('[定时发布] 开始发布活动:', activityId);

    try {
      // 模拟API调用发布活动（实际应调用后端API）
      // 这里只是模拟，真实环境需要调用 activityAPI.publish(activityId)

      const { activities } = require('./utils/mock.js');
      const activity = activities.find(a => a.id === activityId);

      if (!activity) {
        console.error('[定时发布] 活动不存在:', activityId);
        scheduler.updateTaskStatus(activityId, 'failed', '活动不存在');
        notification.sendPublishFailedNotification(activityId, '未知活动', '活动不存在');
        return;
      }

      // 模拟发布过程
      setTimeout(() => {
        // 随机模拟成功或失败（90%成功率）
        const success = Math.random() > 0.1;

        if (success) {
          console.log('[定时发布] 发布成功:', activity.title);

          // 更新任务状态
          scheduler.updateTaskStatus(activityId, 'published');

          // 发送成功通知
          notification.sendPublishSuccessNotification(activityId, activity.title);

          // 实际环境中，这里应该更新活动状态为 'published'
          // activity.status = 'published';
          // activity.actualPublishTime = new Date().toISOString();
        } else {
          console.error('[定时发布] 发布失败:', activity.title);

          // 更新任务状态为失败
          scheduler.updateTaskStatus(activityId, 'failed', '网络错误');

          // 发送失败通知
          notification.sendPublishFailedNotification(activityId, activity.title, '网络错误');
        }
      }, 500); // 模拟网络延迟
    } catch (err) {
      console.error('[定时发布] 发布异常:', err);
      scheduler.updateTaskStatus(activityId, 'failed', err.message || '未知错误');
      notification.sendPublishFailedNotification(activityId, '未知活动', err.message || '未知错误');
    }
  }
});
