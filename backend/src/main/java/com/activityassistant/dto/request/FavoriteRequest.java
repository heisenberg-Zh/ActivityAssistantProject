package com.activityassistant.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

/**
 * 收藏请求DTO
 *
 * @author Claude
 * @since 2025-01-22
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteRequest {

    /**
     * 活动ID
     */
    @NotBlank(message = "活动ID不能为空")
    private String activityId;
}
