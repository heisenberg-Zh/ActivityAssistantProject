package com.activityassistant.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 活动已报名用户（用于白名单/黑名单选择添加）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisteredUserVO {

    private String userId;

    private String nickname;

    private String avatar;

    private String phone;

    /**
     * 报名状态：pending/approved
     */
    private String registrationStatus;

    private String registrationId;

    private LocalDateTime registeredAt;
}

