package com.activityassistant.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 白名单更新结果（用于前端提示与调试）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WhitelistUpdateResultVO {

    /**
     * 本次请求目标用户ID（含由手机号解析得到的用户）
     */
    private List<String> targetUserIds;

    /**
     * 新增白名单数量
     */
    private int addedCount;

    /**
     * 已存在数量（未重复添加）
     */
    private int alreadyExistsCount;

    /**
     * 手机号无法解析为用户ID的列表
     */
    private List<String> unresolvedPhones;

    /**
     * 本次自动通过的报名数量（仅 needReview=true）
     */
    private int autoApprovedCount;

    /**
     * 因名额已满未自动通过的数量（保持 pending）
     */
    private int autoApproveSkippedBecauseFullCount;
}

