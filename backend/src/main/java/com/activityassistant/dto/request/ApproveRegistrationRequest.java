package com.activityassistant.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 审核报名请求DTO
 *
 * @author Claude
 * @since 2025-11-11
 */
@Data
public class ApproveRegistrationRequest {

    /**
     * 是否通过（true=通过，false=拒绝）
     */
    @NotNull(message = "审核结果不能为空")
    private Boolean approved;

    /**
     * 审核备注（可选）
     */
    private String note;
}
