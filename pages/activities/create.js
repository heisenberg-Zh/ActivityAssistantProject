// pages/activities/create.js
const { activityAPI } = require('../../utils/api.js');
const { validateActivityForm } = require('../../utils/validator.js');
const { formatDateTime } = require('../../utils/datetime.js');
const { parseDate } = require('../../utils/date-helper.js');

const TYPE_OPTIONS = ['聚会', '培训', '户外', '运动', '会议'];

Page({
  data: {
    types: TYPE_OPTIONS,
    currentStep: 1,
    todayDate: '', // 今天的日期，用于限制选择范围
    canPublish: false, // 是否可以发布（所有必填步骤已完成）
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
    nextDescFieldId: 1 // 用于生成活动说明自定义字段的唯一ID
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
    } else {
      this.setData({ [`form.${field}`]: e.detail.value });
    }
  },

  // 分组数量改变
  onGroupCountChange(e) {
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

    this.checkCanPublish();
  },

  // 选择地点
  chooseLocation() {
    console.log('点击选择地点');
    // 直接使用自定义地点选择器，避免隐私协议问题
    this.showLocationPicker();
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
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({ 'form.poster': tempFilePath });
        wx.showToast({ title: '海报已选择', icon: 'success' });
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({ title: '选择图片失败', icon: 'none' });
      }
    });
  },

  // 保存草稿
  saveDraft() {
    try {
      wx.setStorageSync('activity_draft', this.data.form);
      wx.showToast({ title: '草稿已保存', icon: 'success' });
    } catch (err) {
      console.error('保存草稿失败:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // 复制活动
  copyActivity() {
    try {
      const draft = wx.getStorageSync('activity_draft');
      if (draft) {
        this.setData({ form: draft });
        wx.showToast({ title: '已加载草稿', icon: 'success' });
      } else {
        wx.showToast({ title: '暂无草稿', icon: 'none' });
      }
    } catch (err) {
      console.error('加载草稿失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 发布活动
  async publish() {
    const { form, groups, defaultCustomFields, canPublish } = this.data;

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
    const activityData = {
      title: form.title,
      desc: form.desc,
      type: form.type,
      startTime: `${form.startDate} ${form.startTime}`,
      endTime: `${form.endDate} ${form.endTime}`,
      registerDeadline: form.registerDeadlineDate
        ? `${form.registerDeadlineDate} ${form.registerDeadlineTime}`
        : `${form.startDate} ${form.startTime}`,
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
      activityData.total = totalCount;
      activityData.minParticipants = Math.floor(totalCount * 0.5); // 默认一半成行
      activityData.groups = groups;
    } else {
      // 无分组配置
      activityData.total = form.total;
      activityData.minParticipants = form.minParticipants;
      activityData.fee = form.fee || 0;
      activityData.feeType = form.feeType || '免费';
      activityData.requirements = form.requirements || '';
      activityData.description = form.description || '';
      activityData.customFields = defaultCustomFields;
    }

    wx.showLoading({ title: '发布中...' });

    try {
      const result = await activityAPI.create(activityData);
      wx.hideLoading();

      if (result.code === 0) {
        wx.showToast({ title: '发布成功', icon: 'success' });

        // 清除草稿
        wx.removeStorageSync('activity_draft');

        // 跳转到详情页
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/activities/detail?id=${result.data.id}`
          });
        }, 1500);
      } else {
        wx.showToast({ title: result.message || '发布失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('发布失败:', err);
      wx.showToast({ title: '发布失败，请重试', icon: 'none' });
    }
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
    // 设置今天的日期
    const today = new Date();
    const todayDate = formatDateTime(today.toISOString(), 'YYYY-MM-DD');
    this.setData({ todayDate });

    // 尝试加载草稿
    try {
      const draft = wx.getStorageSync('activity_draft');
      if (draft && options.loadDraft === '1') {
        this.setData({ form: draft });
      }
    } catch (err) {
      console.error('加载草稿失败:', err);
    }

    // 初始检查是否可以发布
    this.checkCanPublish();
  }
});