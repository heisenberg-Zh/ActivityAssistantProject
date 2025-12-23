// pages/management/index.js
const { activityAPI, registrationAPI, reviewAPI } = require('../../utils/api.js');
const { checkManagementPermission } = require('../../utils/activity-management-helper.js');
const { calculateActivityStatus } = require('../../utils/formatter.js');
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

    // 评价统计（仅已结束活动显示）
    reviewStatistics: null,  // { totalReviews, averageRating, ratingDistribution }

    // 人员列表弹窗
    showUserListModal: false,
    modalTitle: '',
    userList: [],
    userListType: '', // 'total', 'approved', 'pending', 'administrators'

    // 功能菜单
    menuItems: [
      {
        id: 'edit',
        icon: '✏️',
        title: '编辑活动',
        desc: '修改活动基本信息',
        path: '/pages/activities/create',
        availableWhen: ['进行中', '即将开始', '报名中'] // 已结束的活动不可编辑
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
        id: 'reviews',
        icon: '⭐',
        title: '评价管理',
        desc: '查看和管理活动评价',
        path: '/pages/management/reviews',
        availableWhen: ['已结束'] // 仅已结束的活动显示
      },
      {
        id: 'whitelist',
        icon: '✅',
        title: '白名单管理',
        desc: '设置自动通过审核的用户',
        path: '/pages/management/whitelist',
        availableWhen: ['进行中', '即将开始', '报名中'] // 已结束的活动不需要白名单
      },
      {
        id: 'blacklist',
        icon: '🚫',
        title: '黑名单管理',
        desc: '禁止特定用户报名',
        path: '/pages/management/blacklist',
        availableWhen: ['进行中', '即将开始', '报名中'] // 已结束的活动不需要黑名单
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
        confirmColor: '#3b82f6',
        success: (res) => {
          if (res.confirm) {
            // 直接跳转到登录页面
            wx.navigateTo({
              url: '/pages/auth/login'
            });
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
    const windowInfo = wx.getWindowInfo();
    const scrollHeight = windowInfo.windowHeight - navBarHeight;

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

      // 【修复】获取当前用户ID，避免使用默认值
      let currentUserId = app.globalData.currentUserId;

      // 【关键修复】如果 currentUserId 为空或为默认测试值，尝试从存储中读取
      if (!currentUserId || currentUserId === 'u1') {
        console.warn('⚠️ app.globalData.currentUserId 无效，尝试从存储读取');

        // 尝试从本地存储读取
        try {
          const { getSecureStorage } = require('../../utils/security.js');
          currentUserId = getSecureStorage('currentUserId');
          console.log('✅ 从存储读取到 currentUserId:', currentUserId);
        } catch (err) {
          currentUserId = wx.getStorageSync('currentUserId');
          console.log('✅ 从普通存储读取到 currentUserId:', currentUserId);
        }

        // 如果还是读取不到，检查 token 是否存在
        if (!currentUserId) {
          const token = wx.getStorageSync('token');
          if (!token) {
            wx.hideLoading();
            wx.showModal({
              title: '未登录',
              content: '请先登录后再管理活动',
              confirmText: '去登录',
              showCancel: false,
              success: () => {
                wx.navigateTo({ url: '/pages/auth/login' });
              }
            });
            return;
          }

          // 有 token 但没有 currentUserId，说明数据不一致
          console.error('❌ 数据异常：存在token但currentUserId为空');
          wx.hideLoading();
          wx.showModal({
            title: '数据异常',
            content: '登录信息不完整，请重新登录',
            confirmText: '去登录',
            showCancel: false,
            success: () => {
              // 清除异常数据
              app.clearUserInfo();
              wx.navigateTo({ url: '/pages/auth/login' });
            }
          });
          return;
        }

        // 更新全局数据
        app.globalData.currentUserId = currentUserId;
      }

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
      console.log('活动创建者ID (organizerId):', activity.organizerId, '类型:', typeof activity.organizerId);
      console.log('当前用户ID (currentUserId):', currentUserId, '类型:', typeof currentUserId);
      console.log('==================================');

      // 检查管理权限
      const permission = checkManagementPermission(activity, currentUserId);

      console.log('权限检查结果:', permission);

      if (!permission.hasPermission) {
        wx.hideLoading();
        console.error('========== 权限检查失败详情 ==========');
        console.error('活动创建者 (organizerId):', activity.organizerId);
        console.error('当前用户 (currentUserId):', currentUserId);
        console.error('organizerId 类型:', typeof activity.organizerId);
        console.error('currentUserId 类型:', typeof currentUserId);
        console.error('字符串比较结果:', String(activity.organizerId) === String(currentUserId));
        console.error('活动管理员列表:', activity.administrators);
        console.error('======================================');

        wx.showModal({
          title: '无管理权限',
          content: `您不是此活动的创建者或管理员，无法访问管理页面。\n\n调试信息：\n创建者ID: ${activity.organizerId} (${typeof activity.organizerId})\n当前用户ID: ${currentUserId} (${typeof currentUserId})`,
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

      // 【关键修复】动态计算活动状态
      const enrichedActivity = {
        ...activity,
        status: calculateActivityStatus(activity)  // 动态计算活动状态
      };

      // 如果活动已结束，加载评价统计数据
      let reviewStatistics = null;
      if (enrichedActivity.status === '已结束') {
        try {
          const reviewStatsResult = await reviewAPI.getStatistics(activityId);
          if (reviewStatsResult.code === 0) {
            reviewStatistics = reviewStatsResult.data;
            console.log('评价统计数据:', reviewStatistics);
          }
        } catch (reviewErr) {
          console.warn('获取评价统计失败:', reviewErr);
          // 不影响主流程，继续执行
        }
      }

      this.setData({
        activity: enrichedActivity,
        hasPermission: true,
        role: permission.role,
        administrators,
        totalRegistrations,
        approvedCount,
        pendingCount,
        reviewStatistics,
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
    const { id, path, creatorOnly, availableWhen } = e.currentTarget.dataset;
    const { activityId, role, activity } = this.data;

    // 检查是否仅创建者可访问
    if (creatorOnly && role !== 'creator') {
      wx.showToast({ title: '仅创建者可访问此功能', icon: 'none' });
      return;
    }

    // 检查活动状态限制
    if (availableWhen && !availableWhen.includes(activity.status)) {
      wx.showModal({
        title: '功能限制',
        content: `此功能仅在活动状态为"${availableWhen.join('、')}"时可用。\n\n当前活动状态：${activity.status}`,
        showCancel: false,
        confirmText: '我知道了'
      });
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
    const pages = getCurrentPages();

    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      // 没有上一页，跳转到活动列表
      wx.switchTab({ url: '/pages/activities/list' });
    }
  },

  // 打开人员列表弹窗
  async openUserListModal(e) {
    const type = e.currentTarget.dataset.type;
    const { activityId } = this.data;

    let title = '';
    let userList = [];

    try {
      wx.showLoading({ title: '加载中...' });

      // 获取报名记录
      const registrationsResult = await registrationAPI.getByActivity(activityId, {
        page: 0,
        size: 1000
      });

      const allRegistrations = registrationsResult.code === 0
        ? (registrationsResult.data.content || registrationsResult.data || [])
        : [];

      switch (type) {
        case 'total':
          title = '全部报名人员';
          userList = allRegistrations.map(r => ({
            id: r.userId,
            name: r.name || r.userId,
            status: r.status
          }));
          break;
        case 'approved':
          title = '已通过人员';
          userList = allRegistrations
            .filter(r => r.status === 'approved')
            .map(r => ({
              id: r.userId,
              name: r.name || r.userId,
              status: r.status
            }));
          break;
        case 'pending':
          title = '待审核人员';
          userList = allRegistrations
            .filter(r => r.status === 'pending')
            .map(r => ({
              id: r.userId,
              name: r.name || r.userId,
              status: r.status
            }));
          break;
        case 'administrators':
          title = '管理员列表';
          userList = this.data.administrators.map(admin => ({
            id: admin.userId,
            name: admin.name || admin.userId,
            role: admin.userId === this.data.activity.organizerId ? '创建者' : '管理员'
          }));
          break;
      }

      this.setData({
        showUserListModal: true,
        modalTitle: title,
        userList,
        userListType: type
      });

      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('加载人员列表失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 关闭人员列表弹窗
  closeUserListModal() {
    this.setData({
      showUserListModal: false,
      modalTitle: '',
      userList: [],
      userListType: ''
    });
  }
});
