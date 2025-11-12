// utils/api.js - API封装层
const { activities, participants, registrations, checkinRecords } = require('./mock.js');
const { sanitizeInput, escapeHtml } = require('./security.js');
const { requestWithRetry, NetworkErrorType, requestCache } = require('./request-manager.js');
const { transformResponse, transformRequest } = require('./data-adapter.js');

// 模拟网络延迟
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// 通用请求封装（支持超时、重试、缓存）
const request = async (url, options = {}) => {
  // 从全局配置获取useMock设置
  const app = getApp();
  const globalUseMock = app?.globalData?.useMock !== undefined ? app.globalData.useMock : false;

  const {
    method = 'GET',
    data = {},
    mock = globalUseMock,    // 默认使用全局配置的mock设置
    useCache = false,        // 是否使用缓存（仅GET请求）
    cacheMaxAge = 5 * 60 * 1000, // 缓存时长（默认5分钟）
    timeout = 10000,         // 超时时间
    retryCount = 2,          // 重试次数
    showLoading = false,     // 是否显示loading
    showError = true         // 是否显示错误提示
  } = options;

  // Mock模式
  if (mock) {
    // 模拟网络延迟
    await delay(300);
    return mockRequest(url, method, data);
  }

  // 真实API调用
  // 如果是GET请求且启用缓存，先尝试从缓存获取
  if (method === 'GET' && useCache) {
    const cacheKey = requestCache.generateKey(url, data);
    const cached = requestCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // 创建请求函数
  const requestFn = () => {
    return new Promise((resolve, reject) => {
      const app = getApp();
      const apiBase = app?.globalData?.apiBase || '';

      // 转换请求数据（前端格式 -> 后端格式）
      const transformedData = transformRequest(data, url, method);

      wx.request({
        url: `${apiBase}${url}`,
        method,
        data: transformedData,
        header: {
          'content-type': 'application/json',
          'Authorization': wx.getStorageSync('token') || ''
        },
        timeout,
        success: (res) => {
          if (res.statusCode === 200) {
            // 解析响应数据
            try {
              let result = res.data;

              // 如果响应包含 data 字段（统一响应格式）
              if (result && result.data !== undefined) {
                // 转换响应数据（后端格式 -> 前端格式）
                result.data = transformResponse(result.data, url);
              } else {
                // 直接转换整个响应
                result = transformResponse(result, url);
              }

              // 如果是GET请求且启用缓存，保存到缓存
              if (method === 'GET' && useCache) {
                const cacheKey = requestCache.generateKey(url, data);
                requestCache.set(cacheKey, result);
              }

              resolve(result);
            } catch (err) {
              reject({
                type: NetworkErrorType.PARSE_ERROR,
                message: '数据解析失败',
                error: err
              });
            }
          } else if (res.statusCode === 401) {
            // 未授权，跳转登录
            reject({
              type: NetworkErrorType.SERVER_ERROR,
              message: '登录已过期，请重新登录',
              statusCode: 401
            });

            // 清除登录状态
            wx.removeStorageSync('token');
            wx.removeStorageSync('isLoggedIn');

            // 跳转登录页
            setTimeout(() => {
              wx.navigateTo({ url: '/pages/auth/login' });
            }, 1500);
          } else if (res.statusCode >= 500) {
            // 服务器错误
            reject({
              type: NetworkErrorType.SERVER_ERROR,
              message: res.data?.message || '服务器错误',
              statusCode: res.statusCode
            });
          } else {
            // 其他错误
            reject({
              type: NetworkErrorType.REQUEST_FAIL,
              message: res.data?.message || '请求失败',
              statusCode: res.statusCode
            });
          }
        },
        fail: (err) => {
          console.error('Request fail:', err);
          reject({
            type: NetworkErrorType.REQUEST_FAIL,
            message: err.errMsg || '网络请求失败',
            error: err
          });
        }
      });
    });
  };

  // 使用带重试的请求
  return requestWithRetry(requestFn, {
    timeout,
    retryCount,
    showLoading,
    showError
  });
};

// Mock数据请求处理
const mockRequest = (url, method, data) => {
  console.log('[Mock API]', method, url, data);

  // 活动相关接口
  if (url === '/api/activities' && method === 'GET') {
    return { code: 0, data: activities, message: 'success' };
  }

  if (url.startsWith('/api/activities/') && method === 'GET') {
    const id = url.split('/').pop();
    const activity = activities.find(a => a.id === id);
    return { code: 0, data: activity, message: 'success' };
  }

  if (url === '/api/activities' && method === 'POST') {
    // 安全清理：防止XSS注入
    const safeData = {
      ...data,
      title: sanitizeInput(data.title, { maxLength: 50 }),
      desc: data.desc ? sanitizeInput(data.desc, { maxLength: 500 }) : '',
      place: data.place ? sanitizeInput(data.place, { maxLength: 100 }) : '',
      address: data.address ? sanitizeInput(data.address, { maxLength: 200 }) : ''
    };

    const newActivity = {
      id: 'a' + (activities.length + 1),
      ...safeData,
      status: '即将开始',
      joined: 0,
      createdAt: new Date().toISOString()
    };
    activities.push(newActivity);
    return { code: 0, data: newActivity, message: '创建成功' };
  }

  // 报名相关接口
  if (url === '/api/registrations' && method === 'POST') {
    // 安全清理：防止XSS注入
    const safeData = {
      ...data,
      name: data.name ? sanitizeInput(data.name, { maxLength: 20 }) : ''
      // 手机号在validator.js中已经验证，这里不需要额外清理
    };

    const newReg = {
      id: 'r' + (registrations.length + 1),
      ...safeData,
      status: data.needReview ? 'pending' : 'approved',
      registeredAt: new Date().toISOString()
    };
    registrations.push(newReg);
    return { code: 0, data: newReg, message: '报名成功' };
  }

  if (url.startsWith('/api/registrations/activity/')) {
    const activityId = url.split('/').pop();
    const regs = registrations.filter(r => r.activityId === activityId);
    return { code: 0, data: regs, message: 'success' };
  }

  // 签到相关接口
  if (url === '/api/checkins' && method === 'POST') {
    const newCheckin = {
      id: 'c' + (checkinRecords.length + 1),
      ...data,
      checkinTime: new Date().toISOString()
    };
    checkinRecords.push(newCheckin);
    return { code: 0, data: newCheckin, message: '签到成功' };
  }

  if (url.startsWith('/api/checkins/activity/')) {
    const activityId = url.split('/').pop();
    const records = checkinRecords.filter(c => c.activityId === activityId);
    return { code: 0, data: records, message: 'success' };
  }

  // 用户相关接口
  if (url === '/api/user/profile' && method === 'GET') {
    return { code: 0, data: participants[0], message: 'success' };
  }

  return { code: -1, data: null, message: '接口未实现' };
};

// 活动API
const activityAPI = {
  // 获取活动列表（启用缓存，支持分页和筛选）
  getList: (params = {}) => request('/api/activities', {
    method: 'GET',
    data: params,  // 支持 type, status, keyword, page, size, sort 等参数
    useCache: true,
    cacheMaxAge: 3 * 60 * 1000, // 缓存3分钟
    showLoading: false
  }),

  // 获取活动详情（启用缓存）
  getDetail: (id) => request(`/api/activities/${id}`, {
    method: 'GET',
    useCache: true,
    cacheMaxAge: 5 * 60 * 1000, // 缓存5分钟
    showLoading: false
  }),

  // 获取我创建的活动列表
  getMyActivities: (params = {}) => request('/api/activities/my-activities', {
    method: 'GET',
    data: params,  // 支持分页参数
    useCache: true,
    cacheMaxAge: 2 * 60 * 1000,
    showLoading: false
  }),

  // 创建活动（显示loading，增加超时时间）
  create: (data) => request('/api/activities', {
    method: 'POST',
    data,
    timeout: 15000,
    showLoading: true,
    loadingText: '创建中...',
    retryCount: 1
  }),

  // 更新活动
  update: (id, data) => request(`/api/activities/${id}`, {
    method: 'PUT',
    data,
    showLoading: true,
    loadingText: '保存中...'
  }),

  // 删除活动
  delete: (id) => request(`/api/activities/${id}`, {
    method: 'DELETE',
    showLoading: true,
    loadingText: '删除中...'
  }),

  // 发布活动
  publish: (id) => request(`/api/activities/${id}/publish`, {
    method: 'POST',
    showLoading: true,
    loadingText: '发布中...'
  }),

  // 取消活动
  cancel: (id) => request(`/api/activities/${id}/cancel`, {
    method: 'POST',
    showLoading: true,
    loadingText: '取消中...'
  })
};

// 报名API
const registrationAPI = {
  // 创建报名（显示loading）
  create: (data) => request('/api/registrations', {
    method: 'POST',
    data,
    timeout: 10000,
    showLoading: true,
    loadingText: '提交中...',
    retryCount: 1
  }),

  // 取消报名
  cancel: (id) => request(`/api/registrations/${id}`, {
    method: 'DELETE',
    showLoading: true,
    loadingText: '取消中...'
  }),

  // 获取报名详情
  getDetail: (id) => request(`/api/registrations/${id}`, {
    method: 'GET',
    useCache: false
  }),

  // 获取我的报名列表
  getMyRegistrations: (params = {}) => request('/api/registrations/my', {
    method: 'GET',
    data: params,  // 支持分页参数
    useCache: false // 报名数据实时性要求高，不缓存
  }),

  // 获取活动报名列表
  getByActivity: (activityId, params = {}) => request(`/api/registrations/activity/${activityId}`, {
    method: 'GET',
    data: params,  // 支持分页参数
    useCache: false // 报名数据实时性要求高，不缓存
  }),

  // 审核报名
  approve: (id, data) => request(`/api/registrations/${id}/approve`, {
    method: 'PUT',
    data,  // { status: 'approved' 或 'rejected', note: '...' }
    showLoading: true,
    loadingText: '处理中...'
  })
};

// 签到API
const checkinAPI = {
  // 创建签到（显示loading）
  create: (data) => request('/api/checkins', {
    method: 'POST',
    data,
    timeout: 8000,
    showLoading: true,
    loadingText: '签到中...',
    retryCount: 1
  }),

  // 获取签到详情
  getDetail: (id) => request(`/api/checkins/${id}`, {
    method: 'GET',
    useCache: false
  }),

  // 获取我的签到列表
  getMyCheckins: (params = {}) => request('/api/checkins/my', {
    method: 'GET',
    data: params,  // 支持分页参数
    useCache: true,
    cacheMaxAge: 1 * 60 * 1000 // 缓存1分钟
  }),

  // 获取活动签到列表
  getByActivity: (activityId, params = {}) => request(`/api/checkins/activity/${activityId}`, {
    method: 'GET',
    data: params,  // 支持分页参数
    useCache: true,
    cacheMaxAge: 1 * 60 * 1000 // 缓存1分钟
  })
};

// 用户API
const userAPI = {
  // 获取用户信息（启用缓存）
  getProfile: () => request('/api/user/profile', {
    method: 'GET',
    useCache: true,
    cacheMaxAge: 10 * 60 * 1000 // 缓存10分钟
  }),

  // 获取指定用户信息
  getUserInfo: (userId) => request(`/api/user/${userId}`, {
    method: 'GET',
    useCache: true,
    cacheMaxAge: 10 * 60 * 1000
  }),

  // 更新用户信息
  updateProfile: (data) => request('/api/user/profile', {
    method: 'PUT',
    data,
    showLoading: true,
    loadingText: '保存中...'
  }),

  // 微信登录
  login: (code) => request('/api/auth/login', {
    method: 'POST',
    data: { code },
    timeout: 15000,
    showLoading: true,
    loadingText: '登录中...',
    retryCount: 1
  })
};

// 统计API
const statisticsAPI = {
  // 获取活动统计
  getActivityStatistics: (activityId) => request(`/api/statistics/activities/${activityId}`, {
    method: 'GET',
    useCache: true,
    cacheMaxAge: 2 * 60 * 1000  // 缓存2分钟
  }),

  // 获取用户统计
  getUserStatistics: (userId) => request(`/api/statistics/users/${userId}`, {
    method: 'GET',
    useCache: true,
    cacheMaxAge: 5 * 60 * 1000  // 缓存5分钟
  }),

  // 获取我的统计
  getMyStatistics: () => request('/api/statistics/my', {
    method: 'GET',
    useCache: true,
    cacheMaxAge: 2 * 60 * 1000  // 缓存2分钟
  })
};

module.exports = {
  request,
  activityAPI,
  registrationAPI,
  checkinAPI,
  userAPI,
  statisticsAPI
};
