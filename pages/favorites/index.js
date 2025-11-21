// pages/favorites/index.js
const { activityAPI } = require('../../utils/api.js');
const { enrichActivityWithTags } = require('../../utils/activity-helper.js');
const { translateActivityStatus } = require('../../utils/formatter.js');
const app = getApp();

Page({
  data: {
    favoriteActivities: [],
    loading: false,
    isLoggedIn: false  // 添加登录状态标识
  },

  onLoad() {
    this.checkAndLoadData();
  },

  onShow() {
    // 每次显示页面时重新加载收藏列表（可能在其他页面取消收藏）
    this.checkAndLoadData();
  },

  /**
   * 检查登录状态并加载数据
   */
  checkAndLoadData() {
    const isLoggedIn = app.checkLoginStatus();
    this.setData({ isLoggedIn });

    if (!isLoggedIn) {
      // 游客模式：显示游客提示，不加载数据
      console.log('👤 游客模式：我的收藏页面显示游客状态');
      this.setData({
        favoriteActivities: [],
        loading: false
      });
    } else {
      // 已登录：加载收藏数据
      this.loadFavorites();
    }
  },

  // 加载收藏列表
  async loadFavorites() {
    try {
      this.setData({ loading: true });
      wx.showLoading({ title: '加载中...' });

      // 从本地存储获取收藏的活动ID列表
      const favoriteIds = wx.getStorageSync('favoriteActivityIds') || [];

      if (favoriteIds.length === 0) {
        this.setData({ favoriteActivities: [], loading: false });
        wx.hideLoading();
        return;
      }

      const currentUserId = app.globalData.currentUserId || 'u1';

      // 并行请求所有收藏的活动详情
      const promises = favoriteIds.map(id =>
        activityAPI.getDetail(id).catch(err => {
          console.error(`获取活动 ${id} 失败:`, err);
          return null; // 如果某个活动获取失败，返回 null
        })
      );

      const results = await Promise.all(promises);

      // 过滤掉获取失败的活动，并提取有效数据
      const favoriteActivities = results
        .filter(result => result && result.code === 0 && result.data)
        .map(result => {
          const activity = enrichActivityWithTags(result.data, currentUserId);
          // 翻译状态为中文
          activity.status = translateActivityStatus(activity.status);
          return activity;
        });

      // 如果有活动获取失败，更新本地存储（移除不存在的活动ID）
      const validIds = favoriteActivities.map(activity => activity.id);
      const invalidIds = favoriteIds.filter(id => !validIds.includes(id));

      if (invalidIds.length > 0) {
        console.log('发现无效的收藏ID，已自动清理:', invalidIds);
        wx.setStorageSync('favoriteActivityIds', validIds);
      }

      this.setData({
        favoriteActivities,
        loading: false
      });

      wx.hideLoading();
    } catch (error) {
      console.error('加载收藏列表失败:', error);
      this.setData({ loading: false });
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 取消收藏
  removeFavorite(e) {
    // 【优先级1】先检查登录状态（双重保护）
    if (!app.checkLoginStatus()) {
      wx.showModal({
        title: '需要登录',
        content: '取消收藏需要登录后才能操作，是否前往登录？',
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
  },

  /**
   * 游客点击登录按钮
   */
  goLogin() {
    wx.navigateTo({
      url: '/pages/auth/login'
    });
  }
});
