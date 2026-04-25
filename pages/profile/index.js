// pages/profile/index.js
const { userAPI, statisticsAPI, feedbackAPI, adminAPI } = require('../../utils/api.js');
const { sanitizeInput } = require('../../utils/security.js');
const { fixImageUrl } = require('../../utils/formatter.js');
const app = getApp();

// 统一菜单列表（按需求顺序排列）
// 注意：消息中心的badge数量会在页面加载时动态更新
const baseMenuLinks = [
  { key: 'my-activities', label: '我的活动', icon: '📋', bg: '#93c5fd', color: '#1e3a8a' },
  { key: 'messages', label: '消息中心', icon: '📬', bg: '#fca5a5', color: '#7f1d1d', badge: '' },
  { key: 'favorites', label: '我的收藏', icon: '⭐', bg: '#c4b5fd', color: '#4c1d95' },
  { key: 'feedback', label: '帮助与反馈', icon: '💬', bg: '#fcd34d', color: '#78350f' },
  { key: 'privacy', label: '隐私政策', icon: '🔒', bg: '#d8b4fe', color: '#581c87' },
];

const systemAdminMenuItem = { key: 'system-admin', label: '系统管理', icon: '🛡️', bg: '#c7d2fe', color: '#312e81' };

const buildMenuLinks = (isSystemAdmin) => {
  const links = baseMenuLinks.map(item => ({ ...item }));
  if (!isSystemAdmin) return links;

  const insertIndex = links.findIndex(item => item.key === 'privacy');
  if (insertIndex >= 0) {
    links.splice(insertIndex, 0, { ...systemAdminMenuItem });
  } else {
    links.push({ ...systemAdminMenuItem });
  }
  return links;
};

Page({
  data: {
    user: {
      name: '加载中...',
      role: '用户',
      id: '',
      tagline: '',
      initial: '',
      avatarUrl: '' // 添加头像URL字段
    },
    avatarReady: false,
    stats: [
      { label: '创建活动', value: 0, icon: '🎉', bg: '#93c5fd', color: '#1e3a8a' },
      { label: '参与活动', value: 0, icon: '📅', bg: '#86efac', color: '#14532d' },
      { label: '签到率', value: '0%', icon: '✅', bg: '#fca5a5', color: '#7f1d1d' }
    ],
    isSystemAdmin: false,
    menuLinks: buildMenuLinks(false),
    // 帮助与反馈弹窗相关
    showFeedbackModal: false,
    feedbackContent: '',
    feedbackCount: 0,
    // 加载状态
    loading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this._skipNextOnShowReload = true;
    this.loadUserData();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 首次进入页面时，onLoad 已经触发过一次加载，这里跳过一次避免重复请求
    if (this._skipNextOnShowReload) {
      this._skipNextOnShowReload = false;
    } else {
      this.loadUserData();
    }
    // 加载未读消息数量
    this.loadUnreadMessageCount();
  },

  /**
   * 角色码值转中文
   */
  getRoleText(role) {
    const roleMap = {
      'user': '普通用户',
      'organizer': '活动组织者',
      'admin': '管理员'
    };
    return roleMap[role] || '普通用户';
  },

  /**
   * 安全准备头像显示
   * 远程头像先预加载，成功后再显示，避免首次冷加载直接进入渲染链路
   */
  prepareAvatarDisplay(avatarUrl) {
    this._avatarLoadTaskId = (this._avatarLoadTaskId || 0) + 1;
    const taskId = this._avatarLoadTaskId;

    if (!avatarUrl) {
      this.setData({
        avatarReady: false,
        'user.avatarUrl': ''
      });
      return;
    }

    if (avatarUrl.startsWith('/')) {
      this.setData({
        avatarReady: true,
        'user.avatarUrl': avatarUrl
      });
      return;
    }

    wx.getImageInfo({
      src: avatarUrl,
      success: (res) => {
        if (taskId !== this._avatarLoadTaskId) {
          return;
        }

        this.setData({
          avatarReady: true,
          'user.avatarUrl': res.path || avatarUrl
        });
      },
      fail: (err) => {
        if (taskId !== this._avatarLoadTaskId) {
          return;
        }

        console.warn('头像预加载失败，降级为首字母头像:', err);
        this.setData({
          avatarReady: false,
          'user.avatarUrl': ''
        });
      }
    });
  },

  /**
   * 加载用户数据和统计信息
   */
  async loadUserData() {
    if (this._loadingUserData) {
      return;
    }

    this._loadingUserData = true;

    try {
      this.setData({ loading: true });

      // 检查登录状态和 token
      const token = wx.getStorageSync('token');
      const app = getApp();
      const isLoggedIn = app.checkLoginStatus();

      // 如果没有 token 且未登录，显示游客状态
      if (!token || !isLoggedIn) {
        console.log('👤 游客模式：显示游客状态');
        this.setData({
          user: {
            name: '游客',
            role: '点击登录按钮登录',
            id: '',
            tagline: '',
            initial: '游',
            avatarUrl: ''
          },
          avatarReady: false,
          stats: [
            { label: '创建活动', value: '-', icon: '🎉', bg: '#93c5fd', color: '#1e3a8a' },
            { label: '参与活动', value: '-', icon: '📅', bg: '#86efac', color: '#14532d' },
            { label: '签到率', value: '-', icon: '✅', bg: '#fca5a5', color: '#7f1d1d' }
          ],
          isSystemAdmin: false,
          menuLinks: buildMenuLinks(false),
          loading: false
        });
        return;
      }

      // 检查是否是Mock token（离线模式）
      const isMockMode = token.startsWith('mock_token_');

      if (isMockMode) {
        // 离线Mock模式：从本地存储读取数据
        console.log('📦 离线Mock模式：从本地存储加载数据');
        this.loadMockUserData();
      } else {
        const statsPromise = statisticsAPI.getMyStatistics({ showError: false })
          .catch((err) => {
            console.warn('加载个人统计失败，降级为保留当前统计数据:', err);
            return null;
          });

        const adminPromise = adminAPI.me()
          .catch((err) => {
            console.warn('加载管理员状态失败，降级为普通用户菜单:', err);
            return null;
          });

        // 在线模式：优先保证用户主信息加载成功，其他接口失败时降级
        const profileRes = await userAPI.getProfile();
        const [statsRes, adminRes] = await Promise.all([statsPromise, adminPromise]);

        const isSystemAdmin = adminRes && adminRes.code === 0 && adminRes.data && adminRes.data.systemAdmin === true;
        this.setData({
          isSystemAdmin,
          menuLinks: buildMenuLinks(isSystemAdmin)
        });

        // 处理用户信息
        if (profileRes && profileRes.data) {
          const userData = profileRes.data;
          // 对用户输入数据进行安全清理
          const userName = sanitizeInput(userData.nickname || '用户', { maxLength: 50 });

          // 处理头像URL：如果为空则使用默认头像
          let avatarUrl = userData.avatar || '';

          // 调试日志
          console.log('后端返回的头像URL:', avatarUrl);

          // 【修复】使用通用函数修复不完整的URL
          avatarUrl = fixImageUrl(avatarUrl);
          if (avatarUrl !== userData.avatar) {
            console.log('URL修复后:', avatarUrl);
          }

          // 如果头像URL为空，不设置（将显示首字母）
          // 如果想使用默认头像图片，可以设置为 '/activityassistant_avatar_01.png'

          this.setData({
            user: {
              name: userName,
              role: this.getRoleText(userData.role),
              id: userData.id || '',
              tagline: '', // 后端暂无此字段,保留为空
              initial: userName[0] || '用',
              avatarUrl: ''
            },
            avatarReady: false
          });

          this.prepareAvatarDisplay(avatarUrl);

          console.log('用户信息加载完成:', {
            name: userName,
            avatarUrl: avatarUrl,
            hasAvatar: !!avatarUrl
          });
        }

        // 处理统计数据
        if (statsRes && statsRes.data) {
          const statsData = statsRes.data;
          // 计算签到率格式
          const checkinRateValue = statsData.checkinRate !== undefined
            ? `${Math.round(statsData.checkinRate)}%`
            : '0%';

          this.setData({
            stats: [
              {
                label: '创建活动',
                value: statsData.createdActivities || 0,
                icon: '🎉',
                bg: '#93c5fd',
                color: '#1e3a8a'
              },
              {
                label: '参与活动',
                value: statsData.participatedActivities || 0,
                icon: '📅',
                bg: '#86efac',
                color: '#14532d'
              },
              {
                label: '签到率',
                value: checkinRateValue,
                icon: '✅',
                bg: '#fca5a5',
                color: '#7f1d1d'
              }
            ]
          });
        }
      }

      this.setData({ loading: false });
    } catch (error) {
      console.error('加载用户数据失败:', error);
      this.setData({ loading: false });

      // 根据错误类型显示不同提示
      let errorTitle = '加载数据失败';
      let errorMessage = '请稍后重试';
      let needRelogin = false;

      // 检查是否是认证错误
      if (error.statusCode === 401 || error.type === 'auth_error') {
        errorTitle = '登录已过期';
        errorMessage = '请重新登录';
        needRelogin = true;
      } else if (error.type === 'network_error') {
        errorMessage = '网络连接失败，尝试使用离线数据';
        // 尝试加载离线数据
        this.loadMockUserData();
        return;
      } else if (error.message && error.message.includes('用户不存在')) {
        errorTitle = '用户不存在';
        errorMessage = '该用户不存在，请重新登录';
        needRelogin = true;
      }

      // 显示错误提示
      if (needRelogin) {
        // 清除登录状态
        const app = getApp();
        app.clearUserInfo();

        // 显示游客状态
        this.setData({
          user: {
            name: '游客',
            role: '点击登录按钮登录',
            id: '',
            tagline: '',
            initial: '游',
            avatarUrl: ''
          },
          avatarReady: false,
          stats: [
            { label: '创建活动', value: '-', icon: '🎉', bg: '#93c5fd', color: '#1e3a8a' },
            { label: '参与活动', value: '-', icon: '📅', bg: '#86efac', color: '#14532d' },
            { label: '签到率', value: '-', icon: '✅', bg: '#fca5a5', color: '#7f1d1d' }
          ]
        });

        wx.showToast({
          title: '登录已过期，请重新登录',
          icon: 'none',
          duration: 2000
        });
      } else {
        wx.showToast({
          title: errorTitle,
          icon: 'none',
          duration: 2000
        });

        // 设置游客状态
        this.setData({
          user: {
            name: '游客',
            role: '点击登录按钮登录',
            id: '',
            tagline: '',
            initial: '游',
            avatarUrl: ''
          },
          avatarReady: false,
          stats: [
            { label: '创建活动', value: '-', icon: '🎉', bg: '#93c5fd', color: '#1e3a8a' },
            { label: '参与活动', value: '-', icon: '📅', bg: '#86efac', color: '#14532d' },
            { label: '签到率', value: '-', icon: '✅', bg: '#fca5a5', color: '#7f1d1d' }
          ]
        });
      }
    } finally {
      this._loadingUserData = false;
    }
  },

  /**
   * 加载Mock用户数据（离线模式）
   */
  loadMockUserData() {
    console.log('📦 加载离线Mock数据');

    try {
      // 从本地存储读取用户信息
      const currentUser = wx.getStorageSync('currentUser') || {
        id: 'u1',
        name: 'Test User',
        avatar: '/activityassistant_avatar_01.png'
      };

      const currentUserId = wx.getStorageSync('currentUserId') || 'u1';

      this.setData({
        user: {
          name: currentUser.name || 'Test User',
          role: '活动组织者（离线）',
          id: currentUserId,
          tagline: '',
          initial: (currentUser.name || 'T')[0],
          avatarUrl: ''
        },
        avatarReady: false,
        stats: [
          { label: '创建活动', value: 12, icon: '🎉', bg: '#93c5fd', color: '#1e3a8a' },
          { label: '参与活动', value: 25, icon: '📅', bg: '#86efac', color: '#14532d' },
          { label: '签到率', value: '95%', icon: '✅', bg: '#fca5a5', color: '#7f1d1d' }
        ],
        isSystemAdmin: false,
        menuLinks: buildMenuLinks(false),
        loading: false
      });

      this.prepareAvatarDisplay(currentUser.avatar || '/activityassistant_avatar_01.png');

      console.log('✅ 离线数据加载成功');
    } catch (err) {
      console.error('加载离线数据失败:', err);
    }
  },

  /**
   * 加载未读消息数量（从后端API获取）
   */
  async loadUnreadMessageCount() {
    try {
      const token = wx.getStorageSync('token');
      const isLoggedIn = app.checkLoginStatus && app.checkLoginStatus();
      if (!token || !isLoggedIn) {
        const updatedMenuLinks = this.data.menuLinks.map(item => {
          if (item.key === 'messages') {
            return { ...item, badge: '' };
          }
          return item;
        });
        this.setData({ menuLinks: updatedMenuLinks });
        return;
      }

      const { messageAPI } = require('../../utils/api.js');

      // 从后端API获取消息列表
      const result = await messageAPI.getMyMessages({ page: 0, size: 100 });

      if (result.code === 0 && result.data) {
        // 兼容多种后端数据格式
        let notifications = [];

        if (Array.isArray(result.data)) {
          notifications = result.data;
        } else if (result.data.content && Array.isArray(result.data.content)) {
          notifications = result.data.content;
        } else if (result.data.list && Array.isArray(result.data.list)) {
          notifications = result.data.list;
        }

        // 计算未读消息数量
        const unreadCount = notifications.filter(msg => !msg.isRead).length;

        // 更新菜单列表中的消息徽章
        const updatedMenuLinks = this.data.menuLinks.map(item => {
          if (item.key === 'messages') {
            return {
              ...item,
              badge: unreadCount > 0 ? String(unreadCount) : ''
            };
          }
          return item;
        });

        this.setData({ menuLinks: updatedMenuLinks });

        console.log(`📬 未读消息数量: ${unreadCount}`);
      }
    } catch (err) {
      console.error('加载未读消息数量失败:', err);
      // 失败时清空徽章
      const updatedMenuLinks = this.data.menuLinks.map(item => {
        if (item.key === 'messages') {
          return { ...item, badge: '' };
        }
        return item;
      });
      this.setData({ menuLinks: updatedMenuLinks });
    }
  },

  handleMenu(e) {
    const key = e.currentTarget.dataset.key;

    // 检查是否已登录
    const app = getApp();
    const isLoggedIn = app.checkLoginStatus();

    // 需要登录才能访问的功能
    const requireLoginFeatures = ['my-activities', 'messages', 'favorites', 'system-admin'];

    if (!isLoggedIn && requireLoginFeatures.includes(key)) {
      // 显示登录引导
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
      return;
    }

    // 已登录或不需要登录的功能，正常处理
    switch (key) {
      case 'my-activities':
        this.goMyActivities();
        break;
      case 'messages':
        this.goMessages();
        break;
      case 'favorites':
        this.goFavorites();
        break;
      case 'system-admin':
        wx.navigateTo({ url: '/pages/admin/index' });
        break;
      case 'feedback':
        this.showFeedback();
        break;
      case 'privacy':
        wx.navigateTo({ url: '/pages/policy/index' });
        break;
      default:
        break;
    }
  },

  goEditProfile() {
    wx.navigateTo({ url: '/pkg-user/profile-edit/index' });
  },

  goMyActivities() {
    wx.navigateTo({ url: '/pages/my-activities/index' });
  },

  goMessages() {
    wx.navigateTo({ url: '/pages/messages/index' });
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/index' });
  },

  goFavorites() {
    wx.navigateTo({ url: '/pages/favorites/index' });
  },

  // 显示帮助与反馈弹窗
  showFeedback() {
    this.setData({
      showFeedbackModal: true,
      feedbackContent: '',
      feedbackCount: 0
    });
  },

  // 关闭反馈弹窗
  closeFeedbackModal() {
    this.setData({ showFeedbackModal: false });
  },

  // 处理反馈内容输入
  onFeedbackInput(e) {
    const content = e.detail.value;
    this.setData({
      feedbackContent: content,
      feedbackCount: content.length
    });
  },

  // 提交反馈
  async submitFeedback() {
    const { feedbackContent } = this.data;

    if (!feedbackContent.trim()) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' });
      return;
    }

    if (feedbackContent.trim().length < 5) {
      wx.showToast({ title: '反馈内容至少5个字', icon: 'none' });
      return;
    }

    try {
      // 调用后端API提交反馈
      const result = await feedbackAPI.submit({
        content: feedbackContent.trim()
      });

      if (result.code === 0) {
        // 关闭弹窗并提示成功
        this.setData({ showFeedbackModal: false });
        wx.showToast({
          title: result.message || '提交成功，感谢您的反馈！',
          icon: 'success',
          duration: 2000
        });
      } else {
        wx.showToast({
          title: result.message || '提交失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    } catch (err) {
      console.error('提交反馈失败:', err);
      wx.showToast({
        title: '提交失败，请稍后重试',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 退出登录
   */
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？退出后可以游客身份继续浏览。',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          // 显示加载提示
          wx.showLoading({
            title: '退出中...',
            mask: true
          });

          // 清除用户信息和登录状态
          const app = getApp();
          app.clearUserInfo();

          // 清除token
          wx.removeStorageSync('token');

          // 可选：清除其他本地缓存（活动草稿、收藏等）
          try {
            wx.removeStorageSync('activity_draft');
            wx.removeStorageSync('favorites');
            wx.removeStorageSync('recent_viewed');
          } catch (err) {
            console.error('清除本地缓存失败:', err);
          }

          // 关闭加载提示
          wx.hideLoading();

          // 提示退出成功
          wx.showToast({
            title: '已退出，当前为游客模式',
            icon: 'success',
            duration: 2000
          });

          // 刷新当前页面，显示游客状态（不跳转）
          setTimeout(() => {
            this.setData({
              user: {
                name: '游客',
                role: '点击登录按钮登录',
                id: '',
                tagline: '',
                initial: '游',
                avatarUrl: ''
              },
              avatarReady: false,
              stats: [
                { label: '创建活动', value: '-', icon: '🎉', bg: '#93c5fd', color: '#1e3a8a' },
                { label: '参与活动', value: '-', icon: '📅', bg: '#86efac', color: '#14532d' },
                { label: '签到率', value: '-', icon: '✅', bg: '#fca5a5', color: '#7f1d1d' }
              ],
              loading: false
            });
          }, 500);
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
  },

  /**
   * 头像加载失败处理
   */
  onAvatarError(e) {
    console.warn('头像加载失败:', e.detail);
    // 头像加载失败时，清除 avatarUrl，显示首字母
    if (this.data.user.avatarUrl) {
      this.setData({
        avatarReady: false,
        'user.avatarUrl': ''
      });
    }
  }
});
