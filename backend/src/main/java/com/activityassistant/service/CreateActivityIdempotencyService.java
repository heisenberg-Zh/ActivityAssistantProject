package com.activityassistant.service;

import com.activityassistant.dto.response.ActivityVO;
import com.activityassistant.exception.ConflictException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 创建活动接口的轻量幂等服务。
 *
 * <p>当前采用单机内存实现，兼容可选的 clientRequestId；
 * 后续如切换多实例部署，可平滑迁移到 Redis 等集中式存储。</p>
 */
@Slf4j
@Service
public class CreateActivityIdempotencyService {

    private static final long TTL_MILLIS = 60_000L;

    private final ConcurrentHashMap<String, Entry> records = new ConcurrentHashMap<>();

    public ActivityVO checkDuplicateOrMarkProcessing(String userId, String clientRequestId) {
        if (isBlank(userId) || isBlank(clientRequestId)) {
            return null;
        }

        final long now = System.currentTimeMillis();
        final String key = buildKey(userId, clientRequestId);
        final Holder holder = new Holder();

        records.compute(key, (mapKey, existing) -> {
            if (isExpired(existing, now)) {
                existing = null;
            }

            if (existing == null) {
                return Entry.processing(now);
            }

            if (existing.status == Status.SUCCESS && existing.activity != null) {
                holder.cachedActivity = existing.activity;
                return existing;
            }

            if (existing.status == Status.PROCESSING) {
                holder.processing = true;
                return existing;
            }

            return Entry.processing(now);
        });

        if (holder.processing) {
            throw new ConflictException("活动创建处理中，请勿重复提交");
        }

        return holder.cachedActivity;
    }

    public void markSuccess(String userId, String clientRequestId, ActivityVO activity) {
        if (isBlank(userId) || isBlank(clientRequestId) || activity == null) {
            return;
        }

        final String key = buildKey(userId, clientRequestId);
        records.put(key, Entry.success(System.currentTimeMillis(), activity));
        cleanupExpired();
    }

    public void clear(String userId, String clientRequestId) {
        if (isBlank(userId) || isBlank(clientRequestId)) {
            return;
        }

        records.remove(buildKey(userId, clientRequestId));
    }

    private void cleanupExpired() {
        final long now = System.currentTimeMillis();
        records.entrySet().removeIf(entry -> isExpired(entry.getValue(), now));
    }

    private boolean isExpired(Entry entry, long now) {
        return entry == null || now - entry.timestamp > TTL_MILLIS;
    }

    private String buildKey(String userId, String clientRequestId) {
        return userId + ':' + clientRequestId;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private enum Status {
        PROCESSING,
        SUCCESS
    }

    private static final class Entry {
        private final Status status;
        private final long timestamp;
        private final ActivityVO activity;

        private Entry(Status status, long timestamp, ActivityVO activity) {
            this.status = Objects.requireNonNull(status);
            this.timestamp = timestamp;
            this.activity = activity;
        }

        private static Entry processing(long timestamp) {
            return new Entry(Status.PROCESSING, timestamp, null);
        }

        private static Entry success(long timestamp, ActivityVO activity) {
            return new Entry(Status.SUCCESS, timestamp, activity);
        }
    }

    private static final class Holder {
        private boolean processing;
        private ActivityVO cachedActivity;
    }
}
