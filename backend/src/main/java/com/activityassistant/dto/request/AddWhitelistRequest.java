package com.activityassistant.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 批量添加白名单请求DTO
 *
 * @author Claude
 * @since 2025-01-22
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddWhitelistRequest {

    /**
     * 手机号列表
     */
    private List<String> phones;

    /**
     * 用户ID列表
     */
    private List<String> userIds;
}
