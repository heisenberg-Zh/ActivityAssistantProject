package com.activityassistant.dto.response;

import lombok.Builder;
import lombok.Data;

/**
 * 小程序功能开关配置。
 */
@Data
@Builder
public class CreateActivityConfigVO {
    private boolean createActivityAdminOnly;
    private boolean reviewModeEnabled;
}
