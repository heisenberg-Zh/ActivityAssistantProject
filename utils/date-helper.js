/**
 * 日期工具函数
 * 解决 iOS 日期格式兼容性问题
 */

/**
 * 解析日期字符串（兼容 iOS）
 * iOS Safari 不支持 "2025-12-21 09:00" 格式
 * 需要转换为 "2025/12/21 09:00" 格式
 *
 * @param {string} dateStr - 日期字符串
 * @returns {Date} Date 对象
 */
function parseDate(dateStr) {
  if (!dateStr) {
    return new Date();
  }

  // 如果已经是 Date 对象，直接返回
  if (dateStr instanceof Date) {
    return dateStr;
  }

  // 将所有的 "-" 替换为 "/"，iOS Safari 支持这种格式
  const formatted = String(dateStr).replace(/-/g, '/');
  return new Date(formatted);
}

/**
 * 格式化日期显示
 * @param {string|Date} date - 日期字符串或 Date 对象
 * @param {string} format - 格式化模板，默认 "YYYY-MM-DD HH:mm"
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm') {
  const d = parseDate(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 判断日期是否在指定范围内
 * @param {string|Date} date - 要检查的日期
 * @param {string|Date} startDate - 开始日期
 * @param {string|Date} endDate - 结束日期
 * @returns {boolean}
 */
function isDateInRange(date, startDate, endDate) {
  const d = parseDate(date);
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  return d >= start && d <= end;
}

/**
 * 计算两个日期之间的天数差
 * @param {string|Date} date1
 * @param {string|Date} date2
 * @returns {number} 天数差（绝对值）
 */
function daysBetween(date1, date2) {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);

  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

module.exports = {
  parseDate,
  formatDate,
  isDateInRange,
  daysBetween
};
