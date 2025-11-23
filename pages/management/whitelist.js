// pages/management/whitelist.js
const { activityAPI, whitelistAPI } = require('../../utils/api.js');
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
  async loadData() {
    const { activityId } = this.data;
    const currentUserId = app.globalData.currentUserId || 'u1';

    try {
      wx.showLoading({ title: '加载中...' });

      // 并行请求：活动详情、白名单列表、已报名用户列表
      const [activityResult, whitelistResult, usersResult] = await Promise.all([
        activityAPI.getDetail(activityId),
        whitelistAPI.getWhitelist(activityId),
        whitelistAPI.getRegisteredUsers(activityId)
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

      // 获取白名单（从API返回的数据已包含用户详情）
      const whitelist = whitelistResult.code === 0 ? (whitelistResult.data || []) : [];

      // 获取已报名用户列表
      const registeredUsers = usersResult.code === 0 ? (usersResult.data || []) : [];

      // 为每个已报名用户标记是否在白名单中
      registeredUsers.forEach(user => {
        user.inWhitelist = whitelist.some(w =>
          w.userId === user.userId || w.phone === user.mobile
        );
      });

      this.setData({
        activity,
        whitelist,
        registeredUsers
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
  async confirmAdd() {
    const { addMode, phoneValidation, selectedUserIds, activityId } = this.data;

    if (addMode === 'phone') {
      // 批量手机号添加
      if (phoneValidation.validCount === 0) {
        wx.showToast({ title: '没有可添加的手机号', icon: 'none' });
        return;
      }

      // 使用验证后的有效手机号（排除已存在的）
      const phonesToAdd = phoneValidation.valid.filter(p => !phoneValidation.existing.includes(p));

      try {
        // 调用后端API批量添加
        const result = await whitelistAPI.addBatch(activityId, { phones: phonesToAdd });

        if (result.code === 0) {
          wx.showToast({
            title: result.message || `成功添加 ${phonesToAdd.length} 个手机号`,
            icon: 'success',
            duration: 2000
          });

          this.closeAddDialog();
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
        console.error('添加白名单失败:', err);
        wx.showToast({
          title: '操作失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }

    } else {
      // 从已报名用户选择
      if (selectedUserIds.length === 0) {
        wx.showToast({ title: '请选择用户', icon: 'none' });
        return;
      }

      try {
        // 调用后端API批量添加
        const result = await whitelistAPI.addBatch(activityId, { userIds: selectedUserIds });

        if (result.code === 0) {
          wx.showToast({
            title: result.message || `成功添加 ${selectedUserIds.length} 个用户`,
            icon: 'success',
            duration: 2000
          });

          this.closeAddDialog();
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
        console.error('添加白名单失败:', err);
        wx.showToast({
          title: '操作失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    }
  },

  // 删除白名单条目
  removeItem(e) {
    const { phone, name } = e.currentTarget.dataset;
    const { activityId } = this.data;

    wx.showModal({
      title: '移除白名单',
      content: `确定要将"${name || phone}"移出白名单吗？`,
      confirmText: '确定移除',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 调用后端API移除白名单
            const result = await whitelistAPI.remove(activityId, phone);

            if (result.code === 0) {
              wx.showToast({ title: '已移除', icon: 'success' });

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
            console.error('移除白名单失败:', err);
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
