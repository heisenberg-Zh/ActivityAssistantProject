// utils/default-images.js - 活动类型默认图片配置

/**
 * 活动类型默认图片映射
 * 图片规格：750x400px (16:9)
 * 风格：真实摄影风格
 * 注意：使用相对路径（相对于页面文件）
 */
const ACTIVITY_DEFAULT_IMAGES = {
  '聚会': '../../images/default-party.jpg',      // 温馨聚会场景
  '培训': '../../images/default-training.jpg',   // 专业培训场景
  '户外': '../../images/default-outdoor.jpg',    // 自然户外场景
  '运动': '../../images/default-sports.jpg',     // 网球运动场景（突出网球元素）
  '会议': '../../images/default-meeting.jpg',    // 商务会议场景
  '其他': '../../images/default-other.jpg'       // 通用活动场景
};

/**
 * 获取活动类型的默认图片
 * @param {String} type - 活动类型
 * @returns {String} 默认图片路径
 */
const getDefaultImageByType = (type) => {
  return ACTIVITY_DEFAULT_IMAGES[type] || ACTIVITY_DEFAULT_IMAGES['其他'];
};

/**
 * 获取活动图片（优先使用自定义图片，否则使用默认图片）
 * @param {String} customImage - 自定义图片路径
 * @param {String} type - 活动类型
 * @returns {String} 图片路径
 */
const getActivityImage = (customImage, type) => {
  // 如果有自定义图片，使用自定义图片
  if (customImage && customImage.trim() !== '') {
    return customImage;
  }

  // 否则使用默认图片
  return getDefaultImageByType(type);
};

module.exports = {
  ACTIVITY_DEFAULT_IMAGES,
  getDefaultImageByType,
  getActivityImage
};
