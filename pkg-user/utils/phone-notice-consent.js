const PRIVACY_POLICY_VERSION = '2025-12-31';
const CONSENT_STORAGE_KEY = 'consent_phone_notice';

function getStoredConsent() {
  try {
    const raw = wx.getStorageSync(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    if (typeof raw === 'string') return JSON.parse(raw);
    return raw;
  } catch (e) {
    return null;
  }
}

function hasValidConsent() {
  const consent = getStoredConsent();
  return !!(consent
    && consent.accepted === true
    && consent.policyVersion === PRIVACY_POLICY_VERSION);
}

function setConsent() {
  wx.setStorageSync(CONSENT_STORAGE_KEY, {
    accepted: true,
    policyVersion: PRIVACY_POLICY_VERSION,
    acceptedAt: new Date().toISOString()
  });
}

function clearConsent() {
  wx.removeStorageSync(CONSENT_STORAGE_KEY);
}

module.exports = {
  PRIVACY_POLICY_VERSION,
  CONSENT_STORAGE_KEY,
  getStoredConsent,
  hasValidConsent,
  setConsent,
  clearConsent
};

