const tryGetCurrentUserId = () => {
  const app = getApp ? getApp() : null;
  let userId = app && app.globalData ? app.globalData.currentUserId : null;
  if (userId && String(userId).trim().length > 0) return String(userId).trim();

  try {
    const { getSecureStorage } = require('./security.js');
    userId = getSecureStorage('currentUserId');
    if (userId && String(userId).trim().length > 0) return String(userId).trim();
  } catch (e) {}

  userId = wx.getStorageSync('currentUserId');
  if (userId && String(userId).trim().length > 0) return String(userId).trim();
  return null;
};

const getStorageKey = () => {
  const userId = tryGetCurrentUserId();
  if (!userId) return null;
  return `activity_reads:${userId}`;
};

const safeParse = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
};

const getReadMap = () => {
  const key = getStorageKey();
  if (!key) return {};
  const raw = wx.getStorageSync(key);
  const parsed = safeParse(raw, {});
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
};

const setReadMap = (map) => {
  const key = getStorageKey();
  if (!key) return;
  try {
    wx.setStorageSync(key, JSON.stringify(map || {}));
  } catch (e) {}
};

const isActivityRead = (activityId, readMap) => {
  if (!activityId) return false;
  const map = readMap || getReadMap();
  return !!map[String(activityId)];
};

const markActivityRead = (activityId) => {
  if (!activityId) return;
  const key = getStorageKey();
  if (!key) return;

  const map = getReadMap();
  map[String(activityId)] = Date.now();
  setReadMap(map);
};

module.exports = {
  getReadMap,
  isActivityRead,
  markActivityRead
};

