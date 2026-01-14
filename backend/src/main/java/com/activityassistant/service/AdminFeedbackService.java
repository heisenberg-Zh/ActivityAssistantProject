package com.activityassistant.service;

import com.activityassistant.dto.request.UpdateFeedbackAdminRequest;
import com.activityassistant.dto.response.AdminFeedbackVO;
import com.activityassistant.dto.response.FeedbackSubmitterVO;
import com.activityassistant.exception.NotFoundException;
import com.activityassistant.model.Feedback;
import com.activityassistant.model.User;
import com.activityassistant.repository.FeedbackRepository;
import com.activityassistant.repository.UserRepository;
import com.activityassistant.security.SystemAdminAccessChecker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 系统管理员 - 反馈管理服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminFeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final SystemAdminAccessChecker systemAdminAccessChecker;

    public Page<AdminFeedbackVO> list(String adminUserId,
                                     String status,
                                     String type,
                                     String keyword,
                                     int page,
                                     int size) {
        systemAdminAccessChecker.checkIsSystemAdmin(adminUserId);

        Specification<Feedback> spec = (root, query, cb) -> {
            Collection<Predicate> predicates = new ArrayList<>();
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status.trim()));
            }
            if (type != null && !type.isBlank()) {
                predicates.add(cb.equal(root.get("type"), type.trim()));
            }
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("content"), like),
                        cb.like(root.get("contactInfo"), like)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Feedback> feedbackPage = feedbackRepository.findAll(
                spec,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        Map<String, User> usersById = loadUsersById(
                feedbackPage.getContent().stream()
                        .map(Feedback::getUserId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet())
        );

        return feedbackPage.map(feedback -> toVO(feedback, usersById.get(feedback.getUserId())));
    }

    public AdminFeedbackVO getDetail(String adminUserId, Long id) {
        systemAdminAccessChecker.checkIsSystemAdmin(adminUserId);

        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("反馈不存在"));
        User user = feedback.getUserId() != null
                ? userRepository.findById(feedback.getUserId()).orElse(null)
                : null;
        return toVO(feedback, user);
    }

    @Transactional
    public AdminFeedbackVO update(String adminUserId, Long id, UpdateFeedbackAdminRequest request) {
        systemAdminAccessChecker.checkIsSystemAdmin(adminUserId);

        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("反馈不存在"));

        boolean changed = false;

        String nextStatus = request != null ? request.getStatus() : null;
        if (nextStatus != null && !nextStatus.isBlank() && !nextStatus.equals(feedback.getStatus())) {
            feedback.setStatus(nextStatus);
            changed = true;
        }

        String nextNote = request != null ? request.getNote() : null;
        if (nextNote != null && !Objects.equals(nextNote, feedback.getNote())) {
            feedback.setNote(nextNote);
            changed = true;
        }

        if (changed) {
            feedback.setHandledBy(adminUserId);
            feedback.setHandledAt(LocalDateTime.now());
        }

        Feedback saved = feedbackRepository.save(feedback);
        User user = saved.getUserId() != null ? userRepository.findById(saved.getUserId()).orElse(null) : null;
        return toVO(saved, user);
    }

    private Map<String, User> loadUsersById(Set<String> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return new HashMap<>();
        }
        return userRepository.findAllById(userIds)
                .stream()
                .collect(Collectors.toMap(User::getId, u -> u));
    }

    private static AdminFeedbackVO toVO(Feedback feedback, User user) {
        FeedbackSubmitterVO submitter = null;
        if (user != null) {
            submitter = FeedbackSubmitterVO.builder()
                    .userId(user.getId())
                    .nickname(user.getNickname())
                    .avatar(user.getAvatar())
                    .build();
        } else if (feedback.getUserId() != null) {
            submitter = FeedbackSubmitterVO.builder()
                    .userId(feedback.getUserId())
                    .nickname(null)
                    .avatar(null)
                    .build();
        }

        return AdminFeedbackVO.builder()
                .id(feedback.getId())
                .content(feedback.getContent())
                .contactInfo(feedback.getContactInfo())
                .type(feedback.getType())
                .status(feedback.getStatus())
                .note(feedback.getNote())
                .handledBy(feedback.getHandledBy())
                .handledAt(feedback.getHandledAt())
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .submitter(submitter)
                .build();
    }
}
