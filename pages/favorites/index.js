// pages/favorites/index.js
const { activities } = require('../../utils/mock.js');
const { enrichActivityWithTags } = require('../../utils/activity-helper.js');
const app = getApp();

Page({
  data: {
    favoriteActivities: []
  },

  onLoad() {
    this.loadFavorites();
  },

  onShow() {
    // 每次显示页面时重新加载收藏列表（可能在其他页面取消收藏）
    this.loadFavorites();
  },

  // 加载收藏列表
  loadFavorites() {
    // 从本地存储获取收藏的活动ID列表
    const favoriteIds = wx.getStorageSync('favoriteActivityIds') || [];
    const currentUserId = app.globalData.currentUserId || 'u1';

    // 根据收藏的ID筛选活动
    const favoriteActivities = activities
      .filter(activity => favoriteIds.includes(activity.id))
      .map(activity => enrichActivityWithTags(activity, currentUserId));

    this.setData({ favoriteActivities });
  },

  // 取消收藏
  removeFavorite(e) {
    const id = e.currentTarget.dataset.id;

    wx.showModal({
      title: '取消收藏',
      content: '确定要取消收藏该活动吗？',
      success: (res) => {
        if (res.confirm) {
          // 从本地存储中移除
          const favoriteIds = wx.getStorageSync('favoriteActivityIds') || [];
          const newFavoriteIds = favoriteIds.filter(fid => fid !== id);
          wx.setStorageSync('favoriteActivityIds', newFavoriteIds);

          // 重新加载列表
          this.loadFavorites();

          wx.showToast({
            title: '已取消收藏',
            icon: 'success'
          });
        }
      }
    });
  },

  // 跳转到活动详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/activities/detail?id=${id}` });
  }
});
