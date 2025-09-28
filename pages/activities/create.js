// pages/activities/create.js
const TYPE_OPTIONS = ['聚会', '培训', '户外', '运动'];

Page({
  data: {
    types: TYPE_OPTIONS,
    steps: [
      { index: 1, label: '基本信息', active: true },
      { index: 2, label: '时间设置', active: false },
      { index: 3, label: '地点设置', active: false },
      { index: 4, label: '人数设置', active: false },
      { index: 5, label: '其他设置', active: false },
      { index: 6, label: '自定义字段', active: false }
    ],
    form: {
      title: '',
      desc: '',
      type: '',
      start: '',
      end: '',
      place: '',
      address: '',
      total: 20,
      public: true,
      review: false
    },
    customFields: [
      { id: 'name', label: '姓名', required: true, desc: '默认获取微信昵称，可修改' },
      { id: 'mobile', label: '手机号', required: false, desc: '用于联系参与者' }
    ]
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onInputNumber(e) {
    const field = e.currentTarget.dataset.field;
    const value = parseInt(e.detail.value || '0', 10) || 0;
    this.setData({ [`form.${field}`]: value });
  },

  onTypeChange(e) {
    const index = Number(e.detail.value);
    this.setData({ 'form.type': this.data.types[index] });
  },

  onSwitch(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  addField() {
    wx.showToast({ title: '字段管理开发中', icon: 'none' });
  },

  uploadPoster() {
    wx.showToast({ title: '上传功能开发中', icon: 'none' });
  },

  saveDraft() {
    wx.showToast({ title: '已保存草稿', icon: 'success' });
  },

  copyActivity() {
    wx.showToast({ title: '已复制', icon: 'success' });
  },

  publish() {
    wx.showToast({ title: '已发布', icon: 'success' });
  },

  prev() {
    wx.navigateBack({ fail: () => wx.showToast({ title: '已经是第一步', icon: 'none' }) });
  },

  next() {
    wx.showToast({ title: '下一步', icon: 'none' });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    }
  }
});