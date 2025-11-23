package com.activityassistant.service;

import com.activityassistant.model.Feedback;
import com.activityassistant.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 用户反馈服务
 *
 * @author Claude
 * @since 2025-01-22
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;

    /**
     * 提交用户反馈
     *
     * @param userId      用户ID（可为null，支持匿名反馈）
     * @param content     反馈内容
     * @param contactInfo 联系方式
     * @param type        反馈类型
     * @return 创建的反馈记录
     */
    @Transactional
    public Feedback submitFeedback(String userId, String content, String contactInfo, String type) {
        log.info("提交用户反馈，userId={}, type={}, contentLength={}", userId, type, content != null ? content.length() : 0);

        Feedback feedback = Feedback.builder()
                .userId(userId)
                .content(content)
                .contactInfo(contactInfo)
                .type(type)
                .status("pending")
                .build();

        return feedbackRepository.save(feedback);
    }
}
