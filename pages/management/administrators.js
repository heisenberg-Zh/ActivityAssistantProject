// pages/management/administrators.js
const { activities, participants } = require('../../utils/mock.js');
const {
  isActivityCreator,
  getAdministratorsWithDetails,
  canAddAdministrator
} = require('../../utils/activity-management-helper.js');
const app = getApp();

Page({
  data: {
    activityId: '',
    activity: null,
    administrators: [],
    availableUsers: [], // 可添加的用户列表
    showAddDialog: false,
    selectedUserId: '',
    isCreator: false,
    // 系统信息
    statusBarHeight: 0,
    navBarHeight: 0
  },

  onLoad(query) {
    // 获取状态栏高度
    const statusBarHeight = app.globalData.statusBarHeight || 0;
    const navBarHeight = statusBarHeight + 44; // 导航栏总高度 = 状态栏高度 + 44px
    this.setData({
      statusBarHeight,
      navBarHeight
    });

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

    // 检查是否是创建者
    const isCreator = isActivityCreator(activity, currentUserId);

    if (!isCreator) {
      wx.showModal({
        title: '无权限',
        content: '只有活动创建者可以管理管理员',
        showCancel: false,
        success: () => wx.navigateBack()
      });
      return;
    }

    // 获取管理员列表
    const administrators = getAdministratorsWithDetails(activity, participants);

    // 获取可添加的用户列表（排除创建者和已有管理员）
    const adminUserIds = (activity.administrators || []).map(admin => admin.userId);
    const availableUsers = participants.filter(p => {
      return p.id !== activity.organizerId && !adminUserIds.includes(p.id);
    });

    this.setData({
      activity,
      isCreator,
      administrators,
      availableUsers
    });
  },

  // 显示添加管理员对话框
  showAddAdmin() {
    // 检查是否可以添加
    const { activity } = this.data;
    const checkResult = canAddAdministrator(activity);

    if (!checkResult.canAdd) {
      wx.showToast({ title: checkResult.reason, icon: 'none', duration: 2000 });
      return;
    }

    this.setData({ showAddDialog: true });
  },

  // 关闭添加对话框
  closeAddDialog() {
    this.setData({
      showAddDialog: false,
      selectedUserId: ''
    });
  },

  // 选择用户
  selectUser(e) {
    const userId = e.currentTarget.dataset.userId;
    this.setData({ selectedUserId: userId });
  },

  // 确认添加管理员
  confirmAddAdmin() {
    const { selectedUserId, activityId, activity, availableUsers } = this.data;

    if (!selectedUserId) {
      wx.showToast({ title: '请选择用户', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '添加中...' });

    // 模拟API调用
    setTimeout(() => {
      // 找到选中的用户
      const selectedUser = availableUsers.find(u => u.id === selectedUserId);

      if (!selectedUser) {
        wx.hideLoading();
        wx.showToast({ title: '用户不存在', icon: 'none' });
        return;
      }

      // 模拟后端添加管理员：更新activity的administrators数组
      if (!activity.administrators) {
        activity.administrators = [];
      }

      // 检查是否已经是管理员
      const isAlreadyAdmin = activity.administrators.some(admin => admin.userId === selectedUserId);

      if (!isAlreadyAdmin) {
        // 添加到管理员列表（实际应该调用API）
        const currentUserId = app.globalData.currentUserId || 'u1';
        const now = new Date();
        const addedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        activity.administrators.push({
          userId: selectedUserId,
          addedAt: addedAt,
          addedBy: currentUserId
        });
      }

      wx.hideLoading();
      wx.showToast({ title: '添加成功', icon: 'success' });

      // 关闭对话框并刷新数据
      this.closeAddDialog();

      // 立即刷新显示
      setTimeout(() => {
        this.loadData();
      }, 800);
    }, 800);
  },

  // 移除管理员
  removeAdmin(e) {
    const { userId, name } = e.currentTarget.dataset;
    const { activity } = this.data;

    wx.showModal({
      title: '移除管理员',
      content: `确定要移除"${name}"的管理员权限吗？`,
      confirmText: '确定移除',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '移除中...' });

          // 模拟API调用
          setTimeout(() => {
            // 从管理员列表中移除
            if (activity.administrators) {
              const index = activity.administrators.findIndex(admin => admin.userId === userId);
              if (index > -1) {
                activity.administrators.splice(index, 1);
              }
            }

            wx.hideLoading();
            wx.showToast({ title: '已移除', icon: 'success' });

            // 刷新数据
            setTimeout(() => {
              this.loadData();
            }, 800);
          }, 800);
        }
      }
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
});
