// pages/messages/index.js
const { messageAPI } = require('../../utils/api.js');

const app = getApp();

Page({
  data: {
    filters: [
      { key: 'all', name: '全部', active: true },
      { key: 'system', name: '系统通知', active: false },
      { key: 'activity', name: '活动通知', active: false },
      { key: 'signup', name: '报名通知', active: false },
      { key: 'manager', name: '管理通知', active: false }
    ],
    activeFilter: 'all',
    allMessages: [],
    messages: [],
    isLoggedIn: false  // 添加登录状态标识
  },

  onLoad() {
    this.checkAndLoadData();
  },

  onShow() {
    this.checkAndLoadData();
  },

  /**
   * 检查登录状态并加载数据
   */
  checkAndLoadData() {
    const isLoggedIn = app.checkLoginStatus();
    this.setData({ isLoggedIn });

    if (!isLoggedIn) {
      // 游客模式：显示游客提示，不加载消息
      console.log('👤 游客模式：消息中心页面显示游客状态');
      this.setData({
        allMessages: [],
        messages: []
      });
    } else {
      // 已登录：加载消息数据
      this.loadMessages();
    }
  },

  // 加载消息列表（从后端API获取）
  async loadMessages() {
    let loadingShown = false;
    try {
      wx.showLoading({ title: '加载中...' });
      loadingShown = true;

      // 从后端API获取消息列表
      const result = await messageAPI.getMyMessages({ page: 0, size: 100 });

      if (result.code !== 0) {
        throw new Error(result.message || '获取消息列表失败');
      }

      // 兼容多种后端数据格式
      let notifications = [];

      if (result.data) {
        if (Array.isArray(result.data)) {
          // 格式1: { code: 0, data: [...] }
          notifications = result.data;
        } else if (result.data.content && Array.isArray(result.data.content)) {
          // 格式2: { code: 0, data: { content: [...], totalElements: ... } } (分页格式)
          notifications = result.data.content;
        } else if (result.data.list && Array.isArray(result.data.list)) {
          // 格式3: { code: 0, data: { list: [...] } }
          notifications = result.data.list;
        } else if (typeof result.data === 'object' && result.data.id) {
          // 格式4: 单个对象，转换为数组
          notifications = [result.data];
        }
      }

      // 转换为页面所需的格式
      const formattedMessages = notifications.map(notif => this.formatMessage(notif));

      this.setData({
        allMessages: formattedMessages,
        messages: formattedMessages
      });

      this.updateMessages(this.data.activeFilter);

      if (loadingShown) {
        wx.hideLoading();
        loadingShown = false;
      }
    } catch (error) {
      console.error('加载消息列表失败:', error);

      // 确保隐藏loading
      if (loadingShown) {
        wx.hideLoading();
        loadingShown = false;
      }

      // 显示空状态
      this.setData({
        allMessages: [],
        messages: []
      });

      // 友好的错误提示
      const errorMsg = error.message || '加载失败';

      wx.showToast({
        title: errorMsg.includes('No static resource') ? '暂无消息' : errorMsg,
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 格式化消息为页面所需的格式
  formatMessage(notif) {
    const normalizeBoolean = (value) => {
      if (value === true) return true;
      if (value === false) return false;
      if (value === null || value === undefined) return false;
      const raw = String(value).trim().toLowerCase();
      if (raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on') return true;
      if (raw === '0' || raw === 'false' || raw === 'no' || raw === 'off') return false;
      return false;
    };

    const CATEGORY = {
      system: { key: 'system', name: '系统通知' },
      activity: { key: 'activity', name: '活动通知' },
      signup: { key: 'signup', name: '报名通知' },
      manager: { key: 'manager', name: '管理通知' }
    };

    let category = CATEGORY.system.key;
    let categoryName = CATEGORY.system.name;

    let iconText = '🔔';
    let iconBg = '#DBEAFE';
    let iconColor = '#2563eb';
    let subTag = '';

    // 根据消息类型设置样式
    if (notif.type === 'publish_success') {
      category = CATEGORY.system.key;
      categoryName = CATEGORY.system.name;
      iconText = '✅';
      iconBg = '#DCFCE7';
      iconColor = '#047857';
      subTag = '发布成功';
    } else if (notif.type === 'publish_failed') {
      category = CATEGORY.system.key;
      categoryName = CATEGORY.system.name;
      iconText = '❌';
      iconBg = '#FEE2E2';
      iconColor = '#B91C1C';
      subTag = '发布失败';
    } else if (notif.type && notif.type.startsWith('signup_')) {
      category = CATEGORY.signup.key;
      categoryName = CATEGORY.signup.name;
      iconText = '📝';
      iconBg = '#DBEAFE';
      iconColor = '#2563eb';

      if (notif.type === 'signup_approved') {
        iconText = '✅';
        iconBg = '#DCFCE7';
        iconColor = '#047857';
        subTag = '审核通过';
      } else if (notif.type === 'signup_rejected') {
        iconText = '❌';
        iconBg = '#FEE2E2';
        iconColor = '#B91C1C';
        subTag = '审核未通过';
      } else {
        subTag = '报名通知';
      }
    } else if (notif.type && notif.type.startsWith('manager_')) {
      category = CATEGORY.manager.key;
      categoryName = CATEGORY.manager.name;
      iconText = '🛡️';
      iconBg = '#FEF3C7';
      iconColor = '#b45309';

      if (notif.type === 'manager_signup_closed') subTag = '报名截止';
      else if (notif.type && notif.type.startsWith('manager_pending_review_')) subTag = '待审核提醒';
      else if (notif.type === 'manager_activity_started') subTag = '活动已开始';
      else subTag = '管理提醒';
    } else if (notif.type === 'activity_reminder' || (notif.type && notif.type.startsWith('activity_'))) {
      category = CATEGORY.activity.key;
      categoryName = CATEGORY.activity.name;
      iconText = '📅';
      iconBg = '#DCFCE7';
      iconColor = '#047857';

      if (notif.type === 'activity_updated') subTag = '信息更新';
      else if (notif.type === 'activity_upcoming') subTag = '即将开始';
      else if (notif.type === 'activity_started') subTag = '已开始';
      else if (notif.type === 'activity_ended') subTag = '已结束';
      else subTag = '活动提醒';
    } else if (notif.type === 'system') {
      category = CATEGORY.system.key;
      categoryName = CATEGORY.system.name;
      iconText = '🔔';
      iconBg = '#DBEAFE';
      iconColor = '#2563eb';
      subTag = '系统通知';
    }

    const isRead = normalizeBoolean(notif.isRead);
    return {
      id: notif.id,
      title: notif.title,
      time: this.formatTime(notif.createdAt),
      content: notif.content,
      category,
      categoryName,
      iconText,
      iconBg,
      iconColor,
      subTag,
      isRead,
      expanded: false,
      activityId: notif.activityId
    };
  },

  // 格式化时间
  formatTime(isoString) {
    const now = new Date();
    const date = new Date(isoString);
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 1) return '今天';
    if (days < 2) return '昨天';
    if (days < 7) return `${days}天前`;

    // 超过7天显示具体日期
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  onFilterTap(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeFilter) {
      return;
    }
    this.updateMessages(key);
  },

  updateMessages(activeKey) {
    const messages = this.data.allMessages.filter(item => activeKey === 'all' || item.category === activeKey);
    const filters = this.data.filters.map(filter => Object.assign({}, filter, { active: filter.key === activeKey }));
    this.setData({ messages, filters, activeFilter: activeKey });
    this.updateUnreadBadge();
  },

  goBack() {
    const pages = getCurrentPages();

    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      // 没有上一页，跳转到"我的"页面
      wx.switchTab({ url: '/pages/profile/index' });
    }
  },

  // 点击消息卡片：展开/收起；首次点击未读时标记已读（不跳转）
  async onMessageTap(e) {
    const { id } = e.currentTarget.dataset;

    if (!id) {
      console.error('消息ID不存在');
      return;
    }

    const target = this.data.allMessages.find(m => m && m.id === id);
    const wasExpanded = !!(target && target.expanded);
    const wasRead = !!(target && target.isRead);

    this.updateMessageState(id, { expanded: !wasExpanded });

    if (wasRead) {
      return;
    }

    try {
      // 调用后端API标记消息为已读
      const result = await messageAPI.markAsRead(id);

      if (result.code === 0) {
        this.updateMessageState(id, { isRead: true });
      } else {
        wx.showToast({
          title: result.message || '操作失败',
          icon: 'none',
          duration: 1500
        });
      }
    } catch (error) {
      console.error('标记已读失败:', error);
      wx.showToast({
        title: '操作失败，请稍后重试',
        icon: 'none',
        duration: 1500
      });
    }
  },

  updateMessageState(id, patch) {
    const allMessages = (this.data.allMessages || []).map(m => {
      if (!m || m.id !== id) return m;
      return Object.assign({}, m, patch);
    });

    const activeKey = this.data.activeFilter || 'all';
    const messages = allMessages.filter(item => activeKey === 'all' || item.category === activeKey);
    const filters = this.data.filters.map(filter => Object.assign({}, filter, { active: filter.key === activeKey }));

    this.setData({ allMessages, messages, filters, activeFilter: activeKey });
    this.updateUnreadBadge();
  },

  updateUnreadBadge() {
    const unreadCount = (this.data.allMessages || []).filter(m => m && !m.isRead).length;
    if (unreadCount > 0) {
      wx.setTabBarBadge({
        index: 3,
        text: String(unreadCount)
      });
    } else {
      wx.removeTabBarBadge({ index: 3 });
    }
  },

  onViewActivityTap(e) {
    const { activityId } = e.currentTarget.dataset;
    if (!activityId) return;
    try {
      const { markActivityRead } = require('../../utils/activity-read.js');
      markActivityRead(activityId);
    } catch (e) {}
    wx.navigateTo({ url: `/pages/activities/detail?id=${activityId}` });
  },

  // 全部标记为已读
  async markAllRead() {
    // 游客模式下不允许操作
    if (!this.data.isLoggedIn) {
      this.showLoginGuide();
      return;
    }

    // 检查是否有未读消息
    const unreadMessages = this.data.allMessages.filter(m => !m.isRead);

    if (unreadMessages.length === 0) {
      wx.showToast({
        title: '暂无未读消息',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.showModal({
      title: '提示',
      content: `确定要将所有消息（${unreadMessages.length}条未读）标记为已读吗？`,
      confirmText: '确定',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中...' });

            // 调用后端API批量标记已读
            const result = await messageAPI.markAllAsRead();

            wx.hideLoading();

            if (result.code === 0) {
              const allMessages = (this.data.allMessages || []).map(m => Object.assign({}, m, { isRead: true }));
              const activeKey = this.data.activeFilter || 'all';
              const messages = allMessages.filter(item => activeKey === 'all' || item.category === activeKey);
              this.setData({ allMessages, messages });
              this.updateUnreadBadge();

              wx.showToast({
                title: '全部已读',
                icon: 'success',
                duration: 1500
              });
            } else {
              wx.showToast({
                title: result.message || '操作失败',
                icon: 'none',
                duration: 1500
              });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('批量标记已读失败:', error);
            wx.showToast({
              title: '操作失败，请稍后重试',
              icon: 'none',
              duration: 1500
            });
          }
        }
      }
    });
  },

  /**
   * 显示登录引导
   */
  showLoginGuide() {
    wx.showModal({
      title: '需要登录',
      content: '该功能需要登录后才能使用，是否前往登录？',
      confirmText: '去登录',
      cancelText: '暂不',
      confirmColor: '#3b82f6',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/auth/login'
          });
        }
      }
    });
  },

  /**
   * 游客点击登录按钮
   */
  goLogin() {
    wx.navigateTo({
      url: '/pages/auth/login'
    });
  }
});
