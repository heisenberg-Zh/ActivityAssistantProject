// utils/request-manager.js - 网络请求管理器

/**
 * 网络错误类型
 */
const NetworkErrorType = {
  TIMEOUT: 'timeout',           // 超时
  NO_NETWORK: 'no_network',     // 无网络连接
  SERVER_ERROR: 'server_error', // 服务器错误
  REQUEST_FAIL: 'request_fail', // 请求失败
  PARSE_ERROR: 'parse_error'    // 解析错误
};

/**
 * 默认配置
 */
const DEFAULT_CONFIG = {
  timeout: 10000,        // 默认超时时间 10秒
  retryCount: 2,         // 默认重试次数
  retryDelay: 1000,      // 重试延迟 1秒
  showLoading: false,    // 是否显示loading
  showError: true        // 是否显示错误提示
};

/**
 * 网络状态检查
 * @returns {Promise<Object>} 网络状态
 */
const checkNetworkStatus = () => {
  return new Promise((resolve) => {
    wx.getNetworkType({
      success: (res) => {
        resolve({
          isConnected: res.networkType !== 'none',
          networkType: res.networkType
        });
      },
      fail: () => {
        resolve({
          isConnected: false,
          networkType: 'unknown'
        });
      }
    });
  });
};

/**
 * 获取友好的错误提示信息
 * @param {String} errorType - 错误类型
 * @param {Object} error - 错误对象
 * @returns {String} 错误提示
 */
const getErrorMessage = (errorType, error = {}) => {
  const errorMessages = {
    [NetworkErrorType.TIMEOUT]: '请求超时，请检查网络后重试',
    [NetworkErrorType.NO_NETWORK]: '网络连接失败，请检查网络设置',
    [NetworkErrorType.SERVER_ERROR]: '服务器繁忙，请稍后重试',
    [NetworkErrorType.REQUEST_FAIL]: '请求失败，请稍后重试',
    [NetworkErrorType.PARSE_ERROR]: '数据解析失败，请联系客服'
  };

  // 如果有自定义错误信息，优先使用
  if (error.message) {
    return error.message;
  }

  return errorMessages[errorType] || '未知错误，请稍后重试';
};

/**
 * 延迟函数
 * @param {Number} ms - 延迟毫秒数
 * @returns {Promise}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 带重试的网络请求
 * @param {Function} requestFn - 请求函数
 * @param {Object} options - 配置选项
 * @returns {Promise} 请求结果
 */
const requestWithRetry = async (requestFn, options = {}) => {
  const config = { ...DEFAULT_CONFIG, ...options };
  let lastError = null;
  let attemptCount = 0;

  // 显示loading
  if (config.showLoading) {
    wx.showLoading({
      title: config.loadingText || '加载中...',
      mask: true
    });
  }

  try {
    // 检查网络状态
    const networkStatus = await checkNetworkStatus();
    if (!networkStatus.isConnected) {
      throw {
        type: NetworkErrorType.NO_NETWORK,
        message: '网络未连接'
      };
    }

    // 执行请求，带重试逻辑
    for (let i = 0; i <= config.retryCount; i++) {
      attemptCount = i + 1;

      try {
        console.log(`[Request] 第 ${attemptCount} 次请求...`);

        // 执行请求
        const result = await Promise.race([
          requestFn(),
          new Promise((_, reject) =>
            setTimeout(() => reject({
              type: NetworkErrorType.TIMEOUT,
              message: '请求超时'
            }), config.timeout)
          )
        ]);

        // 请求成功，隐藏loading
        if (config.showLoading) {
          wx.hideLoading();
        }

        console.log(`[Request] 请求成功`);
        return result;

      } catch (error) {
        lastError = error;
        console.warn(`[Request] 第 ${attemptCount} 次请求失败:`, error);

        // 如果还有重试次数，延迟后重试
        if (i < config.retryCount) {
          console.log(`[Request] ${config.retryDelay}ms 后重试...`);
          await delay(config.retryDelay);
        }
      }
    }

    // 所有重试都失败
    throw lastError;

  } catch (error) {
    // 隐藏loading
    if (config.showLoading) {
      wx.hideLoading();
    }

    // 处理错误
    const errorType = error.type || NetworkErrorType.REQUEST_FAIL;
    const errorMessage = getErrorMessage(errorType, error);

    console.error(`[Request] 请求最终失败 (尝试 ${attemptCount} 次):`, error);

    // 显示错误提示
    if (config.showError) {
      wx.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 2500
      });
    }

    // 返回格式化的错误
    return Promise.reject({
      code: -1,
      type: errorType,
      message: errorMessage,
      originalError: error
    });
  }
};

/**
 * 创建请求包装器
 * @param {Function} requestFn - 原始请求函数
 * @param {Object} defaultOptions - 默认配置
 * @returns {Function} 包装后的请求函数
 */
const createRequestWrapper = (requestFn, defaultOptions = {}) => {
  return async (params, options = {}) => {
    const finalOptions = { ...defaultOptions, ...options };
    return requestWithRetry(() => requestFn(params), finalOptions);
  };
};

/**
 * 批量请求管理器
 * 支持并发控制和失败重试
 */
class BatchRequestManager {
  constructor(options = {}) {
    this.concurrency = options.concurrency || 3; // 最大并发数
    this.retryCount = options.retryCount || 1;
    this.queue = [];
    this.running = 0;
    this.results = [];
  }

  /**
   * 添加请求到队列
   * @param {Function} requestFn - 请求函数
   */
  add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        requestFn,
        resolve,
        reject,
        retryCount: 0
      });
      this.process();
    });
  }

  /**
   * 处理队列
   */
  async process() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const task = this.queue.shift();

    try {
      const result = await task.requestFn();
      task.resolve(result);
      this.results.push({ success: true, data: result });
    } catch (error) {
      // 如果还有重试次数，重新加入队列
      if (task.retryCount < this.retryCount) {
        task.retryCount++;
        this.queue.push(task);
        console.log(`[BatchRequest] 任务失败，加入重试队列 (第${task.retryCount}次)`);
      } else {
        task.reject(error);
        this.results.push({ success: false, error });
      }
    } finally {
      this.running--;
      this.process();
    }
  }

  /**
   * 等待所有请求完成
   * @returns {Promise<Array>} 所有结果
   */
  async waitAll() {
    while (this.queue.length > 0 || this.running > 0) {
      await delay(100);
    }
    return this.results;
  }
}

/**
 * 请求缓存管理器
 */
class RequestCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxAge = options.maxAge || 5 * 60 * 1000; // 默认缓存5分钟
  }

  /**
   * 生成缓存key
   * @param {String} url - 请求URL
   * @param {Object} params - 请求参数
   * @returns {String} 缓存key
   */
  generateKey(url, params = {}) {
    return `${url}:${JSON.stringify(params)}`;
  }

  /**
   * 获取缓存
   * @param {String} key - 缓存key
   * @returns {Any} 缓存数据
   */
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // 检查是否过期
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    console.log(`[Cache] 命中缓存: ${key}`);
    return cached.data;
  }

  /**
   * 设置缓存
   * @param {String} key - 缓存key
   * @param {Any} data - 数据
   */
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`[Cache] 缓存数据: ${key}`);
  }

  /**
   * 清除缓存
   * @param {String} key - 缓存key，不传则清除全部
   */
  clear(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

// 创建全局实例
const requestCache = new RequestCache();

module.exports = {
  NetworkErrorType,
  checkNetworkStatus,
  getErrorMessage,
  requestWithRetry,
  createRequestWrapper,
  BatchRequestManager,
  RequestCache,
  requestCache
};
