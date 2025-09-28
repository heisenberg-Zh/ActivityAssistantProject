// pages/registration/index.js
const { activities } = require('../../utils/mock.js');

const feeInfo = '本次活动采用AA制，预估每人80-120元，具体费用以现场消费为准。';
const guidelines = [
  '请确认能够按时参加活动',
  '如需取消请提前2小时联系组织者',
  '活动开始前30分钟可到现场签到',
  '请保持手机畅通，及时接收活动通知'
];
const participantList = [
  { id: 'p1', index: '1', name: '张小北', mobile: '138****1234', time: '12-14 18:30', bg: '#3b82f6' },
  { id: 'p2', index: '2', name: '李小雅', mobile: '139****5678', time: '12-14 19:15', bg: '#10b981' },
  { id: 'p3', index: '3', name: '王小文', mobile: '136****9012', time: '12-14 20:05', bg: '#8b5cf6' },
  { id: 'p4', index: '4', name: '赵小海', mobile: '137****3456', time: '12-15 09:20', bg: '#f97316' }
];

Page({
  data: {
    id: '',
    detail: {},
    deadline: '',
    progress: 0,
    feeInfo,
    guidelines,
    participants: participantList,
    form: { name: '', mobile: '', wechat: '', note: '' },
    agree: true
  },

  onLoad(query) {
    const id = query.id || 'a1';
    const detail = activities.find(item => item.id === id) || activities[0];
    const deadline = detail.date.replace(/(\d{2}):(\d{2})$/, (_, hour, minute) => {
      const next = Math.max(0, parseInt(hour, 10) - 1);
      return `${String(next).padStart(2, '0')}:${minute}`;
    });
    const progress = Math.min(100, Math.round((detail.joined / detail.total) * 100));
    this.setData({ id, detail, deadline, progress });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  toggleAgree(e) {
    this.setData({ agree: e.detail.value.length > 0 });
  },

  cancel() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    }
  },

  share() {
    wx.showShareMenu({ withShareTicket: true });
    wx.showToast({ title: '已打开分享面板', icon: 'none' });
  },

  submit() {
    const { name, mobile } = this.data.form;
    if (!name) {
      wx.showToast({ title: '请填写姓名', icon: 'none' });
      return;
    }
    if (!/^[0-9\-+]{6,}$/.test(mobile)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }
    if (!this.data.agree) {
      wx.showToast({ title: '请先同意协议', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '提交中' });
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '报名成功' });
      setTimeout(() => wx.redirectTo({ url: `/pages/activities/detail?id=${this.data.id}` }), 800);
    }, 800);
  },

  onShareAppMessage() {
    return {
      title: this.data.detail.title || '活动报名',
      path: `/pages/registration/index?id=${this.data.id}`
    };
  }
});
