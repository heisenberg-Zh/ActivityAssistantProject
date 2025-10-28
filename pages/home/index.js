// pages/home/index.js
const { activities, registrations } = require('../../utils/mock.js');

Page({
  data: {
    slides: [],
    categories: [
      { name: '全部', key: 'all', active: true },
      { name: '聚会', key: '聚会', active: false },
      { name: '培训', key: '培训', active: false },
      { name: '户外', key: '户外', active: false },
      { name: '运动', key: '运动', active: false }
    ],
    list: [],
    enrichedActivities: []
  },

  onLoad() {
    // 为活动列表添加已报名状态
    const currentUserId = 'u1'; // 应从登录态获取
    const enrichedActivities = activities.map(activity => {
      const isRegistered = registrations.some(
        r => r.activityId === activity.id && r.userId === currentUserId && r.status !== 'cancelled'
      );
      return { ...activity, isRegistered };
    });

    this.setData({
      slides: enrichedActivities,
      list: enrichedActivities,
      enrichedActivities
    });
  },

  onCategoryTap(e) {
    const key = e.currentTarget.dataset.key;
    const categories = this.data.categories.map(item => Object.assign({}, item, { active: item.key === key }));
    const list = key === 'all' ? this.data.enrichedActivities : this.data.enrichedActivities.filter(item => item.type === key);
    this.setData({ categories, list });
  },

  goCreateActivity() {
    wx.navigateTo({ url: '/pages/activities/create' });
  },

  goMyActivities() {
    wx.navigateTo({ url: '/pages/my-activities/index' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/activities/detail?id=${id}` });
  },

  goRegister(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/registration/index?id=${id}` });
  },

  onRegisteredClick(e) {
    const id = e.currentTarget.dataset.id;
    // 已报名的活动，点击后跳转到详情页
    wx.navigateTo({ url: `/pages/activities/detail?id=${id}` });
  },

  onShareAppMessage() {
    return { title: '活动助手', path: '/pages/home/index' };
  }
});