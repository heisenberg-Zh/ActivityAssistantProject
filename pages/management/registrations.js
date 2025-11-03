// pages/management/registrations.js
const { activities, participants, registrations } = require('../../utils/mock.js');
const {
  checkManagementPermission
} = require('../../utils/activity-management-helper.js');
const app = getApp();

Page({
  data: {
    activityId: '',
    activity: null,
    allRegistrations: [],
    displayRegistrations: [],
    statusFilter: 'all', // 'all', 'pending', 'approved', 'rejected'
    showRemoveDialog: false,
    removeTarget: null,
    addToBlacklist: false,
    removeReason: ''
  },

  onLoad(query) {
    const activityId = query.id;
    if (!activityId) {
      wx.showToast({ title: '活动ID不能为空', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    this.setData({ activityId });
    this.loadData();
  },

  // 加载数据
  loadData() {
    const { activityId } = this.data;
    const currentUserId = app.globalData.currentUserId || 'u1';

    // 查找活动
    const activity = activities.find(a => a.id === activityId);

    if (!activity) {
      wx.showToast({ title: '活动不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    // 检查管理权限
    const permission = checkManagementPermission(activity, currentUserId);

    if (!permission.hasPermission) {
      wx.showModal({
        title: '无权限',
        content: '您不是此活动的创建者或管理员',
        showCancel: false,
        success: () => wx.navigateBack()
      });
      return;
    }

    // 获取该活动的所有报名记录
    const activityRegs = registrations.filter(r => r.activityId === activityId);

    // 补充用户信息
    const allRegistrations = activityRegs.map(reg => {
      const user = participants.find(p => p.id === reg.userId);
      return {
        ...reg,
        userName: reg.name,
        userAvatar: user?.avatar || '',
        statusText: this.getStatusText(reg.status),
        statusColor: this.getStatusColor(reg.status),
        registeredAt: reg.createdAt || '未知时间'
      };
    });

    this.setData({
      activity,
      allRegistrations,
      displayRegistrations: allRegistrations
    });
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'pending': '待审核',
      'approved': '已通过',
      'rejected': '已拒绝'
    };
    return statusMap[status] || '未知';
  },

  // 获取状态颜色类名
  getStatusColor(status) {
    const colorMap = {
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'danger'
    };
    return colorMap[status] || 'default';
  },

  // 切换状态筛选
  switchFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ statusFilter: filter });
    this.applyFilter(filter);
  },

  // 应用筛选
  applyFilter(filter) {
    const { allRegistrations } = this.data;

    let displayRegistrations = allRegistrations;

    if (filter !== 'all') {
      displayRegistrations = allRegistrations.filter(r => r.status === filter);
    }

    this.setData({ displayRegistrations });
  },

  // 显示移除对话框
  showRemoveDialog(e) {
    const { userId, name, mobile } = e.currentTarget.dataset;

    this.setData({
      showRemoveDialog: true,
      removeTarget: { userId, name, mobile },
      addToBlacklist: false,
      removeReason: ''
    });
  },

  // 关闭移除对话框
  closeRemoveDialog() {
    this.setData({
      showRemoveDialog: false,
      removeTarget: null,
      addToBlacklist: false,
      removeReason: ''
    });
  },

  // 切换"加入黑名单"选项
  toggleBlacklist(e) {
    this.setData({ addToBlacklist: e.detail.value });
  },

  // 输入移除原因
  onReasonInput(e) {
    this.setData({ removeReason: e.detail.value });
  },

  // 确认移除
  confirmRemove() {
    const { removeTarget, addToBlacklist, removeReason } = this.data;

    if (!removeTarget) return;

    // 如果选择加入黑名单，验证原因
    if (addToBlacklist) {
      if (!removeReason.trim()) {
        wx.showToast({ title: '请输入移除原因', icon: 'none' });
        return;
      }
      if (removeReason.trim().length < 2) {
        wx.showToast({ title: '原因至少2个字', icon: 'none' });
        return;
      }
    }

    wx.showLoading({ title: '处理中...' });

    // 模拟API调用
    setTimeout(() => {
      wx.hideLoading();

      let message = '已移除报名';
      if (addToBlacklist) {
        message += '并加入黑名单';
      }

      wx.showToast({
        title: message,
        icon: 'success'
      });

      this.closeRemoveDialog();
      setTimeout(() => {
        this.loadData();
      }, 1500);
    }, 1000);
  },

  // 审核通过
  approveRegistration(e) {
    const { userId, name } = e.currentTarget.dataset;

    wx.showModal({
      title: '通过审核',
      content: `确定通过"${name}"的报名申请吗？`,
      confirmText: '确定通过',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });

          // 模拟API调用
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '已通过', icon: 'success' });

            setTimeout(() => {
              this.loadData();
            }, 1500);
          }, 1000);
        }
      }
    });
  },

  // 审核拒绝
  rejectRegistration(e) {
    const { userId, name } = e.currentTarget.dataset;

    wx.showModal({
      title: '拒绝审核',
      content: `确定拒绝"${name}"的报名申请吗？`,
      confirmText: '确定拒绝',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });

          // 模拟API调用
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '已拒绝', icon: 'success' });

            setTimeout(() => {
              this.loadData();
            }, 1500);
          }, 1000);
        }
      }
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
});
