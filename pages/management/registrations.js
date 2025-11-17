// pages/management/registrations.js
const { activityAPI, registrationAPI } = require('../../utils/api.js');
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
        userAvatar: reg.avatar || '/activityassistant_avatar_01.png',
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
    const { removeTarget, addToBlacklist, removeReason, activityId, activity } = this.data;
    const currentUserId = app.globalData.currentUserId || 'u1';

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

    // 模拟API调用 - 实际修改mock数据
    setTimeout(() => {
      // 从 registrations 数组中移除该报名记录
      const regIndex = registrations.findIndex(
        r => r.activityId === activityId && r.userId === removeTarget.userId
      );

      if (regIndex > -1) {
        registrations.splice(regIndex, 1);
      }

      // 如果选择加入黑名单，添加到活动的黑名单
      if (addToBlacklist && activity) {
        if (!activity.blacklist) {
          activity.blacklist = [];
        }

        // 检查是否已在黑名单
        const existsInBlacklist = activity.blacklist.some(
          b => b.userId === removeTarget.userId || b.phone === removeTarget.mobile
        );

        if (!existsInBlacklist) {
          const now = new Date();
          const addedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          activity.blacklist.push({
            phone: removeTarget.mobile,
            userId: removeTarget.userId,
            expiresAt: null, // 永久
            isActive: true,
            reason: removeReason.trim() || '从报名管理移除',
            addedAt: addedAt,
            addedBy: currentUserId
          });
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
    }, 800);
  },

  // 审核通过
  approveRegistration(e) {
    const { userId, name } = e.currentTarget.dataset;
    const { activityId } = this.data;

    wx.showModal({
      title: '通过审核',
      content: `确定通过"${name}"的报名申请吗？`,
      confirmText: '确定通过',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });

          // 模拟API调用 - 实际修改mock数据
          setTimeout(() => {
            // 找到对应的报名记录并修改状态
            const reg = registrations.find(
              r => r.activityId === activityId && r.userId === userId
            );

            if (reg) {
              reg.status = 'approved';
              const now = new Date();
              reg.approvedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            }

            wx.hideLoading();
            wx.showToast({ title: '已通过', icon: 'success', duration: 2000 });

            setTimeout(() => {
              this.loadData();
            }, 800);
          }, 800);
        }
      }
    });
  },

  // 审核拒绝
  rejectRegistration(e) {
    const { userId, name } = e.currentTarget.dataset;
    const { activityId } = this.data;

    wx.showModal({
      title: '拒绝审核',
      content: `确定拒绝"${name}"的报名申请吗？`,
      confirmText: '确定拒绝',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });

          // 模拟API调用 - 实际修改mock数据
          setTimeout(() => {
            // 找到对应的报名记录并修改状态
            const reg = registrations.find(
              r => r.activityId === activityId && r.userId === userId
            );

            if (reg) {
              reg.status = 'rejected';
              const now = new Date();
              reg.rejectedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            }

            wx.hideLoading();
            wx.showToast({ title: '已拒绝', icon: 'success', duration: 2000 });

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
