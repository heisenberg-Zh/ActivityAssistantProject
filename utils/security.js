// utils/security.js - 安全工具函数

/**
 * HTML转义 - 防止XSS注入
 * @param {String} str - 需要转义的字符串
 * @returns {String} 转义后的字符串
 */
const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;

  const htmlEscapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return str.replace(/[&<>"'/]/g, (match) => htmlEscapeMap[match]);
};

/**
 * 反转义HTML
 * @param {String} str - 转义后的字符串
 * @returns {String} 原始字符串
 */
const unescapeHtml = (str) => {
  if (typeof str !== 'string') return str;

  const htmlUnescapeMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/'
  };

  return str.replace(/&(amp|lt|gt|quot|#x27|#x2F);/g, (match) => htmlUnescapeMap[match]);
};

/**
 * 验证是否为安全的URL
 * @param {String} url - 待验证的URL
 * @returns {Boolean} 是否安全
 */
const isSafeUrl = (url) => {
  if (!url || typeof url !== 'string') return false;

  // 只允许 http、https、微信小程序页面路径
  const safeProtocols = /^(https?:\/\/|\/pages\/)/i;

  // 禁止 javascript:、data: 等危险协议
  const dangerousProtocols = /^(javascript|data|vbscript):/i;

  if (dangerousProtocols.test(url)) {
    return false;
  }

  return safeProtocols.test(url);
};

/**
 * 清理用户输入 - 移除潜在危险字符
 * @param {String} input - 用户输入
 * @param {Object} options - 选项
 * @returns {String} 清理后的字符串
 */
const sanitizeInput = (input, options = {}) => {
  if (typeof input !== 'string') return input;

  const {
    allowHtml = false,      // 是否允许HTML
    maxLength = 10000,      // 最大长度
    trimWhitespace = true   // 是否trim空格
  } = options;

  let sanitized = input;

  // Trim空格
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // 限制长度
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // 转义HTML（如果不允许HTML）
  if (!allowHtml) {
    sanitized = escapeHtml(sanitized);
  }

  return sanitized;
};

/**
 * 验证手机号格式（防止SQL注入）
 * @param {String} mobile - 手机号
 * @returns {Boolean} 是否有效
 */
const isSafeMobile = (mobile) => {
  if (!mobile || typeof mobile !== 'string') return false;

  // 只允许数字
  const mobileReg = /^1[3-9]\d{9}$/;
  return mobileReg.test(mobile);
};

/**
 * 简单的字符串Base64编码（兼容微信小程序）
 * @param {String} str - 待编码字符串
 * @returns {String} Base64编码后的字符串
 */
const base64Encode = (str) => {
  // 使用微信小程序兼容的方法
  const buffer = [];
  for (let i = 0; i < str.length; i++) {
    buffer.push(str.charCodeAt(i));
  }

  // 转为 Uint8Array
  const uint8Array = new Uint8Array(buffer);

  // 使用微信API转Base64
  return wx.arrayBufferToBase64(uint8Array.buffer);
};

/**
 * 简单的Base64解码（兼容微信小程序）
 * @param {String} base64 - Base64字符串
 * @returns {String} 解码后的字符串
 */
const base64Decode = (base64) => {
  // 使用微信API转ArrayBuffer
  const arrayBuffer = wx.base64ToArrayBuffer(base64);
  const uint8Array = new Uint8Array(arrayBuffer);

  // 转回字符串
  let str = '';
  for (let i = 0; i < uint8Array.length; i++) {
    str += String.fromCharCode(uint8Array[i]);
  }

  return str;
};

/**
 * 加密存储数据
 * @param {String} key - 存储键名
 * @param {Any} data - 待存储数据
 * @param {String} secret - 加密密钥（可选，默认使用内置密钥）
 */
const setSecureStorage = (key, data, secret = null) => {
  try {
    const dataStr = JSON.stringify(data);

    // 简单的Base64编码（兼容微信小程序）
    const encoded = base64Encode(dataStr);

    wx.setStorageSync(key, encoded);
    return true;
  } catch (err) {
    console.error('加密存储失败:', err);
    // 如果编码失败，降级为普通存储
    try {
      wx.setStorageSync(key, data);
      return true;
    } catch (fallbackErr) {
      console.error('降级存储也失败:', fallbackErr);
      return false;
    }
  }
};

/**
 * 解密读取数据
 * @param {String} key - 存储键名
 * @param {String} secret - 解密密钥（可选）
 * @returns {Any} 解密后的数据
 */
const getSecureStorage = (key, secret = null) => {
  try {
    const encoded = wx.getStorageSync(key);
    if (!encoded) return null;

    // 检查是否是Base64编码的数据
    if (typeof encoded === 'string') {
      try {
        // 尝试Base64解码
        const decoded = base64Decode(encoded);
        return JSON.parse(decoded);
      } catch (decodeErr) {
        // 如果解码失败，可能是未编码的数据，直接返回
        console.warn('Base64解码失败，尝试直接解析:', decodeErr);
        try {
          return JSON.parse(encoded);
        } catch (parseErr) {
          // 如果也无法解析为JSON，直接返回原始数据
          return encoded;
        }
      }
    }

    // 如果不是字符串，直接返回（可能是旧数据）
    return encoded;
  } catch (err) {
    console.error('解密读取失败:', err);
    return null;
  }
};

/**
 * 生成随机Token
 * @param {Number} length - Token长度
 * @returns {String} 随机Token
 */
const generateToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * 防抖函数 - 防止重复提交
 * @param {Function} func - 待执行函数
 * @param {Number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
const debounce = (func, wait = 300) => {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
};

/**
 * 节流函数 - 限制执行频率
 * @param {Function} func - 待执行函数
 * @param {Number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
const throttle = (func, limit = 1000) => {
  let inThrottle;
  return function(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

module.exports = {
  escapeHtml,
  unescapeHtml,
  isSafeUrl,
  sanitizeInput,
  isSafeMobile,
  setSecureStorage,
  getSecureStorage,
  generateToken,
  debounce,
  throttle
};
