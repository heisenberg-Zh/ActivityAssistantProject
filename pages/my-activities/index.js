// pages/my-activities/index.js
const { activities, registrations } = require('../../utils/mock.js');
const { isBeforeRegisterDeadline } = require('../../utils/datetime.js');
const { getUserManagedActivities, checkManagementPermission } = require('../../utils/activity-management-helper.js');
const app = getApp();

const filters = [
  { key: 'all', name: '全部', active: true },
  { key: 'scheduled', name: '预发布', active: false },
  { key: 'drafts', name: '我的草稿', active: false },
  { key: 'created', name: '我创建的', active: false },
  { key: 'managed', name: '我管理的', active: false },
  { key: 'joined', name: '我参加的', active: false },
  { key: 'ended', name: '已结束', active: false }
];

Page({
  data: {
    filters,
    activeFilter: 'all',
    list: [],
    display: [],
    // 评价弹窗相关
    showReviewModal: false,
    currentActivityId: '',
    currentActivityTitle: '',
    rating: 0,
    reviewText: '',
    hoverRating: 0
  },

  onLoad() {
    this.loadActivities();
  },

  onShow() {
    this.loadActivities();
  },

  // 加载活动数据
  loadActivities() {
    const currentUserId = app.globalData.currentUserId || 'u1';

    // 获取草稿列表
    const drafts = wx.getStorageSync('activity_drafts') || [];
    const draftActivities = drafts.map(draft => ({
      id: draft.draftId,
      displayId: draft.draftId,
      title: draft.form.title,
      type: draft.form.type || '未分类',
      status: '草稿',
      role: '我的草稿',
      timeRange: draft.form.startDate ? `${draft.form.startDate} ${draft.form.startTime || ''}` : '待设置',
      place: draft.form.place || '待设置',
      joined: 0,
      total: draft.form.total || 0,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      actions: [
        { label: '继续编辑', action: 'editDraft', type: 'primary' },
        { label: '删除', action: 'deleteDraft', type: 'danger' }
      ]
    }));

    // 获取我创建的活动
    const createdActivities = activities
      .filter(a => !a.isDeleted && a.organizerId === currentUserId)
      .map(a => ({
        ...a,
        role: '我创建的',
        actions: this.getActionsForActivity(a, 'created')
      }));

    // 获取我管理的活动（不包括我创建的）
    const managedActivities = getUserManagedActivities(activities, currentUserId, {
      includeCreated: false,
      includeManaged: true
    }).map(a => ({
      ...a,
      role: '我管理的',
      actions: this.getActionsForActivity(a, 'managed')
    }));

    // 获取我参加的活动
    const myRegistrations = registrations.filter(
      r => r.userId === currentUserId && r.status === 'approved'
    );
    const joinedActivities = myRegistrations.map(reg => {
      const activity = activities.find(a => a.id === reg.activityId);
      if (!activity || activity.isDeleted) return null;
      return {
        ...activity,
        role: '我参加的',
        actions: this.getActionsForActivity(activity, 'joined')
      };
    }).filter(a => a !== null);

    // 合并所有活动（草稿放在最前面）
    const allActivities = [...draftActivities, ...createdActivities, ...managedActivities, ...joinedActivities];

    this.setData({
      list: allActivities,
      display: allActivities
    });

    // 应用当前筛选
    this.applyFilter(this.data.activeFilter);
  },

  // 根据活动和角色获取操作按钮
  getActionsForActivity(activity, role) {
    const actions = [];

    if (role === 'created') {
      // 我创建的活动
      if (activity.status === 'scheduled' || activity.status === '预发布') {
        // 预发布状态的活动
        actions.push({ label: '手动发布', action: 'publishNow', type: 'primary' });
        actions.push({ label: '编辑', action: 'edit', type: 'secondary' });
        actions.push({ label: '取消定时', action: 'cancelScheduled', type: 'danger' });
      } else if (activity.status === '进行中') {
        actions.push({ label: '管理', action: 'manage', type: 'primary' });
        actions.push({ label: '详情', action: 'detail', type: 'secondary' });
      } else if (activity.status === '即将开始') {
        actions.push({ label: '编辑', action: 'edit', type: 'primary' });
        actions.push({ label: '详情', action: 'detail', type: 'secondary' });
      } else {
        actions.push({ label: '查看统计', action: 'stats', type: 'primary' });
        actions.push({ label: '详情', action: 'detail', type: 'secondary' });
      }
      // 所有创建的活动都可以复制
      actions.push({ label: '复制', action: 'copy', type: 'secondary' });
    } else if (role === 'managed') {
      // 我管理的活动
      actions.push({ label: '管理', action: 'manage', type: 'primary' });
      actions.push({ label: '详情', action: 'detail', type: 'secondary' });
      // 管理的活动也可以复制
      actions.push({ label: '复制', action: 'copy', type: 'secondary' });
    } else if (role === 'joined') {
      // 我参加的活动
      if (activity.status === '进行中') {
        actions.push({ label: '签到', action: 'checkin', type: 'primary' });
        actions.push({ label: '详情', action: 'detail', type: 'secondary' });
      } else if (activity.status === '即将开始') {
        actions.push({ label: '详情', action: 'detail', type: 'primary' });
        actions.push({ label: '取消报名', action: 'cancelRegistration', type: 'danger' });
      } else {
        actions.push({ label: '评价', action: 'review', type: 'primary' });
        actions.push({ label: '详情', action: 'detail', type: 'secondary' });
      }
    }

    return actions;
  },

  onFilterTap(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeFilter) {
      return;
    }
    const updated = this.data.filters.map(item => Object.assign({}, item, { active: item.key === key }));
    this.setData({ filters: updated, activeFilter: key });
    this.applyFilter(key);
  },

  applyFilter(key) {
    const display = this.data.list.filter(item => {
      if (key === 'all') return true;
      if (key === 'scheduled') return item.status === 'scheduled' || item.status === '预发布';
      if (key === 'drafts') return item.role === '我的草稿';
      if (key === 'created') return item.role === '我创建的';
      if (key === 'managed') return item.role === '我管理的';
      if (key === 'joined') return item.role === '我参加的';
      if (key === 'ended') return item.status === '已结束';
      return true;
    });
    this.setData({ display });
  },

  handleAction(e) {
    const action = e.currentTarget.dataset.action;
    const id = e.currentTarget.dataset.id;

    switch (action) {
      case 'editDraft':
        // 继续编辑草稿
        this.editDraft(id);
        break;
      case 'deleteDraft':
        // 删除草稿
        this.deleteDraft(id);
        break;
      case 'stats':
        // 跳转到统计页面
        wx.navigateTo({ url: '/pages/statistics/index' });
        break;
      case 'manage':
        // 跳转到管理页面
        wx.navigateTo({ url: `/pages/management/index?id=${id}` });
        break;
      case 'edit':
        // 跳转到编辑页面
        wx.navigateTo({ url: `/pages/activities/create?mode=edit&id=${id}` });
        break;
      case 'copy':
        // 跳转到复制页面
        wx.navigateTo({ url: `/pages/activities/create?mode=copy&id=${id}` });
        break;
      case 'checkin':
        // 跳转到签到页面
        wx.navigateTo({ url: '/pages/checkin/index' });
        break;
      case 'cancelRegistration':
        // 取消报名
        this.cancelRegistration(id);
        break;
      case 'review':
        // 打开评价弹窗
        this.openReviewModal(id);
        break;
      case 'detail':
        // 跳转到活动详情页
        wx.navigateTo({ url: `/pages/activities/detail?id=${id}` });
        break;
      case 'publishNow':
        // 手动发布预发布活动
        this.publishScheduledActivity(id);
        break;
      case 'cancelScheduled':
        // 取消定时发布
        this.cancelScheduledPublish(id);
        break;
      default:
        wx.showToast({ title: '功能开发中', icon: 'none' });
    }
  },

  // 手动发布预发布活动
  publishScheduledActivity(activityId) {
    const scheduler = require('../../utils/scheduler.js');
    const notification = require('../../utils/notification.js');

    wx.showModal({
      title: '确认发布',
      content: '确定要立即发布这个活动吗？',
      confirmText: '发布',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '发布中...' });

          // 模拟发布过程（实际应调用后端API）
          setTimeout(() => {
            // 取消定时任务
            scheduler.cancelTask(activityId);

            // 发送发布成功通知
            const activity = activities.find(a => a.id === activityId);
            if (activity) {
              notification.sendPublishSuccessNotification(activityId, activity.title);
            }

            wx.hideLoading();
            wx.showToast({ title: '发布成功', icon: 'success' });

            // 刷新页面
            setTimeout(() => {
              this.loadActivities();
            }, 1500);
          }, 1000);
        }
      }
    });
  },

  // 取消定时发布
  cancelScheduledPublish(activityId) {
    const scheduler = require('../../utils/scheduler.js');

    wx.showModal({
      title: '取消定时发布',
      content: '确定要取消这个活动的定时发布吗？活动将变为草稿状态。',
      confirmText: '确定',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          // 取消定时任务
          const canceled = scheduler.cancelTask(activityId);

          if (canceled) {
            wx.showToast({ title: '已取消定时发布', icon: 'success' });

            // 刷新页面
            setTimeout(() => {
              this.loadActivities();
            }, 1500);
          } else {
            wx.showToast({ title: '取消失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 继续编辑草稿
  editDraft(draftId) {
    wx.navigateTo({ url: `/pages/activities/create?mode=draft&draftId=${draftId}` });
  },

  // 删除草稿
  deleteDraft(draftId) {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个草稿吗？',
      confirmText: '删除',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          try {
            // 获取草稿列表
            let drafts = wx.getStorageSync('activity_drafts') || [];
            // 删除指定草稿
            drafts = drafts.filter(d => d.draftId !== draftId);
            // 保存回本地存储
            wx.setStorageSync('activity_drafts', drafts);

            wx.showToast({ title: '已删除', icon: 'success' });

            // 重新加载活动列表
            setTimeout(() => {
              this.loadActivities();
            }, 500);
          } catch (err) {
            console.error('删除草稿失败:', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 取消报名
  cancelRegistration(id) {
    // 找到对应的活动（id 是原始活动ID）
    const activity = this.data.display.find(item => item.id === id);
    if (!activity) {
      wx.showToast({ title: '活动不存在', icon: 'none' });
      return;
    }

    console.log('取消报名的活动ID:', id, '活动信息:', activity);

    // 校验报名截止时间
    const deadlineCheck = isBeforeRegisterDeadline(activity.registerDeadline);
    if (!deadlineCheck.valid) {
      wx.showModal({
        title: '无法取消报名',
        content: deadlineCheck.message + '\n\n报名截止后不支持取消报名操作，如有问题请联系活动组织者。',
        showCancel: false,
        confirmText: '我知道了'
      });
      return;
    }

    wx.showModal({
      title: '确认取消报名',
      content: '确定要取消报名吗？取消后需要重新报名才能参加活动。',
      confirmText: '确认取消',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });

          try {
            // 这里应该调用API取消报名
            // await activityAPI.cancelRegistration({ activityId: id });

            // 模拟取消成功
            setTimeout(() => {
              wx.hideLoading();
              wx.showToast({ title: '已取消报名', icon: 'success' });

              // 刷新页面数据或移除该活动
              setTimeout(() => {
                // 可以选择刷新列表或跳转
                wx.switchTab({ url: '/pages/home/index' });
              }, 1500);
            }, 1000);
          } catch (err) {
            wx.hideLoading();
            console.error('取消报名失败:', err);
            wx.showToast({ title: '取消失败，请重试', icon: 'none' });
          }
        }
      }
    });
  },

  createActivity() {
    wx.navigateTo({ url: '/pages/activities/create' });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    }
  },

  // 打开评价弹窗
  openReviewModal(id) {
    const activity = this.data.display.find(item => item.id === id);
    if (!activity) return;

    this.setData({
      showReviewModal: true,
      currentActivityId: id,
      currentActivityTitle: activity.title,
      rating: 0,
      reviewText: '',
      hoverRating: 0
    });
  },

  // 关闭评价弹窗
  closeReviewModal() {
    this.setData({
      showReviewModal: false,
      currentActivityId: '',
      currentActivityTitle: '',
      rating: 0,
      reviewText: '',
      hoverRating: 0
    });
  },

  // 阻止弹窗内容区域的点击事件冒泡
  preventClose() {
    // 空函数，仅用于阻止事件冒泡
  },

  // 点击星星评分
  onStarTap(e) {
    const star = e.currentTarget.dataset.star;
    this.setData({ rating: star });
  },

  // 星星悬停效果（触摸开始）
  onStarTouchStart(e) {
    const star = e.currentTarget.dataset.star;
    this.setData({ hoverRating: star });
  },

  // 星星悬停效果（触摸结束）
  onStarTouchEnd() {
    this.setData({ hoverRating: 0 });
  },

  // 输入评价文字
  onReviewInput(e) {
    this.setData({ reviewText: e.detail.value });
  },

  // 提交评价
  submitReview() {
    const { rating, reviewText, currentActivityId, currentActivityTitle } = this.data;

    // 验证评分
    if (rating === 0) {
      wx.showToast({ title: '请先打分', icon: 'none' });
      return;
    }

    // 评价文字可选，但如果填写了需要至少5个字
    if (reviewText.trim() && reviewText.trim().length < 5) {
      wx.showToast({ title: '评价至少5个字', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交中...' });

    // 模拟提交评价
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '评价成功',
        icon: 'success',
        duration: 2000
      });

      // 关闭弹窗
      this.closeReviewModal();

      // 这里可以调用后端API保存评价
      console.log('提交评价:', {
        activityId: currentActivityId,
        activityTitle: currentActivityTitle,
        rating,
        review: reviewText.trim()
      });
    }, 1000);
  }
});