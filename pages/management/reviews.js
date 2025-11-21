// pages/management/reviews.js
const { reviewAPI, activityAPI } = require('../../utils/api.js');
const { formatDateTime } = require('../../utils/formatter.js');
const app = getApp();

Page({
  data: {
    activityId: '',
    activity: null,
    reviews: [],
    loading: true,

    // 系统信息
    statusBarHeight: 0,
    navBarHeight: 0,
    scrollHeight: 0,

    // 筛选和排序
    filterRating: null, // null表示全部，1-5表示对应星级
    sortBy: 'latest', // 'latest' 或 'rating'

    // 分页
    currentPage: 0,
    pageSize: 20,
    hasMore: true,
    loadingMore: false,

    // 统计信息
    statistics: null,

    // 删除确认弹窗
    showDeleteModal: false,
    deleteTarget: null, // { reviewId, userName }
    deleteReason: ''
  },

  onLoad(query) {
    const activityId = query.id;
    if (!activityId) {
      wx.showToast({ title: '活动ID不能为空', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    // 获取状态栏高度
    const statusBarHeight = app.globalData.statusBarHeight || 0;
    const navBarHeight = statusBarHeight + 44;
    const windowInfo = wx.getWindowInfo();
    const scrollHeight = windowInfo.windowHeight - navBarHeight;

    this.setData({
      activityId,
      statusBarHeight,
      navBarHeight,
      scrollHeight
    });

    this.loadActivityInfo();
    this.loadStatistics();
    this.loadReviews(true);
  },

  // 加载活动信息
  async loadActivityInfo() {
    try {
      const result = await activityAPI.getDetail(this.data.activityId);
      if (result.code === 0) {
        this.setData({ activity: result.data });
      }
    } catch (err) {
      console.error('加载活动信息失败:', err);
    }
  },

  // 加载评价统计
  async loadStatistics() {
    try {
      const result = await reviewAPI.getStatistics(this.data.activityId);
      if (result.code === 0) {
        this.setData({ statistics: result.data });
      }
    } catch (err) {
      console.error('加载统计信息失败:', err);
    }
  },

  // 加载评价列表
  async loadReviews(reset = false) {
    const { activityId, filterRating, sortBy, currentPage, reviews, loadingMore } = this.data;

    if (loadingMore) return;

    if (reset) {
      this.setData({
        loading: true,
        currentPage: 0,
        reviews: [],
        hasMore: true
      });
    } else {
      this.setData({ loadingMore: true });
    }

    try {
      const page = reset ? 0 : currentPage;
      const result = await reviewAPI.getActivityReviews(activityId, {
        rating: filterRating,
        sortBy: sortBy,
        page: page,
        size: this.data.pageSize
      });

      if (result.code === 0) {
        const newReviews = result.data.content || [];
        const totalPages = result.data.totalPages || 0;
        const hasMore = (page + 1) < totalPages;

        // 格式化评价数据
        const formattedReviews = newReviews.map(review => ({
          ...review,
          formattedTime: formatDateTime(review.createdAt),
          stars: this.generateStars(review.rating)
        }));

        this.setData({
          reviews: reset ? formattedReviews : [...reviews, ...formattedReviews],
          currentPage: page + 1,
          hasMore,
          loading: false,
          loadingMore: false
        });
      } else {
        throw new Error(result.message || '加载失败');
      }
    } catch (err) {
      console.error('加载评价列表失败:', err);
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      });
      this.setData({
        loading: false,
        loadingMore: false
      });
    }
  },

  // 生成星星数组（用于显示评分）
  generateStars(rating) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push({
        filled: i <= rating,
        index: i
      });
    }
    return stars;
  },

  // 切换评分筛选
  onFilterChange(e) {
    const rating = e.currentTarget.dataset.rating;
    const newRating = this.data.filterRating === rating ? null : rating;

    this.setData({ filterRating: newRating });
    this.loadReviews(true);
    this.loadStatistics(); // 重新加载统计（虽然统计不受筛选影响，但保持一致性）
  },

  // 切换排序方式
  onSortChange(e) {
    const sortBy = e.currentTarget.dataset.sort;
    if (sortBy === this.data.sortBy) return;

    this.setData({ sortBy });
    this.loadReviews(true);
  },

  // 滚动到底部加载更多
  onScrollToLower() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadReviews(false);
    }
  },

  // 下拉刷新
  onRefresh() {
    this.loadActivityInfo();
    this.loadStatistics();
    this.loadReviews(true);
  },

  // 打开删除确认弹窗
  openDeleteModal(e) {
    const { reviewId, userName } = e.currentTarget.dataset;
    this.setData({
      showDeleteModal: true,
      deleteTarget: { reviewId, userName },
      deleteReason: ''
    });
  },

  // 关闭删除弹窗
  closeDeleteModal() {
    this.setData({
      showDeleteModal: false,
      deleteTarget: null,
      deleteReason: ''
    });
  },

  // 删除原因输入
  onDeleteReasonInput(e) {
    this.setData({ deleteReason: e.detail.value });
  },

  // 确认删除评价
  async confirmDelete() {
    const { deleteTarget, deleteReason } = this.data;

    if (!deleteReason || deleteReason.trim().length === 0) {
      wx.showToast({ title: '请输入删除原因', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '删除中...' });

      const currentUserId = app.globalData.currentUserId || 'u1';
      const result = await reviewAPI.deleteByAdmin(
        deleteTarget.reviewId,
        deleteReason.trim()
      );

      wx.hideLoading();

      if (result.code === 0) {
        wx.showToast({ title: '删除成功', icon: 'success' });

        // 关闭弹窗
        this.closeDeleteModal();

        // 刷新列表和统计
        this.loadStatistics();
        this.loadReviews(true);
      } else {
        throw new Error(result.message || '删除失败');
      }
    } catch (err) {
      wx.hideLoading();
      console.error('删除评价失败:', err);
      wx.showToast({
        title: err.message || '删除失败',
        icon: 'none'
      });
    }
  },

  // 返回
  goBack() {
    wx.navigateBack({ delta: 1 });
  }
});
