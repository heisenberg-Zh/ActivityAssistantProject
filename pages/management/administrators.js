// pages/management/administrators.js
const { activityAPI, administratorAPI } = require('../../utils/api.js');
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
  async loadData() {
    const { activityId } = this.data;
    const currentUserId = app.globalData.currentUserId || 'u1';

    try {
      wx.showLoading({ title: '加载中...' });

      // 并行请求：活动详情和可添加用户列表
      const [activityResult, usersResult] = await Promise.all([
        activityAPI.getDetail(activityId),
        administratorAPI.getAvailableUsers(activityId)
      ]);

      wx.hideLoading();

      // 检查活动详情
      if (activityResult.code !== 0) {
        wx.showToast({ title: activityResult.message || '获取活动详情失败', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
        return;
      }

      const activity = activityResult.data;

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

      // 获取管理员列表（从活动详情中获取，这里需要将participants信息合并进去）
      // 由于活动详情中的administrators可能只包含userId，我们需要获取完整信息
      let administrators = [];
      if (activity.administrators && activity.administrators.length > 0) {
        // 如果后端返回的管理员列表已经包含用户详情，直接使用
        if (activity.administrators[0].userName) {
          administrators = activity.administrators.map(admin => ({
            userId: admin.userId,
            userName: admin.userName || '未知用户',
            addedAt: admin.addedAt || '',
            addedBy: admin.addedBy || '',
            avatar: admin.userAvatar || '/activityassistant_avatar_01.png'
          }));
        } else {
          // 否则需要从API获取管理员详情（暂时使用helper函数）
          administrators = activity.administrators.map((admin, index) => ({
            userId: admin.userId,
            userName: `管理员${index + 1}`,  // 临时显示，后续应该从API获取
            addedAt: admin.addedAt || '',
            addedBy: admin.addedBy || '',
            avatar: `/activityassistant_avatar_0${(index % 4) + 1}.png`
          }));
        }
      }

      // 获取可添加的用户列表
      const availableUsers = usersResult.code === 0 ? (usersResult.data || []) : [];

      this.setData({
        activity,
        isCreator,
        administrators,
        availableUsers
      });
    } catch (err) {
      wx.hideLoading();
      console.error('加载活动数据失败:', err);
      wx.showToast({
        title: err.message || '加载失败，请稍后重试',
        icon: 'none'
      });
      setTimeout(() => wx.navigateBack(), 1500);
    }
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
  async confirmAddAdmin() {
    const { selectedUserId, activityId } = this.data;

    if (!selectedUserId) {
      wx.showToast({ title: '请选择用户', icon: 'none' });
      return;
    }

    try {
      // 调用后端API添加管理员
      const result = await administratorAPI.addAdministrator(activityId, selectedUserId);

      if (result.code === 0) {
        wx.showToast({ title: '添加成功', icon: 'success' });

        // 关闭对话框并刷新数据
        this.closeAddDialog();

        // 刷新显示
        setTimeout(() => {
          this.loadData();
        }, 800);
      } else {
        wx.showToast({
          title: result.message || '添加失败',
          icon: 'none',
          duration: 2000
        });
      }
    } catch (err) {
      console.error('添加管理员失败:', err);
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 移除管理员
  removeAdmin(e) {
    const { userId, name } = e.currentTarget.dataset;
    const { activityId } = this.data;

    wx.showModal({
      title: '移除管理员',
      content: `确定要移除"${name}"的管理员权限吗？`,
      confirmText: '确定移除',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 调用后端API移除管理员
            const result = await administratorAPI.removeAdministrator(activityId, userId);

            if (result.code === 0) {
              wx.showToast({ title: '已移除', icon: 'success' });

              // 刷新数据
              setTimeout(() => {
                this.loadData();
              }, 800);
            } else {
              wx.showToast({
                title: result.message || '移除失败',
                icon: 'none',
                duration: 2000
              });
            }
          } catch (err) {
            console.error('移除管理员失败:', err);
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
