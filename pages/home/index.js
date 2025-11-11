// pages/home/index.js
const { activityAPI, registrationAPI } = require('../../utils/api.js');
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
    enrichedActivities: [],
    loading: true
  },

  async onLoad() {
    await this.loadActivities();
  },

  // 加载活动数据
  async loadActivities() {
    try {
      wx.showLoading({ title: '加载中...' });

      // 获取当前用户ID
      const currentUserId = app.globalData.currentUserId || 'u1';

      // 并行请求活动列表和我的报名记录
      const [activitiesResult, registrationsResult] = await Promise.all([
        activityAPI.getList({
          status: 'published',  // 只显示已发布的活动
          isPublic: true,       // 只显示公开活动
          page: 0,
          size: 50,
          sort: 'startTime,asc'
        }),
        registrationAPI.getMyRegistrations({
          status: 'approved',   // 只获取已通过的报名
          page: 0,
          size: 100
        })
      ]);

      // 检查API响应
      if (activitiesResult.code !== 0) {
        throw new Error(activitiesResult.message || '获取活动列表失败');
      }

      // 获取活动列表（处理分页数据）
      const activities = activitiesResult.data.content || activitiesResult.data || [];

      // 获取我的报名记录
      const myRegistrations = registrationsResult.code === 0
        ? (registrationsResult.data.content || registrationsResult.data || [])
        : [];

      // 为活动列表添加已报名状态
      const enrichedActivities = activities.map(activity => {
        const isRegistered = myRegistrations.some(
          r => r.activityId === activity.id && r.status === 'approved'
        );
        return { ...activity, isRegistered };
      });

      this.setData({
        slides: enrichedActivities.slice(0, 5),  // 轮播图显示前5个
        list: enrichedActivities,
        enrichedActivities,
        loading: false
      });

      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('加载活动数据失败:', err);
      wx.showToast({
        title: err.message || '加载失败，请稍后重试',
        icon: 'none',
        duration: 2000
      });
      this.setData({ loading: false });
    }
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