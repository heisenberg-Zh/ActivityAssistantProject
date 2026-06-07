package com.activityassistant.service;

import com.activityassistant.exception.BusinessException;
import com.activityassistant.dto.response.ActivityExportSummaryVO;
import com.activityassistant.model.Activity;
import com.activityassistant.model.Registration;
import com.activityassistant.model.User;
import com.activityassistant.repository.ActivityRepository;
import com.activityassistant.repository.RegistrationRepository;
import com.activityassistant.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Activity registration export service.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityExportService {

    private static final DateTimeFormatter FILE_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;
    private static final String[] HEADERS = {
            "活动序号", "活动标题", "报名序号", "报名分组", "所属部门-姓名", "报名状态", "打卡状态"
    };

    private final ActivityRepository activityRepository;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public ExportFile exportCreatedAndManagedActivities(String userId, LocalDate startDate, LocalDate endDate) {
        ExportData exportData = loadExportData(userId, startDate, endDate);
        Map<String, List<Registration>> registrationsByActivityId = exportData.registrations().stream()
                .collect(Collectors.groupingBy(Registration::getActivityId));
        Map<String, User> userById = loadUsers(exportData.registrations());

        byte[] content = buildWorkbook(exportData.activities(), registrationsByActivityId, userById);
        return new ExportFile(buildFilename(startDate, endDate), content);
    }

    public ActivityExportSummaryVO getExportSummary(String userId, LocalDate startDate, LocalDate endDate) {
        ExportData exportData = loadExportData(userId, startDate, endDate);
        return ActivityExportSummaryVO.builder()
                .activityCount(exportData.activities().size())
                .registrationCount(exportData.registrations().size())
                .rangeText(buildRangeText(startDate, endDate))
                .build();
    }

    private ExportData loadExportData(String userId, LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new BusinessException(400, "开始日期不能晚于结束日期");
        }

        LocalDateTime startTime = startDate == null ? null : startDate.atStartOfDay();
        LocalDateTime endTime = endDate == null ? null : endDate.plusDays(1).atStartOfDay();
        List<Activity> activities = activityRepository.findExportableActivities(userId, startTime, endTime);
        List<String> activityIds = activities.stream().map(Activity::getId).collect(Collectors.toList());
        List<Registration> registrations = activityIds.isEmpty()
                ? Collections.emptyList()
                : registrationRepository.findExportRegistrationsByActivityIds(activityIds);
        return new ExportData(activities, registrations);
    }

    private Map<String, User> loadUsers(List<Registration> registrations) {
        Set<String> userIds = registrations.stream()
                .map(Registration::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user));
    }

    private byte[] buildWorkbook(List<Activity> activities,
                                 Map<String, List<Registration>> registrationsByActivityId,
                                 Map<String, User> userById) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("活动报名明细");
            CellStyle headerStyle = createHeaderStyle(workbook);
            writeHeader(sheet, headerStyle);

            int rowIndex = 1;
            int activityIndex = 1;
            for (Activity activity : activities) {
                Map<String, String> groupNameById = parseGroupNames(activity.getGroups());
                List<Registration> registrations = registrationsByActivityId.getOrDefault(activity.getId(), Collections.emptyList());

                if (registrations.isEmpty()) {
                    Row row = sheet.createRow(rowIndex++);
                    writeCell(row, 0, activityIndex);
                    writeCell(row, 1, activity.getTitle());
                    activityIndex++;
                    continue;
                }

                int registrationIndex = 1;
                for (Registration registration : registrations) {
                    User user = userById.get(registration.getUserId());
                    Map<String, String> customData = parseCustomData(registration.getCustomData());
                    Row row = sheet.createRow(rowIndex++);

                    writeCell(row, 0, activityIndex);
                    writeCell(row, 1, activity.getTitle());
                    writeCell(row, 2, registrationIndex++);
                    writeCell(row, 3, resolveGroupName(groupNameById, registration.getGroupId()));
                    writeCell(row, 4, buildDepartmentAndName(customData, registration, user));
                    writeCell(row, 5, formatRegistrationStatus(registration.getStatus()));
                    writeCell(row, 6, formatCheckinStatus(registration.getCheckinStatus()));
                }
                activityIndex++;
            }

            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
                int width = Math.min(Math.max(sheet.getColumnWidth(i) + 1024, 3200), 12000);
                sheet.setColumnWidth(i, width);
            }
            sheet.createFreezePane(0, 1);

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException e) {
            log.error("生成活动报名导出文件失败", e);
            throw new BusinessException(500, "生成导出文件失败");
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);
        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        return style;
    }

    private void writeHeader(Sheet sheet, CellStyle headerStyle) {
        Row header = sheet.createRow(0);
        for (int i = 0; i < HEADERS.length; i++) {
            Cell cell = header.createCell(i);
            cell.setCellValue(HEADERS[i]);
            cell.setCellStyle(headerStyle);
        }
    }

    private void writeCell(Row row, int column, Object value) {
        Cell cell = row.createCell(column);
        if (value instanceof Number number) {
            cell.setCellValue(number.doubleValue());
            return;
        }
        cell.setCellValue(value == null ? "" : String.valueOf(value));
    }

    private Map<String, String> parseGroupNames(String groupsJson) {
        if (isBlank(groupsJson)) {
            return Collections.emptyMap();
        }
        try {
            JsonNode root = objectMapper.readTree(groupsJson);
            if (!root.isArray()) {
                return Collections.emptyMap();
            }
            Map<String, String> result = new HashMap<>();
            for (JsonNode node : root) {
                String id = textValue(node, "id");
                String name = textValue(node, "name");
                if (!isBlank(id) && !isBlank(name)) {
                    result.put(id, name);
                }
            }
            return result;
        } catch (Exception e) {
            log.warn("解析活动分组失败: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    private Map<String, String> parseCustomData(String customDataJson) {
        if (isBlank(customDataJson)) {
            return Collections.emptyMap();
        }
        try {
            Map<String, Object> parsed = objectMapper.readValue(customDataJson, new TypeReference<LinkedHashMap<String, Object>>() {});
            Map<String, String> result = new HashMap<>();
            parsed.forEach((key, value) -> {
                if (key == null || key.startsWith("_")) {
                    return;
                }
                result.put(key, value == null ? "" : String.valueOf(value).trim());
            });
            return result;
        } catch (Exception e) {
            log.warn("解析报名自定义字段失败: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    private String textValue(JsonNode node, String fieldName) {
        JsonNode value = node.get(fieldName);
        return value == null || value.isNull() ? "" : value.asText("").trim();
    }

    private String resolveGroupName(Map<String, String> groupNameById, String groupId) {
        if (isBlank(groupId)) {
            return "";
        }
        return groupNameById.getOrDefault(groupId, groupId);
    }

    private String buildDepartmentAndName(Map<String, String> customData, Registration registration, User user) {
        String department = firstNonBlank(customData.get("custom_2"), customData.get("所属部门"));
        String name = firstNonBlank(customData.get("custom_1"), customData.get("真实姓名"), registration.getName(), user == null ? null : user.getNickname());
        if (isBlank(department)) {
            return name;
        }
        if (isBlank(name)) {
            return department;
        }
        return department + "-" + name;
    }

    private String formatRegistrationStatus(String status) {
        if (status == null) {
            return "";
        }
        return switch (status) {
            case "approved" -> "已通过";
            case "pending" -> "待审核";
            case "rejected" -> "已拒绝";
            case "cancelled" -> "已取消";
            case "removed" -> "已移除";
            default -> status;
        };
    }

    private String formatCheckinStatus(String status) {
        return "checked".equals(status) || "late".equals(status) ? "已打卡" : "未打卡";
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (!isBlank(value)) {
                return value.trim();
            }
        }
        return "";
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String buildFilename(LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return "活动报名导出_全部.xlsx";
        }
        String start = startDate == null ? "开始" : FILE_DATE_FORMATTER.format(startDate);
        String end = endDate == null ? "至今" : FILE_DATE_FORMATTER.format(endDate);
        return "活动报名导出_" + start + "_" + end + ".xlsx";
    }

    private String buildRangeText(LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return "全部活动";
        }
        String start = startDate == null ? "最早活动创建日期" : startDate.toString();
        String end = endDate == null ? "当前日期" : endDate.toString();
        return start + " 至 " + end;
    }

    public record ExportFile(String filename, byte[] content) {
    }

    private record ExportData(List<Activity> activities, List<Registration> registrations) {
    }
}
