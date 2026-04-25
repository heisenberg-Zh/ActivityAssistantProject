package com.activityassistant.dto.request;

import lombok.Data;

/**
 * 首页活动查询请求DTO
 *
 * @author Claude
 * @since 2026-03-27
 */
@Data
public class HomeActivityQueryRequest {

    /**
     * 页码（从0开始）
     */
    private Integer page = 0;

    /**
     * 每页数量（首页默认20）
     */
    private Integer size = 20;

    /**
     * 排序字段：startTime/createdAt/joined
     */
    private String sortBy = "startTime";

    /**
     * 排序方向：asc/desc
     */
    private String sortDirection = "asc";

    /**
     * 是否包含私密活动（登录用户才生效）
     */
    private Boolean includePrivate = true;

    /**
     * 是否保留当天结束的活动
     */
    private Boolean showEndedToday = true;

    /**
     * 是否排除已取消活动
     */
    private Boolean excludeCancelled = true;
}
