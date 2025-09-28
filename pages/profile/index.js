// pages/profile/index.js
const quickLinks = [
  { key: 'my-activities', label: '我的活动', icon: '活', bg: '#dbeafe', color: '#1d4ed8' },
  { key: 'messages', label: '消息中心', icon: '信', bg: '#fee2e2', color: '#b91c1c', badge: '3' },
  { key: 'favorites', label: '我的收藏', icon: '藏', bg: '#ede9fe', color: '#6d28d9' },
  { key: 'invite', label: '邀请好友', icon: '邀', bg: '#ccfbf1', color: '#0f766e' },
  { key: 'feedback', label: '帮助与反馈', icon: '帮', bg: '#fef3c7', color: '#b45309' }
];

const settingsLinks = [
  { key: 'settings', label: '设置', icon: '设', bg: '#fef3c7', color: '#b45309' },
  { key: 'about', label: '关于我们', icon: '关', bg: '#ede9fe', color: '#6d28d9' },
  { key: 'privacy', label: '隐私政策', icon: '隐', bg: '#fee2e2', color: '#b91c1c' }
];

Page({
  data: {
    user: {
      name: '张小北',
      role: '活动组织者',
      id: '123456789',
      tagline: '热爱生活，喜欢组织各种有趣的活动，希望和大家一起创造美好回忆。',
      initial: '张'
    },
    stats: [
      { label: '创建活动', value: 12, icon: '＋', bg: '#dbeafe', color: '#1d4ed8' },
      { label: '参与活动', value: 25, icon: '人', bg: '#dcfce7', color: '#047857' },
      { label: '签到率', value: '95%', icon: '✔', bg: '#fee2e2', color: '#b91c1c' }
    ],
    quickLinks,
    settingsLinks
  },

  handleMenu(e) {
    const key = e.currentTarget.dataset.key;
    switch (key) {
      case 'my-activities':
        this.goMyActivities();
        break;
      case 'messages':
        this.goMessages();
        break;
      case 'settings':
        this.goSettings();
        break;
      case 'favorites':
      case 'invite':
      case 'feedback':
      case 'about':
      case 'privacy':
        wx.showToast({ title: '功能开发中', icon: 'none' });
        break;
      default:
        break;
    }
  },

  goMyActivities() {
    wx.navigateTo({ url: '/pages/my-activities/index' });
  },

  goMessages() {
    wx.navigateTo({ url: '/pages/messages/index' });
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/index' });
  },

  logout() {
    wx.showModal({ title: '退出登录', content: '确定要退出当前账号吗？', success: ({ confirm }) => { if (confirm) { wx.showToast({ title: '已退出', icon: 'success' }); } } });
  }
});