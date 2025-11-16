package com.activityassistant.service;

import com.activityassistant.entity.SequenceGenerator;
import com.activityassistant.exception.BusinessException;
import com.activityassistant.repository.SequenceGeneratorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import static com.activityassistant.constant.ErrorCode.*;

/**
 * ID生成服务
 * 为各业务表生成格式化的唯一ID
 * 格式：前缀 + YYYYMMDD + 6位序号
 * 示例：A20251116000001（活动）、R20251116000001（报名）
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class IdGeneratorService {

    private final SequenceGeneratorRepository sequenceRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final int MAX_RETRY = 10; // 最大重试次数（防止死循环）
    private static final int SEQUENCE_LENGTH = 6; // 序号长度

    /**
     * 业务类型枚举
     */
    public enum BusinessType {
        ACTIVITY("activity", "A"),
        REGISTRATION("registration", "R"),
        CHECKIN("checkin", "C"),
        MESSAGE("message", "M");

        private final String type;
        private final String prefix;

        BusinessType(String type, String prefix) {
            this.type = type;
            this.prefix = prefix;
        }

        public String getType() {
            return type;
        }

        public String getPrefix() {
            return prefix;
        }
    }

    /**
     * 生成活动ID
     * 格式：A + YYYYMMDD + 6位序号
     * 示例：A20251116000001
     */
    public String generateActivityId() {
        return generateId(BusinessType.ACTIVITY);
    }

    /**
     * 生成报名ID
     * 格式：R + YYYYMMDD + 6位序号
     * 示例：R20251116000001
     */
    public String generateRegistrationId() {
        return generateId(BusinessType.REGISTRATION);
    }

    /**
     * 生成签到ID
     * 格式：C + YYYYMMDD + 6位序号
     * 示例：C20251116000001
     */
    public String generateCheckinId() {
        return generateId(BusinessType.CHECKIN);
    }

    /**
     * 生成消息ID
     * 格式：M + YYYYMMDD + 6位序号
     * 示例：M20251116000001
     */
    public String generateMessageId() {
        return generateId(BusinessType.MESSAGE);
    }

    /**
     * 生成ID的核心方法
     *
     * @param businessType 业务类型
     * @return 生成的ID
     */
    private String generateId(BusinessType businessType) {
        String dateKey = LocalDate.now().format(DATE_FORMATTER);
        int sequence = getNextSequence(businessType.getType(), dateKey);
        return formatId(businessType.getPrefix(), dateKey, sequence);
    }

    /**
     * 获取下一个序列号（使用乐观锁CAS保证并发安全）
     *
     * @param businessType 业务类型
     * @param dateKey      日期键
     * @return 下一个序列号
     */
    @Transactional
    public int getNextSequence(String businessType, String dateKey) {
        int retryCount = 0;

        while (retryCount < MAX_RETRY) {
            try {
                // 1. 查询或创建序列记录
                SequenceGenerator sequence = sequenceRepository
                        .findByBusinessTypeAndDateKey(businessType, dateKey)
                        .orElseGet(() -> createNewSequence(businessType, dateKey));

                int currentValue = sequence.getCurrentValue();
                int nextValue = currentValue + 1;

                // 2. 使用CAS方式更新（乐观锁）
                int updatedRows = sequenceRepository.updateSequenceWithCAS(
                        businessType, dateKey, currentValue, nextValue
                );

                // 3. 更新成功，返回新值
                if (updatedRows > 0) {
                    log.debug("成功生成序列号 - 业务类型: {}, 日期: {}, 序号: {}",
                            businessType, dateKey, nextValue);
                    return nextValue;
                }

                // 4. 更新失败（被其他线程抢先），重试
                retryCount++;
                log.debug("序列号生成冲突，重试 {}/{}", retryCount, MAX_RETRY);

                // 短暂休眠，避免CPU空转
                Thread.sleep(10);

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new BusinessException(SYSTEM_ERROR, "序列号生成被中断");
            } catch (Exception e) {
                log.error("生成序列号异常 - 业务类型: {}, 日期: {}", businessType, dateKey, e);
                throw new BusinessException(SYSTEM_ERROR, "序列号生成失败");
            }
        }

        // 超过最大重试次数
        throw new BusinessException(SYSTEM_ERROR,
                String.format("序列号生成失败，超过最大重试次数 (%d)", MAX_RETRY));
    }

    /**
     * 创建新的序列记录
     */
    private SequenceGenerator createNewSequence(String businessType, String dateKey) {
        SequenceGenerator newSequence = SequenceGenerator.builder()
                .businessType(businessType)
                .dateKey(dateKey)
                .currentValue(0)
                .build();

        try {
            return sequenceRepository.save(newSequence);
        } catch (Exception e) {
            // 可能是并发创建导致的唯一键冲突，重新查询
            log.debug("并发创建序列记录，重新查询 - 业务类型: {}, 日期: {}", businessType, dateKey);
            return sequenceRepository
                    .findByBusinessTypeAndDateKey(businessType, dateKey)
                    .orElseThrow(() -> new BusinessException(SYSTEM_ERROR, "序列记录创建失败"));
        }
    }

    /**
     * 格式化ID
     *
     * @param prefix   前缀（A/R/C/M）
     * @param dateKey  日期键（YYYYMMDD）
     * @param sequence 序列号
     * @return 格式化后的ID
     */
    private String formatId(String prefix, String dateKey, int sequence) {
        // 序号左填充0到指定长度
        String sequenceStr = String.format("%0" + SEQUENCE_LENGTH + "d", sequence);
        return prefix + dateKey + sequenceStr;
    }

    /**
     * 清理过期的序列记录（建议定期执行，如保留最近30天）
     *
     * @param retainDays 保留天数
     */
    @Transactional
    public void cleanExpiredSequences(int retainDays) {
        String cutoffDate = LocalDate.now()
                .minusDays(retainDays)
                .format(DATE_FORMATTER);

        sequenceRepository.deleteByDateKeyBefore(cutoffDate);
        log.info("清理过期序列记录完成 - 删除日期早于: {}", cutoffDate);
    }
}
