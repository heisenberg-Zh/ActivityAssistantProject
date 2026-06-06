// pages/management/registrations.js
const { activityAPI, registrationAPI, blacklistAPI } = require('../../utils/api.js');
const { checkManagementPermission } = require('../../utils/activity-management-helper.js');
const { fixImageUrl, getNameInitial, formatCheckinStatus } = require('../../utils/formatter.js');
const app = getApp();

const safeJsonParse = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
};

const normalizeCustomFields = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const parsed = safeJsonParse(value, []);
    return Array.isArray(parsed) ? parsed : [];
  }
  return [];
};

Page({
  data: {
    activityId: '',
    groupId: '', // 可选：分组ID（多分组活动时按分组查看）
    groupName: '', // 分组名称（用于展示）
    activity: null,
    allRegistrations: [],
    displayRegistrations: [],
    statusFilter: 'all', // 'all', 'pending', 'approved', 'rejected'

    // 报名详情弹层
    showDetailDialog: false,
    detailTarget: null,
    detailFields: [],
    detailGroupName: '',

    // 移除报名弹层
    showRemoveDialog: false,
    removeTarget: null,
    addToBlacklist: false,
    removeReason: '',

    // 系统信息
    statusBarHeight: 0,
    navBarHeight: 0
  },

  onLoad(query) {
    const token = wx.getStorageSync('token');
    if (!token || token.trim().length === 0) {
      wx.showModal({
        title: '需要登录',
        content: '报名管理需要登录，请先登录后再试。',
        confirmText: '去登录',
        cancelText: '返回',
        confirmColor: '#3b82f6',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/auth/login' });
          } else {
            wx.navigateBack();
          }
        }
      });
      return;
    }

    const statusBarHeight = app.globalData.statusBarHeight || 0;
    const navBarHeight = statusBarHeight + 44;
    this.setData({ statusBarHeight, navBarHeight });

    const activityId = String(query.id || '').trim();
    if (!activityId) {
      wx.showToast({ title: '活动ID不能为空', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    const groupId = String(query.groupId || '').trim();
    this.setData({ activityId, groupId });
    this.loadData();
  },

  async loadData() {
    try {
      wx.showLoading({ title: '加载中...' });

      const { activityId, groupId } = this.data;
      let currentUserId = app.globalData.currentUserId;
      if (!currentUserId) {
        try {
          const { getSecureStorage } = require('../../utils/security.js');
          currentUserId = getSecureStorage('currentUserId');
        } catch (e) {}
      }

      const detailResult = await activityAPI.getDetail(activityId);
      if (detailResult.code !== 0) throw new Error(detailResult.message || '获取活动详情失败');
      const activity = detailResult.data;

      if (!activity) {
        wx.hideLoading();
        wx.showToast({ title: '活动不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
        return;
      }

      const permission = checkManagementPermission(activity, currentUserId);
      if (!permission.hasPermission) {
        wx.hideLoading();
        wx.showModal({
          title: '无权限',
          content: '您不是此活动的创建者或管理员。',
          showCancel: false,
          success: () => wx.navigateBack()
        });
        return;
      }

      const registrationsResult = await registrationAPI.getByActivity(activityId, { page: 0, size: 1000 });
      const activityRegs = registrationsResult.code === 0
        ? (registrationsResult.data.content || registrationsResult.data || [])
        : [];

      const groups = Array.isArray(activity.groups) ? activity.groups : [];
      const groupNameById = groups.reduce((acc, g) => {
        if (g && g.id) acc[g.id] = g.name || '';
        return acc;
      }, {});

      const pickNicknameFieldId = (customFieldsValue) => {
        const fields = normalizeCustomFields(customFieldsValue);
        const found = fields.find(f => f && String(f.label || '').trim() === '昵称');
        return found && found.id ? String(found.id) : '';
      };

      const activityNicknameFieldId = pickNicknameFieldId(activity.customFields);
      const groupNicknameFieldIdById = groups.reduce((acc, g) => {
        if (!g || !g.id) return acc;
        const nickId = pickNicknameFieldId(g.customFields);
        if (nickId) acc[g.id] = nickId;
        return acc;
      }, {});

      const allRegistrations = activityRegs.map((reg) => {
        const userNickname = reg.userNickname || reg.user_name || '';
        const userAvatar = fixImageUrl(reg.userAvatar || reg.avatar || '');

        const customData = safeJsonParse(reg.customData, {});
        const nicknameFieldId = reg.groupId ? (groupNicknameFieldIdById[reg.groupId] || '') : activityNicknameFieldId;
        let nicknameFromForm = '';
        if (customData && typeof customData === 'object') {
          nicknameFromForm = (nicknameFieldId && customData[nicknameFieldId]) || customData['昵称'] || '';
        }
        if (nicknameFromForm !== null && nicknameFromForm !== undefined) {
          nicknameFromForm = String(nicknameFromForm).trim();
        } else {
          nicknameFromForm = '';
        }

        const displayName = nicknameFromForm || userNickname || reg.name || '报名用户';
        const groupName = reg.groupId ? (groupNameById[reg.groupId] || '') : '';
        const avatarInitial = getNameInitial(displayName || 'U');
        const checkinStatus = reg.checkinStatus || 'pending';
        const checkinDisplay = formatCheckinStatus(checkinStatus);
        const isCheckedIn = checkinStatus === 'checked' || checkinStatus === 'late';
        const isOutOfRange = reg.checkinValid === false;
        const checkinColor = isCheckedIn
          ? (isOutOfRange ? 'danger' : (checkinStatus === 'late' ? 'warning' : 'success'))
          : 'default';

        return {
          ...reg,
          displayName,
          userNickname,
          userAvatar,
          avatarInitial,
          groupName,
          statusText: this.getStatusText(reg.status),
          statusColor: this.getStatusColor(reg.status),
          registeredAt: reg.registeredAt || reg.createdAt || '未知时间',
          checkinStatus,
          checkinText: isCheckedIn ? '已打卡' : '未打卡',
          checkinColor,
          checkinDisplay
        };
      });

      const scopedRegistrations = groupId
        ? allRegistrations.filter(r => String(r.groupId || '') === groupId)
        : allRegistrations;

      const scopedGroupName = groupId ? (groupNameById[groupId] || '') : '';
      if (groupId && scopedGroupName) {
        try {
          wx.setNavigationBarTitle({ title: `${scopedGroupName} - 报名管理` });
        } catch (e) {}
      }

      this.setData({
        activity,
        groupName: scopedGroupName,
        allRegistrations: scopedRegistrations,
        displayRegistrations: this.filterRegistrations(scopedRegistrations, this.data.statusFilter)
      });

      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('加载报名数据失败:', err);
      wx.showToast({ title: err.message || '加载失败', icon: 'none', duration: 2000 });
      setTimeout(() => wx.navigateBack(), 2000);
    }
  },

  getStatusText(status) {
    const statusMap = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
      cancelled: '已取消',
      removed: '已移除'
    };
    return statusMap[status] || '未知';
  },

  getStatusColor(status) {
    const colorMap = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      cancelled: 'default',
      removed: 'default'
    };
    return colorMap[status] || 'default';
  },

  switchFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    const { allRegistrations } = this.data;
    this.setData({
      statusFilter: filter,
      displayRegistrations: this.filterRegistrations(allRegistrations, filter)
    });
  },

  filterRegistrations(allRegistrations, filter) {
    if (!Array.isArray(allRegistrations)) return [];
    if (filter === 'all') return allRegistrations;
    return allRegistrations.filter(r => r.status === filter);
  },

  openRegistrationDetail(e) {
    const { id } = e.currentTarget.dataset;
    const { allRegistrations, activity } = this.data;
    const reg = allRegistrations.find(r => r.id === id);
    if (!reg) return;

    const groups = Array.isArray(activity?.groups) ? activity.groups : [];
    const group = reg.groupId ? groups.find(g => g && g.id === reg.groupId) : null;
    const groupName = group ? (group.name || '') : '';

    const customData = safeJsonParse(reg.customData, {});
    const customFields = normalizeCustomFields(group?.customFields || activity?.customFields);
    const detailFields = this.buildDetailFields(reg, customFields, customData);

    this.setData({
      showDetailDialog: true,
      detailTarget: reg,
      detailFields,
      detailGroupName: groupName
    });
  },

  closeDetailDialog() {
    this.setData({
      showDetailDialog: false,
      detailTarget: null,
      detailFields: [],
      detailGroupName: ''
    });
  },

  buildDetailFields(reg, customFields, customData) {
    const fields = [];
    const usedKeys = new Set();

    const pushField = (label, value, extra = {}) => {
      const v = value === null || value === undefined ? '' : String(value).trim();
      if (!v) return;
      fields.push({ label, value: v, ...extra });
    };

    // 签到信息（产品要求：展示“是否已打卡”）
    pushField('是否已打卡', reg.checkinText || ((reg.checkinStatus === 'checked' || reg.checkinStatus === 'late') ? '已打卡' : '未打卡'));

    // 打卡范围（用户实际打卡地点距离活动地点的距离；未打卡/无坐标则“无”；超出范围仅标红）
    const isCheckedIn = reg.checkinStatus === 'checked' || reg.checkinStatus === 'late';
    if (!isCheckedIn) {
      pushField('打卡范围', '无');
    } else {
      const distanceValue = reg.checkinDistance;
      const hasDistance = distanceValue === 0
        || distanceValue === '0'
        || (distanceValue !== null && distanceValue !== undefined && String(distanceValue).trim() !== '');

      if (!hasDistance) {
        pushField('打卡范围', '无');
      } else {
        pushField('打卡范围', `${String(distanceValue).trim()}米`, { danger: reg.checkinValid === false });
      }
    }

    // 标准字段（优先按定义顺序展示）
    const defined = Array.isArray(customFields) ? customFields : [];
    defined.forEach((f) => {
      if (!f) return;
      const id = f.id;
      const label = f.label || id || '字段';

      let value;
      if (id === 'name') value = reg.name;
      else if (id === 'mobile') value = reg.mobile;
      else value = customData?.[id] ?? customData?.[label];

      pushField(label, value);
      if (id) usedKeys.add(id);
      if (label) usedKeys.add(label);
    });

    // 补齐 name/mobile（若未在定义中出现）
    if (!usedKeys.has('name')) {
      pushField('报名姓名', reg.name);
      usedKeys.add('name');
    }
    if (!usedKeys.has('mobile')) {
      pushField('手机号', reg.mobile);
      usedKeys.add('mobile');
    }

    // 兜底：customData 中未匹配到定义的字段
    if (customData && typeof customData === 'object') {
      Object.keys(customData).forEach((k) => {
        if (usedKeys.has(k)) return;
        pushField(k, customData[k]);
      });
    }

    return fields;
  },

  // 显示移除对话框
  showRemoveDialog(e) {
    const { id, userId, name, mobile } = e.currentTarget.dataset;
    this.setData({
      showRemoveDialog: true,
      removeTarget: { id, userId, name, mobile },
      addToBlacklist: false,
      removeReason: ''
    });
  },

  closeRemoveDialog() {
    this.setData({
      showRemoveDialog: false,
      removeTarget: null,
      addToBlacklist: false,
      removeReason: ''
    });
  },

  toggleBlacklist(e) {
    this.setData({ addToBlacklist: e.detail.value });
  },

  onReasonInput(e) {
    this.setData({ removeReason: e.detail.value });
  },

  async confirmRemove() {
    const { removeTarget, addToBlacklist, removeReason, activityId } = this.data;
    if (!removeTarget) return;

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

    try {
      wx.showLoading({ title: '处理中...' });

      const removeResult = await registrationAPI.remove(removeTarget.id);
      if (removeResult.code !== 0) {
        throw new Error(removeResult.message || '移除报名失败');
      }

      if (addToBlacklist && removeTarget.mobile) {
        const blacklistResult = await blacklistAPI.addBatch(activityId, {
          phones: [removeTarget.mobile],
          reason: removeReason.trim() || '从报名管理移除',
          expiryDays: null
        });

        if (blacklistResult.code !== 0) {
          console.error('添加黑名单失败:', blacklistResult.message);
        }
      }

      wx.hideLoading();
      wx.showToast({ title: addToBlacklist ? '已移除并加入黑名单' : '已移除报名', icon: 'success', duration: 2000 });

      this.closeRemoveDialog();
      setTimeout(() => this.loadData(), 800);
    } catch (err) {
      wx.hideLoading();
      console.error('移除报名失败:', err);
      wx.showToast({ title: err.message || '操作失败，请重试', icon: 'none', duration: 2000 });
    }
  },

  approveRegistration(e) {
    const { id, name } = e.currentTarget.dataset;

    wx.showModal({
      title: '通过审核',
      content: `确定通过"${name}"的报名申请吗？`,
      confirmText: '确定通过',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          wx.showLoading({ title: '处理中...' });
          const result = await registrationAPI.approve(id, { approved: true, note: '' });
          wx.hideLoading();
          if (result.code === 0) {
            wx.showToast({ title: '已通过', icon: 'success', duration: 2000 });
            setTimeout(() => this.loadData(), 800);
          } else {
            wx.showToast({ title: result.message || '审核失败', icon: 'none', duration: 2000 });
          }
        } catch (err) {
          wx.hideLoading();
          console.error('审核通过失败:', err);
          wx.showToast({ title: '操作失败，请重试', icon: 'none', duration: 2000 });
        }
      }
    });
  },

  rejectRegistration(e) {
    const { id, name } = e.currentTarget.dataset;

    wx.showModal({
      title: '拒绝审核',
      content: `确定拒绝"${name}"的报名申请吗？`,
      confirmText: '确定拒绝',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          wx.showLoading({ title: '处理中...' });
          const result = await registrationAPI.approve(id, { approved: false, note: '' });
          wx.hideLoading();
          if (result.code === 0) {
            wx.showToast({ title: '已拒绝', icon: 'success', duration: 2000 });
            setTimeout(() => this.loadData(), 800);
          } else {
            wx.showToast({ title: result.message || '审核失败', icon: 'none', duration: 2000 });
          }
        } catch (err) {
          wx.hideLoading();
          console.error('审核拒绝失败:', err);
          wx.showToast({ title: '操作失败，请重试', icon: 'none', duration: 2000 });
        }
      }
    });
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.switchTab({ url: '/pages/activities/list' });
    }
  }
});
