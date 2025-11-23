package com.activityassistant.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

/**
 * 添加管理员请求DTO
 *
 * @author Claude
 * @since 2025-01-22
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddAdministratorRequest {

    /**
     * 用户ID
     */
    @NotBlank(message = "用户ID不能为空")
    private String userId;
}
