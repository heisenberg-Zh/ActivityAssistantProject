// pages/my-activities/created-list.js
const { activities: allActivities } = require('../../utils/mock.js');
const { parseDate } = require('../../utils/date-helper.js');
const app = getApp();

Page({
  data: {
    activities: []
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
  loadActivities() {
    const currentUserId = app.globalData.currentUserId || 'u1';

    // 获取用户创建的所有活动（未删除）
    const createdActivities = allActivities.filter(a =>
      a.organizerId === currentUserId &&
      !a.isDeleted
    );

    // 处理活动数据
    const processedActivities = createdActivities.map(activity => {
      // 处理状态
      let statusClass = 'ended';
      if (activity.status === '进行中') {
        statusClass = 'ongoing';
      } else if (activity.status === '即将开始') {
        statusClass = 'upcoming';
      }

      return {
        id: activity.id,
        title: activity.title,
        date: activity.date,
        status: activity.status,
        statusClass: statusClass,
        createdAt: activity.createdAt
      };
    });

    // 按创建时间倒序排列
    processedActivities.sort((a, b) => {
      return parseDate(b.createdAt) - parseDate(a.createdAt);
    });

    this.setData({
      activities: processedActivities
    });
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
