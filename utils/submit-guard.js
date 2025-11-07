// utils/submit-guard.js - 防重复提交守卫

/**
 * 提交守卫类
 * 防止用户快速连续点击导致重复提交
 */
class SubmitGuard {
  constructor() {
    // 存储各个操作的提交状态
    this.submittingMap = new Map();
    // 默认锁定时间（毫秒）
    this.defaultLockTime = 3000;
  }

  /**
   * 检查是否正在提交
   * @param {String} key - 操作标识（如 'registration:a1'）
   * @returns {Boolean} 是否正在提交
   */
  isSubmitting(key) {
    return this.submittingMap.has(key);
  }

  /**
   * 锁定提交（防止重复提交）
   * @param {String} key - 操作标识
   * @param {Number} lockTime - 锁定时间（毫秒），默认3秒
   * @returns {Boolean} 是否成功锁定
   */
  lock(key, lockTime = this.defaultLockTime) {
    // 如果已经锁定，返回false
    if (this.isSubmitting(key)) {
      console.warn(`[SubmitGuard] 操作 ${key} 正在进行中，请勿重复提交`);
      return false;
    }

    // 锁定操作
    const lockId = setTimeout(() => {
      this.unlock(key);
    }, lockTime);

    this.submittingMap.set(key, {
      lockId,
      startTime: Date.now(),
      lockTime
    });

    console.log(`[SubmitGuard] 操作 ${key} 已锁定 ${lockTime}ms`);
    return true;
  }

  /**
   * 解锁提交
   * @param {String} key - 操作标识
   */
  unlock(key) {
    const lockInfo = this.submittingMap.get(key);
    if (lockInfo) {
      clearTimeout(lockInfo.lockId);
      this.submittingMap.delete(key);
      console.log(`[SubmitGuard] 操作 ${key} 已解锁`);
    }
  }

  /**
   * 清除所有锁定
   */
  clearAll() {
    this.submittingMap.forEach((lockInfo, key) => {
      clearTimeout(lockInfo.lockId);
    });
    this.submittingMap.clear();
    console.log('[SubmitGuard] 已清除所有锁定');
  }

  /**
   * 包装异步函数，自动管理锁定
   * @param {String} key - 操作标识
   * @param {Function} asyncFn - 异步函数
   * @param {Object} options - 选项
   * @returns {Promise} 包装后的Promise
   */
  async wrapAsync(key, asyncFn, options = {}) {
    const {
      lockTime = this.defaultLockTime,
      showTips = true,
      tipsMessage = '操作进行中，请勿重复提交'
    } = options;

    // 检查是否正在提交
    if (this.isSubmitting(key)) {
      if (showTips) {
        wx.showToast({
          title: tipsMessage,
          icon: 'none',
          duration: 2000
        });
      }
      return Promise.reject(new Error('重复提交'));
    }

    // 锁定
    if (!this.lock(key, lockTime)) {
      return Promise.reject(new Error('锁定失败'));
    }

    try {
      // 执行异步函数
      const result = await asyncFn();
      return result;
    } catch (error) {
      console.error(`[SubmitGuard] 操作 ${key} 执行失败:`, error);
      throw error;
    } finally {
      // 无论成功失败，都解锁
      this.unlock(key);
    }
  }
}

// 创建全局单例
const submitGuard = new SubmitGuard();

/**
 * 防重复提交装饰器（用于Page方法）
 * @param {String} key - 操作标识，可以是固定字符串或函数
 * @param {Object} options - 选项
 * @returns {Function} 装饰后的函数
 *
 * 使用示例：
 * submit: preventDoubleSubmit('registration', { lockTime: 5000 })(async function() {
 *   // 提交逻辑
 * })
 */
function preventDoubleSubmit(keyOrFn, options = {}) {
  return function(originalFn) {
    return async function(...args) {
      // 生成唯一key
      const key = typeof keyOrFn === 'function'
        ? keyOrFn.call(this, ...args)
        : keyOrFn;

      // 使用submitGuard包装异步函数
      return submitGuard.wrapAsync(
        key,
        () => originalFn.call(this, ...args),
        options
      );
    };
  };
}

/**
 * 简单的防抖函数
 * @param {Function} func - 待执行函数
 * @param {Number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait = 300) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * 简单的节流函数
 * @param {Function} func - 待执行函数
 * @param {Number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit = 1000) {
  let inThrottle;
  return function(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

module.exports = {
  submitGuard,
  preventDoubleSubmit,
  debounce,
  throttle
};
