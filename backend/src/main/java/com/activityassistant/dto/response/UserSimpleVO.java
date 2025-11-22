package com.activityassistant.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户简要信息VO
 *
 * @author Claude
 * @since 2025-01-22
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSimpleVO {

    /**
     * 用户ID
     */
    private String id;

    /**
     * 昵称
     */
    private String nickname;

    /**
     * 头像URL
     */
    private String avatar;

    /**
     * 手机号（可选）
     */
    private String phone;
}
