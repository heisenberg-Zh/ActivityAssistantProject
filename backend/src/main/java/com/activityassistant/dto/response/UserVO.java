package com.activityassistant.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 用户信息VO（视图对象）
 * 注意：敏感信息如手机号需要脱敏处理
 *
 * @author Claude
 * @since 2025-01-08
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "用户信息")
public class UserVO {

    @Schema(description = "用户ID", example = "u1")
    private String id;

    @Schema(description = "用户昵称", example = "张小北")
    private String nickname;

    @Schema(description = "头像URL", example = "/activityassistant_avatar_01.png")
    private String avatar;

    @Schema(description = "手机号（脱敏）", example = "138****8000")
    private String phone;

    @Schema(description = "用户角色", example = "user")
    private String role;

    @Schema(description = "创建时间")
    private LocalDateTime createdAt;

    @Schema(description = "最后登录时间")
    private LocalDateTime lastLoginAt;
}
