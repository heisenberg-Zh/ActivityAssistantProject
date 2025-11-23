package com.activityassistant.repository;

import com.activityassistant.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 用户反馈数据访问层
 *
 * @author Claude
 * @since 2025-01-22
 */
@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
}
