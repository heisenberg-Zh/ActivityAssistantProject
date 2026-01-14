package com.activityassistant.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 系统配置：创建活动是否仅管理员可用
 */
@Data
public class UpdateCreateActivityAdminOnlyRequest {

    @NotNull
    private Boolean adminOnly;
}

