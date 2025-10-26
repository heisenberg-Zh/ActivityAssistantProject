// utils/api.js - API封装层
const { activities, participants, registrations, checkinRecords } = require('./mock.js');

// 模拟网络延迟
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// 通用请求封装
const request = async (url, options = {}) => {
  const {
    method = 'GET',
    data = {},
    mock = true
  } = options;

  if (mock) {
    await delay(300);
    return mockRequest(url, method, data);
  }

  // 真实API调用（待后端接入）
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getApp().globalData.apiBase}${url}`,
      method,
      data,
      header: {
        'content-type': 'application/json',
        'Authorization': wx.getStorageSync('token') || ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(res.data.message || '请求失败'));
        }
      },
      fail: reject
    });
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
    const newActivity = {
      id: 'a' + (activities.length + 1),
      ...data,
      status: '即将开始',
      joined: 0,
      createdAt: new Date().toISOString()
    };
    activities.push(newActivity);
    return { code: 0, data: newActivity, message: '创建成功' };
  }

  // 报名相关接口
  if (url === '/api/registrations' && method === 'POST') {
    const newReg = {
      id: 'r' + (registrations.length + 1),
      ...data,
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
  // 获取活动列表
  getList: (params = {}) => request('/api/activities', { method: 'GET', data: params }),

  // 获取活动详情
  getDetail: (id) => request(`/api/activities/${id}`, { method: 'GET' }),

  // 创建活动
  create: (data) => request('/api/activities', { method: 'POST', data }),

  // 更新活动
  update: (id, data) => request(`/api/activities/${id}`, { method: 'PUT', data }),

  // 删除活动
  delete: (id) => request(`/api/activities/${id}`, { method: 'DELETE' })
};

// 报名API
const registrationAPI = {
  // 创建报名
  create: (data) => request('/api/registrations', { method: 'POST', data }),

  // 取消报名
  cancel: (id) => request(`/api/registrations/${id}`, { method: 'DELETE' }),

  // 获取活动报名列表
  getByActivity: (activityId) => request(`/api/registrations/activity/${activityId}`, { method: 'GET' }),

  // 审核报名
  approve: (id, approved) => request(`/api/registrations/${id}/approve`, { method: 'PUT', data: { approved } })
};

// 签到API
const checkinAPI = {
  // 创建签到
  create: (data) => request('/api/checkins', { method: 'POST', data }),

  // 获取活动签到列表
  getByActivity: (activityId) => request(`/api/checkins/activity/${activityId}`, { method: 'GET' }),

  // 获取用户签到记录
  getByUser: (userId) => request(`/api/checkins/user/${userId}`, { method: 'GET' })
};

// 用户API
const userAPI = {
  // 获取用户信息
  getProfile: () => request('/api/user/profile', { method: 'GET' }),

  // 更新用户信息
  updateProfile: (data) => request('/api/user/profile', { method: 'PUT', data }),

  // 微信登录
  login: (code) => request('/api/auth/login', { method: 'POST', data: { code } })
};

module.exports = {
  request,
  activityAPI,
  registrationAPI,
  checkinAPI,
  userAPI
};
