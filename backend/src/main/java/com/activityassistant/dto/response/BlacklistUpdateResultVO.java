package com.activityassistant.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 黑名单更新结果（用于前端提示与调试）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlacklistUpdateResultVO {

    private List<String> targetUserIds;

    private int addedCount;

    private int alreadyExistsCount;

    private List<String> unresolvedPhones;
}

