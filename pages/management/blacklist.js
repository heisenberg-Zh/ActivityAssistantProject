// pages/management/blacklist.js
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
    blacklist: [],
    showAddDialog: false,
    batchPhoneText: '',
    blockReason: '',
    expiryDays: '', // 过期天数，空表示永久
    isPermanent: true // 是否永久
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

    // 获取黑名单（包含用户详情和状态）
    const blacklist = (activity.blacklist || []).map(item => {
      const user = participants.find(p => p.id === item.userId);

      // 计算是否已过期
      let isExpired = false;
      let remainingDays = null;
      if (item.expiresAt) {
        const now = new Date();
        const expiryDate = new Date(item.expiresAt);
        isExpired = now > expiryDate;
        if (!isExpired) {
          const diffTime = expiryDate.getTime() - now.getTime();
          remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }

      return {
        ...item,
        name: user?.name || '未知用户',
        avatar: user?.avatar || '',
        isExpired,
        remainingDays,
        statusText: this.getStatusText(item, isExpired)
      };
    });

    this.setData({
      activity,
      blacklist
    });
  },

  // 获取状态文本
  getStatusText(item, isExpired) {
    if (!item.isActive) return '已禁用';
    if (isExpired) return '已过期';
    if (item.expiresAt) {
      const now = new Date();
      const expiryDate = new Date(item.expiresAt);
      const diffTime = expiryDate.getTime() - now.getTime();
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `剩余${remainingDays}天`;
    }
    return '永久';
  },

  // 显示添加对话框
  showAddDialog() {
    this.setData({
      showAddDialog: true,
      batchPhoneText: '',
      blockReason: '',
      expiryDays: '',
      isPermanent: true
    });
  },

  // 关闭对话框
  closeAddDialog() {
    this.setData({
      showAddDialog: false,
      batchPhoneText: '',
      blockReason: '',
      expiryDays: '',
      isPermanent: true
    });
  },

  // 输入批量手机号
  onPhoneTextInput(e) {
    this.setData({ batchPhoneText: e.detail.value });
  },

  // 输入原因
  onReasonInput(e) {
    this.setData({ blockReason: e.detail.value });
  },

  // 输入过期天数
  onExpiryDaysInput(e) {
    const value = e.detail.value;
    this.setData({ expiryDays: value });
  },

  // 切换永久/临时
  togglePermanent(e) {
    const isPermanent = e.detail.value;
    this.setData({
      isPermanent,
      expiryDays: isPermanent ? '' : '30' // 默认30天
    });
  },

  // 确认添加
  confirmAdd() {
    const { batchPhoneText, blockReason, isPermanent, expiryDays } = this.data;

    // 验证手机号
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

    // 验证过期天数
    if (!isPermanent) {
      const days = parseInt(expiryDays);
      if (isNaN(days) || days < 1) {
        wx.showToast({ title: '过期天数至少为1天', icon: 'none' });
        return;
      }
    }

    // 验证原因（可选）
    if (blockReason.trim() && blockReason.trim().length < 2) {
      wx.showToast({ title: '原因至少2个字', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '添加中...' });

    // 模拟API调用
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: `成功添加${result.phones.length}个黑名单`,
        icon: 'success'
      });

      this.closeAddDialog();
      setTimeout(() => {
        this.loadData();
      }, 1500);
    }, 1000);
  },

  // 切换激活状态
  toggleActive(e) {
    const { phone, name, isActive } = e.currentTarget.dataset;

    const action = isActive ? '禁用' : '启用';

    wx.showModal({
      title: `${action}黑名单`,
      content: `确定要${action}"${name || phone}"的黑名单状态吗？`,
      confirmText: `确定${action}`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });

          // 模拟API调用
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: `已${action}`, icon: 'success' });

            setTimeout(() => {
              this.loadData();
            }, 1500);
          }, 1000);
        }
      }
    });
  },

  // 删除黑名单条目
  removeItem(e) {
    const { phone, name } = e.currentTarget.dataset;

    wx.showModal({
      title: '移除黑名单',
      content: `确定要将"${name || phone}"移出黑名单吗？`,
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
