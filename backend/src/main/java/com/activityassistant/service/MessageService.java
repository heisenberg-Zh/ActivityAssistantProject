package com.activityassistant.service;

import com.activityassistant.dto.response.MessageVO;
import com.activityassistant.exception.NotFoundException;
import com.activityassistant.model.Message;
import com.activityassistant.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 消息服务
 *
 * @author Claude
 * @since 2025-01-22
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final IdGeneratorService idGeneratorService;

    /**
     * 获取用户消息列表（分页）
     *
     * @param userId   用户ID
     * @param page     页码
     * @param size     每页数量
     * @param category 消息类别（可选，如果为空则返回所有）
     * @return 消息分页列表
     */
    public Page<MessageVO> getMyMessages(String userId, int page, int size, String category) {
        log.info("获取用户消息列表，userId={}, page={}, size={}, category={}", userId, page, size, category);

        Pageable pageable = PageRequest.of(page, size);
        Page<Message> messagePage;

        if (category != null && !category.isEmpty() && !"all".equals(category)) {
            messagePage = messageRepository.findByUserIdAndTypeOrderByCreatedAtDesc(userId, category, pageable);
        } else {
            messagePage = messageRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        return messagePage.map(this::toMessageVO);
    }

    /**
     * 标记消息为已读
     *
     * @param messageId 消息ID
     * @param userId    用户ID（用于权限验证）
     */
    @Transactional
    public void markAsRead(String messageId, String userId) {
        log.info("标记消息为已读，messageId={}, userId={}", messageId, userId);

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException("消息不存在"));

        // 验证消息所属用户
        if (!message.getUserId().equals(userId)) {
            throw new NotFoundException("消息不存在");
        }

        message.setIsRead(true);
        messageRepository.save(message);
    }

    /**
     * 批量标记所有消息为已读
     *
     * @param userId 用户ID
     * @return 更新的消息数量
     */
    @Transactional
    public int markAllAsRead(String userId) {
        log.info("批量标记所有消息为已读，userId={}", userId);
        return messageRepository.markAllAsReadByUserId(userId);
    }

    /**
     * 删除消息
     *
     * @param messageId 消息ID
     * @param userId    用户ID（用于权限验证）
     */
    @Transactional
    public void deleteMessage(String messageId, String userId) {
        log.info("删除消息，messageId={}, userId={}", messageId, userId);

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException("消息不存在"));

        // 验证消息所属用户
        if (!message.getUserId().equals(userId)) {
            throw new NotFoundException("消息不存在");
        }

        messageRepository.delete(message);
    }

    /**
     * 创建新消息（系统内部调用）
     *
     * @param userId     接收用户ID
     * @param type       消息类型
     * @param title      标题
     * @param content    内容
     * @param activityId 关联活动ID（可选）
     * @return 创建的消息
     */
    @Transactional
    public Message createMessage(String userId, String type, String title, String content, String activityId) {
        log.info("创建新消息，userId={}, type={}, title={}", userId, type, title);

        Message message = Message.builder()
                .id(idGeneratorService.generateMessageId())
                .userId(userId)
                .type(type)
                .title(title)
                .content(content)
                .activityId(activityId)
                .isRead(false)
                .build();

        return messageRepository.save(message);
    }

    /**
     * 统计未读消息数
     *
     * @param userId 用户ID
     * @return 未读消息数
     */
    public long getUnreadCount(String userId) {
        return messageRepository.countByUserIdAndIsRead(userId, false);
    }

    /**
     * 转换为VO
     */
    private MessageVO toMessageVO(Message message) {
        return MessageVO.builder()
                .id(message.getId())
                .type(message.getType())
                .title(message.getTitle())
                .content(message.getContent())
                .activityId(message.getActivityId())
                .isRead(message.getIsRead())
                .createdAt(message.getCreatedAt().toString())
                .build();
    }
}
