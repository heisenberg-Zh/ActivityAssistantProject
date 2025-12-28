// pages/statistics/index.js
const { statisticsAPI } = require('../../utils/api.js');
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
    createdStats: [],
    loading: true,
    isLoggedIn: false  // 添加登录状态标识
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.checkAndLoadData();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示页面时检查登录状态并加载数据
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
      console.log('👤 游客模式：统计页面显示游客状态');
      this.setData({
        loading: false,
        joinedStats: [],
        createdStats: []
      });
    } else {
      // 已登录：加载统计数据
      this.loadStatistics();
    }
  },

  /**
   * 加载统计数据（从后端API获取）
   * 注意：当前后端暂不支持时间范围筛选，获取的是全部时间的统计数据
   */
  async loadStatistics() {
    try {
      this.setData({ loading: true });

      // 从后端API获取统计数据
      // 注意：后端API暂不支持timeRange参数，此参数将被忽略
      const response = await statisticsAPI.getMyStatistics();

      if (response && response.data) {
        const data = response.data;

        // 计算签到率格式
        const checkinRateValue = data.checkinRate !== undefined
          ? `${Math.round(data.checkinRate)}%`
          : '0%';

        // 设置已参加活动的统计数据
        const joinedStats = [
          {
            label: '参加活动数',
            value: data.participatedActivities || 0,
            icon: '📅',
            bg: '#dbeafe',
            color: '#1d4ed8'
          },
          {
            label: '签到次数',
            value: data.totalCheckins || 0,
            icon: '✅',
            bg: '#dcfce7',
            color: '#047857'
          },
          {
            label: '签到率',
            value: checkinRateValue,
            icon: '📊',
            bg: '#fde68a',
            color: '#b45309'
          },
          {
            label: '迟到次数',
            value: data.lateCount || 0,
            icon: '🎯',
            bg: '#ede9fe',
            color: '#6d28d9'
          }
        ];

        // 设置已创建活动的统计数据
        // 防御性处理：当创建活动数为0时，其他统计项显示空白
        const hasCreatedActivities = (data.createdActivities || 0) > 0;
        const createdStats = [
          {
            label: '创建活动数',
            value: data.createdActivities || 0,
            icon: '🎉',
            bg: '#dbeafe',
            color: '#1d4ed8'
          },
          {
            label: '总报名人数',
            value: hasCreatedActivities ? (data.totalRegistrations || 0) : '',
            icon: '👥',
            bg: '#dcfce7',
            color: '#047857'
          },
          {
            label: '无效签到',
            value: hasCreatedActivities ? (data.invalidCheckinCount || 0) : '',
            icon: '📈',
            bg: '#fde68a',
            color: '#b45309'
          },
          {
            label: '获得评价数',
            value: hasCreatedActivities ? (data.totalReviews || 0) : '',
            icon: '⭐',
            bg: '#ede9fe',
            color: '#6d28d9'
          }
        ];

        this.setData({
          joinedStats,
          createdStats,
          loading: false
        });
      } else {
        throw new Error('数据格式错误');
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
      this.setData({ loading: false });

      wx.showToast({
        title: '加载统计数据失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 时间筛选器点击事件
   * 注意：后端暂不支持时间范围筛选，此功能待后续实现
   */
  onRangeTap(e) {
    // 游客模式下不允许操作
    if (!this.data.isLoggedIn) {
      this.showLoginGuide();
      return;
    }

    const key = e.currentTarget.dataset.key;
    const updated = this.data.ranges.map(item => ({
      ...item,
      active: item.key === key
    }));

    this.setData({
      ranges: updated,
      currentRange: key
    });

    // 暂时提示功能待支持
    wx.showToast({
      title: '时间筛选功能待后端支持',
      icon: 'none',
      duration: 2000
    });

    // 注释：等后端支持时间筛选后，取消下面的注释并移除上面的提示
    // this.loadStatistics();
  },

  /**
   * 跳转到已参加活动列表
   */
  goToJoinedList() {
    if (!this.data.isLoggedIn) {
      this.showLoginGuide();
      return;
    }
    wx.navigateTo({
      url: '/pages/my-activities/joined-list'
    });
  },

  /**
   * 跳转到已参加活动统计详情
   */
  goToJoinedDetail() {
    if (!this.data.isLoggedIn) {
      this.showLoginGuide();
      return;
    }
    wx.navigateTo({
      url: '/pages/statistics/joined-detail'
    });
  },

  /**
   * 跳转到已创建活动列表
   */
  goToCreatedList() {
    if (!this.data.isLoggedIn) {
      this.showLoginGuide();
      return;
    }
    wx.navigateTo({
      url: '/pages/my-activities/created-list'
    });
  },

  /**
   * 跳转到已创建活动统计详情
   */
  goToCreatedDetail() {
    if (!this.data.isLoggedIn) {
      this.showLoginGuide();
      return;
    }
    wx.navigateTo({
      url: '/pages/statistics/created-detail'
    });
  },

  /**
   * 显示登录引导
   */
  showLoginGuide() {
    wx.showModal({
      title: '需要登录',
      content: '该功能需要登录后才能使用，是否前往登录？',
      confirmText: '去登录',
      cancelText: '暂不',
      confirmColor: '#3b82f6',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/auth/login'
          });
        }
      }
    });
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
