// pages/checkin/index.js
const { activities, registrations, checkinRecords } = require('../../utils/mock.js');
const { checkinAPI } = require('../../utils/api.js');
const { validateCheckinLocation, formatDistance } = require('../../utils/location.js');
const { isInCheckinWindow, isLate, formatDateTime } = require('../../utils/datetime.js');
const { formatCheckinStatus } = require('../../utils/formatter.js');
const { getCurrentUserId } = require('../../utils/user-helper.js');
const { submitGuard } = require('../../utils/submit-guard.js');

Page({
  data: {
    activityId: '',
    activity: null,
    activityStatusClass: '', // 活动状态的CSS类名
    checked: false,
    checkTime: '',
    currentLocation: null,
    currentAddr: '',
    withinRange: false,
    distance: 0,
    canCheckin: false,
    checkinMessage: '',
    records: [],
    checkedCount: 0,
    progress: 0,
    loading: false
  },

  // 状态映射函数
  getStatusClass(status) {
    const statusMap = {
      '进行中': 'status-ongoing',
      '已结束': 'status-finished',
      '未开始': 'status-upcoming',
      '报名中': 'status-ongoing'
    };
    return statusMap[status] || 'status-ongoing';
  },

  onLoad(options) {
    // ========== 【重要】登录前置检查 ==========
    // 签到需要登录，避免用户进入页面后才发现无权限
    const token = wx.getStorageSync('token');
    if (!token || token.trim().length === 0) {
      console.warn('用户未登录，无法签到');
      wx.showModal({
        title: '需要登录',
        content: '签到需要登录，请先登录后再试',
        confirmText: '去登录',
        cancelText: '返回',
        success: (res) => {
          if (res.confirm) {
            wx.showToast({
              title: '请退出小程序重新进入',
              icon: 'none',
              duration: 3000
            });
            setTimeout(() => {
              wx.navigateBack();
            }, 3000);
          } else {
            wx.navigateBack();
          }
        },
        fail: () => {
          wx.navigateBack();
        }
      });
      return; // 中止页面加载
    }
    // ========== 登录检查结束 ==========

    // 确保ID是字符串类型，并去除可能的空格
    const activityId = String(options.id || 'a1').trim();
    console.log('签到页接收到的原始 options:', options);
    console.log('处理后的活动 ID:', activityId, '类型:', typeof activityId);
    this.setData({ activityId });
    this.loadActivity(activityId);
    this.loadCheckinRecords(activityId);
    this.checkCurrentLocation();
  },

  // 加载活动信息
  async loadActivity(activityId) {
    try {
      // 调试信息：打印活动ID和活动列表
      console.log('正在查找活动 ID:', activityId);
      console.log('活动列表数量:', activities.length);
      console.log('活动列表ID:', activities.map(a => a.id));

      let activity = activities.find(a => a.id === activityId);

      // 如果严格匹配失败，尝试宽松匹配
      if (!activity) {
        console.warn('严格匹配失败，尝试宽松匹配...');
        activity = activities.find(a => String(a.id).trim() === String(activityId).trim());
      }

      // 如果还是失败，尝试不区分大小写匹配
      if (!activity) {
        console.warn('宽松匹配失败，尝试不区分大小写匹配...');
        activity = activities.find(a =>
          String(a.id).trim().toLowerCase() === String(activityId).trim().toLowerCase()
        );
      }

      if (!activity) {
        console.error('所有匹配方式都失败了！');
        console.error('查找的 ID:', activityId, '(类型:', typeof activityId, ')');
        console.error('可用的活动 IDs:', activities.map(a => ({
          id: a.id,
          idType: typeof a.id,
          title: a.title
        })));
        wx.showToast({ title: '活动不存在', icon: 'none' });
        return;
      }

      console.log('成功找到活动:', activity.title, '(匹配方式:', activity.id === activityId ? '严格' : '宽松', ')');

      // 获取状态对应的CSS类名
      const activityStatusClass = this.getStatusClass(activity.status);

      this.setData({
        activity,
        activityStatusClass
      });

      // 检查是否在签到时间窗口内
      const inWindow = isInCheckinWindow(activity.startTime, 30);
      const message = inWindow
        ? '可以签到'
        : '签到时间：活动开始前后30分钟内';

      this.setData({
        canCheckin: inWindow,
        checkinMessage: message
      });
    } catch (err) {
      console.error('加载活动失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 加载签到记录
  async loadCheckinRecords(activityId) {
    try {
      // 获取该活动的所有报名记录
      const activityRegs = registrations.filter(
        r => r.activityId === activityId && r.status === 'approved'
      );

      // 获取该活动的签到记录
      const activityCheckins = checkinRecords.filter(
        c => c.activityId === activityId
      );

      // 合并报名和签到信息
      const records = activityRegs.map((reg, index) => {
        const checkin = activityCheckins.find(c => c.registrationId === reg.id);
        return {
          id: reg.userId,
          name: reg.name,
          role: reg.userId === this.data.activity?.organizerId ? '组织者' : '',
          checked: !!checkin,
          time: checkin ? formatDateTime(checkin.checkinTime, 'HH:mm') : '',
          isLate: checkin ? checkin.isLate : false,
          avatar: `/activityassistant_avatar_0${(index % 4) + 1}.png`
        };
      });

      const checkedCount = records.filter(r => r.checked).length;
      const progress = activityRegs.length > 0
        ? Math.round((checkedCount / activityRegs.length) * 100)
        : 0;

      this.setData({
        records,
        checkedCount,
        progress
      });
    } catch (err) {
      console.error('加载签到记录失败:', err);
    }
  },

  // 检查当前位置
  async checkCurrentLocation() {
    const { activity } = this.data;
    if (!activity) return;

    this.setData({ loading: true });

    try {
      const result = await validateCheckinLocation(
        activity.latitude,
        activity.longitude,
        activity.checkinRadius
      );

      if (result.valid) {
        this.setData({
          withinRange: true,
          distance: result.distance,
          currentLocation: result.currentLocation,
          currentAddr: activity.address,
          checkinMessage: `您距离活动地点${formatDistance(result.distance)}，可以签到`
        });
      } else {
        this.setData({
          withinRange: false,
          distance: result.distance,
          currentLocation: result.currentLocation,
          checkinMessage: result.message
        });
      }
    } catch (err) {
      console.error('获取位置失败:', err);
      this.setData({
        checkinMessage: '获取位置失败，请检查定位权限'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 刷新位置
  refreshLocation() {
    this.checkCurrentLocation();
  },

  // 执行签到
  async doCheckin() {
    const {
      activityId,
      activity,
      withinRange,
      canCheckin,
      currentLocation,
      checked
    } = this.data;

    // 检查是否已签到
    if (checked) {
      wx.showToast({ title: '您已签到', icon: 'none' });
      return;
    }

    // 检查时间窗口
    if (!canCheckin) {
      wx.showToast({ title: '不在签到时间范围内', icon: 'none' });
      return;
    }

    // 检查位置
    if (!withinRange) {
      wx.showModal({
        title: '位置不符',
        content: '您当前不在签到范围内，是否继续签到？',
        success: (res) => {
          if (res.confirm) {
            this.submitCheckin();
          }
        }
      });
      return;
    }

    // 正常签到
    this.submitCheckin();
  },

  // 提交签到
  async submitCheckin() {
    const { activityId, activity, currentLocation, distance } = this.data;

    // 防重复提交：使用活动ID作为锁定标识
    const lockKey = `checkin:${activityId}`;

    return submitGuard.wrapAsync(
      lockKey,
      async () => {
        wx.showLoading({ title: '签到中...' });

        try {
          const now = new Date();
          const checkIsLate = isLate(now.toISOString(), activity.startTime, 10);

          // 获取当前用户ID
          const currentUserId = getCurrentUserId();

          const result = await checkinAPI.create({
            activityId,
            userId: currentUserId,
            registrationId: 'r1', // TODO: 应从报名记录获取
            latitude: currentLocation?.latitude || activity.latitude,
            longitude: currentLocation?.longitude || activity.longitude,
            address: activity.address,
            isLate: checkIsLate,
            isValid: this.data.withinRange,
            distance
          });

          wx.hideLoading();

          if (result.code === 0) {
            const checkTime = formatDateTime(now.toISOString(), 'HH:mm');
            this.setData({
              checked: true,
              checkTime
            });

            const message = checkIsLate ? '签到成功（迟到）' : '签到成功';
            wx.showToast({ title: message, icon: 'success' });

            // 重新加载签到记录
            setTimeout(() => {
              this.loadCheckinRecords(activityId);
            }, 1000);
          } else {
            wx.showToast({ title: result.message || '签到失败', icon: 'none' });
          }
        } catch (err) {
          wx.hideLoading();
          console.error('签到失败:', err);
          wx.showToast({ title: '签到失败，请重试', icon: 'none' });
        }
      },
      {
        lockTime: 5000, // 锁定5秒
        showTips: true,
        tipsMessage: '签到提交中，请勿重复操作'
      }
    );
  },

  // 打开地图
  openMap() {
    const { activity } = this.data;
    if (!activity) return;

    wx.openLocation({
      latitude: activity.latitude,
      longitude: activity.longitude,
      name: activity.place,
      address: activity.address,
      scale: 15
    });
  },

  // 分享
  share() {
    wx.showShareMenu({ withShareTicket: true });
  },

  // 返回
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.switchTab({ url: '/pages/home/index' });
    }
  },

  // 分享给好友
  onShareAppMessage() {
    const { activity, activityId } = this.data;
    return {
      title: `${activity?.title || '活动'} - 签到`,
      path: `/pages/checkin/index?id=${activityId}`
    };
  }
});
