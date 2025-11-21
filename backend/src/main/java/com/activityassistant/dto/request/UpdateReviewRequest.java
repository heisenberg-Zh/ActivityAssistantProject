package com.activityassistant.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * 更新评价请求DTO
 *
 * @author Claude
 * @since 2025-01-20
 */
@Data
public class UpdateReviewRequest {

    /**
     * 评分（1-5星）
     */
    @NotNull(message = "评分不能为空")
    @Min(value = 1, message = "评分最低1星")
    @Max(value = 5, message = "评分最高5星")
    private Integer rating;

    /**
     * 评价内容（选填，5-500字）
     */
    @Size(min = 5, max = 500, message = "评价内容长度应在5-500字之间")
    private String content;
}
