package com.activityassistant.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 黑名单条目（userId维度）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlacklistEntryVO {

    private String userId;

    private String nickname;

    private String avatar;

    private String phone;

    private String reason;

    private Boolean isActive;

    /**
     * 过期时间（ISO字符串），为空表示永久
     */
    private String expiresAt;

    private String addedAt;
}

