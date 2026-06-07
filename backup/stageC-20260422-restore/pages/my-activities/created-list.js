// pages/my-activities/created-list.js
const { activityAPI } = require('../../utils/api.js');
const { parseDate } = require('../../utils/date-helper.js');
const { calculateActivityStatus } = require('../../utils/formatter.js');
const app = getApp();

Page({
  data: {
    activities: [],
    loading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadActivities();
  },

  /**
   * 加载已创建的活动列表
   */
  async loadActivities() {
    try {
      this.setData({ loading: true });
      wx.showLoading({ title: '加载中...' });

      const currentUserId = app.globalData.currentUserId || 'u1';

      // 从后端API获取我创建的活动列表
      const result = await activityAPI.getMyActivities({ page: 0, size: 1000 });

      if (result.code !== 0) {
        throw new Error(result.message || '获取活动列表失败');
      }

      const createdActivities = result.data.content || result.data || [];

      // 处理活动数据
      const processedActivities = createdActivities.map(activity => {
        // 动态计算活动状态（根据时间）
        const dynamicStatus = calculateActivityStatus(activity);

        // 处理状态样式类
        let statusClass = 'ended';
        if (dynamicStatus === '进行中') {
          statusClass = 'ongoing';
        } else if (dynamicStatus === '即将开始') {
          statusClass = 'upcoming';
        } else if (dynamicStatus === '报名中') {
          statusClass = 'upcoming';
        }

        return {
          id: activity.id,
          title: activity.title,
          date: activity.date,
          status: dynamicStatus,  // 使用动态计算的中文状态
          statusClass: statusClass,
          createdAt: activity.createdAt
        };
      });

      // 按创建时间倒序排列
      processedActivities.sort((a, b) => {
        return parseDate(b.createdAt) - parseDate(a.createdAt);
      });

      this.setData({
        activities: processedActivities,
        loading: false
      });

      wx.hideLoading();
    } catch (err) {
      console.error('加载活动列表失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none',
        duration: 2000
      });
      this.setData({ loading: false });
    }
  },

  /**
   * 跳转到创建活动页
   */
  goToCreateActivity() {
    wx.navigateTo({
      url: '/pages/activities/create'
    });
  }
});
