// pages/my-activities/index.js
const { activities } = require('../../utils/mock.js');
const { isBeforeRegisterDeadline } = require('../../utils/datetime.js');

const dataset = [
  // 我创建的 - 进行中
  Object.assign({}, activities[0], {
    displayId: 'm1', // 用于页面显示的ID
    // 保留原始的 id 字段，用于跳转
    role: '我创建的',
    status: '进行中',
    actions: [
      { label: '管理', action: 'manage', type: 'primary' },
      { label: '详情', action: 'detail', type: 'secondary' }
    ]
  }),
  // 我创建的 - 即将开始
  Object.assign({}, activities[1], {
    displayId: 'm2',
    role: '我创建的',
    status: '即将开始',
    actions: [
      { label: '编辑', action: 'edit', type: 'primary' },
      { label: '详情', action: 'detail', type: 'secondary' }
    ]
  }),
  // 我创建的 - 已结束
  Object.assign({}, activities[2], {
    displayId: 'm5',
    role: '我创建的',
    status: '已结束',
    actions: [
      { label: '查看统计', action: 'stats', type: 'primary' },
      { label: '详情', action: 'detail', type: 'secondary' }
    ]
  }),
  // 我参加的 - 即将开始
  Object.assign({}, activities[1], {
    displayId: 'm6',
    role: '我参加的',
    status: '即将开始',
    actions: [
      { label: '详情', action: 'detail', type: 'primary' },
      { label: '取消报名', action: 'cancelRegistration', type: 'danger' }
    ]
  }),
  // 我参加的 - 进行中
  Object.assign({}, activities[2], {
    displayId: 'm3',
    role: '我参加的',
    status: '进行中',
    actions: [
      { label: '签到', action: 'checkin', type: 'primary' },
      { label: '详情', action: 'detail', type: 'secondary' }
    ]
  }),
  // 我参加的 - 已结束
  Object.assign({}, activities[0], {
    displayId: 'm4',
    role: '我参加的',
    status: '已结束',
    banner: 'purple',
    actions: [
      { label: '评价', action: 'review', type: 'primary' },
      { label: '详情', action: 'detail', type: 'secondary' }
    ]
  })
];

const filters = [
  { key: 'all', name: '全部', active: true },
  { key: 'created', name: '我创建的', active: false },
  { key: 'joined', name: '我参加的', active: false },
  { key: 'ended', name: '已结束', active: false }
];

Page({
  data: {
    filters,
    activeFilter: 'all',
    list: dataset,
    display: dataset,
    // 评价弹窗相关
    showReviewModal: false,
    currentActivityId: '',
    currentActivityTitle: '',
    rating: 0,
    reviewText: '',
    hoverRating: 0
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
      if (key === 'created') return item.role === '我创建的';
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
      case 'stats':
        // 跳转到统计页面
        wx.navigateTo({ url: '/pages/statistics/index' });
        break;
      case 'manage':
        // 跳转到活动详情页（管理功能在详情页中）
        // 未来可以创建专门的管理页面
        wx.navigateTo({ url: `/pages/activities/detail?id=${id}&mode=manage` });
        break;
      case 'edit':
        // 跳转到编辑页面（创建页面可复用为编辑页面）
        wx.navigateTo({ url: `/pages/activities/create?id=${id}` });
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
      default:
        wx.showToast({ title: '功能开发中', icon: 'none' });
    }
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