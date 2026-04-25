// utils/user-helper.js - 用户辅助函数

/**
 * 获取当前用户ID
 * 统一从全局状态获取，避免硬编码
 * @returns {String} 当前用户ID
 */
const getCurrentUserId = () => {
  const app = getApp();
  if (app && app.globalData && app.globalData.currentUserId) {
    return app.globalData.currentUserId;
  }

  // 如果全局状态未初始化，尝试从本地存储读取
  try {
    const { getSecureStorage } = require('./security.js');
    const storedUserId = getSecureStorage('currentUserId');
    if (storedUserId) {
      return storedUserId;
    }
  } catch (err) {
    console.error('获取用户ID失败:', err);
  }

  // 开发环境：返回默认测试用户ID（生产环境应返回null并提示登录）
  console.warn('⚠️ 未找到当前用户ID，使用默认测试ID: u1');
  return 'u1';
};

/**
 * 获取当前用户信息
 * @returns {Object|null} 当前用户信息
 */
const getCurrentUser = () => {
  const app = getApp();
  if (app && app.globalData && app.globalData.currentUser) {
    return app.globalData.currentUser;
  }

  // 尝试从本地存储读取
  try {
    const { getSecureStorage } = require('./security.js');
    const storedUser = getSecureStorage('currentUser');
    if (storedUser) {
      return storedUser;
    }
  } catch (err) {
    console.error('获取用户信息失败:', err);
  }

  // 返回默认测试用户（开发环境）
  console.warn('⚠️ 未找到当前用户信息，使用默认测试用户');
  return {
    id: 'u1',
    name: '张小北',
    avatar: '/activityassistant_avatar_01.png'
  };
};

/**
 * 检查是否已登录
 * @returns {Boolean} 是否已登录
 */
const isUserLoggedIn = () => {
  const app = getApp();
  if (app && app.globalData) {
    return app.globalData.isLoggedIn === true;
  }

  // 尝试从本地存储读取
  try {
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    return isLoggedIn === true || isLoggedIn === 'true';
  } catch (err) {
    console.error('检查登录状态失败:', err);
    return false;
  }
};

/**
 * 要求用户登录
 * 如果用户未登录，跳转到登录页
 * @returns {Boolean} 是否已登录
 */
const requireLogin = () => {
  if (!isUserLoggedIn()) {
    wx.showModal({
      title: '需要登录',
      content: '请先登录后再进行操作',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/auth/login'
          });
        }
      }
    });
    return false;
  }
  return true;
};

module.exports = {
  getCurrentUserId,
  getCurrentUser,
  isUserLoggedIn,
  requireLogin
};
