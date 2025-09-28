// pages/settings/index.js
Page({
  data: {
    form: { push: true, remind: true, notify: true },
    accountItems: [
      { key: 'profile', label: '个人资料', icon: '资', bg: '#dbeafe', color: '#1d4ed8' },
      { key: 'security', label: '账户安全', icon: '安', bg: '#dcfce7', color: '#047857' },
      { key: 'payment', label: '支付设置', icon: '付', bg: '#ede9fe', color: '#6d28d9' }
    ],
    notifyOptions: [
      { field: 'push', label: '推送通知', desc: '接收活动相关通知' },
      { field: 'remind', label: '活动提醒', desc: '活动开始前提醒' },
      { field: 'notify', label: '报名通知', desc: '报名成功/失败通知' }
    ],
    preferenceItems: [
      { key: 'theme', label: '主题设置', icon: '主', bg: '#fef3c7', color: '#b45309', extra: '浅色' },
      { key: 'language', label: '语言设置', icon: '语', bg: '#ccfbf1', color: '#0f766e', extra: '简体中文' },
      { key: 'storage', label: '清除缓存', icon: '存', bg: '#fee2e2', color: '#b91c1c', extra: '12.5MB' }
    ],
    aboutItems: [
      { key: 'version', label: '版本信息', icon: '版', bg: '#dbeafe', color: '#1d4ed8', extra: 'v1.0.0' },
      { key: 'agreement', label: '用户协议', icon: '协', bg: '#ede9fe', color: '#6d28d9' },
      { key: 'privacy', label: '隐私政策', icon: '隐', bg: '#dcfce7', color: '#047857' }
    ]
  },

  toggle(e) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  handleItem(e) {
    const key = e.currentTarget.dataset.key;
    switch (key) {
      case 'profile':
        wx.navigateTo({ url: '/pages/profile/index' });
        break;
      case 'security':
      case 'payment':
      case 'theme':
      case 'language':
      case 'storage':
      case 'agreement':
      case 'privacy':
      case 'version':
        wx.showToast({ title: '功能开发中', icon: 'none' });
        break;
      default:
        wx.showToast({ title: '敬请期待', icon: 'none' });
    }
  },

  logout() {
    wx.showModal({ title: '退出登录', content: '确定要退出当前账号吗？', success: ({ confirm }) => { if (confirm) { wx.showToast({ title: '已退出', icon: 'success' }); } } });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    }
  }
});