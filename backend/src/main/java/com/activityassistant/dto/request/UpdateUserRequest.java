package com.activityassistant.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 更新用户信息请求DTO
 *
 * @author Claude
 * @since 2025-01-08
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "更新用户信息请求")
public class UpdateUserRequest {

    @Schema(description = "用户昵称", example = "张小北")
    private String nickname;

    @Schema(description = "头像URL", example = "/activityassistant_avatar_01.png")
    private String avatar;

    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    @Schema(description = "手机号", example = "13800138000")
    private String phone;
}
