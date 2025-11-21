package com.activityassistant.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 评价统计响应DTO
 *
 * @author Claude
 * @since 2025-01-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewStatisticsResponse {

    /**
     * 评价总数
     */
    private Long totalReviews;

    /**
     * 平均评分（保留1位小数）
     */
    private Double averageRating;

    /**
     * 各星级评价数量
     * key: 星级(1-5), value: 数量
     */
    private Map<Integer, Long> ratingDistribution;
}
