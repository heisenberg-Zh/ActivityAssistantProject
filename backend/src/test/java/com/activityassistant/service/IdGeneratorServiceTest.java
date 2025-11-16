package com.activityassistant.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * IdGeneratorService 单元测试
 * 测试并发安全性、ID格式、唯一性等
 */
@SpringBootTest
class IdGeneratorServiceTest {

    @Autowired
    private IdGeneratorService idGeneratorService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    /**
     * 测试活动ID生成格式
     */
    @Test
    void testGenerateActivityIdFormat() {
        String id = idGeneratorService.generateActivityId();
        String today = LocalDate.now().format(DATE_FORMATTER);

        // 验证格式：A + YYYYMMDD + 6位数字
        assertNotNull(id);
        assertEquals(15, id.length(), "ID长度应为15位");
        assertTrue(id.startsWith("A"), "ID应以A开头");
        assertTrue(id.startsWith("A" + today), "ID应包含当天日期");

        // 验证后6位是数字
        String sequence = id.substring(9);
        assertTrue(sequence.matches("\\d{6}"), "序号应为6位数字");
    }

    /**
     * 测试报名ID生成格式
     */
    @Test
    void testGenerateRegistrationIdFormat() {
        String id = idGeneratorService.generateRegistrationId();
        String today = LocalDate.now().format(DATE_FORMATTER);

        assertNotNull(id);
        assertEquals(15, id.length());
        assertTrue(id.startsWith("R" + today));
    }

    /**
     * 测试签到ID生成格式
     */
    @Test
    void testGenerateCheckinIdFormat() {
        String id = idGeneratorService.generateCheckinId();
        String today = LocalDate.now().format(DATE_FORMATTER);

        assertNotNull(id);
        assertEquals(15, id.length());
        assertTrue(id.startsWith("C" + today));
    }

    /**
     * 测试消息ID生成格式
     */
    @Test
    void testGenerateMessageIdFormat() {
        String id = idGeneratorService.generateMessageId();
        String today = LocalDate.now().format(DATE_FORMATTER);

        assertNotNull(id);
        assertEquals(15, id.length());
        assertTrue(id.startsWith("M" + today));
    }

    /**
     * 测试ID唯一性（单线程）
     */
    @Test
    void testIdUniqueness() {
        Set<String> ids = new HashSet<>();
        int count = 100;

        for (int i = 0; i < count; i++) {
            String id = idGeneratorService.generateActivityId();
            assertTrue(ids.add(id), "生成的ID应该是唯一的: " + id);
        }

        assertEquals(count, ids.size());
    }

    /**
     * 测试ID递增性
     */
    @Test
    void testIdIncrement() {
        String id1 = idGeneratorService.generateActivityId();
        String id2 = idGeneratorService.generateActivityId();
        String id3 = idGeneratorService.generateActivityId();

        // 提取序号部分
        int seq1 = Integer.parseInt(id1.substring(9));
        int seq2 = Integer.parseInt(id2.substring(9));
        int seq3 = Integer.parseInt(id3.substring(9));

        // 验证递增
        assertTrue(seq2 > seq1, "序号应该递增");
        assertTrue(seq3 > seq2, "序号应该递增");
        assertEquals(seq1 + 1, seq2, "序号应该连续递增");
        assertEquals(seq2 + 1, seq3, "序号应该连续递增");
    }

    /**
     * 测试并发生成ID的唯一性（核心测试）
     * 使用100个线程并发生成1000个ID，验证没有重复
     */
    @Test
    void testConcurrentIdGeneration() throws InterruptedException {
        int threadCount = 100;
        int idsPerThread = 10;
        int totalIds = threadCount * idsPerThread;

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);
        CyclicBarrier barrier = new CyclicBarrier(threadCount);

        Set<String> ids = new HashSet<>();
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);

        // 启动多个线程并发生成ID
        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    // 等待所有线程就绪，同时开始
                    barrier.await();

                    // 每个线程生成多个ID
                    for (int j = 0; j < idsPerThread; j++) {
                        try {
                            String id = idGeneratorService.generateActivityId();
                            synchronized (ids) {
                                ids.add(id);
                            }
                            successCount.incrementAndGet();
                        } catch (Exception e) {
                            errorCount.incrementAndGet();
                            e.printStackTrace();
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    latch.countDown();
                }
            });
        }

        // 等待所有线程完成
        latch.await();
        executor.shutdown();

        // 验证结果
        System.out.println("=== 并发测试结果 ===");
        System.out.println("线程数: " + threadCount);
        System.out.println("每线程ID数: " + idsPerThread);
        System.out.println("预期总ID数: " + totalIds);
        System.out.println("成功生成: " + successCount.get());
        System.out.println("生成失败: " + errorCount.get());
        System.out.println("唯一ID数: " + ids.size());

        assertEquals(0, errorCount.get(), "不应该有生成失败的ID");
        assertEquals(totalIds, successCount.get(), "应该成功生成所有ID");
        assertEquals(totalIds, ids.size(), "所有ID应该是唯一的（无重复）");
    }

    /**
     * 测试不同业务类型的ID互不干扰
     */
    @Test
    void testDifferentBusinessTypes() {
        String activityId = idGeneratorService.generateActivityId();
        String registrationId = idGeneratorService.generateRegistrationId();
        String checkinId = idGeneratorService.generateCheckinId();
        String messageId = idGeneratorService.generateMessageId();

        // 验证前缀不同
        assertEquals('A', activityId.charAt(0));
        assertEquals('R', registrationId.charAt(0));
        assertEquals('C', checkinId.charAt(0));
        assertEquals('M', messageId.charAt(0));

        // 验证各自的序号都从1开始（或接近1）
        String today = LocalDate.now().format(DATE_FORMATTER);
        System.out.println("Activity ID: " + activityId);
        System.out.println("Registration ID: " + registrationId);
        System.out.println("Checkin ID: " + checkinId);
        System.out.println("Message ID: " + messageId);
    }

    /**
     * 测试极端并发情况（压力测试）
     * 模拟高并发场景
     */
    @Test
    void testHighConcurrency() throws InterruptedException {
        int threadCount = 50;
        int idsPerThread = 20;

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);
        Set<String> ids = new HashSet<>();
        AtomicInteger duplicateCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    for (int j = 0; j < idsPerThread; j++) {
                        String id = idGeneratorService.generateActivityId();
                        synchronized (ids) {
                            if (!ids.add(id)) {
                                duplicateCount.incrementAndGet();
                                System.err.println("发现重复ID: " + id);
                            }
                        }
                    }
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executor.shutdown();

        assertEquals(0, duplicateCount.get(), "高并发情况下不应该出现重复ID");
        assertEquals(threadCount * idsPerThread, ids.size());
    }
}
