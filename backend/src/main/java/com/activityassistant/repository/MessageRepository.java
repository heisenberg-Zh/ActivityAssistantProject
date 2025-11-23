package com.activityassistant.repository;

import com.activityassistant.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 消息数据访问层
 *
 * @author Claude
 * @since 2025-01-22
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, String> {

    /**
     * 根据用户ID查找消息列表（分页）
     *
     * @param userId   用户ID
     * @param pageable 分页参数
     * @return 消息分页列表
     */
    Page<Message> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    /**
     * 根据用户ID和消息类型查找消息列表（分页）
     *
     * @param userId   用户ID
     * @param type     消息类型
     * @param pageable 分页参数
     * @return 消息分页列表
     */
    Page<Message> findByUserIdAndTypeOrderByCreatedAtDesc(String userId, String type, Pageable pageable);

    /**
     * 统计用户未读消息数
     *
     * @param userId 用户ID
     * @return 未读消息数
     */
    long countByUserIdAndIsRead(String userId, Boolean isRead);

    /**
     * 批量标记用户所有消息为已读
     *
     * @param userId 用户ID
     * @return 更新的记录数
     */
    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.userId = :userId AND m.isRead = false")
    int markAllAsReadByUserId(@Param("userId") String userId);

    /**
     * 根据用户ID删除所有消息
     *
     * @param userId 用户ID
     */
    void deleteByUserId(String userId);
}
