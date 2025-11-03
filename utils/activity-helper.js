// utils/activity-helper.js

/**
 * 过滤活动列表，根据用户权限和活动公开状态
 * @param {Array} activities - 活动列表
 * @param {String} currentUserId - 当前用户ID
 * @param {Array} userRegistrations - 用户的报名记录（可选）
 * @param {Object} options - 过滤选项
 * @param {Boolean} options.includeOwned - 是否包含用户创建的不公开活动（默认 false）
 * @returns {Array} 过滤后的活动列表
 */
function filterActivitiesByPermission(activities, currentUserId, userRegistrations = [], options = {}) {
  const { includeOwned = false } = options;

  return activities.filter(activity => {
    // 已删除的活动不显示
    if (activity.isDeleted) {
      return false;
    }

    // 如果活动是公开的，直接显示
    if (activity.isPublic) {
      return true;
    }

    // 不公开的活动，需要验证权限

    // 如果是创建者，且允许显示自己创建的活动
    if (includeOwned && activity.organizerId === currentUserId) {
      return true;
    }

    // 如果用户已经报名且审核通过，可以看到
    if (userRegistrations && userRegistrations.length > 0) {
      const hasApprovedRegistration = userRegistrations.some(
        reg => reg.activityId === activity.id && reg.status === 'approved'
      );
      if (hasApprovedRegistration) {
        return true;
      }
    }

    // 其他情况不显示
    return false;
  });
}

/**
 * 检查用户是否有权查看某个活动
 * @param {Object} activity - 活动对象
 * @param {String} currentUserId - 当前用户ID
 * @param {Array} userRegistrations - 用户的报名记录
 * @param {Boolean} fromShare - 是否通过分享链接访问
 * @returns {Object} { hasPermission: Boolean, reason: String }
 */
function checkActivityViewPermission(activity, currentUserId, userRegistrations = [], fromShare = false) {
  // 已删除的活动不可访问
  if (activity.isDeleted) {
    return { hasPermission: false, reason: '活动不存在或已删除' };
  }

  // 公开活动可以查看
  if (activity.isPublic) {
    return { hasPermission: true };
  }

  // 不公开的活动

  // 通过分享链接访问，允许查看
  if (fromShare) {
    return { hasPermission: true };
  }

  // 创建者可以查看
  if (activity.organizerId === currentUserId) {
    return { hasPermission: true };
  }

  // 已报名且审核通过的用户可以查看
  if (userRegistrations && userRegistrations.length > 0) {
    const hasApprovedRegistration = userRegistrations.some(
      reg => reg.activityId === activity.id && reg.status === 'approved'
    );
    if (hasApprovedRegistration) {
      return { hasPermission: true };
    }
  }

  // 无权限
  return { hasPermission: false, reason: '无权查看此私密活动' };
}

/**
 * 为活动添加标签（如"私密"标签）
 * @param {Object} activity - 活动对象
 * @param {String} currentUserId - 当前用户ID
 * @returns {Object} 带标签的活动对象
 */
function enrichActivityWithTags(activity, currentUserId) {
  const enriched = { ...activity };

  // 添加是否为自己创建的标识
  enriched.isOwned = activity.organizerId === currentUserId;

  // 添加私密标签
  if (!activity.isPublic && enriched.isOwned) {
    enriched.privacyTag = '私密';
  }

  return enriched;
}

module.exports = {
  filterActivitiesByPermission,
  checkActivityViewPermission,
  enrichActivityWithTags
};
