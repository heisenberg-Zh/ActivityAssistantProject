// pages/statistics/joined-detail.js
const wxCharts = require('../../utils/wxcharts/wxcharts-full.js');
const { activities, registrations } = require('../../utils/mock.js');
const { parseDate } = require('../../utils/date-helper.js');
const app = getApp();

let pieChart = null;
let barChart = null;

Page({
  data: {
    totalJoined: 0,
    checkedCount: 0,
    checkinRate: '0.0',
    canvasWidth: 0,
    canvasHeight: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('📊 [joined-detail] 页面加载，使用 wx-charts');

    // 获取系统信息以设置 canvas 尺寸
    const systemInfo = wx.getSystemInfoSync();
    const windowWidth = systemInfo.windowWidth;
    const canvasWidth = windowWidth - 40; // 减去左右 padding
    const canvasHeight = 260; // 图表高度

    this.setData({
      canvasWidth,
      canvasHeight
    });

    this.loadStatistics();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时初始化图表
    setTimeout(() => {
      this.initPieChart();
      this.initBarChart();
    }, 300);
  },

  /**
   * 加载统计数据
   */
  loadStatistics() {
    const currentUserId = app.globalData.currentUserId || 'u1';
    console.log('👤 [joined-detail] 当前用户ID:', currentUserId);

    // 获取用户参加的所有活动
    const userRegistrations = registrations.filter(r =>
      r.userId === currentUserId &&
      r.status === 'approved'
    );

    console.log('📋 [joined-detail] 找到报名记录:', userRegistrations.length, '条');

    const totalJoined = userRegistrations.length;
    const checkedCount = userRegistrations.filter(r => r.checkinStatus === 'checked').length;
    const checkinRate = totalJoined > 0 ? ((checkedCount / totalJoined) * 100).toFixed(1) : '0.0';

    console.log('📊 [joined-detail] 统计数据:', { totalJoined, checkedCount, checkinRate });

    this.setData({
      totalJoined,
      checkedCount,
      checkinRate
    });
  },

  /**
   * 初始化饼图 - 活动类型分布
   */
  initPieChart() {
    console.log('🥧 [joined-detail] 初始化饼图');

    const currentUserId = app.globalData.currentUserId || 'u1';
    const userRegistrations = registrations.filter(r =>
      r.userId === currentUserId &&
      r.status === 'approved'
    );

    console.log('📋 [饼图] 找到报名记录:', userRegistrations.length, '条');

    // 统计活动类型分布
    const typeCount = {};
    userRegistrations.forEach(r => {
      const activity = activities.find(a => a.id === r.activityId);
      if (activity) {
        const type = activity.type;
        typeCount[type] = (typeCount[type] || 0) + 1;
      }
    });

    console.log('📊 [饼图] 类型统计:', typeCount);

    // 转换为 wx-charts 数据格式
    const series = Object.keys(typeCount).map((type, index) => ({
      name: type,
      data: typeCount[type],
      color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][index % 5]
    }));

    console.log('📊 [饼图] 图表数据:', series);

    pieChart = new wxCharts({
      canvasId: 'pie-canvas',
      type: 'pie',
      series: series,
      width: this.data.canvasWidth,
      height: this.data.canvasHeight,
      dataLabel: true,
      legend: true,
      animation: true
    });
  },

  /**
   * 初始化柱状图 - 每月参加活动趋势
   */
  initBarChart() {
    console.log('📊 [joined-detail] 初始化柱状图');

    const currentUserId = app.globalData.currentUserId || 'u1';
    const userRegistrations = registrations.filter(r =>
      r.userId === currentUserId &&
      r.status === 'approved'
    );

    console.log('📋 [柱状图] 找到报名记录:', userRegistrations.length, '条');

    // 统计最近6个月的数据
    const now = new Date();
    const monthData = {};
    const monthLabels = [];

    // 生成最近6个月的标签
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const label = `${month}月`;
      monthLabels.push(label);
      monthData[label] = 0;
    }

    console.log('📅 [柱状图] 月份标签:', monthLabels);

    // 统计每月参加活动数
    userRegistrations.forEach(r => {
      const regDate = parseDate(r.registeredAt);
      const month = regDate.getMonth() + 1;
      const label = `${month}月`;
      if (monthData.hasOwnProperty(label)) {
        monthData[label]++;
      }
    });

    console.log('📊 [柱状图] 月度数据:', monthData);

    const barData = monthLabels.map(label => monthData[label]);
    console.log('📊 [柱状图] 图表数据:', barData);

    barChart = new wxCharts({
      canvasId: 'bar-canvas',
      type: 'column',
      categories: monthLabels,
      series: [{
        name: '参加活动数',
        data: barData,
        color: '#3b82f6'
      }],
      width: this.data.canvasWidth,
      height: this.data.canvasHeight,
      yAxis: {
        format: function(val) {
          return val.toFixed(0);
        },
        min: 0
      },
      xAxis: {
        disableGrid: false
      },
      dataLabel: false,
      legend: false,
      animation: true,
      extra: {
        column: {
          width: 20
        }
      }
    });
  }
});

