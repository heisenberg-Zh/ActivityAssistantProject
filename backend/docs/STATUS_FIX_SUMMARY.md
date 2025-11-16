# 活动状态问题修复总结

## 问题描述

用户在活动详情页点击"确认报名"时，后端返回 500 错误：`"活动未发布，无法报名"`

## 根本原因

1. **状态值不一致**：
   - 前端假数据使用中文状态：`"预发布"`, `"即将开始"`, `"进行中"`, `"已结束"`
   - 后端代码期望英文状态：`pending`, `published`, `ongoing`, `finished`, `cancelled`
   - 导入假数据时未统一状态值

2. **状态判断过严**：
   - `RegistrationService.java:61` 仅允许 `published` 状态报名
   - 但实际上 `ongoing` (进行中) 状态也应该允许报名

## 修复方案

### 1. 修改报名服务状态判断逻辑

**文件**: `backend/src/main/java/com/activityassistant/service/RegistrationService.java`

**修改前**:
```java
// 检查活动状态
if (!"published".equals(activity.getStatus())) {
    throw new BusinessException(INVALID_OPERATION, "活动未发布，无法报名");
}

if ("cancelled".equals(activity.getStatus())) {
    throw new BusinessException(INVALID_OPERATION, "活动已取消，无法报名");
}

if ("finished".equals(activity.getStatus())) {
    throw new BusinessException(INVALID_OPERATION, "活动已结束，无法报名");
}
```

**修改后**:
```java
// 检查活动状态 - 只有已发布(published)和进行中(ongoing)的活动可以报名
if ("cancelled".equals(activity.getStatus())) {
    throw new BusinessException(INVALID_OPERATION, "活动已取消，无法报名");
}

if ("finished".equals(activity.getStatus())) {
    throw new BusinessException(INVALID_OPERATION, "活动已结束，无法报名");
}

if (!"published".equals(activity.getStatus()) && !"ongoing".equals(activity.getStatus())) {
    throw new BusinessException(INVALID_OPERATION, "活动未发布，无法报名");
}
```

**改进点**:
- 先判断不可报名的状态（cancelled, finished）
- 然后允许 published 和 ongoing 两种状态报名
- 逻辑更清晰，扩展性更好

### 2. 统一数据库活动状态

**文件**: `backend/fix_activity_status.sql`

**状态映射**:
- `"预发布"` → `pending` (待发布)
- `"即将开始"` → `published` (已发布，可以报名)
- `"进行中"` → `ongoing` (进行中，可以报名)
- `"已结束"` → `finished` (已结束，不可报名)
- `"已取消"` → `cancelled` (已取消，不可报名)

**执行结果**:
```
状态修复完成
- pending (待发布): 3条
- published (已发布): 7条
- ongoing (进行中): 1条
- finished (已结束): 19条
- cancelled (已取消): 0条
总计: 30条活动
```

## 全量排查结果

### 已检查的服务层文件

1. ✅ **RegistrationService.java** - 已修复
   - 修改了状态判断逻辑，允许 published 和 ongoing 状态报名

2. ✅ **CheckinService.java** - 无需修复
   - 第68行已正确判断：允许 published 和 ongoing 状态签到

3. ✅ **ActivityService.java** - 无需修复
   - 状态判断逻辑合理，仅在发布/取消活动时使用

4. ✅ **StatisticsService.java** - 无需修复
   - 不涉及状态判断

5. ✅ **UserService.java** - 无需修复
   - 不涉及活动状态

6. ✅ **WeChatService.java** - 无需修复
   - 不涉及活动状态

### 已检查的控制器层

所有 Controller 文件均无硬编码状态值，状态判断逻辑在 Service 层处理。

## 标准状态枚举

后端使用的活动状态标准：

| 状态值 | 中文名称 | 说明 | 是否可报名 | 是否可签到 |
|--------|---------|------|----------|----------|
| `pending` | 待发布/草稿 | 活动尚未发布 | ❌ | ❌ |
| `published` | 已发布 | 活动已发布，等待开始 | ✅ | ✅ |
| `ongoing` | 进行中 | 活动正在进行 | ✅ | ✅ |
| `finished` | 已结束 | 活动已结束 | ❌ | ❌ |
| `cancelled` | 已取消 | 活动已取消 | ❌ | ❌ |

## 测试验证

### 建议测试场景

1. **报名功能测试**:
   - [ ] 对 `published` 状态活动进行报名
   - [ ] 对 `ongoing` 状态活动进行报名
   - [ ] 对 `pending` 状态活动报名（应被拒绝）
   - [ ] 对 `finished` 状态活动报名（应被拒绝）
   - [ ] 对 `cancelled` 状态活动报名（应被拒绝）

2. **签到功能测试**:
   - [ ] 对 `published` 状态活动进行签到
   - [ ] 对 `ongoing` 状态活动进行签到
   - [ ] 对其他状态活动签到（应被拒绝）

3. **活动列表测试**:
   - [ ] 验证活动列表中状态显示正确
   - [ ] 验证状态筛选功能正常

4. **活动详情测试**:
   - [ ] 验证活动详情页状态显示正确
   - [ ] 验证报名按钮根据状态正确启用/禁用

## 后续建议

### 1. 创建状态枚举类

**建议文件**: `backend/src/main/java/com/activityassistant/constant/ActivityStatus.java`

```java
public enum ActivityStatus {
    PENDING("pending", "待发布"),
    PUBLISHED("published", "已发布"),
    ONGOING("ongoing", "进行中"),
    FINISHED("finished", "已结束"),
    CANCELLED("cancelled", "已取消");

    private final String code;
    private final String label;

    // 构造函数、getter等
}
```

### 2. 前端状态统一

确保前端在调用API时使用英文状态值，在显示时转换为中文。

### 3. 数据导入规范

在导入假数据时，应使用后端定义的标准状态值，避免使用中文状态。

### 4. API文档更新

在 Swagger/OpenAPI 文档中明确标注状态枚举值和说明。

## 总结

本次修复解决了报名功能因状态判断问题导致的报错，同时：
- 统一了数据库中的活动状态为标准英文枚举
- 放宽了报名和签到的状态限制（允许 ongoing 状态）
- 全量排查了其他接口，确保没有类似问题

**修复时间**: 2025-01-XX
**影响范围**: 报名功能、状态判断逻辑、数据库数据
**测试状态**: 待验证
