// pages/statistics/index.js
const { activities, registrations } = require('../../utils/mock.js');
const { parseDate } = require('../../utils/date-helper.js');
const app = getApp();

Page({
  data: {
    ranges: [
      { key: 'week', label: '本周', active: false },
      { key: 'month', label: '本月', active: false },
      { key: 'year', label: '本年', active: true },
      { key: 'all', label: '全部', active: false }
    ],
    currentRange: 'year',
    joinedStats: [],
    createdStats: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查登录状态
    if (!app.checkLoginStatus()) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false,
        success: () => {
          wx.navigateTo({
            url: '/pages/auth/login'
          });
        }
      });
      return;
    }

    // 加载统计数据
    this.loadStatistics();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示页面时刷新数据
    if (app.checkLoginStatus()) {
      this.loadStatistics();
    }
  },

  /**
   * 加载统计数据
   */
  loadStatistics() {
    const currentUserId = app.globalData.currentUserId || 'u1';
    const timeRange = this.data.currentRange;

    // 计算已参加活动的统计数据
    const joinedStats = this.calculateJoinedStats(currentUserId, timeRange);

    // 计算已创建活动的统计数据
    const createdStats = this.calculateCreatedStats(currentUserId, timeRange);

    this.setData({
      joinedStats,
      createdStats
    });
  },

  /**
   * 计算已参加活动的统计数据
   */
  calculateJoinedStats(userId, timeRange) {
    // 获取用户参加的所有活动（status=approved且未取消）
    const userRegistrations = registrations.filter(r =>
      r.userId === userId &&
      r.status === 'approved'
    );

    // 根据时间范围筛选
    const filteredRegistrations = this.filterByTimeRange(userRegistrations, timeRange);

    // 统计参加活动数
    const totalJoined = filteredRegistrations.length;

    // 统计签到次数
    const checkedCount = filteredRegistrations.filter(r => r.checkinStatus === 'checked').length;

    // 计算签到率（保留一位小数）
    const checkinRate = totalJoined > 0 ? ((checkedCount / totalJoined) * 100).toFixed(1) : '0.0';

    // 统计活动类型分布
    const typeDistribution = this.calculateTypeDistribution(filteredRegistrations);

    return [
      {
        label: '参加活动数',
        value: totalJoined,
        icon: '📅',
        bg: '#dbeafe',
        color: '#1d4ed8'
      },
      {
        label: '签到次数',
        value: checkedCount,
        icon: '✅',
        bg: '#dcfce7',
        color: '#047857'
      },
      {
        label: '签到率',
        value: `${checkinRate}%`,
        icon: '📊',
        bg: '#fde68a',
        color: '#b45309'
      },
      {
        label: typeDistribution.label,
        value: typeDistribution.value,
        icon: '🎯',
        bg: '#ede9fe',
        color: '#6d28d9'
      }
    ];
  },

  /**
   * 计算已创建活动的统计数据
   */
  calculateCreatedStats(userId, timeRange) {
    // 获取用户创建的所有活动（未删除）
    const userActivities = activities.filter(a =>
      a.organizerId === userId &&
      !a.isDeleted
    );

    // 根据时间范围筛选
    const filteredActivities = this.filterActivitiesByTimeRange(userActivities, timeRange);

    // 统计创建活动数
    const totalCreated = filteredActivities.length;

    // 统计总报名人数
    const totalJoined = filteredActivities.reduce((sum, a) => sum + a.joined, 0);

    // 计算平均报名率（保留一位小数）
    let avgRegistrationRate = '0.0';
    if (totalCreated > 0) {
      const totalRate = filteredActivities.reduce((sum, a) => {
        return sum + (a.total > 0 ? (a.joined / a.total) * 100 : 0);
      }, 0);
      avgRegistrationRate = (totalRate / totalCreated).toFixed(1);
    }

    // 计算活动完成率（保留一位小数）
    const completedCount = filteredActivities.filter(a => a.status === '已结束').length;
    const completionRate = totalCreated > 0 ? ((completedCount / totalCreated) * 100).toFixed(1) : '0.0';

    return [
      {
        label: '创建活动数',
        value: totalCreated,
        icon: '🎉',
        bg: '#dbeafe',
        color: '#1d4ed8'
      },
      {
        label: '总报名人数',
        value: totalJoined,
        icon: '👥',
        bg: '#dcfce7',
        color: '#047857'
      },
      {
        label: '平均报名率',
        value: `${avgRegistrationRate}%`,
        icon: '📈',
        bg: '#fde68a',
        color: '#b45309'
      },
      {
        label: '活动完成率',
        value: `${completionRate}%`,
        icon: '✨',
        bg: '#ede9fe',
        color: '#6d28d9'
      }
    ];
  },

  /**
   * 根据时间范围筛选报名记录
   */
  filterByTimeRange(registrations, range) {
    if (range === 'all') {
      return registrations;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    return registrations.filter(r => {
      const regDate = parseDate(r.registeredAt);
      const regYear = regDate.getFullYear();
      const regMonth = regDate.getMonth();
      const regDateNum = regDate.getDate();

      switch (range) {
        case 'week':
          // 计算本周（周一到周日）
          const dayOfWeek = now.getDay() || 7; // 周日为0，转为7
          const mondayDate = new Date(now);
          mondayDate.setDate(currentDate - dayOfWeek + 1);
          mondayDate.setHours(0, 0, 0, 0);

          const sundayDate = new Date(mondayDate);
          sundayDate.setDate(mondayDate.getDate() + 6);
          sundayDate.setHours(23, 59, 59, 999);

          return regDate >= mondayDate && regDate <= sundayDate;

        case 'month':
          // 本月
          return regYear === currentYear && regMonth === currentMonth;

        case 'year':
          // 本年
          return regYear === currentYear;

        default:
          return true;
      }
    });
  },

  /**
   * 根据时间范围筛选活动
   */
  filterActivitiesByTimeRange(activities, range) {
    if (range === 'all') {
      return activities;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    return activities.filter(a => {
      const createDate = parseDate(a.createdAt);
      const createYear = createDate.getFullYear();
      const createMonth = createDate.getMonth();

      switch (range) {
        case 'week':
          const dayOfWeek = now.getDay() || 7;
          const mondayDate = new Date(now);
          mondayDate.setDate(currentDate - dayOfWeek + 1);
          mondayDate.setHours(0, 0, 0, 0);

          const sundayDate = new Date(mondayDate);
          sundayDate.setDate(mondayDate.getDate() + 6);
          sundayDate.setHours(23, 59, 59, 999);

          return createDate >= mondayDate && createDate <= sundayDate;

        case 'month':
          return createYear === currentYear && createMonth === currentMonth;

        case 'year':
          return createYear === currentYear;

        default:
          return true;
      }
    });
  },

  /**
   * 计算活动类型分布
   */
  calculateTypeDistribution(registrations) {
    if (registrations.length === 0) {
      return { label: '暂无数据', value: '-' };
    }

    // 统计各类型活动数量
    const typeCount = {};
    registrations.forEach(r => {
      const activity = activities.find(a => a.id === r.activityId);
      if (activity) {
        const type = activity.type;
        typeCount[type] = (typeCount[type] || 0) + 1;
      }
    });

    // 找出最多的类型
    let maxType = '';
    let maxCount = 0;
    for (const type in typeCount) {
      if (typeCount[type] > maxCount) {
        maxCount = typeCount[type];
        maxType = type;
      }
    }

    const percentage = ((maxCount / registrations.length) * 100).toFixed(0);
    return {
      label: `${maxType}`,
      value: `${percentage}%`
    };
  },

  /**
   * 时间筛选器点击事件
   */
  onRangeTap(e) {
    const key = e.currentTarget.dataset.key;
    const updated = this.data.ranges.map(item => ({
      ...item,
      active: item.key === key
    }));

    this.setData({
      ranges: updated,
      currentRange: key
    });

    // 重新加载统计数据
    this.loadStatistics();

    wx.showToast({
      title: `已切换到${updated.find(item => item.active).label}`,
      icon: 'none',
      duration: 1500
    });
  },

  /**
   * 跳转到已参加活动列表
   */
  goToJoinedList() {
    wx.navigateTo({
      url: '/pages/my-activities/joined-list'
    });
  },

  /**
   * 跳转到已参加活动统计详情
   */
  goToJoinedDetail() {
    wx.navigateTo({
      url: '/pages/statistics/joined-detail'
    });
  },

  /**
   * 跳转到已创建活动列表
   */
  goToCreatedList() {
    wx.navigateTo({
      url: '/pages/my-activities/created-list'
    });
  },

  /**
   * 跳转到已创建活动统计详情
   */
  goToCreatedDetail() {
    wx.navigateTo({
      url: '/pages/statistics/created-detail'
    });
  }
});
