// pages/my-activities/joined-list.js
const { activities: allActivities, registrations } = require('../../utils/mock.js');
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
   * 加载已参加的活动列表
   */
  loadActivities() {
    const currentUserId = app.globalData.currentUserId || 'u1';

    // 获取用户参加的所有活动（status=approved且未取消）
    const userRegistrations = registrations.filter(r =>
      r.userId === currentUserId &&
      r.status === 'approved'
    );

    // 获取对应的活动信息
    const joinedActivities = userRegistrations.map(r => {
      const activity = allActivities.find(a => a.id === r.activityId);
      if (!activity) return null;

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
        registrationId: r.id
      };
    }).filter(a => a !== null);

    // 按报名时间倒序排列
    joinedActivities.sort((a, b) => {
      const regA = userRegistrations.find(r => r.id === a.registrationId);
      const regB = userRegistrations.find(r => r.id === b.registrationId);
      return parseDate(regB.registeredAt) - parseDate(regA.registeredAt);
    });

    this.setData({
      activities: joinedActivities
    });
  },

  /**
   * 跳转到活动列表页
   */
  goToActivityList() {
    wx.switchTab({
      url: '/pages/activities/list'
    });
  }
});
