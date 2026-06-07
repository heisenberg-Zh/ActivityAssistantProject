package com.activityassistant.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Activity export summary response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityExportSummaryVO {

    private long activityCount;

    private long registrationCount;

    private String rangeText;
}
