package com.activityassistant.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 系统配置：审核模式开关。
 */
@Data
public class UpdateReviewModeEnabledRequest {

    @NotNull
    private Boolean enabled;
}
