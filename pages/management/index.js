// pages/management/index.js
const { activities, participants, registrations } = require('../../utils/mock.js');
const { checkManagementPermission, getAdministratorsWithDetails } = require('../../utils/activity-management-helper.js');
const app = getApp();

Page({
  data: {
    activityId: '',
    activity: null,
    hasPermission: false,
    role: '', // 'creator' 或 'admin'
    administrators: [],
    loading: true,
    // 系统信息
    statusBarHeight: 0,
    navBarHeight: 0,
    scrollHeight: 0,

    // 功能菜单
    menuItems: [
      {
        id: 'edit',
        icon: '✏️',
        title: '编辑活动',
        desc: '修改活动基本信息',
        path: '/pages/activities/create'
      },
      {
        id: 'administrators',
        icon: '👥',
        title: '管理员管理',
        desc: '添加或移除活动管理员',
        path: '/pages/management/administrators',
        creatorOnly: true // 仅创建者可见
      },
      {
        id: 'registrations',
        icon: '📋',
        title: '报名管理',
        desc: '查看和管理报名用户',
        path: '/pages/management/registrations'
      },
      {
        id: 'whitelist',
        icon: '✅',
        title: '白名单管理',
        desc: '设置自动通过审核的用户',
        path: '/pages/management/whitelist'
      },
      {
        id: 'blacklist',
        icon: '🚫',
        title: '黑名单管理',
        desc: '禁止特定用户报名',
        path: '/pages/management/blacklist'
      }
    ]
  },

  onLoad(query) {
    // ========== 【重要】登录前置检查 ==========
    // 管理活动需要登录，避免用户进入页面后才发现无权限
    const token = wx.getStorageSync('token');
    if (!token || token.trim().length === 0) {
      console.warn('用户未登录，无法管理活动');
      wx.showModal({
        title: '需要登录',
        content: '管理活动需要登录，请先登录后再试',
        confirmText: '去登录',
        cancelText: '返回',
        success: (res) => {
          if (res.confirm) {
            wx.showToast({
              title: '请退出小程序重新进入',
              icon: 'none',
              duration: 3000
            });
            setTimeout(() => {
              wx.navigateBack();
            }, 3000);
          } else {
            wx.navigateBack();
          }
        },
        fail: () => {
          wx.navigateBack();
        }
      });
      return; // 中止页面加载
    }
    // ========== 登录检查结束 ==========

    // 获取状态栏高度和系统信息
    const statusBarHeight = app.globalData.statusBarHeight || 0;
    const navBarHeight = statusBarHeight + 44;

    // 计算滚动区域高度 = 窗口高度 - 导航栏高度
    const systemInfo = wx.getSystemInfoSync();
    const scrollHeight = systemInfo.windowHeight - navBarHeight;

    this.setData({
      statusBarHeight,
      navBarHeight,
      scrollHeight
    });

    const activityId = query.id;
    if (!activityId) {
      wx.showToast({ title: '活动ID不能为空', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    this.setData({ activityId });
    this.loadActivityData();
  },

  // 加载活动数据
  loadActivityData() {
    wx.showLoading({ title: '加载中...' });

    const { activityId } = this.data;
    const currentUserId = app.globalData.currentUserId || 'u1';

    // 查找活动
    const activity = activities.find(a => a.id === activityId);

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
        title: '无管理权限',
        content: '您不是此活动的创建者或管理员，无法访问管理页面。',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
      return;
    }

    // 获取管理员详情
    const administrators = getAdministratorsWithDetails(activity, participants);

    // 统计数据
    const totalRegistrations = registrations.filter(r => r.activityId === activityId).length;
    const approvedCount = registrations.filter(r => r.activityId === activityId && r.status === 'approved').length;
    const pendingCount = registrations.filter(r => r.activityId === activityId && r.status === 'pending').length;

    this.setData({
      activity,
      hasPermission: true,
      role: permission.role,
      administrators,
      totalRegistrations,
      approvedCount,
      pendingCount,
      loading: false
    });

    wx.hideLoading();
  },

  // 菜单项点击
  onMenuItemTap(e) {
    const { id, path, creatorOnly } = e.currentTarget.dataset;
    const { activityId, role } = this.data;

    // 检查是否仅创建者可访问
    if (creatorOnly && role !== 'creator') {
      wx.showToast({ title: '仅创建者可访问此功能', icon: 'none' });
      return;
    }

    // 跳转到对应页面
    let url = `${path}?id=${activityId}`;

    // 编辑活动需要额外参数
    if (id === 'edit') {
      url += '&mode=edit';
    }

    wx.navigateTo({ url });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
});
