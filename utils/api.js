// utils/api.js - API封装层
const { sanitizeInput, escapeHtml } = require('./security.js');
const { requestWithRetry, NetworkErrorType, requestCache } = require('./request-manager.js');
const { transformResponse, transformRequest } = require('./data-adapter.js');

// 模拟网络延迟
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// 通用请求封装（支持超时、重试、缓存、401自动刷新）
const request = async (url, options = {}) => {
  // 从全局配置获取useMock设置
  const app = getApp();
  const globalUseMock = app?.globalData?.useMock !== undefined ? app.globalData.useMock : false;

  const {
    method = 'GET',
    data = {},
    mock = globalUseMock,
    useCache = false,
    cacheMaxAge = 5 * 60 * 1000,
    timeout = 10000,
    retryCount = 2,
    showLoading = false,
    showError = true,
    _retry401 = true  // 内部参数：是否重试401错误
  } = options;

  // Mock模式
  if (mock) {
    await delay(300);
    return mockRequest(url, method, data);
  }

  // 真实API调用
  let cleanedData = data;
  if (method === 'GET' && data && typeof data === 'object') {
    cleanedData = Object.keys(data).reduce((acc, key) => {
      if (data[key] !== null && data[key] !== undefined) {
        acc[key] = data[key];
      }
      return acc;
    }, {});
  }

  // 缓存检查
  if (method === 'GET' && useCache) {
    const cacheKey = requestCache.generateKey(url, cleanedData);
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
      const transformedData = transformRequest(cleanedData, url, method);

      wx.request({
        url: `${apiBase}${url}`,
        method,
        data: transformedData,
        header: {
          'content-type': 'application/json',
          'Authorization': wx.getStorageSync('token') ? `Bearer ${wx.getStorageSync('token')}` : ''
        },
        timeout,
        success: (res) => {
          if (res.statusCode === 200) {
            try {
              let result = res.data;

              if (result && result.data !== undefined) {
                result.data = transformResponse(result.data, url);
              } else {
                result = transformResponse(result, url);
              }

              if (method === 'GET' && useCache) {
                const cacheKey = requestCache.generateKey(url, cleanedData);
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
            // 未授权 - 尝试静默刷新Token
            reject({
              type: 'AUTH_EXPIRED',
              message: '登录状态已过期',
              statusCode: 401,
              needRetry: true
            });
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

  // 使用带重试的请求，并处理401错误
  try {
    const result = await requestWithRetry(requestFn, {
      timeout,
      retryCount,
      showLoading,
      showError
    });
    return result;
  } catch (error) {
    // 处理401错误 - 尝试静默登录后重试
    if (error.type === 'AUTH_EXPIRED' && error.needRetry && _retry401) {
      console.log('🔄 检测到401错误，尝试静默登录后重试...');

      try {
        // 调用app的静默登录方法
        const app = getApp();
        if (app && app.performSilentLogin) {
          await app.performSilentLogin();

          // 检查登录是否成功
          const newToken = wx.getStorageSync('token');
          if (newToken) {
            console.log('✅ 静默登录成功，重新发起请求');

            // 重新发起请求（禁用401重试，避免死循环）
            return request(url, {
              ...options,
              _retry401: false
            });
          }
        }
      } catch (loginErr) {
        console.error('❌ 静默登录失败:', loginErr);
      }

      // 静默登录失败，提示用户手动登录
      wx.showModal({
        title: '登录已过期',
        content: '请重新登录后继续使用',
        showCancel: false,
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/auth/login' });
          }
        }
      });
    }

    // 抛出原始错误
    throw error;
  }
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

    // 根据定时发布设置确定活动状态
    let activityStatus = safeData.status || 'published';

    // 如果是定时发布（有 scheduledPublishTime 且时间在未来）
    if (safeData.scheduledPublishTime) {
      const scheduledTime = new Date(safeData.scheduledPublishTime);
      const now = new Date();

      if (scheduledTime > now) {
        activityStatus = '预发布';  // 定时发布待执行
      } else {
        activityStatus = 'published';  // 时间已过，立即发布
        safeData.actualPublishTime = now.toISOString();
      }
    } else {
      // 立即发布
      activityStatus = 'published';
      safeData.actualPublishTime = new Date().toISOString();
    }

    const newActivity = {
      id: 'a' + (activities.length + 1),
      ...safeData,
      status: activityStatus,
      joined: 0,
      createdAt: new Date().toISOString()
    };
    activities.push(newActivity);

    const message = activityStatus === '预发布' ? '定时发布设置成功' : '创建成功';
    return { code: 0, data: newActivity, message };
  }

  // 更新活动
  if (url.match(/^\/api\/activities\/[^/]+$/) && method === 'PUT') {
    const activityId = url.split('/')[3];
    const activityIndex = activities.findIndex(a => a.id === activityId);

    if (activityIndex === -1) {
      return { code: -1, data: null, message: '活动不存在' };
    }

    // 安全清理：防止XSS注入
    const safeData = {
      ...data,
      title: data.title ? sanitizeInput(data.title, { maxLength: 50 }) : activities[activityIndex].title,
      desc: data.desc !== undefined ? sanitizeInput(data.desc, { maxLength: 500 }) : activities[activityIndex].desc,
      place: data.place !== undefined ? sanitizeInput(data.place, { maxLength: 100 }) : activities[activityIndex].place,
      address: data.address !== undefined ? sanitizeInput(data.address, { maxLength: 200 }) : activities[activityIndex].address
    };

    // 根据定时发布设置确定活动状态
    let activityStatus = safeData.status || activities[activityIndex].status;

    // 如果是定时发布（有 scheduledPublishTime 且时间在未来）
    if (safeData.scheduledPublishTime) {
      const scheduledTime = new Date(safeData.scheduledPublishTime);
      const now = new Date();

      if (scheduledTime > now) {
        activityStatus = '预发布';  // 定时发布待执行
      } else {
        activityStatus = 'published';  // 时间已过，立即发布
        safeData.actualPublishTime = safeData.actualPublishTime || now.toISOString();
      }
    } else if (safeData.scheduledPublishTime === null) {
      // 显式设置为 null，表示取消定时发布，立即发布
      activityStatus = 'published';
      safeData.actualPublishTime = safeData.actualPublishTime || new Date().toISOString();
    }

    // 更新活动数据
    const updatedActivity = {
      ...activities[activityIndex],
      ...safeData,
      status: activityStatus,
      updatedAt: new Date().toISOString()
    };

    activities[activityIndex] = updatedActivity;

    const message = activityStatus === '预发布' ? '定时发布设置成功' : '更新成功';
    return { code: 0, data: updatedActivity, message };
  }

  // 取消活动
  if (url.match(/^\/api\/activities\/[^/]+\/cancel$/) && method === 'POST') {
    const activityId = url.split('/')[3];
    const activity = activities.find(a => a.id === activityId);

    if (!activity) {
      return { code: -1, data: null, message: '活动不存在' };
    }

    // 更新活动状态为已取消
    activity.status = '已取消';
    activity.canceledAt = new Date().toISOString();

    return {
      code: 0,
      data: activity,
      message: '活动已取消'
    };
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

  // 审核报名（通过/拒绝）
  if (url.match(/^\/api\/registrations\/[^/]+\/approve$/) && method === 'PUT') {
    const registrationId = url.split('/')[3];
    const { status, note } = data;  // status: 'approved' 或 'rejected'

    const reg = registrations.find(r => r.id === registrationId);

    if (!reg) {
      return { code: -1, data: null, message: '报名记录不存在' };
    }

    // 更新状态
    reg.status = status;
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (status === 'approved') {
      reg.approvedAt = timestamp;
    } else if (status === 'rejected') {
      reg.rejectedAt = timestamp;
      reg.rejectNote = note || '';
    }

    return {
      code: 0,
      data: reg,
      message: status === 'approved' ? '已通过审核' : '已拒绝'
    };
  }

  // 删除/移除报名
  if (url.match(/^\/api\/registrations\/[^/]+$/) && method === 'DELETE') {
    const registrationId = url.split('/')[3];

    const index = registrations.findIndex(r => r.id === registrationId);

    if (index === -1) {
      return { code: -1, data: null, message: '报名记录不存在' };
    }

    // 移除报名记录
    registrations.splice(index, 1);

    return { code: 0, data: null, message: '已移除报名' };
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

  // 注意：收藏功能已改用真实后端API，不再使用Mock数据

  // 消息相关接口（使用本地存储持久化，兼容 notification.js）
  if (url === '/api/messages/my' && method === 'GET') {
    // 获取我的消息列表（使用与 notification.js 相同的存储key）
    const messages = wx.getStorageSync('notifications') || [];

    // 按时间倒序排列
    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      code: 0,
      data: messages,
      message: 'success'
    };
  }

  if (url.startsWith('/api/messages/') && url.endsWith('/read') && method === 'PUT') {
    // 标记消息已读
    const messageId = url.split('/')[3];
    const messages = wx.getStorageSync('notifications') || [];
    const message = messages.find(m => m.id === messageId);

    if (message) {
      message.isRead = true;
      wx.setStorageSync('notifications', messages);
      return { code: 0, data: message, message: '标记成功' };
    }

    return { code: -1, data: null, message: '消息不存在' };
  }

  if (url.startsWith('/api/messages/') && method === 'DELETE') {
    // 删除消息
    const messageId = url.split('/')[3];
    let messages = wx.getStorageSync('notifications') || [];
    const originalLength = messages.length;

    messages = messages.filter(m => m.id !== messageId);
    wx.setStorageSync('notifications', messages);

    if (messages.length < originalLength) {
      return { code: 0, data: null, message: '删除成功' };
    }

    return { code: -1, data: null, message: '消息不存在' };
  }

  // 批量标记消息已读
  if (url === '/api/messages/mark-all-read' && method === 'PUT') {
    const messages = wx.getStorageSync('notifications') || [];
    messages.forEach(m => m.isRead = true);
    wx.setStorageSync('notifications', messages);
    return { code: 0, data: null, message: '全部已读' };
  }

  // 管理员管理相关接口（临时使用Mock模式）
  // 获取活动管理员列表
  if (url.match(/^\/api\/activities\/[^/]+\/administrators$/) && method === 'GET') {
    const activityId = url.split('/')[3];
    const activity = activities.find(a => a.id === activityId);

    if (!activity) {
      return { code: -1, data: null, message: '活动不存在' };
    }

    // 返回管理员列表（包含用户详情）
    const administrators = (activity.administrators || []).map(admin => {
      const user = participants.find(p => p.id === admin.userId);
      return {
        ...admin,
        userName: user?.name || '未知用户',
        userAvatar: user?.avatar || '',
        userPhone: user?.phone || ''
      };
    });

    return { code: 0, data: administrators, message: 'success' };
  }

  // 添加管理员
  if (url.match(/^\/api\/activities\/[^/]+\/administrators$/) && method === 'POST') {
    const activityId = url.split('/')[3];
    const { userId } = data;

    const activity = activities.find(a => a.id === activityId);

    if (!activity) {
      return { code: -1, data: null, message: '活动不存在' };
    }

    // 检查用户是否存在
    const user = participants.find(p => p.id === userId);
    if (!user) {
      return { code: -1, data: null, message: '用户不存在' };
    }

    // 初始化管理员列表
    if (!activity.administrators) {
      activity.administrators = [];
    }

    // 检查是否已经是管理员
    const isAlreadyAdmin = activity.administrators.some(admin => admin.userId === userId);
    if (isAlreadyAdmin) {
      return { code: -1, data: null, message: '该用户已经是管理员' };
    }

    // 添加管理员
    const now = new Date();
    const addedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newAdmin = {
      userId,
      addedAt,
      addedBy: 'u1'  // TODO: 应该从当前用户获取
    };

    activity.administrators.push(newAdmin);

    return {
      code: 0,
      data: {
        ...newAdmin,
        userName: user.name,
        userAvatar: user.avatar || '',
        userPhone: user.phone || ''
      },
      message: '添加成功'
    };
  }

  // 移除管理员
  if (url.match(/^\/api\/activities\/[^/]+\/administrators\/[^/]+$/) && method === 'DELETE') {
    const pathParts = url.split('/');
    const activityId = pathParts[3];
    const userId = pathParts[5];

    const activity = activities.find(a => a.id === activityId);

    if (!activity) {
      return { code: -1, data: null, message: '活动不存在' };
    }

    if (!activity.administrators) {
      return { code: -1, data: null, message: '该用户不是管理员' };
    }

    // 移除管理员
    const index = activity.administrators.findIndex(admin => admin.userId === userId);
    if (index === -1) {
      return { code: -1, data: null, message: '该用户不是管理员' };
    }

    activity.administrators.splice(index, 1);

    return { code: 0, data: null, message: '移除成功' };
  }

  // 获取可添加为管理员的用户列表
  if (url === '/api/users/available-administrators' && method === 'GET') {
    const { activityId } = data;

    if (!activityId) {
      return { code: -1, data: null, message: '活动ID不能为空' };
    }

    const activity = activities.find(a => a.id === activityId);

    if (!activity) {
      return { code: -1, data: null, message: '活动不存在' };
    }

    // 排除创建者和已有管理员
    const adminUserIds = (activity.administrators || []).map(admin => admin.userId);
    const availableUsers = participants.filter(p => {
      return p.id !== activity.organizerId && !adminUserIds.includes(p.id);
    });

    return {
      code: 0,
      data: availableUsers.map(user => ({
        id: user.id,
        name: user.name,
        avatar: user.avatar || '',
        phone: user.phone || ''
      })),
      message: 'success'
    };
  }

  // 白名单管理相关接口（临时使用Mock模式）
  // 获取活动白名单列表
  if (url.match(/^\/api\/activities\/[^/]+\/whitelist$/) && method === 'GET') {
    const activityId = url.split('/')[3];
    const activity = activities.find(a => a.id === activityId);

    if (!activity) {
      return { code: -1, data: null, message: '活动不存在' };
    }

    // 返回白名单列表（包含用户详情）
    const whitelist = (activity.whitelist || []).map(item => {
      const user = participants.find(p => p.id === item.userId);
      return {
        ...item,
        name: user?.name || '未知用户',
        avatar: user?.avatar || ''
      };
    });

    return { code: 0, data: whitelist, message: 'success' };
  }

  // 批量添加白名单
  if (url.match(/^\/api\/activities\/[^/]+\/whitelist$/) && method === 'POST') {
    const activityId = url.split('/')[3];
    const { phones, userIds } = data;  // 支持按手机号或用户ID批量添加

    const activity = activities.find(a => a.id === activityId);

    if (!activity) {
      return { code: -1, data: null, message: '活动不存在' };
    }

    // 初始化白名单数组
    if (!activity.whitelist) {
      activity.whitelist = [];
    }

    const now = new Date();
    const addedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const addedBy = 'u1';  // TODO: 应该从当前用户获取

    let addedCount = 0;

    // 按手机号添加
    if (phones && Array.isArray(phones)) {
      phones.forEach(phone => {
        // 检查是否已存在
        const exists = activity.whitelist.some(w => w.phone === phone);
        if (!exists) {
          // 查找对应的用户ID
          const user = participants.find(p => p.phone === phone || p.mobile === phone);
          activity.whitelist.push({
            phone,
            userId: user?.id || null,
            addedAt,
            addedBy
          });
          addedCount++;
        }
      });
    }

    // 按用户ID添加
    if (userIds && Array.isArray(userIds)) {
      userIds.forEach(userId => {
        // 检查是否已存在
        const exists = activity.whitelist.some(w => w.userId === userId);
        if (!exists) {
          // 从participants获取用户信息
          const user = participants.find(p => p.id === userId);
          activity.whitelist.push({
            phone: user?.phone || user?.mobile || '',
            userId,
            addedAt,
            addedBy
          });
          addedCount++;
        }
      });
    }

    return {
      code: 0,
      data: { addedCount },
      message: `成功添加 ${addedCount} 个条目`
    };
  }

  // 移除白名单
  if (url.match(/^\/api\/activities\/[^/]+\/whitelist\/[^/]+$/) && method === 'DELETE') {
    const pathParts = url.split('/');
    const activityId = pathParts[3];
    const phone = decodeURIComponent(pathParts[5]);  // 手机号可能包含特殊字符，需要解码

    const activity = activities.find(a => a.id === activityId);

    if (!activity) {
      return { code: -1, data: null, message: '活动不存在' };
    }

    if (!activity.whitelist) {
      return { code: -1, data: null, message: '该条目不存在' };
    }

    // 移除白名单条目
    const index = activity.whitelist.findIndex(w => w.phone === phone);
    if (index === -1) {
      return { code: -1, data: null, message: '该条目不存在' };
    }

    activity.whitelist.splice(index, 1);

    return { code: 0, data: null, message: '移除成功' };
  }

  // 获取活动已报名用户列表（用于白名单选择）
  if (url.match(/^\/api\/activities\/[^/]+\/registered-users$/) && method === 'GET') {
    const activityId = url.split('/')[3];

    // 获取活动的所有已通过审核的报名记录
    const activityRegs = registrations.filter(r =>
      r.activityId === activityId && r.status === 'approved'
    );

    // 映射为包含用户信息的格式
    const registeredUsers = activityRegs.map(reg => {
      const user = participants.find(p => p.id === reg.userId);
      return {
        userId: reg.userId,
        name: reg.name,
        mobile: reg.mobile || reg.phone || '',
        avatar: user?.avatar || ''
      };
    });

    return { code: 0, data: registeredUsers, message: 'success' };
  }

  // 黑名单管理相关接口（临时使用Mock模式）
  // 获取活动黑名单列表
  if (url.match(/^\/api\/activities\/[^/]+\/blacklist$/) && method === 'GET') {
    const activityId = url.split('/')[3];
    const activity = activities.find(a => a.id === activityId);

    if (!activity) {
      return { code: -1, data: null, message: '活动不存在' };
    }

    // 返回黑名单列表（包含用户详情）
    const blacklist = (activity.blacklist || []).map(item => {
      const user = participants.find(p => p.id === item.userId);
      return {
        ...item,
        name: user?.name || '未知用户',
        avatar: user?.avatar || ''
      };
    });

    return { code: 0, data: blacklist, message: 'success' };
  }

  // 批量添加黑名单
  if (url.match(/^\/api\/activities\/[^/]+\/blacklist$/) && method === 'POST') {
    const activityId = url.split('/')[3];
    const { phones, reason, expiryDays } = data;  // phones: 手机号数组, reason: 拉黑原因, expiryDays: 过期天数(null表示永久)

    const activity = activities.find(a => a.id === activityId);

    if (!activity) {
      return { code: -1, data: null, message: '活动不存在' };
    }

    // 初始化黑名单数组
    if (!activity.blacklist) {
      activity.blacklist = [];
    }

    const now = new Date();
    const addedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const addedBy = 'u1';  // TODO: 应该从当前用户获取

    let addedCount = 0;

    // 计算过期时间
    let expiresAt = null;
    if (expiryDays && expiryDays > 0) {
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));
      expiresAt = expiryDate.toISOString();
    }

    // 按手机号添加
    if (phones && Array.isArray(phones)) {
      phones.forEach(phone => {
        // 检查是否已存在
        const exists = activity.blacklist.some(b => b.phone === phone);
        if (!exists) {
          // 查找对应的用户ID
          const user = participants.find(p => p.phone === phone || p.mobile === phone);
          activity.blacklist.push({
            phone,
            userId: user?.id || null,
            reason: reason || '',
            isActive: true,
            expiresAt,
            addedAt,
            addedBy
          });
          addedCount++;
        }
      });
    }

    return {
      code: 0,
      data: { addedCount },
      message: `成功添加 ${addedCount} 个条目`
    };
  }

  // 移除黑名单
  if (url.match(/^\/api\/activities\/[^/]+\/blacklist\/[^/]+$/) && method === 'DELETE') {
    const pathParts = url.split('/');
    const activityId = pathParts[3];
    const phone = decodeURIComponent(pathParts[5]);

    const activity = activities.find(a => a.id === activityId);

    if (!activity) {
      return { code: -1, data: null, message: '活动不存在' };
    }

    if (!activity.blacklist) {
      return { code: -1, data: null, message: '该条目不存在' };
    }

    // 移除黑名单条目
    const index = activity.blacklist.findIndex(b => b.phone === phone);
    if (index === -1) {
      return { code: -1, data: null, message: '该条目不存在' };
    }

    activity.blacklist.splice(index, 1);

    return { code: 0, data: null, message: '移除成功' };
  }

  // 切换黑名单启用/禁用状态
  if (url.match(/^\/api\/activities\/[^/]+\/blacklist\/[^/]+\/toggle$/) && method === 'PUT') {
    const pathParts = url.split('/');
    const activityId = pathParts[3];
    const phone = decodeURIComponent(pathParts[5]);

    const activity = activities.find(a => a.id === activityId);

    if (!activity) {
      return { code: -1, data: null, message: '活动不存在' };
    }

    if (!activity.blacklist) {
      return { code: -1, data: null, message: '该条目不存在' };
    }

    // 查找黑名单条目
    const item = activity.blacklist.find(b => b.phone === phone);
    if (!item) {
      return { code: -1, data: null, message: '该条目不存在' };
    }

    // 切换状态
    item.isActive = !item.isActive;

    return {
      code: 0,
      data: { isActive: item.isActive },
      message: item.isActive ? '已启用' : '已禁用'
    };
  }

  // 用户反馈API（临时使用Mock模式）
  // 提交用户反馈
  if (url === '/api/feedback' && method === 'POST') {
    const { content, contactInfo } = data;

    // 验证反馈内容
    if (!content || !content.trim()) {
      return { code: -1, data: null, message: '反馈内容不能为空' };
    }

    if (content.trim().length < 5) {
      return { code: -1, data: null, message: '反馈内容至少5个字' };
    }

    if (content.trim().length > 500) {
      return { code: -1, data: null, message: '反馈内容不能超过500字' };
    }

    // 创建反馈记录
    const feedback = {
      id: 'fb' + Date.now(),
      userId: 'u1',  // TODO: 应从当前用户获取
      content: content.trim(),
      contactInfo: contactInfo ? contactInfo.trim() : '',
      status: 'pending',  // pending, processing, resolved
      createdAt: new Date().toISOString()
    };

    // 实际应该保存到数据库，这里只是模拟
    console.log('[Mock] 新反馈已保存:', feedback);

    return {
      code: 0,
      data: feedback,
      message: '提交成功，感谢您的反馈！'
    };
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

  // 取消报名（用户自己取消）
  cancel: (id) => request(`/api/registrations/${id}`, {
    method: 'DELETE',
    showLoading: true,
    loadingText: '取消中...'
  }),

  // 移除报名（管理员移除）
  remove: (id) => request(`/api/registrations/${id}`, {
    method: 'DELETE',
    showLoading: false  // 管理员操作不显示全局loading
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

// 评价API
const reviewAPI = {
  // 创建或更新评价（显示loading）
  createOrUpdate: (data) => request('/api/reviews', {
    method: 'POST',
    data,  // { activityId, rating, content }
    showLoading: true,
    loadingText: '提交中...',
    retryCount: 1
  }),

  // 更新评价
  update: (reviewId, data) => request(`/api/reviews/${reviewId}`, {
    method: 'PUT',
    data,  // { rating, content }
    showLoading: true,
    loadingText: '更新中...'
  }),

  // 删除评价
  delete: (reviewId) => request(`/api/reviews/${reviewId}`, {
    method: 'DELETE',
    showLoading: true,
    loadingText: '删除中...'
  }),

  // 获取我的评价
  getMyReview: (activityId) => request('/api/reviews/my', {
    method: 'GET',
    data: { activityId },
    useCache: false  // 评价数据实时性要求高，不缓存
  }),

  // 检查是否已评价
  checkReviewed: (activityId) => request('/api/reviews/check', {
    method: 'GET',
    data: { activityId },
    useCache: false
  }),

  // 获取活动评价列表（管理员）
  getActivityReviews: (activityId, params = {}) => request(`/api/reviews/activity/${activityId}`, {
    method: 'GET',
    data: params,  // 支持 rating, sortBy, page, size 参数
    useCache: false
  }),

  // 获取评价统计
  getStatistics: (activityId) => request(`/api/reviews/activity/${activityId}/statistics`, {
    method: 'GET',
    useCache: true,
    cacheMaxAge: 2 * 60 * 1000  // 缓存2分钟
  }),

  // 管理员删除评价
  deleteByAdmin: (reviewId, deleteReason) => request(`/api/reviews/${reviewId}/admin`, {
    method: 'DELETE',
    data: { deleteReason },
    showLoading: true,
    loadingText: '删除中...'
  })
};

// 收藏API（使用后端数据库）
const favoriteAPI = {
  // 添加收藏
  add: (activityId) => request('/api/favorites', {
    method: 'POST',
    data: { activityId },
    showLoading: false,
    showError: true
  }),

  // 取消收藏
  remove: (activityId) => request(`/api/favorites/${activityId}`, {
    method: 'DELETE',
    showLoading: false,
    showError: true
  }),

  // 获取我的收藏列表（支持分页）
  getMyFavorites: (params = {}) => request('/api/favorites/my', {
    method: 'GET',
    data: params,  // 支持 page, size 参数
    useCache: false,  // 收藏数据实时性要求高，不缓存
    showLoading: false
  }),

  // 检查是否已收藏
  checkFavorited: (activityId) => request('/api/favorites/check', {
    method: 'GET',
    data: { activityId },
    useCache: false,
    showLoading: false
  })
};

// 消息API
const messageAPI = {
  // 获取我的消息列表（减少重试次数，避免大量错误日志）
  getMyMessages: (params = {}) => request('/api/messages/my', {
    method: 'GET',
    data: params,  // 支持 page, size, category 参数
    useCache: false,  // 消息数据实时性要求高，不缓存
    showLoading: false,
    retryCount: 0  // 消息接口失败不重试，直接显示空列表或降级
  }),

  // 标记消息已读
  markAsRead: (messageId) => request(`/api/messages/${messageId}/read`, {
    method: 'PUT',
    showLoading: false,
    retryCount: 1  // 只重试1次
  }),

  // 标记所有消息已读
  markAllAsRead: () => request('/api/messages/mark-all-read', {
    method: 'PUT',
    showLoading: false,
    retryCount: 1  // 只重试1次
  }),

  // 删除消息
  delete: (messageId) => request(`/api/messages/${messageId}`, {
    method: 'DELETE',
    showLoading: false,
    retryCount: 1  // 只重试1次
  })
};

// 管理员管理API
const administratorAPI = {
  // 获取活动管理员列表
  getAdministrators: (activityId) => request(`/api/activities/${activityId}/administrators`, {
    method: 'GET',
    useCache: false,
    showLoading: false
  }),

  // 添加管理员
  addAdministrator: (activityId, userId) => request(`/api/activities/${activityId}/administrators`, {
    method: 'POST',
    data: { userId },
    showLoading: true,
    loadingText: '添加中...'
  }),

  // 移除管理员
  removeAdministrator: (activityId, userId) => request(`/api/activities/${activityId}/administrators/${userId}`, {
    method: 'DELETE',
    showLoading: true,
    loadingText: '移除中...'
  }),

  // 获取可添加为管理员的用户列表
  getAvailableUsers: (activityId) => request('/api/users/available-administrators', {
    method: 'GET',
    data: { activityId },
    useCache: false,
    showLoading: false
  })
};

// 白名单管理API
const whitelistAPI = {
  // 获取活动白名单列表
  getWhitelist: (activityId) => request(`/api/activities/${activityId}/whitelist`, {
    method: 'GET',
    useCache: false,
    showLoading: false
  }),

  // 批量添加白名单（支持手机号或用户ID）
  addBatch: (activityId, data) => request(`/api/activities/${activityId}/whitelist`, {
    method: 'POST',
    data,  // { phones: [...] } 或 { userIds: [...] }
    showLoading: true,
    loadingText: '添加中...'
  }),

  // 移除白名单
  remove: (activityId, phone) => request(`/api/activities/${activityId}/whitelist/${encodeURIComponent(phone)}`, {
    method: 'DELETE',
    showLoading: true,
    loadingText: '移除中...'
  }),

  // 获取活动已报名用户列表（用于选择添加）
  getRegisteredUsers: (activityId) => request(`/api/activities/${activityId}/registered-users`, {
    method: 'GET',
    useCache: false,
    showLoading: false
  })
};

// 黑名单管理API
const blacklistAPI = {
  // 获取活动黑名单列表
  getBlacklist: (activityId) => request(`/api/activities/${activityId}/blacklist`, {
    method: 'GET',
    useCache: false,
    showLoading: false
  }),

  // 批量添加黑名单
  addBatch: (activityId, data) => request(`/api/activities/${activityId}/blacklist`, {
    method: 'POST',
    data,  // { phones: [...], reason: '...', expiryDays: 30 }
    showLoading: true,
    loadingText: '添加中...'
  }),

  // 移除黑名单
  remove: (activityId, phone) => request(`/api/activities/${activityId}/blacklist/${encodeURIComponent(phone)}`, {
    method: 'DELETE',
    showLoading: true,
    loadingText: '移除中...'
  }),

  // 切换黑名单启用/禁用状态
  toggleActive: (activityId, phone) => request(`/api/activities/${activityId}/blacklist/${encodeURIComponent(phone)}/toggle`, {
    method: 'PUT',
    showLoading: true,
    loadingText: '处理中...'
  })
};

// 用户反馈API
const feedbackAPI = {
  // 提交用户反馈
  submit: (data) => request('/api/feedback', {
    method: 'POST',
    data,  // { content: '反馈内容', contactInfo: '联系方式（可选）' }
    showLoading: true,
    loadingText: '提交中...'
  })
};

module.exports = {
  request,
  activityAPI,
  registrationAPI,
  checkinAPI,
  userAPI,
  statisticsAPI,
  reviewAPI,
  favoriteAPI,
  messageAPI,
  administratorAPI,
  whitelistAPI,
  blacklistAPI,
  feedbackAPI
};
