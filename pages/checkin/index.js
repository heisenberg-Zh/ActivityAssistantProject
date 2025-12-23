// pages/checkin/index.js
const { activityAPI, checkinAPI, registrationAPI } = require('../../utils/api.js');
const { validateCheckinLocation, formatDistance } = require('../../utils/location.js');
const { isInCheckinWindow, isLate, formatDateTime } = require('../../utils/datetime.js');
const { formatCheckinStatus, calculateActivityStatus } = require('../../utils/formatter.js');
const { getCurrentUserId } = require('../../utils/user-helper.js');
const { submitGuard } = require('../../utils/submit-guard.js');

Page({
  data: {
    activityId: '',
    activity: null,
    activityStatusClass: '', // 活动状态的CSS类名
    registrationId: '', // 用户的报名ID
    hasRegistered: false, // 是否已报名
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
        confirmColor: '#3b82f6',
        success: (res) => {
          if (res.confirm) {
            // 直接跳转到登录页面
            wx.navigateTo({
              url: '/pages/auth/login'
            });
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
    this.loadRegistration(activityId); // 加载用户报名信息
    this.loadCheckinRecords(activityId);
    this.checkCurrentLocation();
  },

  // 加载活动信息
  async loadActivity(activityId) {
    try {
      console.log('正在加载活动详情 ID:', activityId);
      wx.showLoading({ title: '加载中...' });

      // 从后端API获取活动详情
      const result = await activityAPI.getDetail(activityId);

      if (result.code !== 0 || !result.data) {
        console.error('获取活动详情失败:', result.message || '未知错误');
        wx.hideLoading();
        wx.showToast({
          title: result.message || '活动不存在',
          icon: 'none'
        });
        return;
      }

      const activity = result.data;
      console.log('成功加载活动:', activity.title);

      // 动态计算活动状态（根据时间）
      if (activity) {
        activity.status = calculateActivityStatus(activity);
      }

      // 获取状态对应的CSS类名
      const activityStatusClass = this.getStatusClass(activity.status);

      this.setData({
        activity,
        activityStatusClass
      });

      wx.hideLoading();

      // 检查是否在签到时间窗口内（活动开始前30分钟 至 活动结束时间）
      const inWindow = isInCheckinWindow(activity.startTime, 30, activity.endTime);

      // 【调试】输出签到时间检查详情
      console.log('===== 签到时间检查 =====');
      console.log('活动标题:', activity.title);
      console.log('活动状态:', activity.status);
      console.log('开始时间 (startTime):', activity.startTime);
      console.log('结束时间 (endTime):', activity.endTime);
      console.log('当前时间:', new Date().toISOString());
      console.log('签到窗口开始:', new Date(new Date(activity.startTime).getTime() - 30 * 60 * 1000).toISOString());
      console.log('签到窗口结束:', activity.endTime);
      console.log('是否在签到窗口内 (inWindow):', inWindow);
      console.log('======================');

      const message = inWindow
        ? '可以签到'
        : '签到时间：活动开始前30分钟至活动结束';

      this.setData({
        canCheckin: inWindow,
        checkinMessage: message
      });
    } catch (err) {
      console.error('加载活动信息失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 加载用户报名信息
  async loadRegistration(activityId) {
    try {
      const currentUserId = getCurrentUserId();

      // 调用API获取用户在此活动的报名记录
      const result = await registrationAPI.getByActivity(activityId, {
        page: 0,
        size: 100
      });

      if (result.code === 0) {
        const registrations = result.data.content || result.data || [];

        // 查找当前用户的报名记录（status为approved）
        const myRegistration = registrations.find(r =>
          r.userId === currentUserId && r.status === 'approved'
        );

        if (myRegistration) {
          this.setData({
            registrationId: myRegistration.id,
            hasRegistered: true
          });
          console.log('找到报名记录，registrationId:', myRegistration.id);
        } else {
          this.setData({
            registrationId: '',
            hasRegistered: false,
            canCheckin: false,
            checkinMessage: '您还未报名此活动，无法签到'
          });
          console.warn('未找到报名记录或报名未通过审核');
        }
      }
    } catch (err) {
      console.error('加载报名信息失败:', err);
      this.setData({
        registrationId: '',
        hasRegistered: false
      });
    }
  },

  // 加载签到记录
  async loadCheckinRecords(activityId) {
    try {
      // 并行请求：获取活动的所有报名记录和签到记录
      const [registrationsResult, checkinsResult] = await Promise.all([
        registrationAPI.getByActivity(activityId, { page: 0, size: 100 }),
        checkinAPI.getByActivity(activityId, { page: 0, size: 100 })
      ]);

      // 获取该活动的所有已审核通过的报名记录
      const activityRegs = registrationsResult.code === 0
        ? (registrationsResult.data.content || registrationsResult.data || []).filter(r => r.status === 'approved')
        : [];

      // 获取该活动的签到记录
      const activityCheckins = checkinsResult.code === 0
        ? (checkinsResult.data.content || checkinsResult.data || [])
        : [];

      console.log(`活动${activityId}报名人数: ${activityRegs.length}, 签到人数: ${activityCheckins.length}`);

      // 【关键修复】获取当前用户ID，检查当前用户是否已签到
      const currentUserId = getCurrentUserId();
      const { registrationId } = this.data;

      // 查找当前用户的签到记录
      let myCheckin = null;
      if (registrationId) {
        myCheckin = activityCheckins.find(c => c.registrationId === registrationId);
      }

      // 如果没有通过 registrationId 找到，尝试通过 userId 查找
      if (!myCheckin && currentUserId) {
        myCheckin = activityCheckins.find(c => c.userId === currentUserId);
      }

      console.log('===== 当前用户签到状态 =====');
      console.log('当前用户ID:', currentUserId);
      console.log('报名ID:', registrationId);
      console.log('我的签到记录:', myCheckin);
      console.log('是否已签到:', !!myCheckin);
      console.log('=========================');

      // 【关键修复】更新当前用户的签到状态
      if (myCheckin) {
        this.setData({
          checked: true,
          checkTime: formatDateTime(myCheckin.checkinTime, 'HH:mm')
        });
      } else {
        this.setData({
          checked: false,
          checkTime: ''
        });
      }

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
      // 失败时设置空数据，避免页面显示异常
      this.setData({
        records: [],
        checkedCount: 0,
        progress: 0
      });
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
      checked,
      hasRegistered,
      registrationId
    } = this.data;

    // 【优先级1】检查是否已签到
    if (checked) {
      wx.showToast({ title: '您已签到', icon: 'none' });
      return;
    }

    // 【优先级2】检查是否已报名且审核通过
    if (!hasRegistered || !registrationId) {
      wx.showToast({
        title: '您还未报名此活动或报名未审核通过',
        icon: 'none',
        duration: 2500
      });
      return;
    }

    // 【优先级3】检查时间窗口
    if (!canCheckin) {
      // 计算更详细的时间提示
      const now = new Date();
      const startTime = new Date(activity.startTime);
      const endTime = activity.endTime ? new Date(activity.endTime) : null;
      const checkinStartTime = new Date(startTime.getTime() - 30 * 60 * 1000);

      let timeMessage = '不在签到时间范围内';

      if (now < checkinStartTime) {
        // 签到未开始
        const minutes = Math.ceil((checkinStartTime - now) / (60 * 1000));
        if (minutes > 60) {
          const hours = Math.floor(minutes / 60);
          timeMessage = `签到将在活动开始前30分钟开放（约${hours}小时后）`;
        } else {
          timeMessage = `签到将在活动开始前30分钟开放（约${minutes}分钟后）`;
        }
      } else if (endTime && now > endTime) {
        // 签到已结束
        timeMessage = '签到时间已过，活动已结束';
      } else {
        // 其他情况
        timeMessage = '不在签到时间范围内（活动开始前30分钟至活动结束）';
      }

      console.log('签到时间检查失败:', timeMessage);
      wx.showToast({ title: timeMessage, icon: 'none', duration: 2500 });
      return;
    }

    // 【优先级4】检查位置
    if (!withinRange) {
      wx.showModal({
        title: '位置不符',
        content: `您当前不在签到范围内。是否继续签到？`,
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
    const { activityId, activity, currentLocation, distance, hasRegistered, registrationId } = this.data;

    // 检查是否已报名
    if (!hasRegistered || !registrationId) {
      wx.showToast({
        title: '您还未报名此活动，无法签到',
        icon: 'none',
        duration: 2000
      });
      return;
    }

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
            registrationId, // 使用从报名记录中获取的registrationId
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
            // 【关键修复】根据后端返回的错误信息，显示恰当的提示
            let errorMessage = result.message || '签到失败';

            // 常见错误信息映射，提供更友好的提示
            if (errorMessage.includes('已签到') || errorMessage.includes('重复签到')) {
              errorMessage = '您已签到，无需重复签到';
            } else if (errorMessage.includes('未报名')) {
              errorMessage = '您还未报名此活动';
            } else if (errorMessage.includes('未审核') || errorMessage.includes('审核')) {
              errorMessage = '您的报名申请尚未通过审核';
            } else if (errorMessage.includes('时间') || errorMessage.includes('范围')) {
              errorMessage = '不在签到时间范围内';
            } else if (errorMessage.includes('位置') || errorMessage.includes('距离')) {
              errorMessage = '您不在签到范围内';
            }

            console.log('签到失败 - 错误码:', result.code, '错误信息:', result.message);
            console.log('显示给用户的提示:', errorMessage);

            wx.showToast({
              title: errorMessage,
              icon: 'none',
              duration: 2500
            });
          }
        } catch (err) {
          wx.hideLoading();
          console.error('签到请求异常:', err);

          // 【修复】捕获异常时也要显示恰当的提示
          let errorMessage = '签到失败，请重试';

          // 如果异常对象包含错误信息，尝试提取
          if (err && err.message) {
            if (err.message.includes('已签到') || err.message.includes('重复签到')) {
              errorMessage = '您已签到，无需重复签到';
            } else if (err.message.includes('网络') || err.message.includes('timeout')) {
              errorMessage = '网络连接失败，请检查网络后重试';
            }
          }

          wx.showToast({
            title: errorMessage,
            icon: 'none',
            duration: 2500
          });
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
    const pages = getCurrentPages();

    if (pages.length > 1) {
      // 有上一页，返回上一页
      wx.navigateBack({ delta: 1 });
    } else {
      // 没有上一页，跳转到活动列表
      wx.switchTab({ url: '/pages/activities/list' });
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
