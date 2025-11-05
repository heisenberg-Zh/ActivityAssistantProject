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
    isPermanent: true, // 是否永久
    // 手机号验证结果
    phoneValidation: {
      valid: [],
      invalid: [],
      duplicates: [],
      existing: [],
      validCount: 0
    },
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
      isPermanent: true,
      phoneValidation: {
        valid: [],
        invalid: [],
        duplicates: [],
        existing: [],
        validCount: 0
      }
    });
  },

  // 关闭对话框
  closeAddDialog() {
    this.setData({
      showAddDialog: false,
      batchPhoneText: '',
      blockReason: '',
      expiryDays: '',
      isPermanent: true,
      phoneValidation: {
        valid: [],
        invalid: [],
        duplicates: [],
        existing: [],
        validCount: 0
      }
    });
  },

  // 阻止事件冒泡（空方法）
  stopPropagation() {
    // 仅用于阻止事件冒泡，不做任何处理
  },

  // 输入批量手机号
  onPhoneTextInput(e) {
    const text = e.detail.value;
    this.setData({ batchPhoneText: text });
    this.validatePhoneNumbers(text);
  },

  // 实时验证手机号
  validatePhoneNumbers(text) {
    if (!text.trim()) {
      this.setData({
        phoneValidation: {
          valid: [],
          invalid: [],
          duplicates: [],
          existing: [],
          validCount: 0
        }
      });
      return;
    }

    const { blacklist } = this.data;
    const lines = text.split('\n');
    const phoneRegex = /^1[3-9]\d{9}$/;

    const valid = [];
    const invalid = [];
    const seen = new Set();
    const duplicates = [];
    const existing = [];

    lines.forEach(line => {
      const phone = line.trim();
      if (!phone) return;

      // 检查格式
      if (!phoneRegex.test(phone)) {
        if (!invalid.includes(phone)) {
          invalid.push(phone);
        }
        return;
      }

      // 检查是否重复
      if (seen.has(phone)) {
        if (!duplicates.includes(phone)) {
          duplicates.push(phone);
        }
        return;
      }

      seen.add(phone);

      // 检查是否已在黑名单
      const isExisting = blacklist.some(b => b.phone === phone);
      if (isExisting) {
        existing.push(phone);
      }

      valid.push(phone);
    });

    // 计算可添加数量（有效且不在黑名单中）
    const validCount = valid.filter(p => !existing.includes(p)).length;

    this.setData({
      phoneValidation: {
        valid,
        invalid,
        duplicates,
        existing,
        validCount
      }
    });
  },

  // 去除重复手机号
  removeDuplicates() {
    const { batchPhoneText } = this.data;
    const phoneSet = new Set();
    const lines = batchPhoneText.split('\n');
    const uniqueLines = [];

    lines.forEach(line => {
      const phone = line.trim();
      if (phone && !phoneSet.has(phone)) {
        phoneSet.add(phone);
        uniqueLines.push(phone);
      }
    });

    const newText = uniqueLines.join('\n');
    this.setData({ batchPhoneText: newText });
    this.validatePhoneNumbers(newText);

    wx.showToast({
      title: '已去除重复',
      icon: 'success',
      duration: 1500
    });
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

  // 选择永久
  selectPermanent() {
    this.setData({
      isPermanent: true,
      expiryDays: ''
    });
  },

  // 选择临时
  selectTemporary() {
    this.setData({
      isPermanent: false,
      expiryDays: '30' // 默认30天
    });
  },

  // 确认添加
  confirmAdd() {
    const { phoneValidation, blockReason, isPermanent, expiryDays } = this.data;

    // 验证手机号
    if (phoneValidation.validCount === 0) {
      wx.showToast({ title: '没有可添加的手机号', icon: 'none' });
      return;
    }

    // 使用验证后的有效手机号（排除已存在的）
    const phonesToAdd = phoneValidation.valid.filter(p => !phoneValidation.existing.includes(p));

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
        title: `成功添加${phonesToAdd.length}个黑名单`,
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
