package com.activityassistant.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 创建报名请求DTO
 *
 * @author Claude
 * @since 2025-11-11
 */
@Data
public class CreateRegistrationRequest {

    /**
     * 活动ID
     */
    @NotBlank(message = "活动ID不能为空")
    private String activityId;

    /**
     * 分组ID（可选）
     */
    private String groupId;

    /**
     * 报名姓名
     */
    @NotBlank(message = "报名姓名不能为空")
    @Size(max = 100, message = "报名姓名长度不能超过100个字符")
    private String name;

    /**
     * 联系电话
     */
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String mobile;

    /**
     * 自定义字段值（JSON字符串）
     */
    private String customData;
}
