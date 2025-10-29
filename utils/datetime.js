// utils/datetime.js - 日期时间工具

// 格式化日期时间
const formatDateTime = (dateStr, format = 'YYYY-MM-DD HH:mm') => {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second);
};

// 格式化为中文日期
const formatDateCN = (dateStr) => {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${month}月${day}日 ${hour}:${minute}`;
};

// 获取相对时间描述
const getRelativeTime = (dateStr) => {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < 0) {
    // 已过期
    const absDiff = Math.abs(diff);
    if (absDiff < minute) return '刚刚';
    if (absDiff < hour) return `${Math.floor(absDiff / minute)}分钟前`;
    if (absDiff < day) return `${Math.floor(absDiff / hour)}小时前`;
    if (absDiff < 7 * day) return `${Math.floor(absDiff / day)}天前`;
    return formatDateCN(dateStr);
  } else {
    // 未来时间
    if (diff < minute) return '马上开始';
    if (diff < hour) return `${Math.floor(diff / minute)}分钟后开始`;
    if (diff < day) return `${Math.floor(diff / hour)}小时后开始`;
    if (diff < 7 * day) return `${Math.floor(diff / day)}天后开始`;
    return formatDateCN(dateStr);
  }
};

// 检查时间是否在范围内
const isTimeInRange = (targetTime, startTime, endTime) => {
  const target = new Date(targetTime).getTime();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  return target >= start && target <= end;
};

// 检查是否在签到时间窗口内
const isInCheckinWindow = (activityStartTime, windowMinutes = 30) => {
  const now = new Date().getTime();
  const start = new Date(activityStartTime).getTime();
  const windowMs = windowMinutes * 60 * 1000;

  // 允许活动开始前后windowMinutes分钟内签到
  return now >= (start - windowMs) && now <= (start + windowMs);
};

// 计算时间差（分钟）
const getTimeDiffMinutes = (time1, time2) => {
  const t1 = new Date(time1).getTime();
  const t2 = new Date(time2).getTime();
  return Math.floor(Math.abs(t1 - t2) / (60 * 1000));
};

// 判断是否迟到
const isLate = (checkinTime, activityStartTime, toleranceMinutes = 10) => {
  const checkin = new Date(checkinTime).getTime();
  const start = new Date(activityStartTime).getTime();
  const tolerance = toleranceMinutes * 60 * 1000;

  return checkin > (start + tolerance);
};

// 生成时间选择器选项
const generateTimeOptions = () => {
  const hours = [];
  const minutes = [];

  for (let h = 0; h < 24; h++) {
    hours.push(String(h).padStart(2, '0'));
  }

  for (let m = 0; m < 60; m += 5) {
    minutes.push(String(m).padStart(2, '0'));
  }

  return { hours, minutes };
};

// 解析时间字符串为日期对象
const parseDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  if (timeStr) {
    const [hour, minute] = timeStr.split(':');
    date.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
  }

  return date;
};

// 检查是否在报名截止时间内
const isBeforeRegisterDeadline = (registerDeadline) => {
  if (!registerDeadline) {
    // 如果没有设置截止时间，默认允许报名
    return { valid: true, message: '' };
  }

  const now = new Date();
  const deadline = new Date(registerDeadline);

  if (isNaN(deadline.getTime())) {
    // 时间格式错误，默认允许
    return { valid: true, message: '' };
  }

  if (now > deadline) {
    // 已超过截止时间
    const deadlineStr = formatDateCN(registerDeadline);
    return {
      valid: false,
      message: `报名已截止（截止时间：${deadlineStr}）`
    };
  }

  return { valid: true, message: '' };
};

// 获取距离截止时间的友好提示
const getDeadlineHint = (registerDeadline) => {
  if (!registerDeadline) return '';

  const now = new Date();
  const deadline = new Date(registerDeadline);
  const diff = deadline.getTime() - now.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < 0) {
    return '已截止';
  } else if (diff < hour) {
    return `还剩${Math.floor(diff / minute)}分钟`;
  } else if (diff < day) {
    return `还剩${Math.floor(diff / hour)}小时`;
  } else if (diff < 7 * day) {
    return `还剩${Math.floor(diff / day)}天`;
  }

  return formatDateCN(registerDeadline);
};

module.exports = {
  formatDateTime,
  formatDateCN,
  getRelativeTime,
  isTimeInRange,
  isInCheckinWindow,
  getTimeDiffMinutes,
  isLate,
  generateTimeOptions,
  parseDateTime,
  isBeforeRegisterDeadline,
  getDeadlineHint
};
