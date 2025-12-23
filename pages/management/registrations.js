// pages/management/registrations.js
const { activityAPI, registrationAPI, blacklistAPI } = require('../../utils/api.js');
const {
  checkManagementPermission
} = require('../../utils/activity-management-helper.js');
const { fixImageUrl } = require('../../utils/formatter.js');
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
    removeReason: '',
    // 系统信息
    statusBarHeight: 0,
    navBarHeight: 0
  },

  onLoad(query) {
    // 获取状态栏高度
    const statusBarHeight = app.globalData.statusBarHeight || 0;
    const navBarHeight = statusBarHeight + 44;
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
  async loadData() {
    try {
      wx.showLoading({ title: '加载中...' });

      const { activityId } = this.data;
      const currentUserId = app.globalData.currentUserId || 'u1';

      // 从后端API获取活动详情
      const detailResult = await activityAPI.getDetail(activityId);

      if (detailResult.code !== 0) {
        throw new Error(detailResult.message || '获取活动详情失败');
      }

      const activity = detailResult.data;

      if (!activity) {
        wx.hideLoading();
        wx.showToast({ title: '活动不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
        return;
      }

      // 检查管理权限
      const permission = checkManagementPermission(activity, currentUserId);

      if (!permission.hasPermission) {
        wx.hideLoading();
        wx.showModal({
          title: '无权限',
          content: '您不是此活动的创建者或管理员',
          showCancel: false,
          success: () => wx.navigateBack()
        });
        return;
      }

      // 获取该活动的所有报名记录
      const registrationsResult = await registrationAPI.getByActivity(activityId, {
        page: 0,
        size: 1000
      });

      const activityRegs = registrationsResult.code === 0
        ? (registrationsResult.data.content || registrationsResult.data || [])
        : [];

      // 处理报名记录，添加显示所需的字段
      const allRegistrations = activityRegs.map(reg => ({
        ...reg,
        userName: reg.name,
        userAvatar: fixImageUrl(reg.avatar || ''),
        statusText: this.getStatusText(reg.status),
        statusColor: this.getStatusColor(reg.status),
        registeredAt: reg.createdAt || '未知时间'
      }));

      this.setData({
        activity,
        allRegistrations,
        displayRegistrations: allRegistrations
      });

      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('加载报名数据失败:', err);
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none',
        duration: 2000
      });
      setTimeout(() => wx.navigateBack(), 2000);
    }
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
    const { id, userId, name, mobile } = e.currentTarget.dataset;

    this.setData({
      showRemoveDialog: true,
      removeTarget: { id, userId, name, mobile },
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
  async confirmRemove() {
    const { removeTarget, addToBlacklist, removeReason, activityId } = this.data;

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

    try {
      wx.showLoading({ title: '处理中...' });

      // 1. 先移除报名记录
      const removeResult = await registrationAPI.remove(removeTarget.id);

      if (removeResult.code !== 0) {
        throw new Error(removeResult.message || '移除报名失败');
      }

      // 2. 如果选择加入黑名单，添加到黑名单
      if (addToBlacklist && removeTarget.mobile) {
        const blacklistResult = await blacklistAPI.addBatch(activityId, {
          phones: [removeTarget.mobile],
          reason: removeReason.trim() || '从报名管理移除',
          expiryDays: null  // 永久
        });

        if (blacklistResult.code !== 0) {
          console.error('添加黑名单失败:', blacklistResult.message);
          // 不中断流程，仅记录错误
        }
      }

      wx.hideLoading();

      let message = '已移除报名';
      if (addToBlacklist) {
        message += '并加入黑名单';
      }

      wx.showToast({
        title: message,
        icon: 'success',
        duration: 2000
      });

      this.closeRemoveDialog();
      setTimeout(() => {
        this.loadData();
      }, 800);
    } catch (err) {
      wx.hideLoading();
      console.error('移除报名失败:', err);
      wx.showToast({
        title: err.message || '操作失败，请重试',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 审核通过
  approveRegistration(e) {
    const { id, name } = e.currentTarget.dataset;

    wx.showModal({
      title: '通过审核',
      content: `确定通过"${name}"的报名申请吗？`,
      confirmText: '确定通过',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中...' });

            // 调用后端API审核通过
            const result = await registrationAPI.approve(id, {
              approved: true,  // 后端要求布尔值
              note: ''         // 可选备注
            });

            wx.hideLoading();

            if (result.code === 0) {
              wx.showToast({ title: '已通过', icon: 'success', duration: 2000 });

              setTimeout(() => {
                this.loadData();
              }, 800);
            } else {
              wx.showToast({
                title: result.message || '审核失败',
                icon: 'none',
                duration: 2000
              });
            }
          } catch (err) {
            wx.hideLoading();
            console.error('审核通过失败:', err);
            wx.showToast({
              title: '操作失败，请重试',
              icon: 'none',
              duration: 2000
            });
          }
        }
      }
    });
  },

  // 审核拒绝
  rejectRegistration(e) {
    const { id, name } = e.currentTarget.dataset;

    wx.showModal({
      title: '拒绝审核',
      content: `确定拒绝"${name}"的报名申请吗？`,
      confirmText: '确定拒绝',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中...' });

            // 调用后端API审核拒绝
            const result = await registrationAPI.approve(id, {
              approved: false,  // 后端要求布尔值，false表示拒绝
              note: ''          // 可选备注
            });

            wx.hideLoading();

            if (result.code === 0) {
              wx.showToast({ title: '已拒绝', icon: 'success', duration: 2000 });

              setTimeout(() => {
                this.loadData();
              }, 800);
            } else {
              wx.showToast({
                title: result.message || '审核失败',
                icon: 'none',
                duration: 2000
              });
            }
          } catch (err) {
            wx.hideLoading();
            console.error('审核拒绝失败:', err);
            wx.showToast({
              title: '操作失败，请重试',
              icon: 'none',
              duration: 2000
            });
          }
        }
      }
    });
  },

  // 返回
  goBack() {
    const pages = getCurrentPages();

    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      // 没有上一页，跳转到活动列表
      wx.switchTab({ url: '/pages/activities/list' });
    }
  }
});
