package com.activityassistant.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 创建签到请求DTO
 *
 * @author Claude
 * @since 2025-11-11
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCheckinRequest {

    /**
     * 活动ID
     */
    @NotBlank(message = "活动ID不能为空")
    private String activityId;

    /**
     * 签到纬度
     */
    @NotNull(message = "签到纬度不能为空")
    private BigDecimal latitude;

    /**
     * 签到经度
     */
    @NotNull(message = "签到经度不能为空")
    private BigDecimal longitude;

    /**
     * 签到地址（可选）
     */
    private String address;
}
