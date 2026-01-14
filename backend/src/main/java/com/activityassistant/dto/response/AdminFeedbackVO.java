package com.activityassistant.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 系统管理员反馈视图对象
 */
@Data
@Builder
public class AdminFeedbackVO {
    private Long id;
    private String content;
    private String contactInfo;
    private String type;
    private String status;
    private String note;
    private String handledBy;
    private LocalDateTime handledAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private FeedbackSubmitterVO submitter;
}
