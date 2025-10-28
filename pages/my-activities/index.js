// pages/my-activities/index.js
const { activities } = require('../../utils/mock.js');

const dataset = [
  Object.assign({}, activities[0], {
    id: 'm1',
    role: '我创建的',
    status: '进行中',
    actions: [
      { label: '查看统计', action: 'stats', type: 'secondary' },
      { label: '管理', action: 'manage', type: 'secondary' }
    ]
  }),
  Object.assign({}, activities[1], {
    id: 'm2',
    role: '我创建的',
    status: '即将开始',
    actions: [
      { label: '发布', action: 'publish', type: 'primary' },
      { label: '编辑', action: 'edit', type: 'secondary' }
    ]
  }),
  Object.assign({}, activities[2], {
    id: 'm3',
    role: '我参加的',
    status: '进行中',
    actions: [
      { label: '签到', action: 'checkin', type: 'primary' },
      { label: '取消报名', action: 'cancelRegistration', type: 'danger' }
    ]
  }),
  Object.assign({}, activities[0], {
    id: 'm4',
    role: '我参加的',
    status: '已结束',
    banner: 'purple',
    actions: [
      { label: '评价', action: 'review', type: 'primary' },
      { label: '回顾', action: 'timeline', type: 'secondary' }
    ]
  })
];

const filters = [
  { key: 'all', name: '全部', active: true },
  { key: 'created', name: '我创建的', active: false },
  { key: 'joined', name: '我参加的', active: false },
  { key: 'ended', name: '已结束', active: false }
];

Page({
  data: {
    filters,
    activeFilter: 'all',
    list: dataset,
    display: dataset
  },

  onFilterTap(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeFilter) {
      return;
    }
    const updated = this.data.filters.map(item => Object.assign({}, item, { active: item.key === key }));
    this.setData({ filters: updated, activeFilter: key });
    this.applyFilter(key);
  },

  applyFilter(key) {
    const display = this.data.list.filter(item => {
      if (key === 'all') return true;
      if (key === 'created') return item.role === '我创建的';
      if (key === 'joined') return item.role === '我参加的';
      if (key === 'ended') return item.status === '已结束';
      return true;
    });
    this.setData({ display });
  },

  handleAction(e) {
    const action = e.currentTarget.dataset.action;
    const id = e.currentTarget.dataset.id;

    switch (action) {
      case 'stats':
        wx.navigateTo({ url: '/pages/statistics/index' });
        break;
      case 'manage':
        wx.showToast({ title: '进入管理界面', icon: 'none' });
        break;
      case 'publish':
        wx.showToast({ title: '已发布', icon: 'success' });
        break;
      case 'edit':
        wx.navigateTo({ url: '/pages/activities/create' });
        break;
      case 'checkin':
        wx.navigateTo({ url: '/pages/checkin/index' });
        break;
      case 'cancelRegistration':
        this.cancelRegistration(id);
        break;
      case 'review':
        wx.showToast({ title: '请填写评价', icon: 'none' });
        break;
      case 'timeline':
        wx.showToast({ title: '打开活动回顾', icon: 'none' });
        break;
      default:
        wx.showToast({ title: '功能开发中', icon: 'none' });
    }
  },

  // 取消报名
  cancelRegistration(id) {
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
            // await activityAPI.cancelRegistration({ activityId: id });

            // 模拟取消成功
            setTimeout(() => {
              wx.hideLoading();
              wx.showToast({ title: '已取消报名', icon: 'success' });

              // 刷新页面数据或移除该活动
              setTimeout(() => {
                // 可以选择刷新列表或跳转
                wx.switchTab({ url: '/pages/home/index' });
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

  createActivity() {
    wx.navigateTo({ url: '/pages/activities/create' });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    }
  }
});