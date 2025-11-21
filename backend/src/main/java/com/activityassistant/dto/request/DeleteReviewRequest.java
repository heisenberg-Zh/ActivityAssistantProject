package com.activityassistant.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 删除评价请求DTO（管理员使用）
 *
 * @author Claude
 * @since 2025-01-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeleteReviewRequest {

    /**
     * 删除原因（必填）
     */
    @NotBlank(message = "删除原因不能为空")
    private String deleteReason;
}
