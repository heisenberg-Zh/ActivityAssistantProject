// utils/validator.js - 数据验证工具
const { sanitizeInput, isSafeMobile } = require('./security.js');

// 验证手机号
const validateMobile = (mobile) => {
  if (!mobile) return { valid: false, message: '请输入手机号' };

  // 安全检查：防止SQL注入
  if (!isSafeMobile(mobile)) {
    return { valid: false, message: '手机号格式不正确' };
  }

  return { valid: true, message: '' };
};

// 验证必填字段
const validateRequired = (value, fieldName = '此字段') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { valid: false, message: `${fieldName}不能为空` };
  }
  return { valid: true, message: '' };
};

// 验证字符串长度
const validateLength = (value, min, max, fieldName = '此字段') => {
  const len = (value || '').length;
  if (min && len < min) {
    return { valid: false, message: `${fieldName}不能少于${min}个字符` };
  }
  if (max && len > max) {
    return { valid: false, message: `${fieldName}不能超过${max}个字符` };
  }
  return { valid: true, message: '' };
};

// 验证数字范围
const validateRange = (value, min, max, fieldName = '此字段') => {
  const num = Number(value);
  if (isNaN(num)) {
    return { valid: false, message: `${fieldName}必须是数字` };
  }
  if (min !== undefined && num < min) {
    return { valid: false, message: `${fieldName}不能小于${min}` };
  }
  if (max !== undefined && num > max) {
    return { valid: false, message: `${fieldName}不能大于${max}` };
  }
  return { valid: true, message: '' };
};

// 验证日期
const validateDate = (dateStr, fieldName = '日期') => {
  if (!dateStr) {
    return { valid: false, message: `请选择${fieldName}` };
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { valid: false, message: `${fieldName}格式不正确` };
  }
  return { valid: true, message: '' };
};

// 验证时间范围
const validateTimeRange = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime())) {
    return { valid: false, message: '开始时间格式不正确' };
  }
  if (isNaN(end.getTime())) {
    return { valid: false, message: '结束时间格式不正确' };
  }
  if (end <= start) {
    return { valid: false, message: '结束时间必须晚于开始时间' };
  }
  return { valid: true, message: '' };
};

/**
 * 验证定时发布时间
 * @param {String} scheduledTime - 定时发布时间
 * @param {String} activityStartTime - 活动开始时间
 * @returns {Object} 验证结果
 */
const validateScheduledPublishTime = (scheduledTime, activityStartTime) => {
  // 验证时间格式
  const scheduled = new Date(scheduledTime);
  const activityStart = new Date(activityStartTime);
  const now = new Date();

  if (isNaN(scheduled.getTime())) {
    return { valid: false, message: '定时发布时间格式不正确' };
  }

  // 定时发布时间不能早于当前时间
  if (scheduled <= now) {
    return { valid: false, message: '定时发布时间必须晚于当前时间' };
  }

  // 定时发布时间不能晚于活动开始时间
  if (isNaN(activityStart.getTime()) === false && scheduled >= activityStart) {
    return { valid: false, message: '定时发布时间必须早于活动开始时间' };
  }

  // 定时发布时间不能超过30天
  const maxDays = 30;
  const maxTime = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);
  if (scheduled > maxTime) {
    return { valid: false, message: `定时发布时间不能超过${maxDays}天` };
  }

  return { valid: true, message: '' };
};

/**
 * 验证周期性活动配置
 * @param {Object} recurringConfig - 周期性配置
 * @param {String} startTime - 活动开始时间
 * @returns {Object} 验证结果
 */
const validateRecurringConfig = (recurringConfig, startTime) => {
  if (!recurringConfig) {
    return { valid: false, message: '请配置周期性活动参数' };
  }

  const { frequency, weekdays, totalWeeks } = recurringConfig;

  // 验证频率
  if (!frequency || !['daily', 'weekly', 'monthly'].includes(frequency)) {
    return { valid: false, message: '周期频率不正确' };
  }

  // 如果是按周重复，需要验证weekdays
  if (frequency === 'weekly') {
    if (!weekdays || !Array.isArray(weekdays) || weekdays.length === 0) {
      return { valid: false, message: '请选择重复的星期' };
    }

    // 验证weekdays值是否在0-6之间
    const validWeekdays = weekdays.every(day => day >= 0 && day <= 6);
    if (!validWeekdays) {
      return { valid: false, message: '星期值不正确（0-6）' };
    }
  }

  // 验证总周数
  if (!totalWeeks || totalWeeks < 1 || totalWeeks > 52) {
    return { valid: false, message: '重复周数应在1-52之间' };
  }

  // 验证开始时间
  const start = new Date(startTime);
  const now = new Date();
  if (isNaN(start.getTime())) {
    return { valid: false, message: '活动开始时间格式不正确' };
  }

  if (start <= now) {
    return { valid: false, message: '周期性活动的开始时间必须晚于当前时间' };
  }

  return { valid: true, message: '' };
};

/**
 * 验证报名截止时间
 * @param {String} registerDeadline - 报名截止时间
 * @param {String} activityStartTime - 活动开始时间
 * @returns {Object} 验证结果
 */
const validateRegisterDeadline = (registerDeadline, activityStartTime) => {
  const deadline = new Date(registerDeadline);
  const activityStart = new Date(activityStartTime);
  const now = new Date();

  if (isNaN(deadline.getTime())) {
    return { valid: false, message: '报名截止时间格式不正确' };
  }

  if (isNaN(activityStart.getTime())) {
    return { valid: false, message: '活动开始时间格式不正确' };
  }

  // 报名截止时间不能早于当前时间
  if (deadline <= now) {
    return { valid: false, message: '报名截止时间必须晚于当前时间' };
  }

  // 报名截止时间不能晚于活动开始时间
  if (deadline > activityStart) {
    return { valid: false, message: '报名截止时间不能晚于活动开始时间' };
  }

  return { valid: true, message: '' };
};

// 验证活动表单
const validateActivityForm = (form) => {
  const errors = [];

  // 安全清理：防止XSS注入
  const safeTitle = sanitizeInput(form.title, { maxLength: 50 });
  const safeDesc = form.desc ? sanitizeInput(form.desc, { maxLength: 500 }) : '';

  // 验证标题
  const titleCheck = validateRequired(safeTitle, '活动标题');
  if (!titleCheck.valid) errors.push(titleCheck.message);

  const titleLengthCheck = validateLength(safeTitle, 2, 50, '活动标题');
  if (!titleLengthCheck.valid) errors.push(titleLengthCheck.message);

  // 验证描述
  if (safeDesc) {
    const descLengthCheck = validateLength(safeDesc, 0, 500, '活动描述');
    if (!descLengthCheck.valid) errors.push(descLengthCheck.message);
  }

  // 验证类型
  const typeCheck = validateRequired(form.type, '活动类型');
  if (!typeCheck.valid) errors.push(typeCheck.message);

  // 验证时间
  const startCheck = validateDate(form.startTime, '开始时间');
  if (!startCheck.valid) errors.push(startCheck.message);

  const endCheck = validateDate(form.endTime, '结束时间');
  if (!endCheck.valid) errors.push(endCheck.message);

  if (startCheck.valid && endCheck.valid) {
    const rangeCheck = validateTimeRange(form.startTime, form.endTime);
    if (!rangeCheck.valid) errors.push(rangeCheck.message);
  }

  // 验证地点
  const placeCheck = validateRequired(form.place, '活动地点');
  if (!placeCheck.valid) errors.push(placeCheck.message);

  // 验证人数
  const totalCheck = validateRange(form.total, 1, 10000, '最大参与人数');
  if (!totalCheck.valid) errors.push(totalCheck.message);

  if (form.minParticipants) {
    const minCheck = validateRange(form.minParticipants, 1, form.total, '最小参与人数');
    if (!minCheck.valid) errors.push(minCheck.message);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// 验证报名表单
const validateRegistrationForm = (form) => {
  const errors = [];

  // 安全清理：防止XSS注入
  const safeName = sanitizeInput(form.name, { maxLength: 20 });

  // 验证姓名
  const nameCheck = validateRequired(safeName, '姓名');
  if (!nameCheck.valid) errors.push(nameCheck.message);

  const nameLengthCheck = validateLength(safeName, 2, 20, '姓名');
  if (!nameLengthCheck.valid) errors.push(nameLengthCheck.message);

  // 验证手机号
  const mobileCheck = validateMobile(form.mobile);
  if (!mobileCheck.valid) errors.push(mobileCheck.message);

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateMobile,
  validateRequired,
  validateLength,
  validateRange,
  validateDate,
  validateTimeRange,
  validateScheduledPublishTime,
  validateRecurringConfig,
  validateRegisterDeadline,
  validateActivityForm,
  validateRegistrationForm
};
