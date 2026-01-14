package com.activityassistant.dto.response;

import lombok.Builder;
import lombok.Data;

/**
 * 反馈提交人信息（展示用：昵称/头像/用户ID）
 */
@Data
@Builder
public class FeedbackSubmitterVO {
    private String userId;
    private String nickname;
    private String avatar;
}
