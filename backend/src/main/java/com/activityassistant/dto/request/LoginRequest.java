package com.activityassistant.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 登录请求DTO
 *
 * @author Claude
 * @since 2025-01-08
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "登录请求")
public class LoginRequest {

    /**
     * 微信登录code（小程序端调用wx.login获得）
     * 开发环境：传"test_code_dev"即可
     */
    @NotBlank(message = "登录code不能为空")
    @Schema(description = "微信登录code（开发环境传test_code_dev）", example = "test_code_dev")
    private String code;
}
