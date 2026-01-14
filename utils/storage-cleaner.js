// utils/storage-cleaner.js - 存储清理工具

/**
 * 清理所有可能损坏的加密存储数据
 * 用于修复升级后的兼容性问题
 */
const _base64DecodeToString = (base64) => {
  const arrayBuffer = wx.base64ToArrayBuffer(base64);
  const uint8Array = new Uint8Array(arrayBuffer);
  let str = '';
  for (let i = 0; i < uint8Array.length; i++) {
    str += String.fromCharCode(uint8Array[i]);
  }
  return str;
};

const _tryParseJson = (text) => {
  if (typeof text !== 'string') return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
};

const _tryDecodeSecureJson = (raw) => {
  if (typeof raw !== 'string') return null;
  try {
    const decoded = _base64DecodeToString(raw);
    return _tryParseJson(decoded);
  } catch (e) {
    return null;
  }
};

const _isValidUserIdString = (value) => {
  if (typeof value !== 'string') return false;
  if (value.trim().length === 0) return false;
  if (/\s/.test(value)) return false;
  return value.length <= 128;
};

const _isValidCurrentUserIdValue = (value) => {
  if (typeof value === 'number') return Number.isFinite(value);
  return _isValidUserIdString(value);
};

const _getIdLike = (value) => {
  if (!value || typeof value !== 'object') return null;
  if (value.id !== undefined && value.id !== null) return value.id;
  if (value.userId !== undefined && value.userId !== null) return value.userId;
  return null;
};

const _isValidUserInfoObject = (value) => {
  const id = _getIdLike(value);
  return id !== null && String(id).trim().length > 0;
};

const _isValidCurrentUserObject = (value) => {
  const id = _getIdLike(value);
  return id !== null && String(id).trim().length > 0;
};

const _isStorageValueValid = (key, raw) => {
  if (key === 'user_token') {
    return typeof raw === 'string' && raw.trim().length > 0;
  }

  if (key === 'currentUserId') {
    if (typeof raw !== 'string') return _isValidCurrentUserIdValue(raw);

    const decoded = _tryDecodeSecureJson(raw);
    if (decoded !== null) return _isValidCurrentUserIdValue(decoded);

    // Back-compat: allow plain string ids stored via wx.setStorageSync.
    return _isValidUserIdString(raw);
  }

  if (key === 'userInfo') {
    if (typeof raw === 'object') return _isValidUserInfoObject(raw);
    const decoded = _tryDecodeSecureJson(raw);
    const parsed = decoded !== null ? decoded : _tryParseJson(raw);
    return _isValidUserInfoObject(parsed);
  }

  if (key === 'currentUser') {
    if (typeof raw === 'object') return _isValidCurrentUserObject(raw);
    const decoded = _tryDecodeSecureJson(raw);
    const parsed = decoded !== null ? decoded : _tryParseJson(raw);
    return _isValidCurrentUserObject(parsed);
  }

  return true;
};

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
            if (!_isStorageValueValid(key, value)) {
              throw new Error('invalid storage value');
            }
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
            if (!_isStorageValueValid(key, value)) {
              throw new Error('invalid storage value');
            }
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
