// utils/notification.js
// 消息通知工具 - 用于管理系统消息通知

/**
 * 消息类型定义
 * - 'publish_success': 活动发布成功
 * - 'publish_failed': 活动发布失败
 * - 'activity_reminder': 活动提醒
 * - 'system': 系统通知
 */

const STORAGE_KEY = 'notifications';

/**
 * 消息数据结构
 * {
 *   id: '消息ID',
 *   type: '消息类型',
 *   title: '消息标题',
 *   content: '消息内容',
 *   activityId: '关联活动ID（可选）',
 *   activityTitle: '活动标题（可选）',
 *   isRead: false,
 *   createdAt: '创建时间（ISO字符串）'
 * }
 */

/**
 * 生成唯一ID
 */
function generateId() {
  return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 获取所有消息
 * @param {string} userId - 用户ID（可选，当前版本暂不使用）
 * @returns {array} 消息列表
 */
function getAllNotifications(userId = null) {
  try {
    const notifications = wx.getStorageSync(STORAGE_KEY) || [];
    // 按创建时间倒序排列（最新的在前）
    return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (e) {
    console.error('获取消息失败:', e);
    return [];
  }
}

/**
 * 获取未读消息数量
 * @returns {number} 未读消息数
 */
function getUnreadCount() {
  try {
    const notifications = getAllNotifications();
    return notifications.filter(n => !n.isRead).length;
  } catch (e) {
    console.error('获取未读消息数失败:', e);
    return 0;
  }
}

/**
 * 添加消息
 * @param {object} notification - 消息对象
 * @returns {object|null} 创建的消息对象或null
 */
function addNotification(notification) {
  try {
    const notifications = getAllNotifications();

    const newNotification = {
      id: generateId(),
      type: notification.type,
      title: notification.title,
      content: notification.content,
      activityId: notification.activityId || null,
      activityTitle: notification.activityTitle || null,
      isRead: false,
      createdAt: new Date().toISOString(),
      ...notification // 允许扩展其他字段
    };

    notifications.push(newNotification);
    wx.setStorageSync(STORAGE_KEY, notifications);

    console.log('消息添加成功:', newNotification);
    return newNotification;
  } catch (e) {
    console.error('添加消息失败:', e);
    return null;
  }
}

/**
 * 发送活动发布成功通知
 * @param {string} activityId - 活动ID
 * @param {string} activityTitle - 活动标题
 * @returns {object|null} 创建的消息对象
 */
function sendPublishSuccessNotification(activityId, activityTitle) {
  return addNotification({
    type: 'publish_success',
    title: '活动发布成功',
    content: `您的活动「${activityTitle}」已成功发布，快去查看吧！`,
    activityId,
    activityTitle
  });
}

/**
 * 发送活动发布失败通知
 * @param {string} activityId - 活动ID
 * @param {string} activityTitle - 活动标题
 * @param {string} reason - 失败原因
 * @returns {object|null} 创建的消息对象
 */
function sendPublishFailedNotification(activityId, activityTitle, reason = '未知错误') {
  return addNotification({
    type: 'publish_failed',
    title: '活动发布失败',
    content: `您的活动「${activityTitle}」发布失败，原因：${reason}。请手动重试。`,
    activityId,
    activityTitle,
    failedReason: reason
  });
}

/**
 * 发送活动提醒通知
 * @param {string} activityId - 活动ID
 * @param {string} activityTitle - 活动标题
 * @param {string} content - 提醒内容
 * @returns {object|null} 创建的消息对象
 */
function sendActivityReminderNotification(activityId, activityTitle, content) {
  return addNotification({
    type: 'activity_reminder',
    title: '活动提醒',
    content,
    activityId,
    activityTitle
  });
}

/**
 * 发送系统通知
 * @param {string} title - 标题
 * @param {string} content - 内容
 * @returns {object|null} 创建的消息对象
 */
function sendSystemNotification(title, content) {
  return addNotification({
    type: 'system',
    title,
    content
  });
}

/**
 * 标记消息为已读
 * @param {string} notificationId - 消息ID
 * @returns {boolean} 是否成功
 */
function markAsRead(notificationId) {
  try {
    const notifications = getAllNotifications();
    const notification = notifications.find(n => n.id === notificationId);

    if (!notification) {
      console.error('未找到消息:', notificationId);
      return false;
    }

    notification.isRead = true;
    wx.setStorageSync(STORAGE_KEY, notifications);
    return true;
  } catch (e) {
    console.error('标记已读失败:', e);
    return false;
  }
}

/**
 * 标记所有消息为已读
 * @returns {boolean} 是否成功
 */
function markAllAsRead() {
  try {
    const notifications = getAllNotifications();
    notifications.forEach(n => n.isRead = true);
    wx.setStorageSync(STORAGE_KEY, notifications);
    return true;
  } catch (e) {
    console.error('标记所有消息已读失败:', e);
    return false;
  }
}

/**
 * 删除消息
 * @param {string} notificationId - 消息ID
 * @returns {boolean} 是否成功
 */
function deleteNotification(notificationId) {
  try {
    const notifications = getAllNotifications();
    const filteredNotifications = notifications.filter(n => n.id !== notificationId);
    wx.setStorageSync(STORAGE_KEY, filteredNotifications);
    return true;
  } catch (e) {
    console.error('删除消息失败:', e);
    return false;
  }
}

/**
 * 清理旧消息
 * @param {number} daysToKeep - 保留最近几天的消息，默认30天
 * @returns {boolean} 是否成功
 */
function cleanupOldNotifications(daysToKeep = 30) {
  try {
    const notifications = getAllNotifications();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const filteredNotifications = notifications.filter(n => {
      const createdAt = new Date(n.createdAt);
      return createdAt > cutoffDate;
    });

    wx.setStorageSync(STORAGE_KEY, filteredNotifications);
    console.log('清理旧消息成功，保留', filteredNotifications.length, '条消息');
    return true;
  } catch (e) {
    console.error('清理旧消息失败:', e);
    return false;
  }
}

/**
 * 获取指定活动的相关消息
 * @param {string} activityId - 活动ID
 * @returns {array} 消息列表
 */
function getNotificationsByActivity(activityId) {
  const notifications = getAllNotifications();
  return notifications.filter(n => n.activityId === activityId);
}

module.exports = {
  getAllNotifications,
  getUnreadCount,
  addNotification,
  sendPublishSuccessNotification,
  sendPublishFailedNotification,
  sendActivityReminderNotification,
  sendSystemNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  cleanupOldNotifications,
  getNotificationsByActivity
};
