// pages/activities/copy-activity.js
const { activities } = require('../../utils/mock.js');
const app = getApp();

Page({
  data: {
    activities: [], // 所有可复制的活动和草稿
    activitiesFiltered: [], // 筛选后的列表
    selectedActivityId: '', // 选中的活动/草稿ID
    filterKeyword: '', // 筛选关键词
    filterType: 'title' // 筛选类型：'title', 'id', 'time'
  },

  onLoad(options) {
    this.loadActivities();
  },

  // 加载活动和草稿列表
  loadActivities() {
    const currentUserId = app.globalData.currentUserId || 'u1';

    // 获取草稿列表
    const drafts = wx.getStorageSync('activity_drafts') || [];
    const draftList = drafts.map(draft => ({
      id: draft.draftId,
      title: draft.form.title,
      type: draft.form.type || '未分类',
      time: draft.form.startDate || '待设置',
      activityId: draft.draftId,
      isDraft: true
    }));

    // 获取用户创建的活动
    const createdActivities = activities.filter(a => !a.isDeleted && a.organizerId === currentUserId);
    const activityList = createdActivities.map(a => ({
      id: a.id,
      title: a.title,
      type: a.type,
      time: a.startTime.split(' ')[0],
      activityId: a.id,
      isDraft: false
    }));

    // 合并列表（草稿在前）
    const allItems = [...draftList, ...activityList];

    this.setData({
      activities: allItems,
      activitiesFiltered: allItems
    });
  },

  // 选择活动/草稿
  selectActivity(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ selectedActivityId: id });
  },

  // 切换筛选类型
  selectFilterType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ filterType: type });
    this.filterActivities();
  },

  // 筛选关键词输入
  onFilterInput(e) {
    const keyword = e.detail.value;
    this.setData({ filterKeyword: keyword });
    this.filterActivities();
  },

  // 清空筛选
  clearFilter() {
    this.setData({
      filterKeyword: '',
      activitiesFiltered: this.data.activities
    });
  },

  // 执行筛选
  filterActivities() {
    const { activities, filterKeyword, filterType } = this.data;

    if (!filterKeyword || !filterKeyword.trim()) {
      // 无关键词时，显示所有项
      this.setData({ activitiesFiltered: activities });
      return;
    }

    const keyword = filterKeyword.toLowerCase().trim();
    const filtered = activities.filter(item => {
      if (filterType === 'title') {
        return item.title.toLowerCase().includes(keyword);
      } else if (filterType === 'id') {
        return item.activityId.toLowerCase().includes(keyword);
      } else if (filterType === 'time') {
        return item.time.includes(keyword);
      }
      return false;
    });

    this.setData({ activitiesFiltered: filtered });
  },

  // 确认复制
  confirmCopy() {
    const { selectedActivityId } = this.data;

    if (!selectedActivityId) {
      wx.showToast({ title: '请选择要复制的活动', icon: 'none' });
      return;
    }

    // 返回上一页，并传递选中的ID
    const pages = getCurrentPages();
    if (pages.length > 1) {
      const prevPage = pages[pages.length - 2];
      // 调用上一页的方法来加载数据
      if (prevPage.loadCopiedActivity) {
        prevPage.loadCopiedActivity(selectedActivityId);
      }
      wx.navigateBack();
    }
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
});
