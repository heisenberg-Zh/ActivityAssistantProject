// pages/home/index.js
const { activities, registrations } = require('../../utils/mock.js');
const { filterActivitiesByPermission } = require('../../utils/activity-helper.js');
const app = getApp();

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
    // 获取当前用户ID
    const currentUserId = app.globalData.currentUserId || 'u1';

    // 获取用户的报名记录（仅审核通过的）
    const userRegistrations = registrations.filter(
      r => r.userId === currentUserId && r.status === 'approved'
    );

    // 过滤活动：首页不显示不公开的活动（即使是自己创建的）
    const filteredActivities = filterActivitiesByPermission(
      activities,
      currentUserId,
      userRegistrations,
      { includeOwned: false } // 首页不显示自己创建的私密活动
    );

    // 为活动列表添加已报名状态
    const enrichedActivities = filteredActivities.map(activity => {
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