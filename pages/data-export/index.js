const { activityAPI } = require('../../utils/api.js');

Page({
  data: {
    exportStartDate: '',
    exportEndDate: '',
    exporting: false
  },

  onLoad() {
    const app = getApp();
    if (!app.checkLoginStatus()) {
      wx.showModal({
        title: '需要登录',
        content: '数据导出需要登录后才能使用，是否前往登录？',
        confirmText: '去登录',
        cancelText: '返回',
        confirmColor: '#0f766e',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/auth/login' });
          } else {
            wx.navigateBack();
          }
        }
      });
    }
  },

  onStartDateChange(e) {
    this.setData({ exportStartDate: e.detail.value || '' });
  },

  onEndDateChange(e) {
    this.setData({ exportEndDate: e.detail.value || '' });
  },

  clearDateRange() {
    this.setData({ exportStartDate: '', exportEndDate: '' });
  },

  async exportExcel() {
    if (this.data.exporting) return;

    const app = getApp();
    if (!app.checkLoginStatus()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const { exportStartDate, exportEndDate } = this.data;
    if (exportStartDate && exportEndDate && exportStartDate > exportEndDate) {
      wx.showToast({ title: '开始日期不能晚于结束日期', icon: 'none' });
      return;
    }

    const dateConfirmed = await this.confirmDateDefaults(exportStartDate, exportEndDate);
    if (!dateConfirmed) return;

    this.setData({ exporting: true });
    wx.showLoading({ title: '统计数据中...' });

    try {
      const summaryResult = await activityAPI.getExportSummary({
        startDate: exportStartDate,
        endDate: exportEndDate
      });
      if (!summaryResult || summaryResult.code !== 0) {
        throw new Error(summaryResult?.message || '获取导出概览失败');
      }

      const summary = summaryResult.data || {};
      wx.hideLoading();

      if (!summary.activityCount) {
        wx.showModal({
          title: '暂无可导出数据',
          content: '当前日期范围内没有符合条件的活动。',
          showCancel: false,
          confirmColor: '#0f766e'
        });
        return;
      }

      const exportConfirmed = await this.confirmExportSummary(summary);
      if (!exportConfirmed) return;

      wx.showLoading({ title: '生成文件中...' });
      const tempFilePath = await activityAPI.exportActivities({
        startDate: exportStartDate,
        endDate: exportEndDate
      });

      wx.hideLoading();
      await new Promise((resolve, reject) => {
        wx.openDocument({
          filePath: tempFilePath,
          fileType: 'xlsx',
          showMenu: true,
          success: resolve,
          fail: reject
        });
      });
    } catch (err) {
      wx.hideLoading();
      console.error('导出数据失败:', err);
      wx.showToast({ title: err.message || '导出失败', icon: 'none' });
    } finally {
      this.setData({ exporting: false });
    }
  },

  confirmDateDefaults(startDate, endDate) {
    if (startDate && endDate) {
      return Promise.resolve(true);
    }

    const content = !startDate && !endDate
      ? '开始日期和结束日期均未填写，将按照所有活动导出。是否继续？'
      : '未填写开始日期时，将默认从最早的活动创建日期开始导出。\n未填写结束日期时，将默认导出至当前日期。\n是否继续？';

    return new Promise((resolve) => {
      wx.showModal({
        title: '日期范围提示',
        content,
        confirmText: '继续',
        cancelText: '返回修改',
        confirmColor: '#0f766e',
        success: (res) => resolve(!!res.confirm),
        fail: () => resolve(false)
      });
    });
  },

  confirmExportSummary(summary) {
    const content = [
      `导出范围：${summary.rangeText || '全部活动'}`,
      `活动数量：${summary.activityCount || 0} 场`,
      `报名记录数：${summary.registrationCount || 0} 条`,
      '',
      '确认导出 Excel 文件？'
    ].join('\n');

    return new Promise((resolve) => {
      wx.showModal({
        title: '确认导出',
        content,
        confirmText: '确认导出',
        cancelText: '取消',
        confirmColor: '#0f766e',
        success: (res) => resolve(!!res.confirm),
        fail: () => resolve(false)
      });
    });
  }
});
