// utils/formatter.js - 数据格式化工具

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return '';

  try {
    // 兼容ISO格式和普通格式
    let dateStr = dateTime;

    // 如果包含空格（后端可能返回这种格式），转换为ISO格式
    if (dateStr.includes(' ') && !dateStr.includes('T')) {
      dateStr = dateStr.replace(' ', 'T');
    }

    // 移除毫秒部分
    dateStr = dateStr.replace(/\.\d+/, '');

    const date = new Date(dateStr);

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${hour}:${minute}`;
  } catch (err) {
    console.error('日期格式化失败:', dateTime, err);
    return dateTime;
  }
};

// 格式化手机号（隐藏中间四位）
const formatMobile = (mobile) => {
  if (!mobile || mobile.length !== 11) return mobile;
  return mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

// 格式化金额
const formatMoney = (amount, showSymbol = true) => {
  if (amount === 0) return '免费';

  const formatted = Number(amount).toFixed(2);
  return showSymbol ? `¥${formatted}` : formatted;
};

// 格式化百分比
const formatPercent = (value, decimals = 0) => {
  return `${Number(value).toFixed(decimals)}%`;
};

// 格式化人数显示
const formatParticipants = (joined, total) => {
  return `${joined}/${total}人`;
};

// 将后端英文状态翻译为中文（静态翻译，不考虑时间）
const translateActivityStatus = (status) => {
  const statusMap = {
    'pending': '待发布',
    'draft': '草稿',
    'published': '报名中',
    'ongoing': '进行中',
    'upcoming': '即将开始',
    'finished': '已结束',
    'ended': '已结束',
    'cancelled': '已取消'
  };

  return statusMap[status] || status;
};

/**
 * 根据活动时间动态计算活动实际状态
 * 注意：这是动态状态，会随着当前时间变化
 *
 * @param {Object} activity - 活动对象（必须包含 status, registerDeadline, startTime, endTime）
 * @returns {String} 状态中文文本
 */
const calculateActivityStatus = (activity) => {
  if (!activity) return '未知';

  const now = new Date();

  // 1. 如果是取消或草稿状态，使用数据库状态（这些是固定状态，不随时间变化）
  if (activity.status === 'cancelled') return '已取消';
  if (activity.status === 'draft') return '草稿';
  if (activity.status === 'pending') return '待发布';

  // 2. 解析时间（兼容ISO格式和普通格式）
  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    try {
      // 类型检查
      if (typeof timeStr !== 'string') {
        return null;
      }

      let dateStr = timeStr.trim();

      // 如果包含空格（后端可能返回这种格式），转换为ISO格式
      if (dateStr.includes(' ') && !dateStr.includes('T')) {
        dateStr = dateStr.replace(' ', 'T');
      }

      // 移除毫秒部分
      dateStr = dateStr.replace(/\.\d+/, '');

      const date = new Date(dateStr);

      // 验证日期是否有效
      if (isNaN(date.getTime())) {
        return null;
      }

      return date;
    } catch (err) {
      return null;
    }
  };

  const registerDeadline = parseTime(activity.registerDeadline);
  const startTime = parseTime(activity.startTime);
  const endTime = parseTime(activity.endTime);

  // 3. 如果时间解析失败，回退到使用数据库状态（静默处理，不输出警告）
  if (!registerDeadline || !startTime || !endTime) {
    return translateActivityStatus(activity.status);
  }

  // 4. 根据时间动态判断状态
  if (now >= endTime) {
    return '已结束';  // 当前时间 >= 结束时间
  } else if (now >= startTime) {
    return '进行中';  // 开始时间 <= 当前时间 < 结束时间
  } else if (now >= registerDeadline) {
    return '即将开始';  // 报名截止 <= 当前时间 < 开始时间
  } else {
    return '报名中';  // 当前时间 < 报名截止时间
  }
};

// 格式化活动状态（返回文本和颜色）
const formatActivityStatus = (status) => {
  // 先翻译英文状态
  const translatedStatus = translateActivityStatus(status);

  const statusMap = {
    '待发布': { text: '待发布', color: '#9ca3af' },
    '草稿': { text: '草稿', color: '#9ca3af' },
    '报名中': { text: '报名中', color: '#f59e0b' },
    '进行中': { text: '进行中', color: '#10b981' },
    '即将开始': { text: '即将开始', color: '#3b82f6' },
    '已结束': { text: '已结束', color: '#6b7280' },
    '已取消': { text: '已取消', color: '#ef4444' }
  };

  return statusMap[translatedStatus] || { text: translatedStatus, color: '#6b7280' };
};

// 格式化报名状态
const formatRegistrationStatus = (status) => {
  const statusMap = {
    'pending': { text: '待审核', color: '#f59e0b' },
    'approved': { text: '已通过', color: '#10b981' },
    'rejected': { text: '已拒绝', color: '#ef4444' },
    'cancelled': { text: '已取消', color: '#6b7280' }
  };

  return statusMap[status] || { text: '未知', color: '#6b7280' };
};

// 格式化签到状态
const formatCheckinStatus = (status) => {
  const statusMap = {
    'checked': { text: '已签到', color: '#10b981' },
    'late': { text: '迟到', color: '#f59e0b' },
    'absent': { text: '缺席', color: '#ef4444' },
    'pending': { text: '未签到', color: '#6b7280' }
  };

  return statusMap[status] || { text: '未知', color: '#6b7280' };
};

// 截断文本
const truncateText = (text, maxLength, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + suffix;
};

// 格式化数字（添加千分位）
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// 生成用户名首字母头像背景色
const getAvatarColor = (name) => {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  const charCode = name ? name.charCodeAt(0) : 0;
  return colors[charCode % colors.length];
};

// 获取姓名首字符
const getNameInitial = (name) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

// 格式化活动类型标签
const formatActivityType = (type) => {
  const typeMap = {
    '聚会': { text: '聚会', color: '#ec4899', bgColor: '#fce7f3' },
    '培训': { text: '培训', color: '#3b82f6', bgColor: '#dbeafe' },
    '户外': { text: '户外', color: '#10b981', bgColor: '#d1fae5' },
    '运动': { text: '运动', color: '#f59e0b', bgColor: '#fed7aa' },
    '会议': { text: '会议', color: '#8b5cf6', bgColor: '#ede9fe' }
  };

  return typeMap[type] || { text: type, color: '#6b7280', bgColor: '#f3f4f6' };
};

// 将对象转为URL查询参数
const objectToQueryString = (obj) => {
  return Object.keys(obj)
    .filter(key => obj[key] !== undefined && obj[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
};

// 解析URL查询参数为对象
const queryStringToObject = (queryString) => {
  const params = {};
  if (!queryString) return params;

  const pairs = queryString.split('&');
  pairs.forEach(pair => {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  });

  return params;
};

// 深拷贝对象
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));

  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }

  return clonedObj;
};

module.exports = {
  formatDateTime,
  formatMobile,
  formatMoney,
  formatPercent,
  formatParticipants,
  translateActivityStatus,
  calculateActivityStatus,  // 新增：动态计算活动状态
  formatActivityStatus,
  formatRegistrationStatus,
  formatCheckinStatus,
  truncateText,
  formatNumber,
  getAvatarColor,
  getNameInitial,
  formatFileSize,
  formatActivityType,
  objectToQueryString,
  queryStringToObject,
  deepClone
};
