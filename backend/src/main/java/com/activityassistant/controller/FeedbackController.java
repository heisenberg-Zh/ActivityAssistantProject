package com.activityassistant.controller;

import com.activityassistant.dto.request.SubmitFeedbackRequest;
import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.service.AppFeatureConfigService;
import com.activityassistant.service.FeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户反馈接口。
 */
@Slf4j
@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
@Tag(name = "用户反馈接口", description = "用户反馈提交相关接口")
public class FeedbackController {

    private static final String REVIEW_MODE_MESSAGE = "审核模式已开启，暂不支持帮助与反馈功能";

    private final FeedbackService feedbackService;
    private final AppFeatureConfigService appFeatureConfigService;

    @PostMapping
    @Operation(summary = "提交用户反馈", description = "提交用户反馈或建议")
    public ApiResponse<Void> submitFeedback(@Valid @RequestBody SubmitFeedbackRequest request) {
        if (appFeatureConfigService.isReviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_MESSAGE);
        }

        String userId = null;
        try {
            userId = SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
            log.debug("匿名用户提交反馈");
        }

        log.info("提交用户反馈，userId={}, type={}", userId, request.getType());
        feedbackService.submitFeedback(userId, request.getContent(), request.getContactInfo(), request.getType());
        return ApiResponse.success("感谢您的反馈，我们会尽快处理", null);
    }
}
