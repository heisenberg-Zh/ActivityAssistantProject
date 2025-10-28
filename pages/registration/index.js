// pages/registration/index.js
const { activities, registrations } = require('../../utils/mock.js');
const { registrationAPI } = require('../../utils/api.js');
const { validateRegistrationForm } = require('../../utils/validator.js');
const { formatMobile, formatMoney, getAvatarColor } = require('../../utils/formatter.js');
const { formatDateCN } = require('../../utils/datetime.js');

const defaultGuidelines = [
  '请确认能够按时参加活动',
  '如需取消请提前2小时联系组织者',
  '活动开始前30分钟可到现场签到',
  '请保持手机畅通，及时接收活动通知'
];

Page({
  data: {
    id: '',
    detail: {},
    deadline: '',
    progress: 0,
    feeInfo: '',
    guidelines: defaultGuidelines,
    participants: [],
    customFields: [], // 动态字段配置
    formData: {}, // 动态表单数据
    agree: false,
    isRegistered: false,
    isFull: false
  },

  onLoad(query) {
    const id = query.id || 'a1';
    this.loadActivityDetail(id);
    this.loadParticipants(id);
  },

  // 加载活动详情
  async loadActivityDetail(id) {
    try {
      const detail = activities.find(item => item.id === id) || activities[0];

      // 计算报名截止时间
      const deadline = formatDateCN(detail.registerDeadline);

      // 计算进度
      const progress = Math.min(100, Math.round((detail.joined / detail.total) * 100));

      // 生成费用说明
      let feeInfo = '';
      if (detail.feeType === '免费') {
        feeInfo = '本次活动免费参加';
      } else if (detail.feeType === 'AA') {
        feeInfo = `本次活动采用AA制，预估每人${formatMoney(detail.fee)}，具体费用以现场消费为准`;
      } else {
        feeInfo = `本次活动费用${formatMoney(detail.fee)}/人`;
      }

      // 生成指引
      const guidelines = detail.requirements
        ? [detail.requirements, ...defaultGuidelines]
        : defaultGuidelines;

      // 检查是否已满员
      const isFull = detail.joined >= detail.total;

      // 检查当前用户是否已报名
      const userRegs = registrations.filter(
        r => r.activityId === id && r.status !== 'cancelled'
      );
      const isRegistered = userRegs.length > 0;

      // 获取自定义字段配置
      const customFields = detail.customFields || [
        { id: 'name', label: '昵称', required: true, desc: '默认获取微信昵称，可修改', isCustom: false },
        { id: 'mobile', label: '手机号', required: true, desc: '用于联系参与者', isCustom: false }
      ];

      // 初始化表单数据
      const formData = {};
      customFields.forEach(field => {
        formData[field.id] = '';
      });

      this.setData({
        id,
        detail,
        deadline,
        progress,
        feeInfo,
        guidelines,
        isFull,
        isRegistered,
        customFields,
        formData
      });

      // 如果是微信用户，自动填充昵称
      this.autoFillUserInfo();
    } catch (err) {
      console.error('加载活动详情失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 加载参与者列表
  async loadParticipants(id) {
    try {
      const activityRegs = registrations.filter(
        r => r.activityId === id && r.status === 'approved'
      );

      const participants = activityRegs.map((reg, index) => ({
        id: reg.id,
        index: String(index + 1),
        name: reg.name,
        mobile: formatMobile(reg.mobile),
        time: formatDateCN(reg.registeredAt),
        bg: getAvatarColor(reg.name)
      }));

      this.setData({ participants });
    } catch (err) {
      console.error('加载参与者列表失败:', err);
    }
  },

  // 自动填充用户信息
  autoFillUserInfo() {
    try {
      // 尝试从缓存获取用户信息
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo && userInfo.nickName) {
        this.setData({
          'formData.name': userInfo.nickName
        });
      }
    } catch (err) {
      console.error('获取用户信息失败:', err);
    }
  },

  // 表单输入
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({ [`formData.${field}`]: e.detail.value });
  },

  // 同意协议
  toggleAgree(e) {
    this.setData({ agree: e.detail.value.length > 0 });
  },

  // 获取手机号（微信快捷方式）
  getPhoneNumber(e) {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 这里需要后端解密
      console.log('获取手机号成功:', e.detail);
      wx.showToast({ title: '获取成功', icon: 'success' });
    } else {
      console.log('获取手机号失败:', e.detail);
    }
  },

  // 验证表单
  validateForm() {
    const { formData, customFields, agree } = this.data;

    // 验证协议
    if (!agree) {
      wx.showToast({ title: '请先阅读并同意活动须知', icon: 'none' });
      return false;
    }

    // 动态验证必填字段
    for (const field of customFields) {
      if (field.required) {
        const value = formData[field.id];

        // 验证是否填写
        if (!value || value.trim().length === 0) {
          wx.showToast({ title: `请填写${field.label}`, icon: 'none' });
          return false;
        }

        // 特殊字段的额外验证
        if (field.id === 'name') {
          if (value.trim().length < 2) {
            wx.showToast({ title: '昵称至少2个字', icon: 'none' });
            return false;
          }
          if (value.length > 20) {
            wx.showToast({ title: '昵称不能超过20个字', icon: 'none' });
            return false;
          }
        }

        if (field.id === 'mobile') {
          const mobileReg = /^1[3-9]\d{9}$/;
          if (!mobileReg.test(value)) {
            wx.showToast({ title: '手机号格式不正确', icon: 'none' });
            return false;
          }
        }
      }
    }

    return true;
  },

  // 取消报名
  cancelRegistration() {
    const { id, detail } = this.data;

    wx.showModal({
      title: '确认取消报名',
      content: '确定要取消报名吗？取消后需要重新报名才能参加活动。',
      confirmText: '确认取消',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });

          try {
            // 这里应该调用API取消报名
            // await registrationAPI.cancel({ activityId: id });

            // 模拟取消成功
            setTimeout(() => {
              wx.hideLoading();
              wx.showToast({ title: '已取消报名', icon: 'success' });

              // 延迟跳转到活动详情页
              setTimeout(() => {
                wx.redirectTo({
                  url: `/pages/activities/detail?id=${id}`
                });
              }, 1500);
            }, 1000);
          } catch (err) {
            wx.hideLoading();
            console.error('取消报名失败:', err);
            wx.showToast({ title: '取消失败，请重试', icon: 'none' });
          }
        }
      }
    });
  },

  // 提交报名
  async submit() {
    const { id, detail, formData, isRegistered, isFull } = this.data;

    // 检查是否已报名
    if (isRegistered) {
      wx.showToast({ title: '您已报名，请勿重复报名', icon: 'none' });
      return;
    }

    // 检查是否已满员
    if (isFull) {
      wx.showToast({ title: '活动已满员', icon: 'none' });
      return;
    }

    // 验证表单
    if (!this.validateForm()) {
      return;
    }

    wx.showLoading({ title: '提交中...' });

    try {
      // 构建提交数据，包含所有动态字段
      const submissionData = {
        activityId: id,
        ...formData,
        needReview: detail.needReview
      };

      const result = await registrationAPI.create(submissionData);

      wx.hideLoading();

      if (result.code === 0) {
        const message = detail.needReview ? '报名成功，等待审核' : '报名成功';
        wx.showToast({ title: message, icon: 'success' });

        // 延迟跳转到详情页
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/activities/detail?id=${id}`
          });
        }, 1500);
      } else {
        wx.showToast({ title: result.message || '报名失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('报名失败:', err);
      wx.showToast({ title: '报名失败，请重试', icon: 'none' });
    }
  },

  // 取消
  cancel() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.switchTab({ url: '/pages/home/index' });
    }
  },

  // 分享
  share() {
    wx.showShareMenu({ withShareTicket: true });
  },

  // 分享给好友
  onShareAppMessage() {
    const { detail, id } = this.data;
    return {
      title: detail.title || '活动报名',
      path: `/pages/registration/index?id=${id}`,
      imageUrl: detail.poster || ''
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { detail } = this.data;
    return {
      title: detail.title || '活动报名',
      imageUrl: detail.poster || ''
    };
  }
});
