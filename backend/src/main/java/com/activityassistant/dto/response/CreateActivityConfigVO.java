package com.activityassistant.dto.response;

import lombok.Builder;
import lombok.Data;

/**
 * 创建活动入口配置（首页按钮控制）
 */
@Data
@Builder
public class CreateActivityConfigVO {
    private boolean createActivityAdminOnly;
}

