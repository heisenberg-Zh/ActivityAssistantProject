// pages/activities/create.js
const { activityAPI, registrationAPI } = require('../../utils/api.js');
const { validateActivityForm } = require('../../utils/validator.js');
const { formatDateTime } = require('../../utils/datetime.js');
const { parseDate } = require('../../utils/date-helper.js');
const {
  checkManagementPermission,
  checkFieldEditability,
  getUserManagedActivities
} = require('../../utils/activity-management-helper.js');
const scheduler = require('../../utils/scheduler.js');
const notification = require('../../utils/notification.js');
const app = getApp();

const TYPE_OPTIONS = ['聚会', '培训', '户外', '运动', '会议'];

Page({
  data: {
    mode: 'create', // 'create', 'edit', 'copy'
    activityId: '', // 编辑或复制的活动ID
    originalActivity: null, // 原始活动数据（编辑模式）
    currentRegistrations: 0, // 当前报名数量
    fieldEditability: {}, // 字段可编辑性映射
    types: TYPE_OPTIONS,
    currentStep: 1,
    todayDate: '', // 今天的日期，用于限制选择范围
    canPublish: false, // 是否可以发布（所有必填步骤已完成）
    // 地点选择模式
    useRealLocation: false, // false=测试模式(预设地点), true=真实定位模式
    // 页面显示控制
    pageTitle: '创建活动', // 页面标题
    showDraftButtons: true, // 是否显示草稿和复制按钮
    publishButtonText: '发布', // 发布按钮文本
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
      isPublic: true, // 是否公开（默认公开，用户可在设置中修改）
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
      needReview: false
    },
    // 分组配置
    groups: [],
    currentGroupIndex: 0, // 当前正在配置的分组索引
    // 默认的自定义字段（用于无分组或复制到分组）
    defaultCustomFields: [
      { id: 'name', label: '昵称', required: true, desc: '默认获取微信昵称，可修改', isCustom: false },
      { id: 'mobile', label: '手机号', required: false, desc: '用于联系参与者', isCustom: false }
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
        break;

      case 3: // 地点设置
        if (!form.place || !form.address) {
          wx.showToast({ title: '请选择活动地点', icon: 'none' });
          return false;
        }
        if (!form.checkinRadius || form.checkinRadius < 10) {
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
    this.setData({
      'form.type': this.data.types[index],
      'form.typeIndex': index
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
    const now = new Date();

    // 1. 不能早于当前时间
    if (registerDeadline <= now) {
      wx.showModal({
        title: '报名截止时间无效',
        content: '报名截止时间不能早于或等于当前时间，请重新选择。',
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

    // 2. 不能晚于活动开始时间
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
      content: '请输入字段名称',
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
                  [`groups[${currentGroupIndex}].customFields`]: [...currentFields, newField],
                  nextFieldId: this.data.nextFieldId + 1
                });
              } else {
                // 添加到默认字段
                this.setData({
                  defaultCustomFields: [...currentFields, newField],
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
      content: '请输入字段名称',
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
              [`groups[${currentGroupIndex}].descriptionFields`]: [...currentFields, newField],
              nextDescFieldId: this.data.nextDescFieldId + 1
            });
          } else {
            // 添加到默认字段
            this.setData({
              descriptionFields: [...currentFields, newField],
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
        this.setData({
          [`groups[${groupIndex}].descriptionFields[${fieldIndex}].value`]: value
        });
      }
    } else {
      // 无分组模式
      const fields = this.data.descriptionFields;
      const fieldIndex = fields.findIndex(f => f.id === fieldId);
      if (fieldIndex >= 0) {
        this.setData({
          [`descriptionFields[${fieldIndex}].value`]: value
        });
      }
    }
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
      const { form, groups, defaultCustomFields, descriptionFields } = this.data;

      // 验证必填项
      if (!form.title || form.title.trim().length < 2) {
        wx.showToast({ title: '请至少输入活动标题', icon: 'none' });
        return;
      }

      // 获取现有草稿列表
      let drafts = wx.getStorageSync('activity_drafts') || [];

      // 创建草稿对象
      const draft = {
        draftId: `draft_${Date.now()}`,
        form: { ...form },
        groups: groups.map(g => ({ ...g })),
        defaultCustomFields: JSON.parse(JSON.stringify(defaultCustomFields)),
        descriptionFields: JSON.parse(JSON.stringify(descriptionFields)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 添加到草稿列表
      drafts.unshift(draft); // 最新的放在最前面

      // 最多保存10个草稿
      if (drafts.length > 10) {
        drafts = drafts.slice(0, 10);
      }

      // 保存到本地存储
      wx.setStorageSync('activity_drafts', drafts);

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
      this.loadActivityData(selectedId);
    }
  },

  // 发布活动
  async publish() {
    const { mode, activityId, form, groups, defaultCustomFields, canPublish, copiedWhitelist, copiedBlacklist } = this.data;

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

    // 检查联系方式（友好提示，但不强制）
    const hasPhone = form.organizerPhone && form.organizerPhone.trim().length > 0;
    const hasWechat = form.organizerWechat && form.organizerWechat.trim().length > 0;

    if (!hasPhone && !hasWechat) {
      const confirmResult = await new Promise(resolve => {
        wx.showModal({
          title: '建议填写联系方式',
          content: '建议至少填写一种联系方式，便于参与者联系您。是否继续发布？',
          confirmText: '继续发布',
          cancelText: '返回填写',
          success: res => resolve(res.confirm)
        });
      });

      if (!confirmResult) {
        // 用户选择返回填写，切换到步骤1
        this.setCurrentStep(1);
        return;
      }
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
      needReview: form.needReview,
      hasGroups: form.hasGroups
    };

    // 分组配置
    if (form.hasGroups) {
      // 计算总人数
      const totalCount = groups.reduce((sum, g) => sum + (parseInt(g.total) || 0), 0);

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
      activityData.groups = groups;
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

    // 复制模式下添加白名单和黑名单
    if (mode === 'copy') {
      if (copiedWhitelist && copiedWhitelist.length > 0) {
        activityData.whitelist = copiedWhitelist;
      }
      if (copiedBlacklist && copiedBlacklist.length > 0) {
        activityData.blacklist = copiedBlacklist;
      }
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

    const isEdit = mode === 'edit';
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

      wx.hideLoading();

      if (result.code === 0) {
        const targetId = isEdit ? activityId : result.data.id;

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

        // 清除草稿
        wx.removeStorageSync('activity_draft');

        // 跳转到我的活动页面
        setTimeout(() => {
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
        // 处理参数校验失败等错误
        this.showErrorDialog(result);
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
    }
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
      'organizerPhone': '联系人电话',
      'organizerWechat': '联系人微信'
    };

    // 如果有详细的字段错误信息（参数校验失败）
    if (code === 400 && data && typeof data === 'object') {
      const errorList = [];

      for (const [field, error] of Object.entries(data)) {
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
  onLoad(options) {
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

    this.setData({ mode, activityId });

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
      // 创建模式
      // 不自动加载草稿，用户可以通过"复制活动"功能选择草稿
    }

    // 初始检查是否可以发布
    this.checkCanPublish();
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
      groups = activity.groups.map(g => ({ ...g }));
    }

    // 判断活动状态，已发布的活动不显示草稿和复制按钮
    const isPublished = activity.status && activity.status !== '草稿';

    this.setData({
      form,
      groups,
      originalActivity: activity,
      currentRegistrations,
      fieldEditability,
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
        total: activity.total,
        minParticipants: activity.minParticipants || 0,
        needReview: activity.needReview || false,
        fee: activity.fee || 0,
        feeType: activity.feeType || '免费',
        requirements: activity.requirements || '',
        description: activity.description || ''
      };

      // 如果有分组，复制分组数据
      let groups = [];
      if (activity.hasGroups && activity.groups) {
        groups = activity.groups.map(g => ({ ...g }));
      }

      // 复制白名单和黑名单
      const copiedWhitelist = activity.whitelist ? [...activity.whitelist] : [];
      const copiedBlacklist = activity.blacklist ? [...activity.blacklist] : [];

      this.setData({
        form,
        groups,
        copiedWhitelist,
        copiedBlacklist
      });

      // 标记所有步骤为已完成
      const steps = this.data.steps.map(s => ({ ...s, completed: true }));
      this.setData({ steps });

      this.checkCanPublish();

      wx.hideLoading();
      wx.showToast({ title: '已加载活动数据', icon: 'success' });
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
        form: draft.form,
        groups: draft.groups || [],
        defaultCustomFields: draft.defaultCustomFields || [
          { id: 'name', label: '昵称', required: true, desc: '默认获取微信昵称，可修改', isCustom: false },
          { id: 'mobile', label: '手机号', required: false, desc: '用于联系参与者', isCustom: false }
        ],
        descriptionFields: draft.descriptionFields || [],
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
        descriptionFields: JSON.parse(JSON.stringify(draft.descriptionFields))
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
        groups = activity.groups.map(g => ({ ...g }));
      }

      this.setData({
        form,
        groups
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
