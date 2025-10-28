// pages/activities/list.js
const { activities, registrations } = require('../../utils/mock.js');

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
    filtered: []
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
      list: enrichedActivities,
      filtered: enrichedActivities
    });
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