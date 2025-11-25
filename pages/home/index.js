// pages/home/index.js
const { activityAPI, registrationAPI } = require('../../utils/api.js');
const { calculateActivityStatus } = require('../../utils/formatter.js');
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

      // ========== 【关键】检查登录状态 ==========
      const isLoggedIn = app.checkLoginStatus();
      const currentUserId = isLoggedIn ? (app.globalData.currentUserId || null) : null;
      console.log('用户登录状态:', isLoggedIn, '当前用户ID:', currentUserId);
      // ========== 登录状态检查结束 ==========

      // 请求活动列表（所有人都可以看）
      const activitiesResult = await activityAPI.getList({
        status: 'published',  // 只显示已发布的活动
        isPublic: true,       // 只显示公开活动
        page: 0,
        size: 50,
        sort: 'startTime,asc'
      });

      // 检查API响应
      if (activitiesResult.code !== 0) {
        throw new Error(activitiesResult.message || '获取活动列表失败');
      }

      // 获取活动列表（处理分页数据）
      const activities = activitiesResult.data.content || activitiesResult.data || [];

      // 获取我的报名记录（只有登录用户才请求）
      let myRegistrations = [];
      if (isLoggedIn && currentUserId) {
        try {
          const registrationsResult = await registrationAPI.getMyRegistrations({
            status: 'approved',   // 只获取已通过的报名
            page: 0,
            size: 100
          });
          myRegistrations = registrationsResult.code === 0
            ? (registrationsResult.data.content || registrationsResult.data || [])
            : [];
        } catch (err) {
          console.warn('获取报名记录失败（可能未登录）:', err);
          myRegistrations = [];
        }
      }

      // 为活动列表添加已报名状态，并动态计算状态
      const enrichedActivities = activities.map(activity => {
        // 只有登录用户才检查报名状态
        const isRegistered = isLoggedIn && myRegistrations.some(
          r => r.activityId === activity.id && r.status === 'approved'
        );
        return {
          ...activity,
          isRegistered,
          status: calculateActivityStatus(activity) // 动态计算活动状态
        };
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
    // 检查是否已登录
    if (!app.checkLoginStatus()) {
      wx.showModal({
        title: '需要登录',
        content: '创建活动需要登录后才能使用，是否前往登录？',
        confirmText: '去登录',
        cancelText: '暂不',
        confirmColor: '#3b82f6',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/auth/login'
            });
          }
        }
      });
      return;
    }
    wx.navigateTo({ url: '/pages/activities/create' });
  },

  goMyActivities() {
    // 检查是否已登录
    if (!app.checkLoginStatus()) {
      wx.showModal({
        title: '需要登录',
        content: '查看我的活动需要登录后才能使用，是否前往登录？',
        confirmText: '去登录',
        cancelText: '暂不',
        confirmColor: '#3b82f6',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/auth/login'
            });
          }
        }
      });
      return;
    }
    wx.navigateTo({ url: '/pages/my-activities/index' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/activities/detail?id=${id}` });
  },

  goRegister(e) {
    // 【优先级1】先检查登录状态
    if (!app.checkLoginStatus()) {
      wx.showModal({
        title: '需要登录',
        content: '报名活动需要登录后才能操作，是否前往登录？',
        confirmText: '去登录',
        cancelText: '暂不',
        confirmColor: '#3b82f6',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/auth/login' });
          }
        }
      });
      return;
    }

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