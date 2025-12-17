// pages/home/index.js
const { activityAPI, registrationAPI } = require('../../utils/api.js');
const { calculateActivityStatus } = require('../../utils/formatter.js');
const { getActivityImage } = require('../../utils/default-images.js');
const app = getApp();

// 状态到CSS类名的映射
const STATUS_CLASS_MAP = {
  '报名中': 'registering',
  '进行中': 'ongoing',
  '已结束': 'ended',
  '已取消': 'cancelled',
  '已满员': 'full'
};

// 获取状态对应的CSS类名
const getStatusClass = (status) => {
  return STATUS_CLASS_MAP[status] || '';
};

// 判断活动是否应该在首页显示
// 规则：已取消的活动不显示；当天结束的活动仍显示，跨天后才不显示
const shouldShowInHome = (activity) => {
  // 已取消的活动不显示
  if (activity.status === '已取消') {
    return false;
  }

  // 如果不是"已结束"状态，直接显示
  if (activity.status !== '已结束') {
    return true;
  }

  // 如果是"已结束"状态，检查是否是当天结束
  if (!activity.endTime) {
    return false;  // 没有结束时间，不显示
  }

  try {
    // 解析结束时间
    let endTimeStr = activity.endTime;
    if (endTimeStr.includes(' ') && !endTimeStr.includes('T')) {
      endTimeStr = endTimeStr.replace(' ', 'T');
    }
    endTimeStr = endTimeStr.replace(/\.\d+/, '');
    const endTime = new Date(endTimeStr);

    // 获取今天的日期（去掉时间部分）
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // 获取活动结束日期（去掉时间部分）
    const endDate = new Date(endTime.getFullYear(), endTime.getMonth(), endTime.getDate());

    // 如果结束日期 >= 今天，显示（包括当天结束的活动）
    // 如果结束日期 < 今天（已经过了结束日期），不显示
    return endDate >= todayDate;
  } catch (err) {
    console.error('解析活动结束时间失败:', err);
    return false;  // 解析失败，不显示
  }
};

Page({
  data: {
    slides: [],
    categories: [
      { name: '全部', key: 'all', active: true },
      { name: '聚会', key: '聚会', active: false },
      { name: '培训', key: '培训', active: false },
      { name: '户外', key: '户外', active: false },
      { name: '运动', key: '运动', active: false },
      { name: '其他', key: '其他', active: false }
    ],
    list: [],
    enrichedActivities: [],
    loading: true
  },

  async onLoad() {
    await this.loadActivities();
  },

  // 每次显示页面时刷新数据
  async onShow() {
    await this.loadActivities();
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadActivities();
    wx.stopPullDownRefresh();
  },

  // 加载活动数据
  async loadActivities() {
    try {
      wx.showLoading({ title: '加载中...' });

      // 检查登录状态
      const isLoggedIn = app.checkLoginStatus();
      const currentUserId = isLoggedIn ? (app.globalData.currentUserId || null) : null;

      // 请求活动列表
      const activitiesResult = await activityAPI.getList({
        status: 'published',
        isPublic: true,
        page: 0,
        size: 50,
        sort: 'startTime,asc'
      });

      // 检查API响应
      if (activitiesResult.code !== 0) {
        throw new Error(activitiesResult.message || '获取活动列表失败');
      }

      // 获取活动列表
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
        const calculatedStatus = calculateActivityStatus(activity);
        const imageUrl = getActivityImage(activity.image, activity.type);

        return {
          ...activity,
          isRegistered,
          status: calculatedStatus,
          statusClass: getStatusClass(calculatedStatus), // 添加状态CSS类名
          imageUrl  // 添加图片URL（自定义或默认）
        };
      });

      // 首页只显示有效活动：过滤掉"已取消"和已过期的"已结束"活动
      // 当天结束的活动仍然显示，跨天后才不显示
      const validActivities = enrichedActivities.filter(activity => {
        return shouldShowInHome(activity);
      });

      this.setData({
        slides: validActivities.slice(0, 5),  // 轮播图显示前5个有效活动
        list: validActivities,
        enrichedActivities: validActivities,
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