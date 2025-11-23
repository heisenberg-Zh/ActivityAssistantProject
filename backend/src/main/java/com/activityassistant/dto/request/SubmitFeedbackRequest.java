package com.activityassistant.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 提交反馈请求DTO
 *
 * @author Claude
 * @since 2025-01-22
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmitFeedbackRequest {

    /**
     * 反馈内容
     */
    @NotBlank(message = "反馈内容不能为空")
    @Size(min = 5, max = 5000, message = "反馈内容长度应在5-5000字之间")
    private String content;

    /**
     * 联系方式（可选）
     */
    @Size(max = 200, message = "联系方式不能超过200字")
    private String contactInfo;

    /**
     * 反馈类型（可选）
     */
    private String type;
}
