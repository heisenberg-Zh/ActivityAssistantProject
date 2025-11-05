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
    selectedUserIds: [],
    // 手机号验证结果
    phoneValidation: {
      valid: [],
      invalid: [],
      duplicates: [],
      existing: [],
      validCount: 0
    },
    // 用户搜索
    searchKeyword: '',
    filteredUsers: [],
    availableUsers: [],
    existingUsers: [],
    canSelectAll: false,
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
      selectedUserIds: [],
      searchKeyword: '',
      phoneValidation: {
        valid: [],
        invalid: [],
        duplicates: [],
        existing: [],
        validCount: 0
      }
    });
    // 初始化用户列表
    this.filterUsers();
  },

  // 关闭对话框
  closeAddDialog() {
    this.setData({
      showAddDialog: false,
      batchPhoneText: '',
      selectedUserIds: [],
      searchKeyword: '',
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

  // 切换添加模式
  switchAddMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ addMode: mode });
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

    const { whitelist } = this.data;
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

      // 检查是否已在白名单
      const isExisting = whitelist.some(w => w.phone === phone);
      if (isExisting) {
        existing.push(phone);
      }

      valid.push(phone);
    });

    // 计算可添加数量（有效且不在白名单中）
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
    const { phoneValidation, batchPhoneText } = this.data;
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

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.filterUsers();
  },

  // 清空搜索
  clearSearch() {
    this.setData({ searchKeyword: '' });
    this.filterUsers();
  },

  // 过滤用户列表
  filterUsers() {
    const { registeredUsers, searchKeyword, selectedUserIds } = this.data;
    const keyword = searchKeyword.toLowerCase().trim();

    let filtered = registeredUsers;

    // 搜索过滤
    if (keyword) {
      filtered = registeredUsers.filter(user =>
        user.name.toLowerCase().includes(keyword) ||
        user.mobile.includes(keyword)
      );
    }

    // 分组：可添加 vs 已存在，并添加 isSelected 标记
    const available = filtered
      .filter(u => !u.inWhitelist)
      .map(u => ({
        ...u,
        isSelected: selectedUserIds.indexOf(u.userId) > -1
      }));

    const existing = filtered.filter(u => u.inWhitelist);

    // 是否可以全选
    const canSelectAll = available.length > 0 &&
                         available.some(u => !u.isSelected);

    this.setData({
      filteredUsers: filtered,
      availableUsers: available,
      existingUsers: existing,
      canSelectAll
    });
  },

  // 选择/取消选择用户
  toggleUserSelection(e) {
    const userId = e.currentTarget.dataset.userId;
    let { selectedUserIds, registeredUsers, searchKeyword } = this.data;

    // 创建新数组避免引用问题
    selectedUserIds = [...selectedUserIds];

    const index = selectedUserIds.indexOf(userId);
    if (index > -1) {
      // 取消选择
      selectedUserIds.splice(index, 1);
    } else {
      // 添加选择
      selectedUserIds.push(userId);
    }

    // 重新计算过滤后的用户列表
    const keyword = searchKeyword.toLowerCase().trim();
    let filtered = registeredUsers;
    if (keyword) {
      filtered = registeredUsers.filter(user =>
        user.name.toLowerCase().includes(keyword) ||
        user.mobile.includes(keyword)
      );
    }

    // 分组并添加 isSelected 标记
    const available = filtered
      .filter(u => !u.inWhitelist)
      .map(u => ({
        ...u,
        isSelected: selectedUserIds.indexOf(u.userId) > -1
      }));

    const existing = filtered.filter(u => u.inWhitelist);
    const canSelectAll = available.length > 0 &&
                         available.some(u => !u.isSelected);

    // 一次性更新所有相关状态
    this.setData({
      selectedUserIds: selectedUserIds,
      filteredUsers: filtered,
      availableUsers: available,
      existingUsers: existing,
      canSelectAll: canSelectAll
    });
  },

  // 全选
  selectAll() {
    const { availableUsers } = this.data;
    const allUserIds = availableUsers.map(u => u.userId);
    this.setData({ selectedUserIds: allUserIds }, () => {
      this.filterUsers();
    });
  },

  // 清空选择
  clearSelection() {
    this.setData({ selectedUserIds: [] }, () => {
      this.filterUsers();
    });
  },

  // 确认添加
  confirmAdd() {
    const { addMode, phoneValidation, selectedUserIds, registeredUsers, activity } = this.data;
    const currentUserId = app.globalData.currentUserId || 'u1';

    if (addMode === 'phone') {
      // 批量手机号添加
      if (phoneValidation.validCount === 0) {
        wx.showToast({ title: '没有可添加的手机号', icon: 'none' });
        return;
      }

      // 使用验证后的有效手机号（排除已存在的）
      const phonesToAdd = phoneValidation.valid.filter(p => !phoneValidation.existing.includes(p));

      wx.showLoading({ title: '添加中...' });

      // 模拟API调用 - 实际添加到whitelist
      setTimeout(() => {
        // 初始化whitelist数组
        if (!activity.whitelist) {
          activity.whitelist = [];
        }

        // 添加手机号到白名单
        const now = new Date();
        const addedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        phonesToAdd.forEach(phone => {
          // 查找对应的用户ID
          const user = participants.find(p => p.mobile === phone);
          activity.whitelist.push({
            phone: phone,
            userId: user?.id || null,
            addedAt: addedAt,
            addedBy: currentUserId
          });
        });

        wx.hideLoading();
        wx.showToast({
          title: `成功添加 ${phonesToAdd.length} 个手机号`,
          icon: 'success',
          duration: 2000
        });

        this.closeAddDialog();
        setTimeout(() => {
          this.loadData();
        }, 800);
      }, 800);

    } else {
      // 从已报名用户选择
      if (selectedUserIds.length === 0) {
        wx.showToast({ title: '请选择用户', icon: 'none' });
        return;
      }

      wx.showLoading({ title: '添加中...' });

      // 模拟API调用 - 实际添加到whitelist
      setTimeout(() => {
        // 初始化whitelist数组
        if (!activity.whitelist) {
          activity.whitelist = [];
        }

        const now = new Date();
        const addedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        let addedCount = 0;
        selectedUserIds.forEach(userId => {
          // 检查是否已存在
          const exists = activity.whitelist.some(w => w.userId === userId);
          if (!exists) {
            // 从registeredUsers获取用户信息
            const regUser = registeredUsers.find(u => u.userId === userId);
            activity.whitelist.push({
              phone: regUser?.mobile || '',
              userId: userId,
              addedAt: addedAt,
              addedBy: currentUserId
            });
            addedCount++;
          }
        });

        wx.hideLoading();
        wx.showToast({
          title: `成功添加 ${addedCount} 个用户`,
          icon: 'success',
          duration: 2000
        });

        this.closeAddDialog();
        setTimeout(() => {
          this.loadData();
        }, 800);
      }, 800);
    }
  },

  // 删除白名单条目
  removeItem(e) {
    const { phone, name } = e.currentTarget.dataset;
    const { activity } = this.data;

    wx.showModal({
      title: '移除白名单',
      content: `确定要将"${name || phone}"移出白名单吗？`,
      confirmText: '确定移除',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '移除中...' });

          // 模拟API调用 - 实际从whitelist中删除
          setTimeout(() => {
            if (activity.whitelist) {
              const index = activity.whitelist.findIndex(w => w.phone === phone);
              if (index > -1) {
                activity.whitelist.splice(index, 1);
              }
            }

            wx.hideLoading();
            wx.showToast({ title: '已移除', icon: 'success' });

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
