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
    form: {
      name: '',
      mobile: '',
      wechat: '',
      note: ''
    },
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

      this.setData({
        id,
        detail,
        deadline,
        progress,
        feeInfo,
        guidelines,
        isFull,
        isRegistered
      });

      // 如果是微信用户，自动填充姓名
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
          'form.name': userInfo.nickName
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
    this.setData({ [`form.${field}`]: e.detail.value });
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
    const { form, agree, detail } = this.data;

    // 验证协议
    if (!agree) {
      wx.showToast({ title: '请先阅读并同意活动须知', icon: 'none' });
      return false;
    }

    // 验证姓名
    if (!form.name || form.name.trim().length < 2) {
      wx.showToast({ title: '请输入姓名（至少2个字）', icon: 'none' });
      return false;
    }

    if (form.name.length > 20) {
      wx.showToast({ title: '姓名不能超过20个字', icon: 'none' });
      return false;
    }

    // 验证手机号
    if (!form.mobile) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return false;
    }

    const mobileReg = /^1[3-9]\d{9}$/;
    if (!mobileReg.test(form.mobile)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return false;
    }

    return true;
  },

  // 提交报名
  async submit() {
    const { id, detail, form, isRegistered, isFull } = this.data;

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
      const result = await registrationAPI.create({
        activityId: id,
        name: form.name.trim(),
        mobile: form.mobile,
        wechat: form.wechat,
        note: form.note,
        needReview: detail.needReview
      });

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
