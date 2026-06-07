package com.activityassistant.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Update registration information request.
 */
@Data
public class UpdateRegistrationRequest {

    @Size(max = 100, message = "报名姓名长度不能超过100个字符")
    private String name;

    @Pattern(regexp = "^$|^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String mobile;

    private String customData;
}
