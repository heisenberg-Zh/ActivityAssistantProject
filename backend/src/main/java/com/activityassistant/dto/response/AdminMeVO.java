package com.activityassistant.dto.response;

import lombok.Builder;
import lombok.Data;

/**
 * 系统管理员身份信息
 */
@Data
@Builder
public class AdminMeVO {
    private boolean systemAdmin;
}
