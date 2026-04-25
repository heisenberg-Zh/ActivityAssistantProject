// pages/statistics/created-detail.js
const wxCharts = require('../utils/wxcharts-full.js');
const { activityAPI } = require('../../utils/api.js');
const { parseDate } = require('../../utils/date-helper.js');
const app = getApp();

let pieChart = null;
let barChart = null;

Page({
  data: {
    activities: [],  // 存储从后端获取的活动列表
    totalCreated: 0,
    totalJoined: 0,
    avgRate: '0.0',
    canvasWidth: 0,
    canvasHeight: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('📊 [created-detail] 页面加载，使用 wx-charts');

    // 获取系统信息以设置 canvas 尺寸
    const windowInfo = wx.getWindowInfo();
    const windowWidth = windowInfo.windowWidth;
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
    // 页面显示时初始化图表（仅在有数据时）
    setTimeout(() => {
      if (this.data.totalCreated > 0) {
        this.initPieChart();
        this.initBarChart();
      }
    }, 300);
  },

  /**
   * 加载统计数据
   */
  async loadStatistics() {
    try {
      wx.showLoading({ title: '加载中...' });

      const currentUserId = app.globalData.currentUserId || 'u1';
      console.log('👤 [created-detail] 当前用户ID:', currentUserId);

      // 从后端API获取我创建的活动列表
      const result = await activityAPI.getMyActivities({ page: 0, size: 1000 });

      if (result.code !== 0) {
        throw new Error(result.message || '获取活动列表失败');
      }

      const userActivities = result.data.content || result.data || [];

      console.log('📋 [created-detail] 找到创建的活动:', userActivities.length, '个');

      const totalCreated = userActivities.length;
      const totalJoined = userActivities.reduce((sum, a) => sum + (a.joined || 0), 0);

      let avgRate = '0.0';
      if (totalCreated > 0) {
        const totalRate = userActivities.reduce((sum, a) => {
          return sum + (a.total > 0 ? ((a.joined || 0) / a.total) * 100 : 0);
        }, 0);
        avgRate = (totalRate / totalCreated).toFixed(1);
      }

      console.log('📊 [created-detail] 统计数据:', { totalCreated, totalJoined, avgRate });

      this.setData({
        activities: userActivities,  // 保存活动列表供图表使用
        totalCreated,
        totalJoined,
        avgRate
      });

      wx.hideLoading();
    } catch (err) {
      console.error('加载统计数据失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 初始化饼图 - 活动类型分布
   */
  initPieChart() {
    console.log('🥧 [created-detail] 初始化饼图');

    // 从页面数据中获取活动列表
    const userActivities = this.data.activities;

    console.log('📋 [饼图] 找到创建的活动:', userActivities.length, '个');

    // 统计活动类型分布
    const typeCount = {};
    userActivities.forEach(activity => {
      const type = activity.type;
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    console.log('📊 [饼图] 类型统计:', typeCount);

    // 转换为 wx-charts 数据格式
    const series = Object.keys(typeCount).map((type, index) => ({
      name: type,
      data: typeCount[type],
      color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][index % 5]
    }));

    console.log('📊 [饼图] 图表数据:', series);

    // 如果没有数据，不初始化图表
    if (series.length === 0) {
      console.log('📊 [饼图] 无数据，跳过初始化');
      return;
    }

    pieChart = new wxCharts({
      canvasId: 'pie-canvas',
      type: 'pie',
      series: series,
      width: this.data.canvasWidth,
      height: this.data.canvasHeight,
      dataLabel: true,
      legend: true,
      animation: true,
      // 少量数据时增加饼图半径，使其更加明显
      radius: series.length <= 2 ? '65%' : '60%'
    });
  },

  /**
   * 初始化柱状图 - 每月创建活动趋势（智能动态范围）
   */
  initBarChart() {
    console.log('📊 [created-detail] 初始化柱状图（智能动态范围）');

    // 从页面数据中获取活动列表
    const userActivities = this.data.activities;

    console.log('📋 [柱状图] 找到创建的活动:', userActivities.length, '个');

    // 如果没有数据，跳过初始化
    if (userActivities.length === 0) {
      console.log('📊 [柱状图] 无数据，跳过初始化');
      return;
    }

    // 统计最近6个月的数据
    const now = new Date();
    const recentMonthData = {};
    const recentMonthLabels = [];

    // 生成最近6个月的标签
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const label = `${month}月`;
      recentMonthLabels.push(label);
      recentMonthData[label] = 0;
    }

    console.log('📅 [柱状图] 最近6个月标签:', recentMonthLabels);

    // 统计最近6个月的数据
    let hasDataInRecentMonths = false;
    userActivities.forEach(activity => {
      const createDate = parseDate(activity.createdAt);
      const month = createDate.getMonth() + 1;
      const label = `${month}月`;
      if (recentMonthData.hasOwnProperty(label)) {
        recentMonthData[label]++;
        hasDataInRecentMonths = true;
      }
    });

    console.log('📊 [柱状图] 最近6个月数据:', recentMonthData, '是否有数据:', hasDataInRecentMonths);

    // 决定使用哪个时间范围
    let finalLabels, finalData;

    if (hasDataInRecentMonths) {
      // 有最近6个月的数据，使用最近6个月
      finalLabels = recentMonthLabels;
      finalData = recentMonthLabels.map(label => recentMonthData[label]);
      console.log('✅ [柱状图] 使用最近6个月数据');
    } else {
      // 没有最近6个月的数据，使用数据实际所在的月份
      console.log('⚠️ [柱状图] 最近6个月无数据，切换到数据实际月份');

      // 提取所有活动的创建月份
      const allMonths = userActivities.map(activity => {
        const createDate = parseDate(activity.createdAt);
        return {
          year: createDate.getFullYear(),
          month: createDate.getMonth() + 1,
          timestamp: createDate.getTime()
        };
      });

      // 按时间排序并去重
      const uniqueMonths = Array.from(new Map(
        allMonths.map(m => [`${m.year}-${m.month}`, m])
      ).values()).sort((a, b) => a.timestamp - b.timestamp);

      console.log('📅 [柱状图] 数据实际月份:', uniqueMonths);

      // 取最后6个月（或全部，如果不足6个月）
      const displayMonths = uniqueMonths.slice(-6);
      finalLabels = displayMonths.map(m => `${m.month}月`);

      // 统计这些月份的数据
      const dataMonthData = {};
      finalLabels.forEach(label => dataMonthData[label] = 0);

      userActivities.forEach(activity => {
        const createDate = parseDate(activity.createdAt);
        const month = createDate.getMonth() + 1;
        const label = `${month}月`;
        if (dataMonthData.hasOwnProperty(label)) {
          dataMonthData[label]++;
        }
      });

      finalData = finalLabels.map(label => dataMonthData[label]);
      console.log('✅ [柱状图] 使用数据实际月份:', finalLabels, finalData);
    }

    console.log('📊 [柱状图] 最终图表数据:', { labels: finalLabels, data: finalData });

    // 计算Y轴最大值，向上取整到合适的刻度
    const maxValue = Math.max.apply(null, finalData.concat([1]));
    // 对于少量数据，设置更合理的Y轴范围
    let yMax;
    if (maxValue <= 3) {
      yMax = 5; // 数据很少时，固定显示0-5，使图表更美观
    } else {
      yMax = Math.ceil(maxValue * 1.2); // 留出20%空间
    }
    const splitNumber = Math.min(yMax, 5); // 最多5个刻度，避免过于密集

    // 根据数据量调整柱状图宽度
    const columnWidth = this.data.totalCreated <= 5 ? 30 : 20;

    barChart = new wxCharts({
      canvasId: 'bar-canvas',
      type: 'column',
      categories: finalLabels,
      series: [{
        name: '创建活动数',
        data: finalData,
        color: '#10b981'
      }],
      width: this.data.canvasWidth,
      height: this.data.canvasHeight,
      yAxis: {
        format: function(val) {
          return Math.round(val); // 使用 Math.round 确保显示整数
        },
        min: 0,
        max: yMax,
        splitNumber: splitNumber,
        gridType: 'dash'
      },
      xAxis: {
        disableGrid: false
      },
      dataLabel: false,
      legend: false,
      animation: true,
      extra: {
        column: {
          width: columnWidth
        }
      }
    });

    console.log('✅ [柱状图] 初始化完成');
  }
});

