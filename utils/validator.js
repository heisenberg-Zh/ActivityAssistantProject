// utils/validator.js - 数据验证工具

// 验证手机号
const validateMobile = (mobile) => {
  if (!mobile) return { valid: false, message: '请输入手机号' };
  const reg = /^1[3-9]\d{9}$/;
  if (!reg.test(mobile)) {
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

// 验证活动表单
const validateActivityForm = (form) => {
  const errors = [];

  // 验证标题
  const titleCheck = validateRequired(form.title, '活动标题');
  if (!titleCheck.valid) errors.push(titleCheck.message);

  const titleLengthCheck = validateLength(form.title, 2, 50, '活动标题');
  if (!titleLengthCheck.valid) errors.push(titleLengthCheck.message);

  // 验证描述
  if (form.desc) {
    const descLengthCheck = validateLength(form.desc, 0, 500, '活动描述');
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

  // 验证姓名
  const nameCheck = validateRequired(form.name, '姓名');
  if (!nameCheck.valid) errors.push(nameCheck.message);

  const nameLengthCheck = validateLength(form.name, 2, 20, '姓名');
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
  validateActivityForm,
  validateRegistrationForm
};
