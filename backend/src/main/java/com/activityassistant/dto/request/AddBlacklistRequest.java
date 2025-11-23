package com.activityassistant.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 批量添加黑名单请求DTO
 *
 * @author Claude
 * @since 2025-01-22
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddBlacklistRequest {

    /**
     * 手机号列表
     */
    private List<String> phones;

    /**
     * 拉黑原因
     */
    private String reason;

    /**
     * 过期天数（0表示永久）
     */
    private Integer expiryDays;
}
