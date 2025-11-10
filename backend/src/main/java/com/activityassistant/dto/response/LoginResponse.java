package com.activityassistant.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 登录响应DTO
 *
 * @author Claude
 * @since 2025-01-08
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "登录响应")
public class LoginResponse {

    @Schema(description = "JWT Token", example = "eyJhbGciOiJIUzUxMiJ9...")
    private String token;

    @Schema(description = "用户信息")
    private UserVO userInfo;
}
