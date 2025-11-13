// pages/activities/list.js
const { activityAPI, registrationAPI } = require('../../utils/api.js');
const { translateActivityStatus } = require('../../utils/formatter.js');
const app = getApp();

const filters = [
  { key: 'all', name: '全部', active: true },
  { key: 'status:进行中', name: '进行中', active: false },
  { key: 'status:即将开始', name: '即将开始', active: false },
  { key: 'status:已结束', name: '已结束', active: false },
  { key: 'type:聚会', name: '聚会', active: false },
  { key: 'type:培训', name: '培训', active: false },
  { key: 'type:户外', name: '户外', active: false }
];

Page({
  data: {
    keyword: '',
    filters,
    activeFilter: 'all',
    list: [],
    filtered: [],
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
          page: 0,
          size: 100,
          sort: 'createdAt,desc'
        }),
        registrationAPI.getMyRegistrations({
          page: 0,
          size: 100
        })
      ]);

      // 检查API响应
      if (activitiesResult.code !== 0) {
        throw new Error(activitiesResult.message || '获取活动列表失败');
      }

      // 获取活动列表
      const activities = activitiesResult.data.content || activitiesResult.data || [];

      // 获取我的报名记录
      const myRegistrations = registrationsResult.code === 0
        ? (registrationsResult.data.content || registrationsResult.data || [])
        : [];

      // 为活动列表添加已报名状态，并翻译状态为中文
      const enrichedActivities = activities.map(activity => {
        const isRegistered = myRegistrations.some(
          r => r.activityId === activity.id &&
          r.status !== 'cancelled' &&
          r.status !== 'rejected'
        );
        return {
          ...activity,
          isRegistered,
          status: translateActivityStatus(activity.status) // 翻译英文状态为中文
        };
      });

      this.setData({
        list: enrichedActivities,
        filtered: enrichedActivities,
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

  onSearchInput(e) {
    const keyword = (e.detail.value || '').trim();
    this.setData({ keyword });
    this.applyFilters(keyword, this.data.activeFilter);
  },

  onFilterTap(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeFilter) {
      return;
    }
    const updated = this.data.filters.map(item => Object.assign({}, item, { active: item.key === key }));
    this.setData({ filters: updated, activeFilter: key });
    this.applyFilters(this.data.keyword, key);
  },

  applyFilters(keyword, filterKey) {
    const kw = keyword.toLowerCase();
    const filtered = this.data.list.filter(item => {
      const matchKeyword = !kw || item.title.toLowerCase().includes(kw) || item.place.toLowerCase().includes(kw);
      if (!matchKeyword) return false;
      if (filterKey === 'all') return true;
      if (filterKey.startsWith('status:')) {
        const status = filterKey.split(':')[1];
        return item.status === status;
      }
      if (filterKey.startsWith('type:')) {
        const type = filterKey.split(':')[1];
        return item.type === type;
      }
      return true;
    });
    this.setData({ filtered });
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

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    }
  }
});