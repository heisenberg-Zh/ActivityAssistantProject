// utils/storage-cleaner.js - 存储清理工具

/**
 * 清理所有可能损坏的加密存储数据
 * 用于修复升级后的兼容性问题
 */
const cleanCorruptedStorage = () => {
  const keysToClean = [
    'userInfo',
    'currentUserId',
    'currentUser',
    'user_token'
  ];

  let cleanedCount = 0;

  keysToClean.forEach(key => {
    try {
      const value = wx.getStorageSync(key);
      if (value) {
        // 尝试验证数据是否有效
        if (typeof value === 'string') {
          try {
            // 如果是字符串，尝试解析为JSON
            JSON.parse(value);
          } catch (e) {
            // 如果无法解析，可能是损坏的Base64数据，清理它
            console.log(`清理损坏的数据: ${key}`);
            wx.removeStorageSync(key);
            cleanedCount++;
          }
        }
      }
    } catch (err) {
      console.error(`检查 ${key} 时出错:`, err);
    }
  });

  return cleanedCount;
};

/**
 * 完全清理所有用户相关存储
 * 注意：这将清除所有用户数据，谨慎使用
 */
const clearAllUserStorage = () => {
  const keysToRemove = [
    'userInfo',
    'isLoggedIn',
    'currentUserId',
    'currentUser',
    'user_token',
    'activity_drafts',
    'favoriteActivityIds',
    'scheduled_tasks',
    'notifications'
  ];

  keysToRemove.forEach(key => {
    try {
      wx.removeStorageSync(key);
      console.log(`已清除: ${key}`);
    } catch (err) {
      console.error(`清除 ${key} 失败:`, err);
    }
  });

  console.log('✅ 所有用户存储已清理');
};

/**
 * 初始化默认存储数据
 */
const initDefaultStorage = () => {
  try {
    // 设置默认用户信息（开发环境）
    const defaultUser = {
      id: 'u1',
      name: '张小北',
      avatar: '/activityassistant_avatar_01.png'
    };

    const { setSecureStorage } = require('./security.js');

    setSecureStorage('currentUserId', 'u1');
    setSecureStorage('currentUser', defaultUser);
    wx.setStorageSync('isLoggedIn', false);

    console.log('✅ 默认存储数据已初始化');
    return true;
  } catch (err) {
    console.error('初始化默认存储失败:', err);
    return false;
  }
};

/**
 * 存储健康检查
 * 返回存储状态报告
 */
const checkStorageHealth = () => {
  const report = {
    healthy: true,
    issues: [],
    storageInfo: {}
  };

  const keysToCheck = [
    'userInfo',
    'currentUserId',
    'currentUser',
    'isLoggedIn'
  ];

  keysToCheck.forEach(key => {
    try {
      const value = wx.getStorageSync(key);
      if (value !== undefined && value !== null && value !== '') {
        report.storageInfo[key] = {
          exists: true,
          type: typeof value,
          size: JSON.stringify(value).length
        };

        // 验证数据完整性
        if (typeof value === 'string' && key !== 'isLoggedIn') {
          try {
            JSON.parse(value);
          } catch (e) {
            report.healthy = false;
            report.issues.push(`${key} 数据格式损坏`);
          }
        }
      } else {
        report.storageInfo[key] = {
          exists: false
        };
      }
    } catch (err) {
      report.healthy = false;
      report.issues.push(`${key} 读取失败: ${err.message}`);
    }
  });

  return report;
};

module.exports = {
  cleanCorruptedStorage,
  clearAllUserStorage,
  initDefaultStorage,
  checkStorageHealth
};
