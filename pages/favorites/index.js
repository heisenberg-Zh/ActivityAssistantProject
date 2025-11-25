// pages/favorites/index.js
const { activityAPI, favoriteAPI } = require('../../utils/api.js');
const { enrichActivityWithTags } = require('../../utils/activity-helper.js');
const { calculateActivityStatus } = require('../../utils/formatter.js');
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

  // 加载收藏列表（从后端API获取）
  async loadFavorites() {
    try {
      this.setData({ loading: true });
      wx.showLoading({ title: '加载中...' });

      const currentUserId = app.globalData.currentUserId || null;

      // 从后端API获取收藏列表
      const result = await favoriteAPI.getMyFavorites({ page: 0, size: 100 });

      if (result.code !== 0) {
        throw new Error(result.message || '获取收藏列表失败');
      }

      // 获取收藏的活动列表
      // 后端返回格式：{ content: [...], totalElements, totalPages }
      const favoritesData = result.data?.content || result.data || [];

      // 处理活动数据
      const favoriteActivities = favoritesData.map(favorite => {
        // 后端 FavoriteVO 结构包含了活动的所有信息
        const activity = {
          id: favorite.activityId,
          title: favorite.activityTitle,
          description: favorite.activityDescription,
          type: favorite.activityType,
          status: favorite.activityStatus,
          startTime: favorite.startTime,
          endTime: favorite.endTime,
          registerDeadline: favorite.registerDeadline,  // 添加报名截止时间
          place: favorite.place,
          organizerId: favorite.organizerId,
          organizerName: favorite.organizerName,
          joined: favorite.joined,
          total: favorite.total
        };

        // 添加标签和动态计算状态
        const enrichedActivity = enrichActivityWithTags(activity, currentUserId);
        enrichedActivity.status = calculateActivityStatus(activity);  // 动态计算状态

        return enrichedActivity;
      });

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
        title: error.message || '加载失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 取消收藏（使用后端API）
  async removeFavorite(e) {
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
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中...' });

            // 调用后端API取消收藏
            const result = await favoriteAPI.remove(id);

            wx.hideLoading();

            if (result.code === 0) {
              // 重新加载列表
              this.loadFavorites();

              wx.showToast({
                title: '已取消收藏',
                icon: 'success'
              });
            } else {
              wx.showToast({
                title: result.message || '取消失败',
                icon: 'none'
              });
            }
          } catch (err) {
            wx.hideLoading();
            console.error('取消收藏失败:', err);
            wx.showToast({
              title: '操作失败，请重试',
              icon: 'none'
            });
          }
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
