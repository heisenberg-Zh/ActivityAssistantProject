package com.activityassistant.service;

import com.activityassistant.model.Activity;
import com.activityassistant.repository.ActivityRepository;
import com.activityassistant.repository.MessageRepository;
import com.activityassistant.repository.RegistrationRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 活动系统消息定时任务（消息中心）
 *
 * 说明：
 * - “活动临近/开始/结束类提醒”仅发送给 approved 且 notifyUsers=true 的用户
 * - pending 用户仅发送“审核结果通知”（在 RegistrationService 中处理）
 * - 管理员提醒（报名截止/活动开始/待审核提醒）发送给创建者与管理员
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityMessageScheduler {

    private static final int SCAN_WINDOW_MINUTES = 5;
    private static final int UPCOMING_ADVANCE_MINUTES = 60;
    private static final int END_AFTER_MINUTES = 10;
    private static final int PENDING_REMIND_30 = 30;
    private static final int PENDING_REMIND_10 = 10;

    private static final DateTimeFormatter DATE_TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final ActivityRepository activityRepository;
    private final RegistrationRepository registrationRepository;
    private final MessageService messageService;
    private final MessageRepository messageRepository;
    private final ObjectMapper objectMapper;

    @Scheduled(cron = "0 */1 * * * *")
    public void run() {
        LocalDateTime now = LocalDateTime.now();

        try {
            sendUpcoming(now);
        } catch (Exception e) {
            log.warn("sendUpcoming failed: {}", e.getMessage(), e);
        }

        try {
            sendStart(now);
        } catch (Exception e) {
            log.warn("sendStart failed: {}", e.getMessage(), e);
        }

        try {
            sendEnd(now);
        } catch (Exception e) {
            log.warn("sendEnd failed: {}", e.getMessage(), e);
        }

        try {
            sendSignupClosed(now);
        } catch (Exception e) {
            log.warn("sendSignupClosed failed: {}", e.getMessage(), e);
        }

        try {
            sendPendingReviewReminders(now, PENDING_REMIND_30);
        } catch (Exception e) {
            log.warn("sendPendingReviewReminders(-30m) failed: {}", e.getMessage(), e);
        }

        try {
            sendPendingReviewReminders(now, PENDING_REMIND_10);
        } catch (Exception e) {
            log.warn("sendPendingReviewReminders(-10m) failed: {}", e.getMessage(), e);
        }

        try {
            sendManagerActivityStarted(now);
        } catch (Exception e) {
            log.warn("sendManagerActivityStarted failed: {}", e.getMessage(), e);
        }
    }

    private void sendUpcoming(LocalDateTime now) {
        LocalDateTime from = now.plusMinutes(UPCOMING_ADVANCE_MINUTES - SCAN_WINDOW_MINUTES);
        LocalDateTime to = now.plusMinutes(UPCOMING_ADVANCE_MINUTES + SCAN_WINDOW_MINUTES);

        List<Activity> activities = activityRepository.findByIsDeletedFalseAndStartTimeBetween(from, to);
        for (Activity activity : activities) {
            if (activity == null) continue;
            if (Boolean.FALSE.equals(activity.getNotifyUsers())) continue;
            if (Boolean.TRUE.equals(activity.getIsDeleted())) continue;
            if ("cancelled".equals(activity.getStatus())) continue;

            String title = "活动即将开始";
            String content = buildParticipantReminderContent(activity, "活动将在约 1 小时后开始。");
            sendToApprovedIfNotSent(activity, "activity_upcoming", title, content);
        }
    }

    private void sendStart(LocalDateTime now) {
        LocalDateTime from = now.minusMinutes(SCAN_WINDOW_MINUTES);
        LocalDateTime to = now.plusMinutes(SCAN_WINDOW_MINUTES);

        List<Activity> activities = activityRepository.findByIsDeletedFalseAndStartTimeBetween(from, to);
        for (Activity activity : activities) {
            if (activity == null) continue;
            if (Boolean.FALSE.equals(activity.getNotifyUsers())) continue;
            if (Boolean.TRUE.equals(activity.getIsDeleted())) continue;
            if ("cancelled".equals(activity.getStatus())) continue;

            String title = "活动已开始";
            String content = buildParticipantReminderContent(activity, "活动已开始，请按时到达并参与。");
            sendToApprovedIfNotSent(activity, "activity_started", title, content);
        }
    }

    private void sendEnd(LocalDateTime now) {
        // endTime + 10 分钟 触发：等价于 endTime 在 (now-10m) 附近
        LocalDateTime center = now.minusMinutes(END_AFTER_MINUTES);
        LocalDateTime from = center.minusMinutes(SCAN_WINDOW_MINUTES);
        LocalDateTime to = center.plusMinutes(SCAN_WINDOW_MINUTES);

        List<Activity> activities = activityRepository.findByIsDeletedFalseAndEndTimeBetween(from, to);
        for (Activity activity : activities) {
            if (activity == null) continue;
            if (Boolean.FALSE.equals(activity.getNotifyUsers())) continue;
            if (Boolean.TRUE.equals(activity.getIsDeleted())) continue;
            if ("cancelled".equals(activity.getStatus())) continue;

            String title = "活动已结束";
            String content = buildParticipantReminderContent(activity, "活动已结束，欢迎在应用内提交评价/反馈。");
            sendToApprovedIfNotSent(activity, "activity_ended", title, content);
        }
    }

    private void sendSignupClosed(LocalDateTime now) {
        LocalDateTime from = now.minusMinutes(SCAN_WINDOW_MINUTES);
        LocalDateTime to = now.plusMinutes(SCAN_WINDOW_MINUTES);

        List<Activity> activities = activityRepository.findByIsDeletedFalseAndRegisterDeadlineBetween(from, to);
        for (Activity activity : activities) {
            if (activity == null) continue;
            if (Boolean.TRUE.equals(activity.getIsDeleted())) continue;
            if ("cancelled".equals(activity.getStatus())) continue;

            long approved = registrationRepository.countByActivityIdAndStatus(activity.getId(), "approved");
            long pending = registrationRepository.countByActivityIdAndStatus(activity.getId(), "pending");

            String title = "报名已截止";
            String content = String.format(
                    "活动《%s》报名已截止。\n已通过：%d 人，待审核：%d 人。",
                    safe(activity.getTitle()),
                    approved,
                    pending
            );

            sendToManagersIfNotSent(activity, "manager_signup_closed", title, content);
        }
    }

    private void sendPendingReviewReminders(LocalDateTime now, int minutesBeforeStart) {
        LocalDateTime from = now.plusMinutes(minutesBeforeStart - SCAN_WINDOW_MINUTES);
        LocalDateTime to = now.plusMinutes(minutesBeforeStart + SCAN_WINDOW_MINUTES);

        List<Activity> activities = activityRepository.findByIsDeletedFalseAndStartTimeBetween(from, to);
        for (Activity activity : activities) {
            if (activity == null) continue;
            if (Boolean.TRUE.equals(activity.getIsDeleted())) continue;
            if ("cancelled".equals(activity.getStatus())) continue;

            long pending = registrationRepository.countByActivityIdAndStatus(activity.getId(), "pending");
            if (pending <= 0) {
                continue;
            }

            String title = "待审核提醒";
            String content = String.format(
                    "活动《%s》将在 %d 分钟后开始，目前还有 %d 位报名待审核，请及时处理。",
                    safe(activity.getTitle()),
                    minutesBeforeStart,
                    pending
            );

            String type = minutesBeforeStart == PENDING_REMIND_30
                    ? "manager_pending_review_30m"
                    : "manager_pending_review_10m";
            sendToManagersIfNotSent(activity, type, title, content);
        }
    }

    private void sendManagerActivityStarted(LocalDateTime now) {
        LocalDateTime from = now.minusMinutes(SCAN_WINDOW_MINUTES);
        LocalDateTime to = now.plusMinutes(SCAN_WINDOW_MINUTES);

        List<Activity> activities = activityRepository.findByIsDeletedFalseAndStartTimeBetween(from, to);
        for (Activity activity : activities) {
            if (activity == null) continue;
            if (Boolean.TRUE.equals(activity.getIsDeleted())) continue;
            if ("cancelled".equals(activity.getStatus())) continue;

            String checkinPart = Boolean.TRUE.equals(activity.getNeedCheckin())
                    ? "如需签到，请提醒参与者在开始前30分钟至结束时间内完成签到。"
                    : "本活动无需签到。";

            String title = "活动已开始";
            String content = String.format(
                    "活动《%s》已开始。\n%s",
                    safe(activity.getTitle()),
                    checkinPart
            );

            sendToManagersIfNotSent(activity, "manager_activity_started", title, content);
        }
    }

    private void sendToApprovedIfNotSent(Activity activity, String type, String title, String content) {
        List<String> userIds = registrationRepository.findUserIdsByActivityIdAndStatus(activity.getId(), "approved");
        sendToUsersIfNotSent(activity, type, title, content, userIds);
    }

    private void sendToManagersIfNotSent(Activity activity, String type, String title, String content) {
        Set<String> userIdSet = new HashSet<>();
        if (activity.getOrganizerId() != null) userIdSet.add(activity.getOrganizerId());
        userIdSet.addAll(parseAdminIds(activity.getAdministrators()));

        sendToUsersIfNotSent(activity, type, title, content, new ArrayList<>(userIdSet));
    }

    private void sendToUsersIfNotSent(Activity activity, String type, String title, String content, List<String> userIds) {
        if (userIds == null || userIds.isEmpty()) return;

        List<String> normalized = userIds.stream()
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .toList();
        if (normalized.isEmpty()) return;

        Set<String> sentSet = new HashSet<>();
        try {
            List<String> sent = messageRepository.findUserIdsByActivityIdAndTypeAndUserIdIn(
                    activity.getId(),
                    type,
                    normalized
            );
            if (sent != null) sentSet.addAll(sent);
        } catch (Exception e) {
            // 回退：避免一条异常导致整批发送失败
            log.warn("find sent users failed (activityId={}, type={}): {}", activity.getId(), type, e.getMessage());
        }

        for (String userId : normalized) {
            if (sentSet.contains(userId)) continue;
            messageService.createMessage(userId, type, title, content, activity.getId());
        }
    }

    private String buildParticipantReminderContent(Activity activity, String firstLine) {
        String start = activity.getStartTime() != null ? activity.getStartTime().format(DATE_TIME_FMT) : "";
        String end = activity.getEndTime() != null ? activity.getEndTime().format(DATE_TIME_FMT) : "";

        String timePart = (start.isEmpty() && end.isEmpty())
                ? ""
                : String.format("时间：%s - %s\n", start, end);

        String placePart = "";
        if (activity.getPlace() != null && !activity.getPlace().isBlank()) {
            placePart = "地点：" + activity.getPlace().trim() + "\n";
        }
        if (activity.getAddress() != null && !activity.getAddress().isBlank()) {
            placePart = placePart + "地址：" + activity.getAddress().trim() + "\n";
        }

        String checkinPart = Boolean.TRUE.equals(activity.getNeedCheckin())
                ? "签到：开始前30分钟开放，至活动结束。\n"
                : "签到：本活动无需签到。\n";

        return String.format(
                "%s\n活动：《%s》\n%s%s%s",
                firstLine,
                safe(activity.getTitle()),
                timePart,
                placePart,
                checkinPart
        ).trim();
    }

    private List<String> parseAdminIds(String administratorsJson) {
        if (administratorsJson == null) return List.of();
        String trimmed = administratorsJson.trim();
        if (trimmed.isEmpty() || "null".equalsIgnoreCase(trimmed)) return List.of();

        try {
            List<String> ids = objectMapper.readValue(trimmed, new TypeReference<List<String>>() {});
            if (ids == null) return List.of();
            return ids.stream().filter(id -> id != null && !id.isBlank()).distinct().toList();
        } catch (Exception e) {
            log.warn("parse administrators failed: {}", e.getMessage());
            return List.of();
        }
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}

