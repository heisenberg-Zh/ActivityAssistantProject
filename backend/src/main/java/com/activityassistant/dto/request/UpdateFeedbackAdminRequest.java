package com.activityassistant.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 系统管理员更新反馈请求
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFeedbackAdminRequest {

    /**
     * 处理状态（pending/processing/resolved/closed）
     */
    @Pattern(regexp = "^(pending|processing|resolved|closed)$", message = "状态不合法")
    private String status;

    /**
     * 处理备注（内部）
     */
    @Size(max = 2000, message = "处理备注不能超过2000字")
    private String note;
}
