// pages/my-activities/joined-list.js
const { registrationAPI, activityAPI } = require('../../utils/api.js');
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
   * 加载已参加的活动列表
   */
  async loadActivities() {
    try {
      this.setData({ loading: true });
      wx.showLoading({ title: '加载中...' });

      const currentUserId = app.globalData.currentUserId || 'u1';

      // 从后端API获取我的报名列表
      const result = await registrationAPI.getMyRegistrations({ page: 0, size: 1000 });

      if (result.code !== 0) {
        throw new Error(result.message || '获取报名列表失败');
      }

      const allRegistrations = result.data.content || result.data || [];

      // 筛选已通过审核的报名
      const approvedRegistrations = allRegistrations.filter(r => r.status === 'approved');

      // 获取对应的活动信息（批量获取或逐个获取）
      const joinedActivities = [];

      for (const registration of approvedRegistrations) {
        try {
          const activityResult = await activityAPI.getDetail(registration.activityId);

          if (activityResult.code === 0 && activityResult.data) {
            const activity = activityResult.data;

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

            joinedActivities.push({
              id: activity.id,
              title: activity.title,
              date: activity.date,
              status: dynamicStatus,  // 使用动态计算的中文状态
              statusClass: statusClass,
              registrationId: registration.id,
              registeredAt: registration.createdAt || registration.registeredAt
            });
          }
        } catch (err) {
          console.warn('获取活动详情失败:', registration.activityId, err);
        }
      }

      // 按报名时间倒序排列
      joinedActivities.sort((a, b) => {
        return parseDate(b.registeredAt) - parseDate(a.registeredAt);
      });

      this.setData({
        activities: joinedActivities,
        loading: false
      });

      wx.hideLoading();
    } catch (err) {
      console.error('加载参与活动列表失败:', err);
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
   * 跳转到活动列表页
   */
  goToActivityList() {
    wx.switchTab({
      url: '/pages/activities/list'
    });
  }
});
