// pages/home/index.js
const { activities } = require('../../utils/mock.js');

Page({
  data: {
    slides: activities,
    categories: [
      { name: '全部', key: 'all', active: true },
      { name: '聚会', key: '聚会', active: false },
      { name: '培训', key: '培训', active: false },
      { name: '户外', key: '户外', active: false },
      { name: '运动', key: '运动', active: false }
    ],
    list: activities
  },

  onCategoryTap(e) {
    const key = e.currentTarget.dataset.key;
    const categories = this.data.categories.map(item => Object.assign({}, item, { active: item.key === key }));
    const list = key === 'all' ? activities : activities.filter(item => item.type === key);
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

  onShareAppMessage() {
    return { title: '活动助手', path: '/pages/home/index' };
  }
});