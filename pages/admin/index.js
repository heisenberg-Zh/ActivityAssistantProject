const { adminAPI, appConfigAPI } = require('../../utils/api.js');

Page({
  data: {
    ready: false,
    createActivityAdminOnly: false,
    savingCreateActivitySwitch: false
  },

  async onLoad() {
    const ok = await this.ensureSystemAdmin();
    if (ok) {
      await this.loadCreateActivityConfig();
    }
  },

  async onShow() {
    if (this.data.ready) {
      await this.loadCreateActivityConfig();
    }
  },

  async ensureSystemAdmin() {
    try {
      const res = await adminAPI.me();
      const isSystemAdmin = !!(res && res.code === 0 && res.data && res.data.systemAdmin === true);
      if (!isSystemAdmin) {
        wx.showToast({ title: '无权限访问', icon: 'none' });
        setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
        return false;
      }
      this.setData({ ready: true });
      return true;
    } catch (err) {
      wx.showToast({ title: '无权限访问', icon: 'none' });
      setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
      return false;
    }
  },

  async loadCreateActivityConfig() {
    try {
      const res = await appConfigAPI.getCreateActivityConfig();
      if (res && res.code === 0 && res.data) {
        this.setData({ createActivityAdminOnly: !!res.data.createActivityAdminOnly });
      }
    } catch (err) {
      console.warn('加载创建活动开关失败:', err);
    }
  },

  async onCreateActivitySwitchChange(e) {
    const nextValue = !!(e && e.detail && e.detail.value);
    const prevValue = this.data.createActivityAdminOnly;

    this.setData({ createActivityAdminOnly: nextValue, savingCreateActivitySwitch: true });
    try {
      const res = await adminAPI.updateCreateActivityAdminOnly(nextValue);
      if (!res || res.code !== 0) {
        throw new Error((res && res.message) || '保存失败');
      }
      this.setData({ createActivityAdminOnly: !!(res.data && res.data.createActivityAdminOnly) });
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (err) {
      this.setData({ createActivityAdminOnly: prevValue });
      wx.showToast({ title: (err && err.message) || '保存失败', icon: 'none' });
    } finally {
      this.setData({ savingCreateActivitySwitch: false });
    }
  },

  goActivities() {
    wx.navigateTo({ url: '/pages/admin/activities/index' });
  },

  goFeedback() {
    wx.navigateTo({ url: '/pages/admin/feedback/list' });
  }
});
