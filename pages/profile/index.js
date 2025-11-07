// pages/profile/index.js
// 统一菜单列表（按需求顺序排列）
const menuLinks = [
  { key: 'my-activities', label: '我的活动', icon: '活', bg: '#dbeafe', color: '#1d4ed8' },
  { key: 'messages', label: '消息中心', icon: '信', bg: '#fee2e2', color: '#b91c1c', badge: '3' },
  { key: 'favorites', label: '我的收藏', icon: '藏', bg: '#ede9fe', color: '#6d28d9' },
  { key: 'feedback', label: '帮助与反馈', icon: '帮', bg: '#fef3c7', color: '#b45309' },
  { key: 'about', label: '关于我们', icon: '关', bg: '#e0e7ff', color: '#4338ca' },
  { key: 'privacy', label: '隐私政策', icon: '隐', bg: '#f3e8ff', color: '#7c3aed' },
  { key: 'settings', label: '设置', icon: '设', bg: '#fce7f3', color: '#be185d' }
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
    menuLinks,
    // 帮助与反馈弹窗相关
    showFeedbackModal: false,
    feedbackContent: '',
    feedbackCount: 0
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
      case 'favorites':
        this.goFavorites();
        break;
      case 'feedback':
        this.showFeedback();
        break;
      case 'settings':
        this.goSettings();
        break;
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

  goFavorites() {
    wx.navigateTo({ url: '/pages/favorites/index' });
  },

  // 显示帮助与反馈弹窗
  showFeedback() {
    this.setData({
      showFeedbackModal: true,
      feedbackContent: '',
      feedbackCount: 0
    });
  },

  // 关闭反馈弹窗
  closeFeedbackModal() {
    this.setData({ showFeedbackModal: false });
  },

  // 处理反馈内容输入
  onFeedbackInput(e) {
    const content = e.detail.value;
    this.setData({
      feedbackContent: content,
      feedbackCount: content.length
    });
  },

  // 提交反馈
  submitFeedback() {
    const { feedbackContent } = this.data;
    if (!feedbackContent.trim()) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' });
      return;
    }

    // 模拟提交（后续需要接入真实API）
    console.log('用户反馈内容:', feedbackContent);

    // 关闭弹窗并提示成功
    this.setData({ showFeedbackModal: false });
    wx.showToast({ title: '提交成功，感谢您的反馈！', icon: 'success', duration: 2000 });
  },

  logout() {
    wx.showModal({ title: '退出登录', content: '确定要退出当前账号吗？', success: ({ confirm }) => { if (confirm) { wx.showToast({ title: '已退出', icon: 'success' }); } } });
  }
});