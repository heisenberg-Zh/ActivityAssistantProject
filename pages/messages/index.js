// pages/messages/index.js
const { messageAPI } = require('../../utils/api.js');
const notification = require('../../utils/notification.js');  // 保留用于初始化示例消息

const app = getApp();

Page({
  data: {
    filters: [
      { key: 'all', name: '全部', active: true },
      { key: 'publish', name: '发布通知', active: false },
      { key: 'system', name: '系统通知', active: false },
      { key: 'activity', name: '活动通知', active: false },
      { key: 'signup', name: '报名通知', active: false }
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
    try {
      wx.showLoading({ title: '加载中...' });

      // 从后端API获取消息列表
      const result = await messageAPI.getMyMessages({ page: 0, size: 100 });

      if (result.code !== 0) {
        throw new Error(result.message || '获取消息列表失败');
      }

      let notifications = result.data || [];  // 改为 let，允许重新赋值

      // 如果是第一次使用且没有消息，初始化一些示例消息
      if (notifications.length === 0) {
        this.initializeSampleMessages();
        // 重新获取消息（现在应该有示例消息了）
        const retryResult = await messageAPI.getMyMessages({ page: 0, size: 100 });
        notifications = retryResult.data || [];
      }

      // 转换为页面所需的格式
      const formattedMessages = notifications.map(notif => {
        return this.formatMessage(notif);
      });

      this.setData({
        allMessages: formattedMessages,
        messages: formattedMessages
      });

      this.updateMessages(this.data.activeFilter);

      wx.hideLoading();
    } catch (error) {
      console.error('加载消息列表失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 初始化示例消息（首次使用时）
  initializeSampleMessages() {
    console.log('初始化示例消息');

    // 添加欢迎消息
    notification.sendSystemNotification(
      '欢迎使用活动助手',
      '您已成功注册，现在可以开始创建和参与精彩活动了。'
    );

    // 添加功能介绍消息
    notification.sendSystemNotification(
      '新功能上线',
      '活动助手新增数据统计功能，现在可以查看详细的活动数据分析报告。'
    );
  },

  // 格式化消息为页面所需的格式
  formatMessage(notif) {
    let category = 'system';
    let iconText = '消';
    let iconBg = '#DBEAFE';
    let iconColor = '#2563eb';
    let tags = [];

    // 根据消息类型设置样式
    if (notif.type === 'publish_success') {
      category = 'publish';
      iconText = '发';
      iconBg = '#DCFCE7';
      iconColor = '#047857';
      tags.push({ name: '发布成功', bg: 'rgba(16,185,129,0.15)', color: '#047857' });
    } else if (notif.type === 'publish_failed') {
      category = 'publish';
      iconText = '失';
      iconBg = '#FEE2E2';
      iconColor = '#B91C1C';
      tags.push({ name: '发布失败', bg: 'rgba(239,68,68,0.15)', color: '#B91C1C' });
    } else if (notif.type === 'activity_reminder') {
      category = 'activity';
      iconText = '约';
      iconBg = '#DCFCE7';
      iconColor = '#047857';
      tags.push({ name: '活动提醒', bg: 'rgba(16,185,129,0.15)', color: '#047857' });
    } else if (notif.type === 'system') {
      category = 'system';
      iconText = '铃';
      iconBg = '#DBEAFE';
      iconColor = '#2563eb';
      tags.push({ name: '系统通知', bg: 'rgba(59,130,246,0.15)', color: '#1d4ed8' });
    }

    // 添加已读/未读标签
    if (notif.isRead) {
      tags.push({ name: '已读', bg: '#e5e7eb', color: '#4b5563' });
    } else {
      tags.push({ name: '未读', bg: '#ef4444', color: '#ffffff' });
    }

    return {
      id: notif.id,
      title: notif.title,
      time: this.formatTime(notif.createdAt),
      content: notif.content,
      category,
      iconText,
      iconBg,
      iconColor,
      tags,
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

    // 更新未读消息数量（从当前消息列表中计算）
    const unreadCount = this.data.allMessages.filter(m => {
      return m.tags.some(tag => tag.name === '未读');
    }).length;

    if (unreadCount > 0) {
      wx.setTabBarBadge({
        index: 3, // 假设消息中心是第4个tab（索引从0开始）
        text: String(unreadCount)
      });
    } else {
      wx.removeTabBarBadge({ index: 3 });
    }
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

  // 点击消息卡片
  async onMessageTap(e) {
    const { id, activityId } = e.currentTarget.dataset;

    if (!id) {
      console.error('消息ID不存在');
      return;
    }

    try {
      // 标记消息为已读（使用后端API）
      const result = await messageAPI.markAsRead(id);

      if (result.code === 0) {
        // 重新加载消息列表以更新UI
        await this.loadMessages();

        // 如果有关联的活动ID，跳转到活动详情页
        if (activityId) {
          wx.navigateTo({
            url: `/pages/activities/detail?id=${activityId}`
          });
        }
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
        title: '操作失败',
        icon: 'error',
        duration: 1500
      });
    }
  },

  // 全部标记为已读
  async markAllRead() {
    // 游客模式下不允许操作
    if (!this.data.isLoggedIn) {
      this.showLoginGuide();
      return;
    }

    // 检查是否有未读消息
    const unreadMessages = this.data.allMessages.filter(m => {
      return m.tags.some(tag => tag.name === '未读');
    });

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
              // 重新加载消息列表
              await this.loadMessages();

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
              title: '操作失败',
              icon: 'error',
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