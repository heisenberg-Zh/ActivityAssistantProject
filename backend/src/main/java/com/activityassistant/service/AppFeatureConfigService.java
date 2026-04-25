package com.activityassistant.service;

import com.activityassistant.dto.response.CreateActivityConfigVO;
import com.activityassistant.model.SystemSetting;
import com.activityassistant.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Locale;

/**
 * 应用功能开关配置服务。
 */
@Service
@RequiredArgsConstructor
public class AppFeatureConfigService {

    public static final String KEY_CREATE_ACTIVITY_ADMIN_ONLY = "create_activity_admin_only";
    public static final String KEY_REVIEW_MODE_ENABLED = "review_mode_enabled";

    private final SystemSettingRepository systemSettingRepository;

    public CreateActivityConfigVO getCreateActivityConfig() {
        return CreateActivityConfigVO.builder()
                .createActivityAdminOnly(isCreateActivityAdminOnlyEnabled())
                .reviewModeEnabled(isReviewModeEnabled())
                .build();
    }

    public boolean isCreateActivityAdminOnlyEnabled() {
        return getBooleanSetting(KEY_CREATE_ACTIVITY_ADMIN_ONLY);
    }

    public boolean isReviewModeEnabled() {
        return getBooleanSetting(KEY_REVIEW_MODE_ENABLED);
    }

    public CreateActivityConfigVO updateCreateActivityAdminOnly(boolean enabled) {
        saveBooleanSetting(KEY_CREATE_ACTIVITY_ADMIN_ONLY, enabled);
        return getCreateActivityConfig();
    }

    public CreateActivityConfigVO updateReviewModeEnabled(boolean enabled) {
        saveBooleanSetting(KEY_REVIEW_MODE_ENABLED, enabled);
        return getCreateActivityConfig();
    }

    private boolean getBooleanSetting(String key) {
        return systemSettingRepository.findById(key)
                .map(SystemSetting::getSettingValue)
                .map(AppFeatureConfigService::isTruthy)
                .orElse(false);
    }

    private void saveBooleanSetting(String key, boolean enabled) {
        String value = enabled ? "1" : "0";
        SystemSetting setting = systemSettingRepository.findById(key)
                .orElse(SystemSetting.builder()
                        .settingKey(key)
                        .settingValue(value)
                        .updatedAt(LocalDateTime.now())
                        .build());
        setting.setSettingValue(value);
        systemSettingRepository.save(setting);
    }

    private static boolean isTruthy(String value) {
        if (value == null) {
            return false;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return "1".equals(normalized)
                || "true".equals(normalized)
                || "on".equals(normalized)
                || "yes".equals(normalized);
    }
}
