// pages/management/index.js
const { activityAPI, registrationAPI } = require('../../utils/api.js');
const { checkManagementPermission } = require('../../utils/activity-management-helper.js');
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
  async loadActivityData() {
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

      // 【调试】打印权限检查相关信息
      console.log('========== 管理权限检查 ==========');
      console.log('活动ID:', activityId);
      console.log('活动标题:', activity.title);
      console.log('活动创建者ID (organizerId):', activity.organizerId);
      console.log('当前用户ID (currentUserId):', currentUserId);
      console.log('活动对象:', activity);
      console.log('==================================');

      // 检查管理权限
      const permission = checkManagementPermission(activity, currentUserId);

      console.log('权限检查结果:', permission);

      if (!permission.hasPermission) {
        wx.hideLoading();
        console.error('权限检查失败！');
        console.error('  - 活动创建者:', activity.organizerId);
        console.error('  - 当前用户:', currentUserId);
        console.error('  - 是否相等:', activity.organizerId === currentUserId);
        console.error('  - organizerId类型:', typeof activity.organizerId);
        console.error('  - currentUserId类型:', typeof currentUserId);

        wx.showModal({
          title: '无管理权限',
          content: `您不是此活动的创建者或管理员，无法访问管理页面。\n\n调试信息：\n创建者ID: ${activity.organizerId}\n当前用户ID: ${currentUserId}`,
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
        return;
      }

      // 获取活动的报名记录
      const registrationsResult = await registrationAPI.getByActivity(activityId, {
        page: 0,
        size: 1000 // 获取所有报名记录
      });

      const allRegistrations = registrationsResult.code === 0
        ? (registrationsResult.data.content || registrationsResult.data || [])
        : [];

      // 统计数据
      const totalRegistrations = allRegistrations.length;
      const approvedCount = allRegistrations.filter(r => r.status === 'approved').length;
      const pendingCount = allRegistrations.filter(r => r.status === 'pending').length;

      // 获取管理员列表（如果有）
      const administrators = activity.administrators || [];

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
    } catch (err) {
      wx.hideLoading();
      console.error('加载活动数据失败:', err);
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none',
        duration: 2000
      });
      setTimeout(() => wx.navigateBack(), 2000);
    }
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
