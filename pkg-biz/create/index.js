// pages/activities/create.js
const { activityAPI, registrationAPI, userAPI, administratorAPI } = require('../../utils/api.js');
const { validateActivityForm } = require('../utils/validator.js');
const { formatDateTime } = require('../../utils/datetime.js');
const { parseDate } = require('../../utils/date-helper.js');
const {
  checkManagementPermission,
  checkFieldEditability,
  getUserManagedActivities
} = require('../../utils/activity-management-helper.js');
const { getActivityImage } = require('../../utils/default-images.js');
const {
  getCreateActivityAccess,
  getDeniedMessage,
  isRestrictedCreateMode
} = require('../../utils/create-activity-access.js');
const { submitGuard } = require('../utils/submit-guard.js');
const scheduler = require('../../utils/scheduler.js');
const notification = require('../../utils/notification.js');
const app = getApp();

const TYPE_OPTIONS = ['聚会', '培训', '户外', '运动', '会议', '其他'];

const normalizeGroupsForNewActivity = (groups) => {
  if (!Array.isArray(groups)) return [];
  return groups.map(g => ({
    ...g,
    joined: 0
  }));
};

const normalizeToJsonString = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return '';
    return trimmed;
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return '';
    }
  }
  return '';
};

const hasNonEmptyJsonString = (value) => {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== '[]' && trimmed !== '{}' && trimmed !== 'null';
};

const getJsonArrayLength = (value) => {
  const jsonStr = normalizeToJsonString(value);
  if (!jsonStr) return 0;
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch (e) {
    return 0;
  }
};

const padDatePart = (value) => String(value).padStart(2, '0');

const toDateOnlyString = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return [date.getFullYear(), padDatePart(date.getMonth() + 1), padDatePart(date.getDate())].join('-');
};

const buildDateFromParts = (dateStr, timeStr) => {
  if (!dateStr) return null;
  return new Date(`${dateStr}T${timeStr || '00:00'}:00`);
};

const buildMidnightDate = (dateStr) => buildDateFromParts(dateStr, '00:00');

const shiftDateString = (dateStr, offsetDays) => {
  const baseDate = buildMidnightDate(dateStr);
  if (!baseDate) return dateStr || '';
  baseDate.setDate(baseDate.getDate() + offsetDays);
  return toDateOnlyString(baseDate);
};

const formatDateTimePreview = (dateStr, timeStr) => {
  if (!dateStr) return '--';
  return `${dateStr} ${timeStr || '00:00'}`;
};

const calculateDayOffset = (fromDateStr, toDateStr) => {
  const fromDate = buildMidnightDate(fromDateStr);
  const toDate = buildMidnightDate(toDateStr);
  if (!fromDate || !toDate) return 0;
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.round((toDate.getTime() - fromDate.getTime()) / dayMs);
};

const buildCopyDateAdjustmentPlan = (form, nowDate = new Date()) => {
  if (!form || !form.startDate) return null;

  const targetStart = buildDateFromParts(toDateOnlyString(nowDate), form.startTime || '09:00');
  if (!targetStart) return null;

  let shiftedToTomorrow = false;
  if (targetStart.getTime() <= nowDate.getTime()) {
    targetStart.setDate(targetStart.getDate() + 1);
    shiftedToTomorrow = true;
  }

  const newStartDate = toDateOnlyString(targetStart);
  const endOffsetDays = calculateDayOffset(form.startDate, form.endDate || form.startDate);
  const deadlineOffsetDays = calculateDayOffset(form.startDate, form.registerDeadlineDate || form.startDate);
  const newEndDate = shiftDateString(newStartDate, endOffsetDays);
  const newRegisterDeadlineDate = shiftDateString(newStartDate, deadlineOffsetDays);

  return {
    shiftedToTomorrow,
    originalForm: {
      startDate: form.startDate || '',
      startTime: form.startTime || '09:00',
      endDate: form.endDate || '',
      endTime: form.endTime || '18:00',
      registerDeadlineDate: form.registerDeadlineDate || '',
      registerDeadlineTime: form.registerDeadlineTime || '09:00'
    },
    adjustedForm: {
      startDate: newStartDate,
      startTime: form.startTime || '09:00',
      endDate: newEndDate,
      endTime: form.endTime || '18:00',
      registerDeadlineDate: newRegisterDeadlineDate,
      registerDeadlineTime: form.registerDeadlineTime || '09:00'
    },
    preview: {
      originalStart: formatDateTimePreview(form.startDate, form.startTime || '09:00'),
      newStart: formatDateTimePreview(newStartDate, form.startTime || '09:00') + (shiftedToTomorrow ? '（已顺延至明天）' : ''),
      originalEnd: formatDateTimePreview(form.endDate, form.endTime || '18:00'),
      newEnd: formatDateTimePreview(newEndDate, form.endTime || '18:00'),
      originalDeadline: formatDateTimePreview(form.registerDeadlineDate, form.registerDeadlineTime || '09:00'),
      newDeadline: formatDateTimePreview(newRegisterDeadlineDate, form.registerDeadlineTime || '09:00')
    }
  };
};

const hasCopyDateAdjustment = (datePlan) => {
  if (!datePlan || !datePlan.originalForm || !datePlan.adjustedForm) return false;
  const keys = ['startDate', 'endDate', 'registerDeadlineDate'];
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    if ((datePlan.originalForm[key] || '') !== (datePlan.adjustedForm[key] || '')) {
      return true;
    }
  }
  return false;
};

const buildDateVariants = (dateStr) => {
  if (!dateStr) return [];
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return [dateStr];
  const year = parts[0];
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const monthPad = padDatePart(month);
  const dayPad = padDatePart(day);
  return Array.from(new Set([
    `${year}-${monthPad}-${dayPad}`,
    `${year}/${monthPad}/${dayPad}`,
    `${year}年${month}月${day}日`,
    `${year}年${monthPad}月${dayPad}日`,
    `${month}月${day}日`,
    `${monthPad}月${dayPad}日`
  ]));
};

const replaceAllLiteral = (source, from, to) => {
  if (!source || !from || from === to) return { text: source || '', count: 0 };
  const segments = String(source).split(from);
  const count = Math.max(0, segments.length - 1);
  return {
    text: count > 0 ? segments.join(to) : String(source),
    count
  };
};

const syncCopyTextDates = (payload, datePlan) => {
  const summary = [];
  if (!payload || !payload.form || !datePlan) return summary;

  const replacementPairs = [];
  const dateKeyPairs = [
    ['startDate', 'startDate'],
    ['endDate', 'endDate'],
    ['registerDeadlineDate', 'registerDeadlineDate']
  ];

  dateKeyPairs.forEach(([fromKey, toKey]) => {
    const fromDate = datePlan.originalForm[fromKey];
    const toDate = datePlan.adjustedForm[toKey];
    if (!fromDate || !toDate || fromDate === toDate) return;
    const fromVariants = buildDateVariants(fromDate);
    const toVariants = buildDateVariants(toDate);
    for (let i = 0; i < fromVariants.length; i += 1) {
      replacementPairs.push({ from: fromVariants[i], to: toVariants[Math.min(i, toVariants.length - 1)] || toDate });
    }
  });

  const replaceFieldText = (container, fieldKey, label) => {
    const originalText = container && typeof container[fieldKey] === 'string' ? container[fieldKey] : '';
    if (!originalText) return;
    let nextText = originalText;
    let hitCount = 0;
    replacementPairs.forEach(pair => {
      const result = replaceAllLiteral(nextText, pair.from, pair.to);
      nextText = result.text;
      hitCount += result.count;
    });
    if (hitCount > 0) {
      container[fieldKey] = nextText;
      summary.push({ label, count: hitCount });
    }
  };

  replaceFieldText(payload.form, 'title', '活动标题');
  replaceFieldText(payload.form, 'desc', '活动描述');
  replaceFieldText(payload.form, 'requirements', '报名要求');
  replaceFieldText(payload.form, 'description', '活动说明');

  if (Array.isArray(payload.groups)) {
    let groupRequirementsHits = 0;
    let groupDescriptionHits = 0;
    payload.groups.forEach(group => {
      if (!group || typeof group !== 'object') return;
      let nextRequirements = typeof group.requirements === 'string' ? group.requirements : '';
      let nextDescription = typeof group.description === 'string' ? group.description : '';
      replacementPairs.forEach(pair => {
        const requirementsResult = replaceAllLiteral(nextRequirements, pair.from, pair.to);
        nextRequirements = requirementsResult.text;
        groupRequirementsHits += requirementsResult.count;
        const descriptionResult = replaceAllLiteral(nextDescription, pair.from, pair.to);
        nextDescription = descriptionResult.text;
        groupDescriptionHits += descriptionResult.count;
      });
      if (groupRequirementsHits > 0) {
        group.requirements = nextRequirements;
      }
      if (groupDescriptionHits > 0) {
        group.description = nextDescription;
      }
    });
    if (groupRequirementsHits > 0) {
      summary.push({ label: '分组报名要求', count: groupRequirementsHits });
    }
    if (groupDescriptionHits > 0) {
      summary.push({ label: '分组活动说明', count: groupDescriptionHits });
    }
  }

  return summary;
};

Page({
  data: {
    mode: 'create', // 'create', 'edit', 'copy'
    activityId: '', // 编辑或复制的活动ID
    currentDraftId: '', // 当前正在编辑/保存的草稿ID（用于“保存草稿”更新同一条记录）
    originalActivity: null, // 原始活动数据（编辑模式）
    currentRegistrations: 0, // 当前报名数量
    fieldEditability: {}, // 字段可编辑性映射
    types: TYPE_OPTIONS,
    currentStep: 1,
    todayDate: '', // 今天的日期，用于限制选择范围
    canPublish: false, // 是否可以发布（所有必填步骤已完成）
    // 地点选择模式（生产环境默认使用真实定位）
    useRealLocation: true, // true=真实定位模式（生产环境）, false=测试模式（开发）
    // 页面显示控制
    pageTitle: '创建活动', // 页面标题
    showDraftButtons: true, // 是否显示草稿和复制按钮
    publishButtonText: '发布', // 发布按钮文本
    isPublishing: false,
    currentPublishRequestId: '',
    previewImageUrl: '../../images/default-other.jpg', // 预览图片URL
    copiedWhitelist: '', // 复制来源的白名单（JSON字符串）
    copiedBlacklist: '', // 复制来源的黑名单（JSON字符串）
    copiedAdministratorIds: [], // 复制来源的活动管理员ID列表
    showCopyExtrasDialog: false, // 是否显示“复制附带信息”弹窗
    copyExtrasCounts: { whitelist: 0, blacklist: 0, administrators: 0 }, // 弹窗中仅展示数量
    copyExtrasOptions: { whitelist: true, blacklist: true, administrators: true }, // 默认全选
    showCopyDateDialog: false, // 是否显示复制日期调整弹窗
    copyDateDialogPreview: null, // 日期调整预览信息
    showCopyTextSyncResultDialog: false, // 是否显示文本日期同步结果弹窗
    copyTextSyncSummary: [], // 文本日期同步结果
    copySourceActivityId: '', // 复制来源活动ID
    steps: [
      { index: 1, label: '基本信息', active: true, completed: false },
      { index: 2, label: '时间设置', active: false, completed: false },
      { index: 3, label: '地点设置', active: false, completed: false },
      { index: 4, label: '人数设置', active: false, completed: false },
      { index: 5, label: '报名信息', active: false, completed: false },
      { index: 6, label: '活动说明', active: false, completed: false },
      { index: 7, label: '发布预览', active: false, completed: false }
    ],
    form: {
      title: '',
      desc: '',
      type: '',
      typeIndex: 0,
      isPublic: false, // 是否公开（默认关闭）
      organizerPhone: '', // 联系人电话
      organizerWechat: '', // 联系人微信号
      hasGroups: false, // 是否启用分组
      groupCount: 2, // 分组数量（2-5）
      startDate: '',
      startTime: '09:00',
      endDate: '',
      endTime: '18:00',
      registerDeadlineDate: '',
      registerDeadlineTime: '09:00',
      place: '',
      address: '',
      latitude: null,
      longitude: null,
      checkinRadius: 500,
      total: 20,
      minParticipants: 5,
      needReview: false,
      needCheckin: true,
      notifyUsers: false
    },
    // 分组配置
    groups: [],
    currentGroupIndex: 0, // 当前正在配置的分组索引
    // 默认的自定义字段（用于无分组或复制到分组）
    defaultCustomFields: [
      { id: 'name', label: '昵称', required: true, desc: '默认获取微信昵称，可修改', isCustom: false },
      { id: 'mobile', label: '联系方式', required: false, desc: '用于联系参与者', isCustom: false }
    ],
    feeTypes: ['免费', 'AA', '统一收费'],
    nextFieldId: 1, // 用于生成自定义字段的唯一ID
    // 第6步活动说明页的自定义字段（无分组时使用）
    descriptionFields: [],
    nextDescFieldId: 1, // 用于生成活动说明自定义字段的唯一ID
    // 定时发布相关字段
    enableScheduledPublish: false, // 是否启用定时发布
    scheduledPublishDate: '', // 定时发布日期
    scheduledPublishTime: '09:00', // 定时发布时间
    // 周期性活动相关字段
    enableRecurring: false, // 是否启用周期性活动
    recurringFrequency: 'weekly', // 重复频率：weekly
    recurringWeekdays: [], // 周几：[1, 3] 表示周一和周三
    recurringWeeks: 4, // 持续几周
    publishTiming: 'advance', // 发布时机：'advance'(提前发布) 或 'immediate'(立即发布所有)
    advanceHours: 24 // 提前多少小时发布
  },

  // 步骤切换
  goToStep(e) {
    const step = e.currentTarget.dataset.step;
    this.setCurrentStep(step);
  },

  setCurrentStep(step) {
    const steps = this.data.steps.map(s => ({
      ...s,
      active: s.index === step
    }));
    this.setData({
      currentStep: step,
      steps
    });
  },

  // 验证当前步骤
  validateCurrentStep() {
    const { currentStep, form, groups } = this.data;

    switch (currentStep) {
      case 1: // 基本信息
        if (!form.title || form.title.trim().length < 2) {
          wx.showToast({ title: '请输入活动标题（至少2个字）', icon: 'none' });
          return false;
        }
        if (!form.type) {
          wx.showToast({ title: '请选择活动类型', icon: 'none' });
          return false;
        }
        // 验证分组配置
        if (form.hasGroups) {
          const count = parseInt(form.groupCount);
          if (isNaN(count) || count < 2 || count > 5) {
            wx.showToast({ title: '分组数量必须在2-5之间', icon: 'none' });
            return false;
          }
          if (groups.length !== count) {
            wx.showToast({ title: '请完成分组配置', icon: 'none' });
            return false;
          }
          // 验证分组名称
          for (let i = 0; i < groups.length; i++) {
            if (!groups[i].name || groups[i].name.trim().length === 0) {
              wx.showToast({ title: `请输入分组${i + 1}的名称`, icon: 'none' });
              return false;
            }
          }
        }
        break;

      case 2: // 时间设置
        if (!form.startDate || !form.startTime) {
          wx.showToast({ title: '请选择活动开始时间', icon: 'none' });
          return false;
        }
        if (!form.endDate || !form.endTime) {
          wx.showToast({ title: '请选择活动结束时间', icon: 'none' });
          return false;
        }
        const startDateTime = parseDate(`${form.startDate} ${form.startTime}`);
        const endDateTime = parseDate(`${form.endDate} ${form.endTime}`);
        if (endDateTime <= startDateTime) {
          wx.showToast({ title: '结束时间必须晚于开始时间', icon: 'none' });
          return false;
        }
        // 验证报名截止时间（如果已设置）
        if (form.registerDeadlineDate && form.registerDeadlineTime) {
          const registerDeadline = parseDate(`${form.registerDeadlineDate} ${form.registerDeadlineTime}`);
          if (registerDeadline >= startDateTime) {
            wx.showToast({ title: '报名截止时间必须早于活动开始时间', icon: 'none' });
            return false;
          }
        }
        break;

      case 3: // 地点设置
        if (!form.place || !form.address) {
          wx.showToast({ title: '请选择活动地点', icon: 'none' });
          return false;
        }
        if (form.needCheckin && (!form.checkinRadius || form.checkinRadius < 10)) {
          wx.showToast({ title: '签到范围不能少于10米', icon: 'none' });
          return false;
        }
        break;

      case 4: // 人数配置
        // 无分组时需要验证人数
        if (!form.hasGroups) {
          if (!form.total || form.total < 1) {
            wx.showToast({ title: '人数上限不能少于1人', icon: 'none' });
            return false;
          }
          if (form.minParticipants && form.minParticipants > form.total) {
            wx.showToast({ title: '最少成行人数不能大于人数上限', icon: 'none' });
            return false;
          }
        }
        // 有分组时验证分组人数
        if (form.hasGroups) {
          for (let i = 0; i < groups.length; i++) {
            if (!groups[i].total || groups[i].total < 1) {
              wx.showToast({ title: `请设置${groups[i].name}的人数上限`, icon: 'none' });
              return false;
            }
          }
        }
        break;

      case 5: // 展示字段（可选，无需强制验证）
        break;

      case 6: // 海报预览（可选，无需强制验证）
        break;
    }

    return true;
  },

  // 上一步
  prev() {
    const { currentStep } = this.data;
    if (currentStep > 1) {
      this.setCurrentStep(currentStep - 1);
    } else {
      wx.showToast({ title: '已经是第一步', icon: 'none' });
    }
  },

  // 下一步
  next() {
    if (this.data.currentStep >= this.data.steps.length && this.data.isPublishing) {
      wx.showToast({ title: '正在提交，请勿重复操作', icon: 'none' });
      return;
    }

    if (!this.validateCurrentStep()) {
      return;
    }

    const { currentStep, steps } = this.data;

    // 标记当前步骤为已完成
    const updatedSteps = steps.map(s => ({
      ...s,
      completed: s.index <= currentStep ? true : s.completed
    }));
    this.setData({ steps: updatedSteps });

    // 检查是否可以发布
    this.checkCanPublish();

    if (currentStep < steps.length) {
      // 进入下一步
      this.setCurrentStep(currentStep + 1);
    } else {
      // 最后一步，发布活动
      this.publish();
    }
  },

  buildPublishRequestId() {
    const timestamp = Date.now().toString(36);
    const randomSuffix = Math.random().toString(36).slice(2, 10);
    const mode = this.data.mode || 'create';
    const activityId = this.data.activityId || 'new';
    return `activity-${mode}-${activityId}-${timestamp}-${randomSuffix}`;
  },

  getPublishGuardKey() {
    const { mode, activityId, copySourceActivityId } = this.data;
    const targetId = activityId || copySourceActivityId || 'new';
    return `activity-publish:${mode || 'create'}:${targetId}`;
  },

  resetPublishState(guardKey) {
    if (guardKey) {
      submitGuard.unlock(guardKey);
    }
    this.setData({
      isPublishing: false,
      currentPublishRequestId: ''
    });
  },

  // 检查是否可以发布（前4步必填步骤都已完成）
  checkCanPublish() {
    const { form } = this.data;

    // 必填项检查
    const hasBasicInfo = form.title && form.type; // 步骤1
    const hasTimeInfo = form.startDate && form.startTime && form.endDate && form.endTime; // 步骤2
    const hasLocationInfo = form.place && form.address; // 步骤3
    const hasParticipantInfo = form.total && form.total > 0; // 步骤4

    const canPublish = hasBasicInfo && hasTimeInfo && hasLocationInfo && hasParticipantInfo;

    this.setData({ canPublish });
  },

  // 表单输入
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({ [`form.${field}`]: e.detail.value });
    this.checkCanPublish();
  },

  onInputNumber(e) {
    const field = e.currentTarget.dataset.field;
    const value = parseInt(e.detail.value || '0', 10) || 0;
    this.setData({ [`form.${field}`]: value });
    this.checkCanPublish();
  },

  onTypeChange(e) {
    const index = Number(e.detail.value);
    const type = this.data.types[index];

    // 更新活动类型和预览图片
    this.setData({
      'form.type': type,
      'form.typeIndex': index,
      previewImageUrl: getActivityImage(null, type) // 使用默认图片
    });
    this.checkCanPublish();
  },

  onFeeTypeChange(e) {
    const index = Number(e.detail.value);
    const feeType = this.data.feeTypes[index];
    this.setData({
      'form.feeType': feeType,
      'form.fee': feeType === '免费' ? 0 : this.data.form.fee
    });
  },

  onDateChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onTimeChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onSwitch(e) {
    const field = e.currentTarget.dataset.field;

    // 特殊处理 hasGroups 切换
    if (field === 'hasGroups') {
      const hasGroups = e.detail.value;
      this.setData({ 'form.hasGroups': hasGroups });

      if (hasGroups) {
        // 启用分组时，初始化分组数据
        this.initGroups(this.data.form.groupCount || 2);
      } else {
        // 关闭分组时，清空分组数据
        this.setData({ groups: [] });
      }
    } else if (field === 'enableScheduledPublish') {
      // 特殊处理定时发布切换
      const enabled = e.detail.value;
      this.setData({
        enableScheduledPublish: enabled,
        publishButtonText: enabled ? '预发布' : '发布'
      });

      // 如果启用定时发布，设置默认日期为明天
      if (enabled && !this.data.scheduledPublishDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = formatDateTime(tomorrow.toISOString(), 'YYYY-MM-DD');
        this.setData({ scheduledPublishDate: tomorrowDate });
      }
    } else if (field === 'enableRecurring') {
      // 特殊处理周期性活动切换
      const enabled = e.detail.value;
      this.setData({ enableRecurring: enabled });
    } else {
      this.setData({ [`form.${field}`]: e.detail.value });
    }
  },

  // 定时发布日期改变
  onScheduledPublishDateChange(e) {
    const date = e.detail.value;
    this.setData({ scheduledPublishDate: date });
    // 延迟校验，等待时间也设置完成
    setTimeout(() => {
      this.validateScheduledPublishTime();
    }, 100);
  },

  // 定时发布时间改变
  onScheduledPublishTimeChange(e) {
    const time = e.detail.value;
    this.setData({ scheduledPublishTime: time });
    // 延迟校验，等待日期也设置完成
    setTimeout(() => {
      this.validateScheduledPublishTime();
    }, 100);
  },

  // 校验定时发布时间
  validateScheduledPublishTime() {
    const { scheduledPublishDate, scheduledPublishTime, form } = this.data;

    if (!scheduledPublishDate || !scheduledPublishTime) {
      return { isValid: false, error: '请选择定时发布时间' };
    }

    const scheduledDateTime = `${scheduledPublishDate} ${scheduledPublishTime}`;
    const scheduledTime = new Date(scheduledDateTime);
    const now = new Date();

    // 1. 不能早于当前时间
    if (scheduledTime <= now) {
      wx.showModal({
        title: '时间无效',
        content: '定时发布时间不能早于或等于当前时间，请重新选择。',
        showCancel: false,
        success: () => {
          this.setData({
            scheduledPublishDate: '',
            scheduledPublishTime: '09:00'
          });
        }
      });
      return { isValid: false, error: '定时发布时间不能早于当前时间' };
    }

    // 2. 不能晚于活动开始时间
    if (form.startDate && form.startTime) {
      const activityStartTime = new Date(`${form.startDate} ${form.startTime}`);
      if (scheduledTime >= activityStartTime) {
        wx.showModal({
          title: '时间无效',
          content: '定时发布时间不能晚于或等于活动开始时间，请重新选择。',
          showCancel: false,
          success: () => {
            this.setData({
              scheduledPublishDate: '',
              scheduledPublishTime: '09:00'
            });
          }
        });
        return { isValid: false, error: '定时发布时间不能晚于活动开始时间' };
      }
    }

    // 3. 不能晚于报名截止时间（如有）
    if (form.registerDeadlineDate && form.registerDeadlineTime) {
      const registerDeadline = new Date(`${form.registerDeadlineDate} ${form.registerDeadlineTime}`);
      if (scheduledTime >= registerDeadline) {
        wx.showModal({
          title: '时间无效',
          content: '定时发布时间不能晚于或等于报名截止时间，请重新选择。',
          showCancel: false,
          success: () => {
            this.setData({
              scheduledPublishDate: '',
              scheduledPublishTime: '09:00'
            });
          }
        });
        return { isValid: false, error: '定时发布时间不能晚于报名截止时间' };
      }
    }

    // 4. 使用 scheduler 的通用校验（不能超过1年）
    const result = scheduler.validateScheduledTime(scheduledDateTime);
    if (!result.isValid) {
      wx.showModal({
        title: '时间无效',
        content: result.error,
        showCancel: false,
        success: () => {
          this.setData({
            scheduledPublishDate: '',
            scheduledPublishTime: '09:00'
          });
        }
      });
    }

    return result;
  },

  // 周期性活动 - 周几选择
  toggleWeekday(e) {
    const weekday = parseInt(e.currentTarget.dataset.weekday);
    const { recurringWeekdays } = this.data;

    const index = recurringWeekdays.indexOf(weekday);
    if (index > -1) {
      // 已选中，取消选择
      recurringWeekdays.splice(index, 1);
    } else {
      // 未选中，添加选择
      recurringWeekdays.push(weekday);
    }

    // 排序
    recurringWeekdays.sort((a, b) => a - b);

    this.setData({ recurringWeekdays });
  },

  // 周期性活动 - 持续周数改变
  onRecurringWeeksChange(e) {
    let weeks = parseInt(e.detail.value || '4');

    // 限制范围 1-52周
    if (isNaN(weeks) || weeks < 1) {
      weeks = 1;
    } else if (weeks > 52) {
      weeks = 52;
    }

    this.setData({ recurringWeeks: weeks });
  },

  // 周期性活动 - 发布时机改变
  onPublishTimingChange(e) {
    const value = e.detail.value;
    this.setData({ publishTiming: value === 'advance' ? 'advance' : 'immediate' });
  },

  // 周期性活动 - 提前小时数改变
  onAdvanceHoursChange(e) {
    let hours = parseInt(e.detail.value || '24');

    // 限制范围 1-168小时（7天）
    if (isNaN(hours) || hours < 1) {
      hours = 1;
    } else if (hours > 168) {
      hours = 168;
    }

    this.setData({ advanceHours: hours });
  },

  // 分组数量改变（失焦时触发）
  onGroupCountBlur(e) {
    let count = parseInt(e.detail.value);

    // 验证范围：2-5
    if (isNaN(count) || count < 2) {
      count = 2;
    } else if (count > 5) {
      count = 5;
    }

    this.setData({ 'form.groupCount': count });

    // 如果已启用分组，重新初始化分组
    if (this.data.form.hasGroups) {
      this.initGroups(count);
    }
  },

  // 焦点进入时全选文本（方便用户直接输入新值）
  onGroupCountFocus(e) {
    // 微信小程序没有原生的全选API，但输入框获得焦点时用户可以直接输入覆盖
    // 这里记录一个标记，提示用户可以直接输入
    console.log('分组数量输入框获得焦点，可以直接输入新值');
  },

  // 增加分组数量
  increaseGroupCount() {
    const currentCount = this.data.form.groupCount;
    if (currentCount < 5) {
      const newCount = currentCount + 1;
      this.setData({ 'form.groupCount': newCount });

      // 如果已启用分组，重新初始化分组
      if (this.data.form.hasGroups) {
        this.initGroups(newCount);
      }
    }
  },

  // 减少分组数量
  decreaseGroupCount() {
    const currentCount = this.data.form.groupCount;
    if (currentCount > 2) {
      const newCount = currentCount - 1;
      this.setData({ 'form.groupCount': newCount });

      // 如果已启用分组，重新初始化分组
      if (this.data.form.hasGroups) {
        this.initGroups(newCount);
      }
    }
  },

  // 初始化分组数据
  initGroups(count) {
    const groups = [];
    for (let i = 0; i < count; i++) {
      groups.push({
        id: `g${i + 1}`,
        name: this.data.groups[i]?.name || `分组${i + 1}`, // 保留已有的名称
        total: this.data.groups[i]?.total || 10,
        fee: this.data.groups[i]?.fee || 0,
        feeType: this.data.groups[i]?.feeType || '免费',
        requirements: this.data.groups[i]?.requirements || '',
        description: this.data.groups[i]?.description || '',
        customFields: this.data.groups[i]?.customFields || JSON.parse(JSON.stringify(this.data.defaultCustomFields)),
        descriptionFields: this.data.groups[i]?.descriptionFields || [] // 活动说明自定义字段
      });
    }
    this.setData({ groups, currentGroupIndex: 0 });
  },

  // 分组名称输入
  onGroupNameInput(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    this.setData({ [`groups[${index}].name`]: value });
  },

  // 切换当前配置的分组
  switchGroup(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentGroupIndex: index });
  },

  // 复制首组信息到当前分组
  copyFirstGroup() {
    const { groups, currentGroupIndex } = this.data;

    if (currentGroupIndex === 0) {
      wx.showToast({ title: '当前已是首组', icon: 'none' });
      return;
    }

    if (groups.length === 0) {
      return;
    }

    const firstGroup = groups[0];
    const currentGroup = groups[currentGroupIndex];

    // 复制首组的配置（保留当前组的名称）
    const updatedGroup = {
      ...currentGroup,
      total: firstGroup.total,
      fee: firstGroup.fee,
      feeType: firstGroup.feeType,
      requirements: firstGroup.requirements,
      description: firstGroup.description,
      customFields: JSON.parse(JSON.stringify(firstGroup.customFields))
    };

    this.setData({ [`groups[${currentGroupIndex}]`]: updatedGroup });
    wx.showToast({ title: '已复制首组信息', icon: 'success' });
  },

  // 分组字段输入（用于人数、费用等）
  onGroupFieldInput(e) {
    const { field, index } = e.currentTarget.dataset;
    const value = e.detail.value;
    this.setData({ [`groups[${index}].${field}`]: value });
  },

  onGroupFieldInputNumber(e) {
    const { field, index } = e.currentTarget.dataset;
    const value = parseInt(e.detail.value || '0', 10) || 0;
    this.setData({ [`groups[${index}].${field}`]: value });
  },

  // 分组费用类型改变
  onGroupFeeTypeChange(e) {
    const index = e.currentTarget.dataset.index;
    const feeTypeIndex = Number(e.detail.value);
    const feeType = this.data.feeTypes[feeTypeIndex];
    this.setData({
      [`groups[${index}].feeType`]: feeType,
      [`groups[${index}].fee`]: feeType === '免费' ? 0 : this.data.groups[index].fee
    });
  },

  // 开始时间改变
  onStartTimeChange(e) {
    const { date, time } = e.detail;
    this.setData({
      'form.startDate': date || this.data.form.startDate,
      'form.startTime': time || this.data.form.startTime
    });

    // 如果结束日期早于开始日期，自动调整
    if (this.data.form.endDate && date && this.data.form.endDate < date) {
      this.setData({
        'form.endDate': date
      });
    }

    this.checkCanPublish();
  },

  // 结束时间改变
  onEndTimeChange(e) {
    const { date, time } = e.detail;
    this.setData({
      'form.endDate': date || this.data.form.endDate,
      'form.endTime': time || this.data.form.endTime
    });

    this.checkCanPublish();
  },

  // 报名截止时间改变
  onRegisterDeadlineChange(e) {
    const { date, time } = e.detail;
    this.setData({
      'form.registerDeadlineDate': date || this.data.form.registerDeadlineDate,
      'form.registerDeadlineTime': time || this.data.form.registerDeadlineTime
    });

    // 实时校验报名截止时间
    this.validateRegisterDeadline();

    this.checkCanPublish();
  },

  // 校验报名截止时间
  validateRegisterDeadline() {
    const { form } = this.data;

    if (!form.registerDeadlineDate || !form.registerDeadlineTime) {
      return true; // 未设置则不校验
    }

    const registerDeadline = parseDate(`${form.registerDeadlineDate} ${form.registerDeadlineTime}`);

    // 报名截止时间不能晚于活动开始时间
    if (form.startDate && form.startTime) {
      const activityStart = parseDate(`${form.startDate} ${form.startTime}`);
      if (registerDeadline >= activityStart) {
        wx.showModal({
          title: '报名截止时间无效',
          content: '报名截止时间不能晚于或等于活动开始时间，请重新选择。',
          showCancel: false,
          success: () => {
            this.setData({
              'form.registerDeadlineDate': '',
              'form.registerDeadlineTime': '09:00'
            });
          }
        });
        return false;
      }
    }

    return true;
  },

  // 切换地点选择模式
  toggleLocationMode() {
    const useRealLocation = !this.data.useRealLocation;
    this.setData({ useRealLocation });
    wx.showToast({
      title: useRealLocation ? '已切换到真实定位' : '已切换到测试模式',
      icon: 'success',
      duration: 2000
    });
  },

  // 选择地点 - 根据模式选择不同的方式
  chooseLocation() {
    console.log('点击选择地点，当前模式:', this.data.useRealLocation ? '真实定位' : '测试模式');

    if (this.data.useRealLocation) {
      // 真实定位模式 - 使用微信原生API
      this.useRealLocationPicker();
    } else {
      // 测试模式 - 使用预设地点列表
      this.showLocationPicker();
    }
  },

  // 真实GPS定位选择器
  useRealLocationPicker() {
    console.log('✅ [定位] 开始使用真实GPS定位');

    // 首先检查位置权限
    wx.getSetting({
      success: (res) => {
        console.log('✅ [定位] 当前权限设置:', res.authSetting);

        // 检查位置权限状态
        const hasLocationAuth = res.authSetting['scope.userLocation'];

        if (hasLocationAuth === false) {
          // 用户之前拒绝过位置权限
          console.warn('⚠️ [定位] 用户之前拒绝了位置权限');
          wx.showModal({
            title: '需要位置权限',
            content: '真实定位功能需要访问您的位置信息，请在设置中开启位置权限',
            confirmText: '去设置',
            cancelText: '使用测试模式',
            success: (modalRes) => {
              if (modalRes.confirm) {
                // 打开设置页面
                wx.openSetting({
                  success: (settingRes) => {
                    console.log('✅ [定位] 设置页返回:', settingRes.authSetting);
                    if (settingRes.authSetting['scope.userLocation']) {
                      wx.showToast({ title: '权限已开启', icon: 'success' });
                      // 重新调用选择地点
                      setTimeout(() => {
                        this.callChooseLocation();
                      }, 1000);
                    }
                  }
                });
              } else {
                // 切换到测试模式
                this.setData({ useRealLocation: false });
                wx.showToast({ title: '已切换到测试模式', icon: 'success' });
              }
            }
          });
          return;
        }

        // 如果有权限或者首次请求，直接调用选择地点
        console.log('✅ [定位] 权限正常，调用选择地点');
        this.callChooseLocation();
      },
      fail: (err) => {
        console.error('❌ [定位] 获取权限设置失败:', err);
        // 降级处理，直接尝试调用
        this.callChooseLocation();
      }
    });
  },

  // 调用微信选择地点API
  callChooseLocation() {
    console.log('✅ [定位] 调用 wx.chooseLocation');

    // 检查是否需要隐私授权（微信基础库 2.32.3 及以上）
    if (wx.requirePrivacyAuthorize) {
      wx.requirePrivacyAuthorize({
        success: () => {
          console.log('✅ [定位] 隐私授权成功');
          this.doChooseLocation();
        },
        fail: (err) => {
          console.error('❌ [定位] 隐私授权失败:', err);
          wx.showToast({
            title: '需要同意隐私协议才能使用定位功能',
            icon: 'none',
            duration: 3000
          });
        }
      });
    } else {
      // 低版本微信，直接调用
      this.doChooseLocation();
    }
  },

  // 执行选择地点操作
  doChooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        console.log('✅ [定位] 选择地点成功:', res);

        this.setData({
          'form.place': res.name,
          'form.address': res.address,
          'form.latitude': res.latitude,
          'form.longitude': res.longitude
        });

        wx.showToast({
          title: '已选择：' + res.name,
          icon: 'success',
          duration: 2000
        });

        // 检查是否可以发布
        this.checkCanPublish();
      },
      fail: (err) => {
        console.error('❌ [定位] 选择地点失败:', err);

        // 友好的错误提示
        if (err.errMsg && err.errMsg.includes('cancel')) {
          // 用户取消选择
          console.log('⚠️ [定位] 用户取消选择地点');
          return;
        } else if (err.errMsg && (err.errMsg.includes('authorize') || err.errMsg.includes('auth'))) {
          // 权限未授予
          console.warn('⚠️ [定位] 权限未授予');
          wx.showModal({
            title: '需要位置权限',
            content: '请在设置中允许小程序访问您的位置信息',
            confirmText: '去设置',
            cancelText: '使用测试模式',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting({
                  success: (settingRes) => {
                    if (settingRes.authSetting['scope.userLocation']) {
                      wx.showToast({ title: '权限已开启，请重新选择', icon: 'success' });
                    }
                  }
                });
              } else {
                this.setData({ useRealLocation: false });
                wx.showToast({ title: '已切换到测试模式', icon: 'success' });
              }
            }
          });
          return;
        } else if (err.errMsg && err.errMsg.includes('privacy')) {
          console.warn('⚠️ [定位] 隐私协议未授权');
          wx.showModal({
            title: '需要同意隐私政策',
            content: '真实定位依赖隐私授权，请先在弹出的隐私指引中同意授权，或切换回测试模式使用预设地点。',
            confirmText: '切换测试模式',
            cancelText: '稍后再试',
            success: (modalRes) => {
              if (modalRes.confirm) {
                this.setData({ useRealLocation: false });
                wx.showToast({ title: '已切换到测试模式', icon: 'success' });
              }
            }
          });
          return;
        } else {
          // 其他错误
          console.error('❌ [定位] 其他错误:', err.errMsg);
          wx.showModal({
            title: '选择地点失败',
            content: '定位功能暂时无法使用，建议切换到测试模式使用预设地点\n\n错误信息：' + (err.errMsg || '未知错误'),
            confirmText: '切换测试模式',
            cancelText: '我知道了',
            success: (modalRes) => {
              if (modalRes.confirm) {
                this.setData({ useRealLocation: false });
                wx.showToast({ title: '已切换到测试模式', icon: 'success' });
              }
            }
          });
        }
      }
    });
  },

  // 原生地点选择器（已禁用，避免隐私协议问题）
  useNativeLocationPicker() {
    console.log('原生选择器已禁用，使用自定义选择器');
    // 直接使用自定义选择器
    this.showLocationPicker();
  },

  // 显示地点选择器（用于模拟器）
  showLocationPicker() {
    console.log('显示地点选择器');

    const that = this;
    const presetLocations = [
      { name: '北京大学', address: '北京市海淀区颐和园路5号', latitude: 39.9925, longitude: 116.3061 },
      { name: '清华大学', address: '北京市海淀区清华园1号', latitude: 39.9990, longitude: 116.3262 },
      { name: '中关村创业大街', address: '北京市海淀区中关村大街', latitude: 39.9796, longitude: 116.3089 },
      { name: '国家图书馆', address: '北京市海淀区中关村南大街33号', latitude: 39.9354, longitude: 116.3235 },
      { name: '鸟巢（国家体育场）', address: '北京市朝阳区国家体育场南路1号', latitude: 39.9928, longitude: 116.3972 },
      { name: '手动输入', address: '', latitude: 39.9042, longitude: 116.4074 }
    ];

    wx.showActionSheet({
      itemList: ['北京大学', '清华大学', '中关村创业大街', '国家图书馆', '鸟巢（国家体育场）', '手动输入'],
      success: function(res) {
        console.log('选择了索引:', res.tapIndex);
        const selected = presetLocations[res.tapIndex];

        if (selected.name === '手动输入') {
          // 手动输入地点
          that.manualInputLocation();
        } else {
          // 使用预设地点
          console.log('设置地点:', selected);
          that.setData({
            'form.place': selected.name,
            'form.address': selected.address,
            'form.latitude': selected.latitude,
            'form.longitude': selected.longitude
          });
          wx.showToast({
            title: '已选择：' + selected.name,
            icon: 'success',
            duration: 2000
          });
          // 检查是否可以发布
          that.checkCanPublish();
        }
      },
      fail: function(err) {
        console.log('取消选择或失败:', err);
      }
    });
  },

  // 手动输入地点
  manualInputLocation() {
    console.log('手动输入地点');

    try {
      wx.showModal({
        title: '输入地点名称',
        editable: true,
        placeholderText: '例如：北京大学',
        success: (res) => {
          console.log('第一步输入结果:', res);
          if (res.confirm && res.content) {
            const placeName = res.content.trim();

            if (!placeName) {
              wx.showToast({ title: '地点名称不能为空', icon: 'none' });
              return;
            }

            // 第二步：输入详细地址
            try {
              wx.showModal({
                title: '输入详细地址',
                editable: true,
                placeholderText: '例如：北京市海淀区颐和园路5号',
                success: (addrRes) => {
                  console.log('第二步输入结果:', addrRes);
                  if (addrRes.confirm && addrRes.content) {
                    const address = addrRes.content.trim();

                    if (!address) {
                      wx.showToast({ title: '地址不能为空', icon: 'none' });
                      return;
                    }

                    // 使用默认坐标（北京市中心）
                    const latitude = 39.9042 + Math.random() * 0.1;
                    const longitude = 116.4074 + Math.random() * 0.1;

                    console.log('设置地点数据:', { placeName, address, latitude, longitude });

                    this.setData({
                      'form.place': placeName,
                      'form.address': address,
                      'form.latitude': latitude,
                      'form.longitude': longitude
                    });

                    wx.showToast({ title: '地点已设置', icon: 'success' });

                    // 检查是否可以发布
                    this.checkCanPublish();
                  } else {
                    console.log('用户取消输入地址');
                  }
                }
              });
            } catch (error) {
              console.error('输入地址异常:', error);
              wx.showToast({ title: '输入失败，请重试', icon: 'none' });
            }
          } else {
            console.log('用户取消输入地点名称');
          }
        }
      });
    } catch (error) {
      console.error('输入地点名称异常:', error);
      wx.showToast({ title: '输入失败，请重试', icon: 'none' });
    }
  },

  // 添加自定义字段
  addField() {
    const { form, groups, currentGroupIndex } = this.data;

    // 第一步：输入字段名称
    wx.showModal({
      title: '添加自定义字段',
      editable: true,
      placeholderText: '例如：学号、公司名称',
      success: (res) => {
        if (res.confirm && res.content) {
          const fieldLabel = res.content.trim();

          if (fieldLabel.length === 0) {
            wx.showToast({ title: '字段名称不能为空', icon: 'none' });
            return;
          }

          // 获取当前字段列表
          const currentFields = form.hasGroups
            ? groups[currentGroupIndex].customFields
            : this.data.defaultCustomFields;

          // 检查是否已存在相同名称的字段
          const exists = currentFields.some(f => f.label === fieldLabel);
          if (exists) {
            wx.showToast({ title: '该字段已存在', icon: 'none' });
            return;
          }

          // 第二步：选择是否必填
          wx.showModal({
            title: '设置字段属性',
            content: `"${fieldLabel}" 是否为必填项？`,
            cancelText: '选填',
            confirmText: '必填',
            success: (requireRes) => {
              const isRequired = requireRes.confirm;

              // 生成唯一ID
              const fieldId = `custom_${this.data.nextFieldId}`;

              // 添加到字段列表
              const newField = {
                id: fieldId,
                label: fieldLabel,
                required: isRequired,
                desc: '',
                isCustom: true
              };

              if (form.hasGroups) {
                // 添加到当前分组
                this.setData({
                  [`groups[${currentGroupIndex}].customFields`]: currentFields.concat([newField]),
                  nextFieldId: this.data.nextFieldId + 1
                });
              } else {
                // 添加到默认字段
                this.setData({
                  defaultCustomFields: currentFields.concat([newField]),
                  nextFieldId: this.data.nextFieldId + 1
                });
              }

              wx.showToast({
                title: `已添加"${fieldLabel}"`,
                icon: 'success'
              });
            }
          });
        }
      }
    });
  },

  // 切换字段必填状态
  onFieldRequiredChange(e) {
    const fieldId = e.currentTarget.dataset.fieldId;
    const groupIndex = e.currentTarget.dataset.groupIndex;
    const newValue = e.detail.value;
    const { form, groups } = this.data;

    if (form.hasGroups && groupIndex >= 0) {
      // 分组模式
      const currentFields = groups[groupIndex].customFields;
      const updatedFields = currentFields.map(field => {
        if (field.id === fieldId) {
          return { ...field, required: newValue };
        }
        return field;
      });

      this.setData({
        [`groups[${groupIndex}].customFields`]: updatedFields
      });

      const field = updatedFields.find(f => f.id === fieldId);
      wx.showToast({
        title: `${field.label}已设为${newValue ? '必填' : '选填'}`,
        icon: 'none'
      });
    } else {
      // 无分组模式
      const updatedFields = this.data.defaultCustomFields.map(field => {
        if (field.id === fieldId) {
          return { ...field, required: newValue };
        }
        return field;
      });

      this.setData({
        defaultCustomFields: updatedFields
      });

      const field = updatedFields.find(f => f.id === fieldId);
      wx.showToast({
        title: `${field.label}已设为${newValue ? '必填' : '选填'}`,
        icon: 'none'
      });
    }
  },

  // 删除自定义字段
  deleteField(e) {
    const fieldId = e.currentTarget.dataset.fieldId;
    const groupIndex = e.currentTarget.dataset.groupIndex;
    const { form, groups } = this.data;

    // 查找字段
    let field;
    if (form.hasGroups && groupIndex >= 0) {
      field = groups[groupIndex].customFields.find(f => f.id === fieldId);
    } else {
      field = this.data.defaultCustomFields.find(f => f.id === fieldId);
    }

    if (!field) {
      return;
    }

    // 确认删除
    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${field.label}"字段吗？`,
      confirmText: '删除',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          if (form.hasGroups && groupIndex >= 0) {
            // 分组模式
            const updatedFields = groups[groupIndex].customFields.filter(f => f.id !== fieldId);
            this.setData({
              [`groups[${groupIndex}].customFields`]: updatedFields
            });
          } else {
            // 无分组模式
            const updatedFields = this.data.defaultCustomFields.filter(f => f.id !== fieldId);
            this.setData({
              defaultCustomFields: updatedFields
            });
          }

          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 添加活动说明自定义字段（第6步）
  addDescriptionField() {
    const { form, groups, currentGroupIndex } = this.data;

    wx.showModal({
      title: '添加自定义字段',
      editable: true,
      placeholderText: '例如：携带物品、特殊要求',
      success: (res) => {
        if (res.confirm && res.content) {
          const fieldLabel = res.content.trim();

          if (fieldLabel.length === 0) {
            wx.showToast({ title: '字段名称不能为空', icon: 'none' });
            return;
          }

          // 获取当前字段列表
          const currentFields = form.hasGroups
            ? groups[currentGroupIndex].descriptionFields
            : this.data.descriptionFields;

          // 检查是否已存在相同名称的字段
          const exists = currentFields.some(f => f.label === fieldLabel);
          if (exists) {
            wx.showToast({ title: '该字段已存在', icon: 'none' });
            return;
          }

          // 生成唯一ID
          const fieldId = `desc_${this.data.nextDescFieldId}`;

          // 添加到字段列表
          const newField = {
            id: fieldId,
            label: fieldLabel,
            value: '', // 文本框的值
            isCustom: true
          };

          if (form.hasGroups) {
            // 添加到当前分组
            this.setData({
              [`groups[${currentGroupIndex}].descriptionFields`]: currentFields.concat([newField]),
              nextDescFieldId: this.data.nextDescFieldId + 1
            });
          } else {
            // 添加到默认字段
            this.setData({
              descriptionFields: currentFields.concat([newField]),
              nextDescFieldId: this.data.nextDescFieldId + 1
            });
          }

          wx.showToast({
            title: `已添加"${fieldLabel}"`,
            icon: 'success'
          });
        }
      }
    });
  },

  // 删除活动说明自定义字段（第6步）
  deleteDescriptionField(e) {
    const fieldId = e.currentTarget.dataset.fieldId;
    const groupIndex = e.currentTarget.dataset.groupIndex;
    const { form, groups } = this.data;

    // 查找字段
    let field;
    if (form.hasGroups && groupIndex >= 0) {
      field = groups[groupIndex].descriptionFields.find(f => f.id === fieldId);
    } else {
      field = this.data.descriptionFields.find(f => f.id === fieldId);
    }

    if (!field) {
      return;
    }

    // 确认删除
    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${field.label}"字段吗？`,
      confirmText: '删除',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          if (form.hasGroups && groupIndex >= 0) {
            // 分组模式
            const updatedFields = groups[groupIndex].descriptionFields.filter(f => f.id !== fieldId);
            this.setData({
              [`groups[${groupIndex}].descriptionFields`]: updatedFields
            });
          } else {
            // 无分组模式
            const updatedFields = this.data.descriptionFields.filter(f => f.id !== fieldId);
            this.setData({
              descriptionFields: updatedFields
            });
          }

          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 活动说明字段内容输入（第6步）
  onDescriptionFieldInput(e) {
    const fieldId = e.currentTarget.dataset.fieldId;
    const groupIndex = e.currentTarget.dataset.groupIndex;
    const value = e.detail.value;
    const { form, groups } = this.data;

    if (form.hasGroups && groupIndex >= 0) {
      // 分组模式
      const fields = groups[groupIndex].descriptionFields;
      const fieldIndex = fields.findIndex(f => f.id === fieldId);
      if (fieldIndex >= 0) {
        this.setData({ [`groups[${groupIndex}].descriptionFields[${fieldIndex}].value`]: value });
      }
    } else {
      // 无分组模式
      const fields = this.data.descriptionFields;
      const fieldIndex = fields.findIndex(f => f.id === fieldId);
      if (fieldIndex >= 0) {
        this.setData({ [`descriptionFields[${fieldIndex}].value`]: value });
      }
    }
  },

  // 全屏编辑（用于长文本字段：活动描述/报名要求/活动说明及注意事项）
  openFullScreenEditor(e) {
    const scope = e.currentTarget.dataset.scope;
    const field = e.currentTarget.dataset.field;
    const indexRaw = e.currentTarget.dataset.index;
    const index = typeof indexRaw !== 'undefined' ? Number(indexRaw) : null;

    const titleMap = {
      desc: '编辑活动描述',
      requirements: '编辑报名要求',
      description: '编辑活动说明及注意事项'
    };
    const placeholderMap = {
      desc: '请描述活动内容、目的和注意事项',
      requirements: '请输入报名要求',
      description: '请输入活动说明及注意事项'
    };
    const maxLengthMap = { desc: 2000, requirements: 5000, description: 5000 };

    let value = '';
    if (scope === 'form') {
      value = (this.data.form && this.data.form[field]) ? String(this.data.form[field]) : '';
    } else if (scope === 'group' && typeof index === 'number' && index >= 0) {
      const group = (this.data.groups && this.data.groups[index]) || {};
      value = group[field] ? String(group[field]) : '';
    } else {
      wx.showToast({ title: '无法打开编辑页', icon: 'none' });
      return;
    }

    const key = `text_editor_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    wx.setStorageSync(key, {
      scope,
      field,
      index: scope === 'group' ? index : null,
      title: titleMap[field] || '全屏编辑',
      placeholder: placeholderMap[field] || '请输入内容',
      maxLength: maxLengthMap[field] || 5000,
      value
    });

    wx.navigateTo({
      url: `/pages/activities/text-editor?key=${key}`,
      success: (res) => {
        const channel = res.eventChannel;
        if (!channel || !channel.on) return;

        channel.on('save', (payload) => {
          if (!payload || payload.field !== field || payload.scope !== scope) return;
          const nextValue = payload.value != null ? String(payload.value) : '';

          if (scope === 'form') {
            this.setData({ [`form.${field}`]: nextValue }, () => this.checkCanPublish());
          } else if (scope === 'group' && typeof payload.index === 'number') {
            this.setData({ [`groups[${payload.index}].${field}`]: nextValue });
          }
        });
      }
    });
  },

  // 上传海报
  uploadPoster() {
    // 使用 wx.chooseImage 替代 wx.chooseMedia，避免隐私协议问题
    wx.chooseImage({
      count: 1, // 最多可以选择的图片张数
      sizeType: ['compressed'], // 压缩图，节省空间
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机
      success: (res) => {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        const tempFilePath = res.tempFilePaths[0];

        console.log('海报已选择:', tempFilePath);

        // 保存到表单数据
        this.setData({
          'form.poster': tempFilePath
        });

        wx.showToast({
          title: '海报已选择',
          icon: 'success',
          duration: 2000
        });
      },
      fail: (err) => {
        console.error('选择图片失败:', err);

        // 友好的错误提示
        let errorMsg = '选择图片失败';

        if (err.errMsg && err.errMsg.includes('cancel')) {
          errorMsg = '已取消选择';
        } else if (err.errMsg && err.errMsg.includes('permission')) {
          errorMsg = '请允许访问相册权限';
        } else if (err.errMsg && err.errMsg.includes('privacy')) {
          errorMsg = '请在小程序设置中允许访问相册';
        }

        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 保存草稿
  saveDraft() {
    try {
      const { form, groups, defaultCustomFields, descriptionFields, currentDraftId } = this.data;

      // 验证必填项
      if (!form.title || form.title.trim().length < 2) {
        wx.showToast({ title: '请至少输入活动标题', icon: 'none' });
        return;
      }

      // 获取现有草稿列表
      let drafts = wx.getStorageSync('activity_drafts') || [];
      const nowIso = new Date().toISOString();

      const buildDraftPayload = (draftId, createdAt) => ({
        draftId,
        form: { ...form },
        groups: groups.map(g => ({ ...g })),
        defaultCustomFields: JSON.parse(JSON.stringify(defaultCustomFields)),
        descriptionFields: JSON.parse(JSON.stringify(descriptionFields)),
        createdAt: createdAt || nowIso,
        updatedAt: nowIso
      });

      if (currentDraftId) {
        const existingIndex = drafts.findIndex(d => d.draftId === currentDraftId);
        if (existingIndex >= 0) {
          const existing = drafts[existingIndex] || {};
          const updated = buildDraftPayload(currentDraftId, existing.createdAt);
          drafts.splice(existingIndex, 1);
          drafts.unshift(updated); // 更新后置顶
          drafts = drafts.slice(0, 10);
          wx.setStorageSync('activity_drafts', drafts);
          wx.showToast({ title: '草稿已更新', icon: 'success' });
          return;
        }

        // 找不到对应草稿：重新生成一条并提示
        const newId = `draft_${Date.now()}`;
        drafts.unshift(buildDraftPayload(newId, nowIso));
        drafts = drafts.slice(0, 10);
        wx.setStorageSync('activity_drafts', drafts);
        this.setData({ currentDraftId: newId });
        wx.showToast({ title: '草稿不存在，已重新生成并保存', icon: 'success' });
        return;
      }

      // 首次保存：生成新草稿并记住 draftId，后续保存更新同一条
      const newId = `draft_${Date.now()}`;
      drafts.unshift(buildDraftPayload(newId, nowIso)); // 最新的放在最前面
      drafts = drafts.slice(0, 10);
      wx.setStorageSync('activity_drafts', drafts);
      this.setData({ currentDraftId: newId });
      wx.showToast({ title: '草稿已保存', icon: 'success' });
    } catch (err) {
      console.error('保存草稿失败:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // 复制活动 - 跳转到选择页面
  copyActivity() {
    wx.navigateTo({
      url: '/pages/activities/copy-activity'
    });
  },

  // 从复制页面返回后加载选中的活动/草稿
  loadCopiedActivity(selectedId) {
    const { activities } = this.data;

    // 查找选中的项
    const drafts = wx.getStorageSync('activity_drafts') || [];
    const draft = drafts.find(d => d.draftId === selectedId);

    if (draft) {
      // 加载草稿
      this.loadDraftData(selectedId);
    } else {
      // 加载活动
      this.loadActivityForCopy(selectedId);
    }
  },

  // 复制活动：附带信息选择弹窗
  openCopyExtrasDialog(pendingPayload, pendingExtras, counts) {
    this._pendingCopyPayload = pendingPayload;
    this._pendingCopyExtras = pendingExtras;
    this._pendingCopyDatePlan = null;

    this.setData({
      showCopyExtrasDialog: true,
      showCopyDateDialog: false,
      copyDateDialogPreview: null,
      showCopyTextSyncResultDialog: false,
      copyTextSyncSummary: [],
      copyExtrasCounts: counts || { whitelist: 0, blacklist: 0, administrators: 0 },
      copyExtrasOptions: { whitelist: true, blacklist: true, administrators: true }
    });
  },

  noop() {},

  copyExtrasSelectAll(e) {
    const value = String(e.currentTarget?.dataset?.value || '1');
    const checked = value === '1';
    this.setData({
      copyExtrasOptions: { whitelist: checked, blacklist: checked, administrators: checked }
    });
  },

  onCopyExtrasChange(e) {
    const values = Array.isArray(e.detail?.value) ? e.detail.value : [];
    this.setData({
      copyExtrasOptions: {
        whitelist: values.includes('whitelist'),
        blacklist: values.includes('blacklist'),
        administrators: values.includes('administrators')
      }
    });
  },

  cancelCopyExtras() {
    this._pendingCopyPayload = null;
    this._pendingCopyExtras = null;
    this._pendingCopyDatePlan = null;
    this.setData({ showCopyExtrasDialog: false });
  },

  finalizeCopyActivityPayload(payload, textSyncSummary = []) {
    const safeSummary = Array.isArray(textSyncSummary) ? textSyncSummary : [];

    this._pendingCopyPayload = null;
    this._pendingCopyExtras = null;
    this._pendingCopyDatePlan = null;

    this.setData({
      ...payload,
      showCopyExtrasDialog: false,
      showCopyDateDialog: false,
      copyDateDialogPreview: null,
      showCopyTextSyncResultDialog: safeSummary.length > 0,
      copyTextSyncSummary: safeSummary
    });

    this.checkCanPublish();
    if (safeSummary.length === 0) {
      wx.showToast({ title: '复制成功', icon: 'success' });
    }
  },

  openCopyDateDialog(payload) {
    const datePlan = buildCopyDateAdjustmentPlan(payload?.form, new Date());
    if (!hasCopyDateAdjustment(datePlan)) {
      this.finalizeCopyActivityPayload(payload);
      return;
    }

    this._pendingCopyPayload = payload;
    this._pendingCopyDatePlan = datePlan;

    this.setData({
      showCopyExtrasDialog: false,
      showCopyDateDialog: true,
      copyDateDialogPreview: datePlan
    });
  },

  keepCopyOriginalDates() {
    if (!this._pendingCopyPayload) {
      this.setData({
        showCopyDateDialog: false,
        copyDateDialogPreview: null
      });
      return;
    }

    this.finalizeCopyActivityPayload(this._pendingCopyPayload);
  },

  applyCopyDateAdjustment() {
    const payload = this._pendingCopyPayload;
    const datePlan = this._pendingCopyDatePlan;

    if (!payload || !datePlan) {
      this.setData({
        showCopyDateDialog: false,
        copyDateDialogPreview: null
      });
      return;
    }

    const nextPayload = JSON.parse(JSON.stringify(payload));
    nextPayload.form = {
      ...nextPayload.form,
      ...datePlan.adjustedForm
    };

    const textSyncSummary = syncCopyTextDates(nextPayload, datePlan);
    this.finalizeCopyActivityPayload(nextPayload, textSyncSummary);
  },

  closeCopyTextSyncResultDialog() {
    this.setData({
      showCopyTextSyncResultDialog: false,
      copyTextSyncSummary: []
    });
  },

  confirmCopyExtras() {
    const payload = this._pendingCopyPayload;
    const extras = this._pendingCopyExtras;
    const { copyExtrasOptions } = this.data;

    if (!payload || !extras) {
      this.setData({ showCopyExtrasDialog: false });
      return;
    }

    const copiedWhitelist = copyExtrasOptions.whitelist ? (extras.copiedWhitelist || '') : '';
    const copiedBlacklist = copyExtrasOptions.blacklist ? (extras.copiedBlacklist || '') : '';
    const copiedAdministratorIds = copyExtrasOptions.administrators ? (extras.copiedAdministratorIds || []) : [];

    const resolvedPayload = {
      ...payload,
      copiedWhitelist,
      copiedBlacklist,
      copiedAdministratorIds
    };

    this.openCopyDateDialog(resolvedPayload);
  },

  // 发布活动
  async publish() {
    if (this.data.isPublishing) {
      wx.showToast({ title: '正在提交，请勿重复操作', icon: 'none' });
      return;
    }

    const {
      mode,
      activityId,
      form,
      groups,
      defaultCustomFields,
      canPublish,
      copiedWhitelist,
      copiedBlacklist,
      copiedAdministratorIds,
      copySourceActivityId
    } = this.data;

    // 检查是否可以发布
    if (!canPublish) {
      wx.showToast({ title: '请完善必填信息', icon: 'none', duration: 2000 });
      return;
    }

    // 最终验证
    if (!form.title || !form.type || !form.startDate || !form.place) {
      wx.showToast({ title: '请完善必填信息', icon: 'none' });
      return;
    }

    // 【修复】强制要求至少填写一种联系方式
    const hasPhone = form.organizerPhone && form.organizerPhone.trim().length > 0;
    const hasWechat = form.organizerWechat && form.organizerWechat.trim().length > 0;

    if (!hasPhone && !hasWechat) {
      wx.showModal({
        title: '缺少联系方式',
        content: '为便于参与者联系您，必须至少填写一种联系方式（联系方式或联系人昵称）',
        confirmText: '前往填写',
        showCancel: false,
        success: () => {
          this.setCurrentStep(6); // 返回步骤6填写联系方式
        }
      });
      return;
    }

    // 如果有分组，验证分组信息完整性
    if (form.hasGroups) {
      if (groups.length === 0) {
        wx.showToast({ title: '请配置分组信息', icon: 'none' });
        return;
      }
      for (let i = 0; i < groups.length; i++) {
        if (!groups[i].name || groups[i].name.trim().length === 0) {
          wx.showToast({ title: `请输入分组${i + 1}的名称`, icon: 'none' });
          return;
        }
        if (!groups[i].total || groups[i].total <= 0) {
          wx.showToast({ title: `请设置${groups[i].name}的人数上限`, icon: 'none' });
          return;
        }
      }
    }

    // 组装提交数据
    // 【修复】统一日期时间格式化为 ISO 8601 格式（使用 'T' 分隔符）
    const formatDateTime = (date, time) => {
      // 如果date参数本身就是完整的日期时间字符串（包含T或空格），先解析它
      if (date && (date.includes('T') || (date.includes(' ') && date.length > 10))) {
        // 内联解析逻辑
        if (date.includes('T')) {
          const parts = date.split('T');
          date = parts[0];
          time = time || parts[1].substring(0, 5); // 只取HH:mm
        } else {
          const parts = date.split(' ');
          date = parts[0];
          time = time || (parts[1] ? parts[1].substring(0, 5) : '09:00');
        }
      }

      // 确保date只包含日期部分（YYYY-MM-DD），移除可能的时间部分
      if (date && date.length > 10) {
        date = date.substring(0, 10);
      }

      // 处理time部分
      if (!time || time.trim().length === 0) {
        return `${date}T09:00:00`;  // 【修复】使用 'T' 分隔符
      }

      // 移除可能的空格
      time = time.trim();

      // 如果time已经包含秒数（HH:mm:ss），直接使用
      if (time.length === 8 && time.split(':').length === 3) {
        return `${date}T${time}`;  // 【修复】使用 'T' 分隔符
      }

      // 如果time是HH:mm格式，添加秒数
      if (time.length === 5 && time.split(':').length === 2) {
        return `${date}T${time}:00`;  // 【修复】使用 'T' 分隔符
      }

      // 其他情况，使用默认值
      console.warn('formatDateTime: 未识别的时间格式:', time, '使用默认值');
      return `${date}T09:00:00`;  // 【修复】使用 'T' 分隔符
    };

    const activityData = {
      title: form.title,
      desc: form.desc,
      type: form.type,
      isPublic: form.isPublic, // 是否公开
      organizerPhone: form.organizerPhone || '', // 联系人电话
      organizerWechat: form.organizerWechat || '', // 联系人微信号
      startTime: formatDateTime(form.startDate, form.startTime),
      endTime: formatDateTime(form.endDate, form.endTime),
      registerDeadline: form.registerDeadlineDate
        ? formatDateTime(form.registerDeadlineDate, form.registerDeadlineTime)
        : formatDateTime(form.startDate, form.startTime),
      place: form.place,
      address: form.address,
      latitude: form.latitude,
      longitude: form.longitude,
      checkinRadius: form.checkinRadius,
      needCheckin: form.needCheckin,
      needReview: form.needReview,
      notifyUsers: form.notifyUsers,
      hasGroups: form.hasGroups
    };

    // 分组配置
    if (form.hasGroups) {
      // 新建/复制活动时，分组初始无人报名：joined 强制归零，避免出现“3/12”或“/12”
      const groupsForSubmit = mode === 'edit' ? groups : normalizeGroupsForNewActivity(groups);
      // 计算总人数
      const totalCount = groupsForSubmit.reduce((sum, g) => sum + (parseInt(g.total) || 0), 0);

      // 【修复】：防止total为0导致"满员"误判
      if (totalCount <= 0) {
        wx.showModal({
          title: '人数配置错误',
          content: '所有分组的总人数不能为0，请检查分组设置。',
          showCancel: false,
          confirmText: '返回修改',
          success: () => {
            this.setCurrentStep(4); // 跳转到人数设置步骤
          }
        });
        return;
      }

      activityData.total = totalCount;
      activityData.minParticipants = Math.floor(totalCount * 0.5); // 默认一半成行
      activityData.groups = groupsForSubmit;
    } else {
      // 无分组配置

      // 【修复】：防止total为0导致"满员"误判
      if (!form.total || form.total <= 0) {
        wx.showModal({
          title: '人数配置错误',
          content: '活动人数上限不能为0，请返回修改。',
          showCancel: false,
          confirmText: '返回修改',
          success: () => {
            this.setCurrentStep(4); // 跳转到人数设置步骤
          }
        });
        return;
      }

      activityData.total = form.total;
      activityData.minParticipants = form.minParticipants;
      activityData.fee = form.fee || 0;
      activityData.feeType = form.feeType || '免费';
      activityData.requirements = form.requirements || '';
      activityData.description = form.description || '';
      activityData.customFields = defaultCustomFields;
    }

    // 复制（含列表复制/页内复制）后可带入白名单/黑名单
    // 说明：后端以 JSON 字符串存储名单，这里传递 JSON 字符串，避免 String<->Array 类型不一致导致 400
    if (hasNonEmptyJsonString(copiedWhitelist)) {
      activityData.whitelist = copiedWhitelist;
    }
    if (hasNonEmptyJsonString(copiedBlacklist)) {
      activityData.blacklist = copiedBlacklist;
    }

    // 定时发布处理
    const { enableScheduledPublish, scheduledPublishDate, scheduledPublishTime } = this.data;

    if (enableScheduledPublish) {
      // 检查定时发布时间是否已设置
      if (!scheduledPublishDate || !scheduledPublishTime) {
        wx.showModal({
          title: '无法预发布',
          content: '请先设置定时发布的日期和时间后再预发布。',
          showCancel: false
        });
        return;
      }

      // 校验定时发布时间
      const validation = this.validateScheduledPublishTime();
      if (!validation.isValid) {
        return;
      }

      // 设置为预发布状态
      activityData.status = '预发布';
      activityData.scheduledPublishTime = formatDateTime(scheduledPublishDate, scheduledPublishTime);
      activityData.actualPublishTime = null;
    } else {
      // 立即发布
      activityData.status = 'published';
      activityData.scheduledPublishTime = null;
      // 【修复】使用 ISO 8601 格式（'T' 分隔符）
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      activityData.actualPublishTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;  // 【修复】使用 'T' 分隔符
    }

    const guardKey = this.getPublishGuardKey();
    if (!submitGuard.lock(guardKey, 10000)) {
      wx.showToast({ title: '正在提交，请勿重复操作', icon: 'none' });
      return;
    }

    const publishRequestId = this.data.currentPublishRequestId || this.buildPublishRequestId();
    this.setData({
      isPublishing: true,
      currentPublishRequestId: publishRequestId
    });

    const isEdit = mode === 'edit';
    if (!isEdit) {
      activityData.clientRequestId = publishRequestId;
      if (copySourceActivityId) {
        activityData.sourceActivityId = copySourceActivityId;
      }
    }
    const loadingText = enableScheduledPublish ? '设置定时发布中...' : (isEdit ? '保存中...' : '发布中...');
    const successText = enableScheduledPublish ? '定时发布设置成功' : (isEdit ? '保存成功' : '发布成功');

    wx.showLoading({ title: loadingText });

    try {
      let result;
      if (isEdit) {
        // 编辑模式 - 调用更新API
        result = await activityAPI.update(activityId, activityData);
      } else {
        // 创建或复制模式 - 调用创建API
        result = await activityAPI.create(activityData);
      }

      if (result.code === 0) {
        const targetId = isEdit ? activityId : result.data.id;
        let adminCopyResult = null;

        // 复制活动管理员（仅创建/复制场景）
        if (!isEdit) {
          adminCopyResult = await this.copyAdministratorsAfterCreate(targetId, copiedAdministratorIds);
        }

        wx.hideLoading();

        // 如果启用了定时发布，添加定时任务
        if (enableScheduledPublish) {
          const scheduledDateTime = `${scheduledPublishDate} ${scheduledPublishTime}`;
          const added = scheduler.addTask(targetId, scheduledDateTime);

          if (added) {
            console.log('定时任务添加成功:', targetId, scheduledDateTime);
            wx.showToast({ title: successText, icon: 'success' });
          } else {
            console.error('定时任务添加失败');
            wx.showToast({ title: '定时发布设置失败', icon: 'none' });
          }
        } else {
          wx.showToast({ title: successText, icon: 'success' });
        }

        // 管理员复制失败提示（不阻断发布）
        if (adminCopyResult && adminCopyResult.failed > 0) {
          setTimeout(() => {
            wx.showToast({
              title: `管理员复制失败(${adminCopyResult.success}/${adminCopyResult.total})`,
              icon: 'none',
              duration: 2500
            });
          }, 1600);
        }

        // 发布成功后：自动删除对应草稿（按 currentDraftId），并兼容清理旧 key
        try {
          const draftId = this.data.currentDraftId;
          if (draftId) {
            const drafts = wx.getStorageSync('activity_drafts') || [];
            const nextDrafts = drafts.filter(d => d.draftId !== draftId);
            wx.setStorageSync('activity_drafts', nextDrafts);
            this.setData({ currentDraftId: '' });
          }
        } catch (e) {
          console.warn('发布成功后清理草稿失败（不影响发布）:', e);
        }
        wx.removeStorageSync('activity_draft');

        // 跳转到我的活动页面
        setTimeout(() => {
          this.resetPublishState(guardKey);
          if (enableScheduledPublish) {
            // 定时发布的活动跳转到我的活动-预发布页面
            wx.redirectTo({
              url: `/pages/my-activities/index?tab=scheduled`
            });
          } else {
            // 立即发布的活动跳转到详情页
            wx.redirectTo({
              url: `/pages/activities/detail?id=${targetId}`
            });
          }
        }, 1500);
      } else {
        wx.hideLoading();
        // 处理参数校验失败等错误
        this.showErrorDialog(result);
        this.resetPublishState(guardKey);
      }
    } catch (err) {
      wx.hideLoading();
      console.error('操作失败:', err);

      // 解析并展示错误信息
      if (err && err.data) {
        this.showErrorDialog(err.data);
      } else if (err && err.errMsg) {
        wx.showModal({
          title: '操作失败',
          content: err.errMsg || '网络请求失败，请检查网络连接后重试',
          showCancel: false
        });
      } else {
        wx.showModal({
          title: '操作失败',
          content: '未知错误，请重试',
          showCancel: false
        });
      }
      this.resetPublishState(guardKey);
    }
  },

  // 创建/复制活动后：按需复制活动管理员（不阻断发布）
  async copyAdministratorsAfterCreate(activityId, administratorIds) {
    const currentUserId = app.globalData.currentUserId || '';
    const ids = Array.isArray(administratorIds) ? administratorIds : [];
    const uniqueIds = Array.from(new Set(ids)).filter(id => id && id !== currentUserId);

    if (uniqueIds.length === 0) {
      return { total: 0, success: 0, failed: 0 };
    }

    let success = 0;
    for (let userIndex = 0; userIndex < uniqueIds.length; userIndex += 1) {
      const userId = uniqueIds[userIndex];
      try {
        const res = await administratorAPI.addAdministratorSilent(activityId, userId);
        if (res && res.code === 0) success += 1;
      } catch (e) {
        // 忽略单个失败，整体不阻断发布
      }
    }

    return { total: uniqueIds.length, success, failed: uniqueIds.length - success };
  },

  /**
   * 显示错误信息弹窗
   * 解析后端返回的参数校验错误，友好展示给用户
   */
  showErrorDialog(result) {
    const { code, message, data } = result;

    // 字段名到中文名称的映射
      const fieldNameMap = {
      'title': '活动标题',
      'type': '活动类型',
      'startTime': '开始时间',
      'endTime': '结束时间',
      'registerDeadline': '报名截止时间',
      'place': '地点名称',
      'address': '详细地址',
      'latitude': '纬度',
      'longitude': '经度',
      'checkinRadius': '签到范围',
      'total': '总人数上限',
      'minParticipants': '最少成行人数',
      'fee': '费用',
      'feeType': '费用类型',
      'needReview': '是否需要审核',
      'isPublic': '是否公开',
      'groups': '分组配置',
      'customFields': '自定义字段',
      'scheduledPublishTime': '定时发布时间',
      'description': '活动描述',
      'organizerPhone': '联系方式',
      'organizerWechat': '联系人昵称'
      };

    // 如果有详细的字段错误信息（参数校验失败）
    if (code === 400 && data && typeof data === 'object') {
      const errorList = [];

      const errorFields = Object.keys(data);
      for (let errorIndex = 0; errorIndex < errorFields.length; errorIndex += 1) {
        const field = errorFields[errorIndex];
        const error = data[field];
        const fieldName = fieldNameMap[field] || field;
        errorList.push(`• ${fieldName}: ${error}`);
      }

      if (errorList.length > 0) {
        const errorContent = errorList.join('\n');

        wx.showModal({
          title: '参数校验失败',
          content: `请修改以下内容后重试：\n\n${errorContent}`,
          showCancel: true,
          cancelText: '我知道了',
          confirmText: '返回修改',
          confirmColor: '#3b82f6',
          success: (res) => {
            if (res.confirm) {
              // 用户点击"返回修改"，跳转到第一步
              this.setCurrentStep(1);
            }
          }
        });
        return;
      }
    }

    // 通用错误提示
    wx.showModal({
      title: message || '操作失败',
      content: typeof data === 'string' ? data : '请检查输入内容后重试',
      showCancel: false
    });
  },

  // 返回
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.switchTab({ url: '/pages/home/index' });
    }
  },

  // 页面加载
  async onLoad(options) {
    // ========== 【重要】登录前置检查 ==========
    // 创建/编辑活动需要登录，避免用户填写完表单后才发现无权限
    const token = wx.getStorageSync('token');
    if (!token || token.trim().length === 0) {
      console.warn('用户未登录，无法创建活动');
      wx.showModal({
        title: '需要登录',
        content: '创建活动需要登录，请先登录后再试',
        confirmText: '去登录',
        cancelText: '返回',
        success: (res) => {
          if (res.confirm) {
            // 直接跳转到登录页面
            wx.navigateTo({
              url: '/pages/auth/login'
            });
          } else {
            // 用户点击"返回"
            wx.switchTab({ url: '/pages/home/index' });
          }
        },
        fail: () => {
          // Modal失败时也返回首页
          wx.switchTab({ url: '/pages/home/index' });
        }
      });
      return; // 中止页面加载
    }
    // ========== 登录检查结束 ==========

    // 设置今天的日期
    const today = new Date();
    const todayDate = formatDateTime(today.toISOString(), 'YYYY-MM-DD');
    this.setData({ todayDate });

    // 检测模式
    const mode = options.mode || 'create'; // 'create', 'edit', 'copy', 'draft'
    const activityId = options.id || '';
    const draftId = options.draftId || '';

    if (isRestrictedCreateMode(mode)) {
      const access = await getCreateActivityAccess();
      if (!access.canCreate) {
        wx.showModal({
          title: '无权限进入',
          content: access.success ? getDeniedMessage(mode) : (access.message || '暂时无法校验创建权限，请稍后再试'),
          showCancel: false,
          confirmText: '我知道了',
          success: () => {
            if (getCurrentPages().length > 1) {
              wx.navigateBack({ delta: 1 });
              return;
            }
            wx.switchTab({ url: '/pages/home/index' });
          }
        });
        return;
      }
    }

    this.setData({ mode, activityId, currentDraftId: mode === 'draft' ? draftId : '' });

    if (mode === 'edit') {
      // 编辑模式
      this.loadActivityForEdit(activityId);
    } else if (mode === 'copy') {
      // 复制模式
      if (activityId) {
        // 直接复制指定活动
        this.loadActivityForCopy(activityId);
      } else {
        // 显示选择对话框
        this.showCopySourceDialog();
      }
    } else if (mode === 'draft') {
      // 草稿模式
      this.loadDraft(draftId);
    } else {
      // 创建模式 - 加载用户资料作为默认联系人信息
      this.loadUserProfileForCreate();
    }

    // 初始检查是否可以发布
    this.checkCanPublish();
  },

  // 创建模式：加载用户资料作为默认联系人信息
  async loadUserProfileForCreate() {
    try {
      const result = await userAPI.getProfile();

      if (result.code === 0 && result.data) {
        const profile = result.data;

        // 更新表单的联系人信息
        this.setData({
          'form.organizerPhone': profile.phone || '',
          'form.organizerWechat': profile.nickname || ''
        });

        console.log('已加载用户资料作为默认联系人信息:', {
          phone: profile.phone || '(空)',
          wechat: profile.nickname || '(空)'
        });
      }
    } catch (err) {
      console.warn('加载用户资料失败，使用空默认值:', err);
      // 失败时不影响创建流程，保持空值即可
    }
  },

  // 加载活动数据用于编辑
  async loadActivityForEdit(activityId) {
    try {
      wx.showLoading({ title: '加载中...' });

      const currentUserId = app.globalData.currentUserId || 'u1';

      // 从后端API获取活动详情
      const detailResult = await activityAPI.getDetail(activityId);

      if (detailResult.code !== 0) {
        throw new Error(detailResult.message || '获取活动详情失败');
      }

      const activity = detailResult.data;

      if (!activity) {
        wx.hideLoading();
        wx.showModal({
          title: '活动不存在',
          content: '未找到要编辑的活动',
          showCancel: false,
          success: () => wx.navigateBack()
        });
        return;
      }

      // 检查管理权限
      const permission = checkManagementPermission(activity, currentUserId);

      if (!permission.hasPermission) {
        wx.hideLoading();
        wx.showModal({
          title: '无编辑权限',
          content: '您不是此活动的创建者或管理员',
          showCancel: false,
          success: () => wx.navigateBack()
        });
        return;
      }

      // 获取当前报名数量
      const registrationsResult = await registrationAPI.getByActivity(activityId, {
        page: 0,
        size: 1000
      });

      const allRegs = registrationsResult.code === 0
        ? (registrationsResult.data.content || registrationsResult.data || [])
        : [];
      const currentRegistrations = allRegs.filter(r => r.status === 'approved').length;

    // 计算字段可编辑性
    const fieldEditability = {
      title: checkFieldEditability(activity, 'title', currentRegistrations),
      desc: checkFieldEditability(activity, 'desc', currentRegistrations),
      type: checkFieldEditability(activity, 'type', currentRegistrations),
      startTime: checkFieldEditability(activity, 'startTime', currentRegistrations),
      endTime: checkFieldEditability(activity, 'endTime', currentRegistrations),
      place: checkFieldEditability(activity, 'place', currentRegistrations),
      address: checkFieldEditability(activity, 'address', currentRegistrations),
      total: checkFieldEditability(activity, 'total', currentRegistrations),
      fee: checkFieldEditability(activity, 'fee', currentRegistrations),
      needReview: checkFieldEditability(activity, 'needReview', currentRegistrations),
      hasGroups: checkFieldEditability(activity, 'hasGroups', currentRegistrations),
      isPublic: checkFieldEditability(activity, 'isPublic', currentRegistrations)
    };

    // 解析活动数据到表单
    // 【修复】统一日期时间格式解析，支持ISO格式和空格分隔格式
    const parseDateTime = (dateTimeStr) => {
      if (!dateTimeStr) return ['', '09:00'];

      // ISO格式: 2025-12-26T09:00:00 或 2025-12-26T09:00
      if (dateTimeStr.includes('T')) {
        const [datePart, timePart] = dateTimeStr.split('T');
        const timeWithoutSeconds = timePart.substring(0, 5); // 只取 HH:mm
        return [datePart, timeWithoutSeconds];
      }

      // 空格分隔格式: 2025-12-26 09:00:00 或 2025-12-26 09:00
      const parts = dateTimeStr.split(' ');
      if (parts.length >= 2) {
        const timeWithoutSeconds = parts[1].substring(0, 5); // 只取 HH:mm
        return [parts[0], timeWithoutSeconds];
      }

      // 默认值
      return [parts[0] || '', '09:00'];
    };

    const startDateTime = parseDateTime(activity.startTime);
    const endDateTime = parseDateTime(activity.endTime);
    const registerDeadline = activity.registerDeadline
      ? parseDateTime(activity.registerDeadline)
      : startDateTime;

    const form = {
      title: activity.title,
      desc: activity.desc || '',
      type: activity.type,
      typeIndex: TYPE_OPTIONS.indexOf(activity.type),
      isPublic: activity.isPublic !== undefined ? activity.isPublic : true,
      organizerPhone: activity.organizerPhone || '',
      organizerWechat: activity.organizerWechat || '',
      hasGroups: activity.hasGroups || false,
      groupCount: activity.groups ? activity.groups.length : 2,
      startDate: startDateTime[0],
      startTime: startDateTime[1] || '09:00',
      endDate: endDateTime[0],
      endTime: endDateTime[1] || '18:00',
      registerDeadlineDate: registerDeadline[0],
      registerDeadlineTime: registerDeadline[1] || '09:00',
      place: activity.place,
      address: activity.address,
      latitude: activity.latitude,
      longitude: activity.longitude,
      checkinRadius: activity.checkinRadius || 500,
      needCheckin: activity.needCheckin !== undefined ? activity.needCheckin : true,
      total: activity.total,
      minParticipants: activity.minParticipants || 0,
      needReview: activity.needReview || false,
      notifyUsers: activity.notifyUsers === true,
      fee: activity.fee || 0,
      feeType: activity.feeType || '免费',
      requirements: activity.requirements || '',
      description: activity.description || ''
    };

    // 如果有分组，加载分组数据
    let groups = [];
    if (activity.hasGroups && activity.groups) {
      groups = activity.groups.map(g => ({ ...g }));
    }

    // 回填自定义报名字段（无分组时用于defaultCustomFields；有分组时用于补齐缺省group.customFields）
    const defaultCustomFields = Array.isArray(activity.customFields) && activity.customFields.length > 0
      ? JSON.parse(JSON.stringify(activity.customFields))
      : JSON.parse(JSON.stringify(this.data.defaultCustomFields));

    // 规范化分组字段，避免编辑时出现空字段
    let normalizedGroups = groups;
    if (form.hasGroups) {
      normalizedGroups = groups.map(g => ({
        ...g,
        fee: g.fee || 0,
        feeType: g.feeType || '免费',
        requirements: g.requirements || '',
        description: g.description || '',
        customFields: Array.isArray(g.customFields) && g.customFields.length > 0
          ? JSON.parse(JSON.stringify(g.customFields))
          : JSON.parse(JSON.stringify(defaultCustomFields)),
        descriptionFields: Array.isArray(g.descriptionFields)
          ? JSON.parse(JSON.stringify(g.descriptionFields))
          : []
      }));
    }

    // 计算nextFieldId / nextDescFieldId，避免新增字段ID冲突
    let maxCustomId = 0;
    const customFieldsForScan = form.hasGroups
      ? normalizedGroups.reduce((acc, g) => acc.concat(g.customFields || []), [])
      : defaultCustomFields;
    customFieldsForScan.forEach(f => {
      const match = String((f && f.id) || '').match(/^custom_(\d+)$/);
      if (match) maxCustomId = Math.max(maxCustomId, Number(match[1]));
    });

    let maxDescId = 0;
    const descFieldsForScan = form.hasGroups
      ? normalizedGroups.reduce((acc, g) => acc.concat(g.descriptionFields || []), [])
      : (this.data.descriptionFields || []);
    descFieldsForScan.forEach(f => {
      const match = String((f && f.id) || '').match(/^desc_(\d+)$/);
      if (match) maxDescId = Math.max(maxDescId, Number(match[1]));
    });

    // 判断活动状态，已发布的活动不显示草稿和复制按钮
    const isPublished = activity.status && activity.status !== '草稿';

    this.setData({
      form,
      groups: normalizedGroups,
      originalActivity: activity,
      currentRegistrations,
      fieldEditability,
      defaultCustomFields,
      nextFieldId: Math.max(this.data.nextFieldId || 1, maxCustomId + 1),
      nextDescFieldId: Math.max(this.data.nextDescFieldId || 1, maxDescId + 1),
      previewImageUrl: getActivityImage(activity.image, activity.type), // 设置预览图片
      copiedWhitelist: '',
      copiedBlacklist: '',
      copiedAdministratorIds: [],
      copySourceActivityId: '',
      showCopyDateDialog: false,
      copyDateDialogPreview: null,
      showCopyTextSyncResultDialog: false,
      copyTextSyncSummary: [],
      // 编辑模式的显示控制
      pageTitle: '活动编辑',
      showDraftButtons: !isPublished, // 已发布活动不显示草稿和复制按钮
      publishButtonText: '重新发布'
    });

      // 标记所有步骤为已完成（因为是编辑现有活动）
      const steps = this.data.steps.map(s => ({ ...s, completed: true }));
      this.setData({ steps });

      this.checkCanPublish();

      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('加载活动数据失败:', err);
      wx.showModal({
        title: '加载失败',
        content: err.message || '无法加载活动数据',
        showCancel: false,
        success: () => wx.navigateBack()
      });
    }
  },

  // 加载活动数据用于复制
  async loadActivityForCopy(activityId) {
    try {
      wx.showLoading({ title: '加载中...' });

      // 从后端API获取活动详情
      const detailResult = await activityAPI.getDetail(activityId);

      if (detailResult.code !== 0) {
        throw new Error(detailResult.message || '获取活动详情失败');
      }

      const activity = detailResult.data;

      if (!activity) {
        wx.hideLoading();
        wx.showToast({ title: '活动不存在', icon: 'none' });
        setTimeout(() => {
          this.showCopySourceDialog();
        }, 1500);
        return;
      }

      // 复制活动数据（但不包括ID和状态）
      // 【修复】使用统一的日期时间解析函数
      const parseDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return ['', '09:00'];

        // ISO格式: 2025-12-26T09:00:00 或 2025-12-26T09:00
        if (dateTimeStr.includes('T')) {
          const [datePart, timePart] = dateTimeStr.split('T');
          const timeWithoutSeconds = timePart.substring(0, 5); // 只取 HH:mm
          return [datePart, timeWithoutSeconds];
        }

        // 空格分隔格式: 2025-12-26 09:00:00 或 2025-12-26 09:00
        const parts = dateTimeStr.split(' ');
        if (parts.length >= 2) {
          const timeWithoutSeconds = parts[1].substring(0, 5); // 只取 HH:mm
          return [parts[0], timeWithoutSeconds];
        }

        // 默认值
        return [parts[0] || '', '09:00'];
      };

      const startDateTime = parseDateTime(activity.startTime);
      const endDateTime = parseDateTime(activity.endTime);
      const registerDeadline = activity.registerDeadline
        ? parseDateTime(activity.registerDeadline)
        : startDateTime;

      const form = {
        title: `${activity.title} (副本)`,
        desc: activity.desc || '',
        type: activity.type,
        typeIndex: TYPE_OPTIONS.indexOf(activity.type),
        isPublic: activity.isPublic !== undefined ? activity.isPublic : true,
        organizerPhone: activity.organizerPhone || '',
        organizerWechat: activity.organizerWechat || '',
        hasGroups: activity.hasGroups || false,
        groupCount: activity.groups ? activity.groups.length : 2,
        startDate: startDateTime[0],
        startTime: startDateTime[1] || '09:00',
        endDate: endDateTime[0],
        endTime: endDateTime[1] || '18:00',
        registerDeadlineDate: registerDeadline[0],
        registerDeadlineTime: registerDeadline[1] || '09:00',
        place: activity.place,
        address: activity.address,
        latitude: activity.latitude,
        longitude: activity.longitude,
        checkinRadius: activity.checkinRadius || 500,
        needCheckin: activity.needCheckin !== undefined ? activity.needCheckin : true,
        needCheckin: activity.needCheckin !== undefined ? activity.needCheckin : true,
        total: activity.total,
        minParticipants: activity.minParticipants || 0,
        needReview: activity.needReview || false,
        notifyUsers: activity.notifyUsers === true,
        notifyUsers: activity.notifyUsers === true,
        fee: activity.fee || 0,
        feeType: activity.feeType || '免费',
        requirements: activity.requirements || '',
        description: activity.description || ''
      };

      // 如果有分组，复制分组数据
      let groups = [];
      if (activity.hasGroups && activity.groups) {
        groups = normalizeGroupsForNewActivity(activity.groups.map(g => ({ ...g })));
      }

      // 复制白名单和黑名单
      const copiedWhitelist = normalizeToJsonString(activity.whitelist);
      const copiedBlacklist = normalizeToJsonString(activity.blacklist);
      const copiedAdministratorIds = Array.isArray(activity.administrators)
        ? Array.from(new Set(activity.administrators
          .map(a => a && (a.id || a.userId))
          .filter(Boolean)))
        : [];

      // 回填自定义报名字段（无分组时用于defaultCustomFields；有分组时用于补齐缺省group.customFields）
      const defaultCustomFields = Array.isArray(activity.customFields) && activity.customFields.length > 0
        ? JSON.parse(JSON.stringify(activity.customFields))
        : JSON.parse(JSON.stringify(this.data.defaultCustomFields));

      // 规范化分组字段，避免复制后出现空字段
      let normalizedGroups = groups;
      if (form.hasGroups) {
        normalizedGroups = groups.map(g => ({
          ...g,
          fee: g.fee || 0,
          feeType: g.feeType || '免费',
          requirements: g.requirements || '',
          description: g.description || '',
          customFields: Array.isArray(g.customFields) && g.customFields.length > 0
            ? JSON.parse(JSON.stringify(g.customFields))
            : JSON.parse(JSON.stringify(defaultCustomFields)),
          descriptionFields: Array.isArray(g.descriptionFields)
            ? JSON.parse(JSON.stringify(g.descriptionFields))
            : []
        }));
      }

      // 计算nextFieldId / nextDescFieldId，避免新增字段ID冲突
      let maxCustomId = 0;
      const customFieldsForScan = form.hasGroups
        ? normalizedGroups.reduce((acc, g) => acc.concat(g.customFields || []), [])
        : defaultCustomFields;
      customFieldsForScan.forEach(f => {
        const match = String((f && f.id) || '').match(/^custom_(\d+)$/);
        if (match) maxCustomId = Math.max(maxCustomId, Number(match[1]));
      });

      let maxDescId = 0;
      const descFieldsForScan = form.hasGroups
        ? normalizedGroups.reduce((acc, g) => acc.concat(g.descriptionFields || []), [])
        : (this.data.descriptionFields || []);
      descFieldsForScan.forEach(f => {
        const match = String((f && f.id) || '').match(/^desc_(\d+)$/);
        if (match) maxDescId = Math.max(maxDescId, Number(match[1]));
      });

      const steps = this.data.steps.map(s => ({ ...s, completed: true }));

      const pendingPayload = {
        form,
        groups: normalizedGroups,
        defaultCustomFields,
        nextFieldId: Math.max(this.data.nextFieldId || 1, maxCustomId + 1),
        nextDescFieldId: Math.max(this.data.nextDescFieldId || 1, maxDescId + 1),
        previewImageUrl: getActivityImage(activity.image, activity.type),
        copySourceActivityId: activity.id,
        steps
      };

      const counts = {
        whitelist: getJsonArrayLength(copiedWhitelist),
        blacklist: getJsonArrayLength(copiedBlacklist),
        administrators: copiedAdministratorIds.length
      };

      wx.hideLoading();
      this.openCopyExtrasDialog(
        pendingPayload,
        { copiedWhitelist, copiedBlacklist, copiedAdministratorIds },
        counts
      );
    } catch (err) {
      wx.hideLoading();
      console.error('加载活动数据失败:', err);
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none',
        duration: 2000
      });
      setTimeout(() => {
        this.showCopySourceDialog();
      }, 2000);
    }
  },


  // 加载草稿
  loadDraft(draftId) {
    try {
      // 获取草稿列表
      const drafts = wx.getStorageSync('activity_drafts') || [];
      const draft = drafts.find(d => d.draftId === draftId);

      if (!draft) {
        wx.showToast({ title: '草稿不存在', icon: 'none' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
        return;
      }

      // 恢复草稿数据
      this.setData({
        currentDraftId: draftId,
        form: draft.form,
        groups: draft.groups || [],
        defaultCustomFields: draft.defaultCustomFields || [
          { id: 'name', label: '昵称', required: true, desc: '默认获取微信昵称，可修改', isCustom: false },
          { id: 'mobile', label: '联系方式', required: false, desc: '用于联系参与者', isCustom: false }
        ],
        descriptionFields: draft.descriptionFields || [],
        copiedWhitelist: '',
        copiedBlacklist: '',
        copiedAdministratorIds: [],
        copySourceActivityId: '',
        showCopyDateDialog: false,
        copyDateDialogPreview: null,
        showCopyTextSyncResultDialog: false,
        copyTextSyncSummary: [],
        pageTitle: '编辑草稿',
        publishButtonText: '发布'
      });

      // 标记已完成的步骤
      const steps = this.data.steps.map((s, index) => {
        let completed = false;
        if (index === 0 && draft.form.title && draft.form.type) completed = true;
        if (index === 1 && draft.form.startDate && draft.form.endDate) completed = true;
        if (index === 2 && draft.form.place && draft.form.address) completed = true;
        if (index === 3 && draft.form.total) completed = true;
        return { ...s, completed };
      });

      this.setData({ steps });
      this.checkCanPublish();

      wx.showToast({ title: '已加载草稿', icon: 'success' });
    } catch (err) {
      console.error('加载草稿失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },


  // 加载草稿数据（不跳转，直接加载到当前表单）
  loadDraftData(draftId) {
    try {
      const drafts = wx.getStorageSync('activity_drafts') || [];
      const draft = drafts.find(d => d.draftId === draftId);

      if (!draft) {
        wx.showToast({ title: '草稿不存在', icon: 'none' });
        return;
      }

      // 将草稿数据复制到当前表单
      this.setData({
        form: { ...draft.form },
        groups: draft.groups.map(g => ({ ...g })),
        defaultCustomFields: JSON.parse(JSON.stringify(draft.defaultCustomFields)),
        descriptionFields: JSON.parse(JSON.stringify(draft.descriptionFields)),
        // 加载草稿时不带入上一次复制的名单
        copiedWhitelist: '',
        copiedBlacklist: '',
        copiedAdministratorIds: [],
        copySourceActivityId: '',
        showCopyDateDialog: false,
        copyDateDialogPreview: null,
        showCopyTextSyncResultDialog: false,
        copyTextSyncSummary: [],
        previewImageUrl: getActivityImage(null, draft.form.type)
      });

      // 标记已完成的步骤
      const steps = this.data.steps.map((s, index) => {
        let completed = false;
        if (index === 0 && draft.form.title && draft.form.type) completed = true;
        if (index === 1 && draft.form.startDate && draft.form.endDate) completed = true;
        if (index === 2 && draft.form.place && draft.form.address) completed = true;
        if (index === 3 && draft.form.total) completed = true;
        return { ...s, completed };
      });

      this.setData({ steps });
      this.checkCanPublish();

      wx.showToast({ title: '已复制草稿内容', icon: 'success' });
    } catch (err) {
      console.error('加载草稿失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 加载活动数据（不跳转，直接加载到当前表单）
  async loadActivityData(activityId) {
    try {
      wx.showLoading({ title: '加载中...' });

      // 从后端API获取活动详情
      const result = await activityAPI.getDetail(activityId);

      if (result.code !== 0 || !result.data) {
        throw new Error(result.message || '活动不存在');
      }

      const activity = result.data;

      // 解析活动数据到表单
      const startDateTime = (activity.startTime || activity.date || '').split(' ');
      const endDateTime = (activity.endTime || activity.date || '').split(' ');
      const registerDeadline = activity.registerDeadline ? activity.registerDeadline.split(' ') : startDateTime;

      const form = {
        title: activity.title,
        desc: activity.desc || '',
        type: activity.type,
        typeIndex: TYPE_OPTIONS.indexOf(activity.type),
        isPublic: activity.isPublic !== undefined ? activity.isPublic : true,
        organizerPhone: activity.organizerPhone || '',
        organizerWechat: activity.organizerWechat || '',
        hasGroups: activity.hasGroups || false,
        groupCount: activity.groups ? activity.groups.length : 2,
        startDate: startDateTime[0] || '',
        startTime: startDateTime[1] || '09:00',
        endDate: endDateTime[0] || '',
        endTime: endDateTime[1] || '18:00',
        registerDeadlineDate: registerDeadline[0] || '',
        registerDeadlineTime: registerDeadline[1] || '09:00',
        place: activity.place || '',
        address: activity.address || '',
        latitude: activity.latitude,
        longitude: activity.longitude,
        checkinRadius: activity.checkinRadius || 500,
        total: activity.total,
        minParticipants: activity.minParticipants || 0,
        needReview: activity.needReview || false,
        fee: activity.fee || 0,
        feeType: activity.feeType || '免费',
        requirements: activity.requirements || '',
        description: activity.description || ''
      };

      // 如果有分组，加载分组数据
      let groups = [];
      if (activity.hasGroups && activity.groups) {
        groups = normalizeGroupsForNewActivity(activity.groups.map(g => ({ ...g })));
      }

      this.setData({
        form,
        groups,
        previewImageUrl: getActivityImage(activity.image, activity.type),
        copiedWhitelist: normalizeToJsonString(activity.whitelist),
        copiedBlacklist: normalizeToJsonString(activity.blacklist)
      });

      // 标记所有步骤为已完成
      const steps = this.data.steps.map(s => ({ ...s, completed: true }));
      this.setData({ steps });

      this.checkCanPublish();

      wx.hideLoading();
      wx.showToast({ title: '已复制活动内容', icon: 'success' });
    } catch (err) {
      console.error('加载活动数据失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none',
        duration: 2000
      });
    }
  }
});
