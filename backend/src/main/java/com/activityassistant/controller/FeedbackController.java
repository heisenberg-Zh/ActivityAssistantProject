package com.activityassistant.controller;

import com.activityassistant.dto.request.SubmitFeedbackRequest;
import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.model.Feedback;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.service.FeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

/**
 * 用户反馈控制器
 * 处理用户反馈相关接口
 *
 * @author Claude
 * @since 2025-01-22
 */
@Slf4j
@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
@Tag(name = "用户反馈接口", description = "用户反馈提交相关接口")
public class FeedbackController {

    private final FeedbackService feedbackService;

    /**
     * 提交用户反馈
     *
     * @param request 反馈内容
     * @return 成功响应
     */
    @PostMapping
    @Operation(summary = "提交用户反馈", description = "提交用户反馈或建议")
    public ApiResponse<Void> submitFeedback(@Valid @RequestBody SubmitFeedbackRequest request) {
        // 获取当前用户ID（可能为null，支持匿名反馈）
        String userId = null;
        try {
            userId = SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
            // 未登录用户也可以提交反馈
            log.debug("匿名用户提交反馈");
        }

        log.info("提交用户反馈，userId={}, type={}", userId, request.getType());

        feedbackService.submitFeedback(
                userId,
                request.getContent(),
                request.getContactInfo(),
                request.getType()
        );

        return ApiResponse.success("感谢您的反馈！我们会尽快处理", null);
    }
}
