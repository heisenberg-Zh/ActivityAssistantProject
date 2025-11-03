// pages/management/whitelist.js
const { activities, participants, registrations } = require('../../utils/mock.js');
const {
  checkManagementPermission,
  parseBatchPhoneNumbers
} = require('../../utils/activity-management-helper.js');
const app = getApp();

Page({
  data: {
    activityId: '',
    activity: null,
    whitelist: [],
    registeredUsers: [], // 已报名用户列表
    showAddDialog: false,
    addMode: 'phone', // 'phone' 或 'user'
    batchPhoneText: '',
    selectedUserIds: []
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

    // 获取白名单（包含用户详情）
    const whitelist = (activity.whitelist || []).map(item => {
      const user = participants.find(p => p.id === item.userId);
      return {
        ...item,
        name: user?.name || '未知用户',
        avatar: user?.avatar || ''
      };
    });

    // 获取已报名用户（用于选择添加）
    const activityRegs = registrations.filter(r => r.activityId === activityId && r.status === 'approved');
    const registeredUsers = activityRegs.map(reg => {
      const user = participants.find(p => p.id === reg.userId);
      return {
        userId: reg.userId,
        name: reg.name,
        mobile: reg.mobile,
        avatar: user?.avatar || '',
        // 检查是否已在白名单
        inWhitelist: whitelist.some(w => w.userId === reg.userId || w.phone === reg.mobile)
      };
    });

    this.setData({
      activity,
      whitelist,
      registeredUsers
    });
  },

  // 显示添加对话框
  showAddDialog() {
    this.setData({
      showAddDialog: true,
      addMode: 'phone',
      batchPhoneText: '',
      selectedUserIds: []
    });
  },

  // 关闭对话框
  closeAddDialog() {
    this.setData({
      showAddDialog: false,
      batchPhoneText: '',
      selectedUserIds: []
    });
  },

  // 切换添加模式
  switchAddMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ addMode: mode });
  },

  // 输入批量手机号
  onPhoneTextInput(e) {
    this.setData({ batchPhoneText: e.detail.value });
  },

  // 选择/取消选择用户
  toggleUserSelection(e) {
    const userId = e.currentTarget.dataset.userId;
    const { selectedUserIds } = this.data;

    const index = selectedUserIds.indexOf(userId);
    if (index > -1) {
      selectedUserIds.splice(index, 1);
    } else {
      selectedUserIds.push(userId);
    }

    this.setData({ selectedUserIds: [...selectedUserIds] });
  },

  // 确认添加
  confirmAdd() {
    const { addMode, batchPhoneText, selectedUserIds, registeredUsers } = this.data;

    if (addMode === 'phone') {
      // 批量手机号添加
      if (!batchPhoneText.trim()) {
        wx.showToast({ title: '请输入手机号', icon: 'none' });
        return;
      }

      const result = parseBatchPhoneNumbers(batchPhoneText);

      if (result.errors.length > 0) {
        const errorMsg = result.errors.slice(0, 3).map(e => `第${e.line}行: ${e.reason}`).join('\n');
        wx.showModal({
          title: '手机号格式错误',
          content: errorMsg + (result.errors.length > 3 ? `\n...还有${result.errors.length - 3}个错误` : ''),
          showCancel: false
        });
        return;
      }

      if (result.phones.length === 0) {
        wx.showToast({ title: '没有有效的手机号', icon: 'none' });
        return;
      }

      wx.showLoading({ title: '添加中...' });

      // 模拟API调用
      setTimeout(() => {
        wx.hideLoading();
        wx.showToast({
          title: `成功添加${result.phones.length}个手机号`,
          icon: 'success'
        });

        this.closeAddDialog();
        setTimeout(() => {
          this.loadData();
        }, 1500);
      }, 1000);

    } else {
      // 从已报名用户选择
      if (selectedUserIds.length === 0) {
        wx.showToast({ title: '请选择用户', icon: 'none' });
        return;
      }

      wx.showLoading({ title: '添加中...' });

      // 模拟API调用
      setTimeout(() => {
        wx.hideLoading();
        wx.showToast({
          title: `成功添加${selectedUserIds.length}个用户`,
          icon: 'success'
        });

        this.closeAddDialog();
        setTimeout(() => {
          this.loadData();
        }, 1500);
      }, 1000);
    }
  },

  // 删除白名单条目
  removeItem(e) {
    const { phone, name } = e.currentTarget.dataset;

    wx.showModal({
      title: '移除白名单',
      content: `确定要将"${name || phone}"移出白名单吗？`,
      confirmText: '确定移除',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '移除中...' });

          // 模拟API调用
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '已移除', icon: 'success' });

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
