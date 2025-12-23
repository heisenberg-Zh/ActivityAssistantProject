// pages/profile/edit.js
const { userAPI, uploadAPI } = require('../../utils/api.js');
const { getSecureStorage } = require('../../utils/security.js');
const { requestCache } = require('../../utils/request-manager.js');
const app = getApp();

Page({
  data: {
    avatarUrl: '/activityassistant_avatar_01.png', // 默认头像
    avatarUrlRaw: '', // 保存用：不带缓存参数的URL
    nickname: '',
    phone: '',
    role: '', // 用户角色
    userId: '', // 用户ID
    canSave: true,
    hasChanges: false, // 是否有修改
    // 弹窗相关
    showNicknameModal: false,
    showPhoneModal: false,
    tempNickname: '',
    tempPhone: ''
  },

  onLoad() {
    this.loadUserInfo();
  },

  /**
   * 加载用户信息
   */
  async loadUserInfo() {
    try {
      // 使用 getSecureStorage 读取加密存储的 userId（兼容旧的普通存储）
      const userId = getSecureStorage('currentUserId') || wx.getStorageSync('currentUserId');

      if (!userId) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
        return;
      }

      // 从后端API获取用户完整信息
      const result = await userAPI.getProfile();

      if (result && result.data) {
        const userData = result.data;
        let rawAvatarUrl = (userData.avatar || '').split('?')[0];
        if (rawAvatarUrl.startsWith('wxfile://') || rawAvatarUrl.startsWith('http://tmp/')) {
          rawAvatarUrl = '';
        }
        this.setData({
          avatarUrl: rawAvatarUrl || '/activityassistant_avatar_01.png',
          avatarUrlRaw: rawAvatarUrl,
          nickname: userData.nickname || '',
          phone: userData.phone || '',
          role: this.getRoleText(userData.role),
          userId: userData.id || ''
        });

        console.log('加载用户信息成功:', { nickname: this.data.nickname, role: this.data.role, userId: this.data.userId });
      } else {
        // 如果API失败，从本地存储获取基本信息（兼容加密和普通存储）
        const userInfo = getSecureStorage('userInfo') || wx.getStorageSync('userInfo') || {};
        const userId = getSecureStorage('currentUserId') || wx.getStorageSync('currentUserId') || '';
        let rawAvatarUrl = (userInfo.avatarUrl || '').split('?')[0];
        if (rawAvatarUrl.startsWith('wxfile://') || rawAvatarUrl.startsWith('http://tmp/')) {
          rawAvatarUrl = '';
        }
        this.setData({
          avatarUrl: rawAvatarUrl || '/activityassistant_avatar_01.png',
          avatarUrlRaw: rawAvatarUrl,
          nickname: userInfo.nickName || '',
          phone: userInfo.phone || '',
          role: '用户', // 默认角色
          userId: userId
        });
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });

      // 降级处理：从本地存储获取（兼容加密和普通存储）
      const userInfo = getSecureStorage('userInfo') || wx.getStorageSync('userInfo') || {};
      const userId = getSecureStorage('currentUserId') || wx.getStorageSync('currentUserId') || '';
      let rawAvatarUrl = (userInfo.avatarUrl || '').split('?')[0];
      if (rawAvatarUrl.startsWith('wxfile://') || rawAvatarUrl.startsWith('http://tmp/')) {
        rawAvatarUrl = '';
      }
      this.setData({
        avatarUrl: rawAvatarUrl || '/activityassistant_avatar_01.png',
        avatarUrlRaw: rawAvatarUrl,
        nickname: userInfo.nickName || '',
        phone: userInfo.phone || '',
        role: '用户',
        userId: userId
      });
    }
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
   * 选择头像
   */
  async onChooseAvatar(e) {
    // 检查是否取消选择
    if (!e.detail.avatarUrl) {
      console.log('用户取消选择头像');
      return;
    }

    const { avatarUrl } = e.detail;
    console.log('选择头像，临时路径:', avatarUrl);

    try {
      // 显示上传提示
      wx.showLoading({
        title: '上传中...',
        mask: true
      });

      // 上传头像到服务器
      const uploadResult = await uploadAPI.uploadAvatar(avatarUrl);

      wx.hideLoading();

      if (uploadResult.code === 0) {
        // 使用服务器返回的URL
        const serverAvatarUrl = uploadResult.data.url;
        console.log('头像上传成功，服务器URL:', serverAvatarUrl);
        console.log('准备更新页面头像...');

        // 【关键修复】强制更新头像URL，添加时间戳避免缓存
        const urlWithTimestamp = serverAvatarUrl.includes('?')
          ? `${serverAvatarUrl}&t=${Date.now()}`
          : `${serverAvatarUrl}?t=${Date.now()}`;

        this.setData({
          avatarUrl: urlWithTimestamp,
          avatarUrlRaw: serverAvatarUrl,
          hasChanges: true
        }, () => {
          console.log('头像URL已更新到data:', this.data.avatarUrl);
        });

        wx.showToast({
          title: '头像已上传，请点击“保存”生效',
          icon: 'success',
          duration: 1500
        });
      } else {
        throw new Error('上传失败');
      }

    } catch (error) {
      wx.hideLoading();
      console.error('头像上传失败:', error);

      wx.showModal({
        title: '上传失败',
        content: error.message || '请重试',
        showCancel: false
      });

      // 恢复原头像
      this.loadUserInfo();
    }
  },

  /**
   * 头像加载失败处理
   */
  onAvatarError(e) {
    console.warn('头像加载失败:', e.detail);
    // 使用默认头像
    const defaultAvatar = '/activityassistant_avatar_01.png';
    if (this.data.avatarUrl !== defaultAvatar) {
      this.setData({
        avatarUrl: defaultAvatar
      });
    }
  },

  /**
   * 打开昵称编辑弹窗
   */
  editNickname() {
    this.setData({
      showNicknameModal: true,
      tempNickname: this.data.nickname
    });
  },

  /**
   * 关闭昵称编辑弹窗
   */
  closeNicknameModal() {
    this.setData({
      showNicknameModal: false
    });
  },

  /**
   * 临时昵称输入
   */
  onTempNicknameInput(e) {
    this.setData({
      tempNickname: e.detail.value
    });
  },

  /**
   * 确认昵称修改
   */
  confirmNickname() {
    const nickname = this.data.tempNickname.trim();

    if (!nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    this.setData({
      nickname,
      showNicknameModal: false,
      hasChanges: true
    });
  },

  /**
   * 打开手机号编辑弹窗
   */
  editPhone() {
    this.setData({
      showPhoneModal: true,
      tempPhone: this.data.phone
    });
  },

  /**
   * 关闭手机号编辑弹窗
   */
  closePhoneModal() {
    this.setData({
      showPhoneModal: false
    });
  },

  /**
   * 临时手机号输入
   */
  onTempPhoneInput(e) {
    this.setData({
      tempPhone: e.detail.value
    });
  },

  /**
   * 确认手机号修改
   */
  confirmPhone() {
    const phone = this.data.tempPhone.trim();

    // 如果填写了手机号，验证格式
    if (phone.length > 0) {
      const phonePattern = /^1[3-9]\d{9}$/;
      if (!phonePattern.test(phone)) {
        wx.showToast({
          title: '手机号格式不正确',
          icon: 'none'
        });
        return;
      }
    }

    this.setData({
      phone,
      showPhoneModal: false,
      hasChanges: true
    });
  },

  /**
   * 保存个人资料
   */
  async saveProfile() {
    if (!this.data.canSave) {
      return;
    }

    const { avatarUrl, avatarUrlRaw, nickname, phone } = this.data;

    // 验证昵称
    if (!nickname || nickname.trim().length === 0) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    // 验证手机号（如果填写了）
    if (phone && phone.trim().length > 0) {
      const phonePattern = /^1[3-9]\d{9}$/;
      if (!phonePattern.test(phone)) {
        wx.showToast({
          title: '手机号格式不正确',
          icon: 'none'
        });
        return;
      }
    }

    try {
      this.setData({ canSave: false });
      wx.showLoading({ title: '保存中...', mask: true });

      // 构建更新数据
      const updateData = {
        nickname: nickname.trim()
      };

      // 仅当存在可持久化的头像URL时才提交，避免误把默认头像/无效值覆盖到后端
      const cleanedAvatar = (avatarUrlRaw || '').split('?')[0].trim();
      if (cleanedAvatar) {
        updateData.avatar = cleanedAvatar;
      }

      // 只有填写了手机号才传递
      if (phone && phone.trim().length > 0) {
        updateData.phone = phone.trim();
      }

      // 调用后端API更新用户信息
      const result = await userAPI.updateProfile(updateData);

      if (result.code === 0) {
        // 更新成功后清理用户资料缓存，避免个人中心/编辑页命中旧数据（例如历史 wxfile://tmp 脏数据）
        try {
          const profileCacheKey = requestCache.generateKey('/api/user/profile', {});
          requestCache.clear(profileCacheKey);
        } catch (e) {
          // 忽略缓存清理失败
        }

        // 更新本地存储
        const userInfo = {
          nickName: result.data.nickname,
          avatarUrl: result.data.avatar,
          id: result.data.id,
          phone: result.data.phone || ''
        };

        wx.setStorageSync('userInfo', userInfo);

        // 更新全局数据
        app.globalData.userInfo = userInfo;

        // 强制刷新头像缓存
        app.globalData.avatarUrl = result.data.avatar;
        app.globalData.avatarUpdateTime = Date.now();

        wx.hideLoading();
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 2000
        });

        // 延迟返回上一页，确保数据已更新
        setTimeout(() => {
          // 通过 getCurrentPages 获取上一页实例并刷新数据
          const pages = getCurrentPages();
          const prevPage = pages[pages.length - 2];
          if (prevPage && prevPage.loadUserData) {
            prevPage.loadUserData(); // 触发上一页刷新
          }
          wx.navigateBack();
        }, 2000);
      } else {
        throw new Error(result.message || '保存失败');
      }
    } catch (error) {
      wx.hideLoading();
      console.error('保存失败:', error);

      wx.showModal({
        title: '保存失败',
        content: error.message || '请稍后重试',
        showCancel: false
      });

      this.setData({ canSave: true });
    }
  },

  /**
   * 页面卸载前提示
   */
  onUnload() {
    if (this.data.hasChanges && this.data.canSave) {
      // 有未保存的修改（但微信小程序不支持阻止返回，只能提示）
      console.log('有未保存的修改');
    }
  }
});
