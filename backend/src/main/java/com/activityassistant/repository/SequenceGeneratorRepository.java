package com.activityassistant.repository;

import com.activityassistant.entity.SequenceGenerator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 序列号生成器 Repository
 */
@Repository
public interface SequenceGeneratorRepository extends JpaRepository<SequenceGenerator, Long> {

    /**
     * 根据业务类型和日期键查询序列记录
     */
    Optional<SequenceGenerator> findByBusinessTypeAndDateKey(String businessType, String dateKey);

    /**
     * 使用乐观锁 CAS 方式更新序列值
     * 只有当当前值等于期望值时才更新，确保并发安全
     *
     * @param businessType 业务类型
     * @param dateKey      日期键
     * @param oldValue     期望的旧值
     * @param newValue     要设置的新值
     * @return 影响的行数（1表示成功，0表示失败需重试）
     */
    @Modifying
    @Query("UPDATE SequenceGenerator s SET s.currentValue = :newValue, s.updatedAt = CURRENT_TIMESTAMP " +
           "WHERE s.businessType = :businessType AND s.dateKey = :dateKey AND s.currentValue = :oldValue")
    int updateSequenceWithCAS(
            @Param("businessType") String businessType,
            @Param("dateKey") String dateKey,
            @Param("oldValue") Integer oldValue,
            @Param("newValue") Integer newValue
    );

    /**
     * 删除指定日期之前的序列记录（用于定期清理）
     *
     * @param dateKey 日期键（保留此日期及之后的记录）
     */
    @Modifying
    @Query("DELETE FROM SequenceGenerator s WHERE s.dateKey < :dateKey")
    void deleteByDateKeyBefore(@Param("dateKey") String dateKey);
}
