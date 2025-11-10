package com.activityassistant.dto.request;

import lombok.Data;

/**
 * 活动查询请求DTO
 *
 * @author Claude
 * @since 2025-11-10
 */
@Data
public class ActivityQueryRequest {

    /**
     * 活动类型：运动/聚会/培训/户外
     */
    private String type;

    /**
     * 活动状态：pending/published/ongoing/finished/cancelled
     */
    private String status;

    /**
     * 是否公开（null表示查询所有，true表示仅公开，false表示仅私密）
     */
    private Boolean isPublic;

    /**
     * 组织者ID（查询某个组织者的活动）
     */
    private String organizerId;

    /**
     * 关键字搜索（标题、描述、地点）
     */
    private String keyword;

    /**
     * 页码（从0开始）
     */
    private Integer page = 0;

    /**
     * 每页数量
     */
    private Integer size = 10;

    /**
     * 排序字段：startTime/createdAt/joined
     */
    private String sortBy = "startTime";

    /**
     * 排序方向：asc/desc
     */
    private String sortDirection = "asc";
}
