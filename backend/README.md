# ActivityAssistant 后端系统

> 微信小程序"ActivityAssistant"的后端API服务
>
> **技术栈**：Java 17 + Spring Boot 3.2 + MySQL 8.0 + Redis

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/technologies/downloads/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)

---

## 📖 项目简介

本项目为"活动助手"微信小程序提供后端RESTful API服务，支持活动管理、报名签到、数据统计等核心功能。

### 核心功能
- ✅ 微信登录鉴权（已完成）
- ✅ JWT Token认证授权（已完成）
- ⏳ 活动创建与管理（开发中）
- ⏳ 报名审核与名额控制（计划中）
- ⏳ GPS定位签到（计划中）
- ⏳ 数据统计与导出（计划中）

**当前版本**：v1.0.0-alpha（阶段1完成）
**最后更新**：2025-11-10

---

## 🚀 快速开始

### 前置要求

确保您已安装以下工具（详见 [环境搭建指南](docs/SETUP_GUIDE.md)）：

- JDK 17+
- Maven 3.9+
- MySQL 8.0+
- IntelliJ IDEA（推荐）

### 1. 克隆项目

```bash
git clone <repository-url>
cd ActivityAssistantProject/backend
```

### 2. 创建数据库

```bash
mysql -u root -p

# 创建数据库
CREATE DATABASE activity_assistant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户（可选）
CREATE USER 'activity_user'@'localhost' IDENTIFIED BY 'Activity@2025';
GRANT ALL PRIVILEGES ON activity_assistant.* TO 'activity_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 初始化数据库

```bash
# 运行建表脚本
mysql -u activity_user -p activity_assistant < scripts/init-schema.sql

# 导入测试数据
mysql -u activity_user -p activity_assistant < scripts/init-data.sql
```

### 4. 配置应用

编辑 `src/main/resources/application-dev.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/activity_assistant
    username: activity_user
    password: Activity@2025  # 修改为您的密码
```

### 5. 启动项目

**方式1：IDEA运行**
```
右键 ActivityApplication.java -> Run 'ActivityApplication'
```

**方式2：Maven命令**
```bash
mvn spring-boot:run
```

**方式3：打包运行**
```bash
mvn clean package
java -jar target/activity-assistant-1.0.0.jar
```

### 6. 验证运行

访问：http://localhost:8082/swagger-ui.html

看到API文档页面说明启动成功！✅

**测试登录接口**：
```bash
curl -X POST 'http://localhost:8082/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"code":"test_code_dev"}'
```

**期望返回**：包含token和userInfo的JSON响应

---

## 📚 文档索引

| 文档 | 说明 | 状态 |
|-----|------|------|
| [实施计划](docs/IMPLEMENTATION_PLAN.md) | 完整的开发计划和分阶段任务 | ✅ 完成 |
| [环境搭建指南](docs/SETUP_GUIDE.md) | 开发环境安装步骤（Windows） | ✅ 完成 |
| [数据库设计](docs/DATABASE_DESIGN.md) | 数据库表结构和SQL脚本 | ✅ 完成 |
| [API规范](docs/API_SPECIFICATION.md) | RESTful API接口文档 | ✅ 完成 |
| [开发进度](docs/DEVELOPMENT_PROGRESS.md) | 实时开发进度追踪 | 🔄 持续更新 |

**开发进度**：阶段0 ✅ 100% | 阶段1 ✅ 100% | 整体进度 40%

---

## 🏗️ 项目结构

```
backend/
├── docs/                           # 项目文档
│   ├── IMPLEMENTATION_PLAN.md      # 实施计划
│   ├── SETUP_GUIDE.md              # 环境搭建指南
│   ├── DATABASE_DESIGN.md          # 数据库设计
│   ├── API_SPECIFICATION.md        # API规范
│   └── DEVELOPMENT_PROGRESS.md     # 开发进度
├── scripts/                        # 脚本文件
│   ├── init-schema.sql             # 建表脚本
│   └── init-data.sql               # 测试数据
├── src/
│   ├── main/
│   │   ├── java/com/activityassistant/
│   │   │   ├── config/             # 配置类
│   │   │   ├── controller/         # 控制器
│   │   │   ├── service/            # 业务逻辑
│   │   │   ├── repository/         # 数据访问
│   │   │   ├── model/              # 实体类
│   │   │   ├── dto/                # 数据传输对象
│   │   │   ├── mapper/             # MapStruct映射
│   │   │   ├── security/           # 安全相关
│   │   │   ├── exception/          # 异常定义
│   │   │   ├── util/               # 工具类
│   │   │   └── constant/           # 常量
│   │   └── resources/
│   │       ├── application.yml     # 主配置
│   │       ├── application-dev.yml # 开发环境
│   │       └── application-prod.yml# 生产环境
│   └── test/                       # 测试代码
├── pom.xml                         # Maven配置
└── README.md                       # 本文档
```

---

## 🔧 开发环境配置

### Dev环境（开发/测试）

```yaml
# application-dev.yml
spring:
  profiles:
    active: dev

# 特点：
# - 使用本地MySQL
# - 模拟微信登录（无需真实AppSecret）
# - 日志级别：DEBUG
# - 快速登录：code='test_code_dev' 即可登录
```

### Prod环境（生产）

```yaml
# application-prod.yml
spring:
  profiles:
    active: prod

# 特点：
# - 使用云数据库
# - 真实微信登录
# - 日志级别：INFO
# - 需要配置真实的AppID和AppSecret
```

---

## 📡 API接口

### 基础URL

```
开发环境：http://localhost:8082
生产环境：https://api.yourdomain.com
```

### 已实现接口（阶段1）

| 模块 | 接口 | 说明 | 状态 |
|-----|------|------|------|
| **健康检查** | `GET /api/health` | 系统健康状态 | ✅ 已完成 |
| **认证** | `POST /api/auth/login` | 微信登录 | ✅ 已完成 |
| **用户** | `GET /api/user/profile` | 获取当前用户信息 | ✅ 已完成 |
| **用户** | `PUT /api/user/profile` | 更新用户信息 | ✅ 已完成 |
| **用户** | `GET /api/user/{userId}` | 查看他人信息 | ✅ 已完成 |

### 计划接口（阶段2-4）

| 模块 | 接口 | 说明 | 状态 |
|-----|------|------|------|
| **活动** | `GET /api/activities` | 活动列表 | ⏳ 计划中 |
| **活动** | `POST /api/activities` | 创建活动 | ⏳ 计划中 |
| **报名** | `POST /api/registrations` | 提交报名 | ⏳ 计划中 |
| **签到** | `POST /api/checkins` | 签到 | ⏳ 计划中 |
| **统计** | `GET /api/statistics/activities/:id` | 活动统计 | ⏳ 计划中 |

**完整接口文档**：http://localhost:8082/swagger-ui.html

---

## 🧪 测试

### 运行单元测试

```bash
mvn test
```

### 使用Postman测试

导入 `postman_collection.json`（后续提供）

### 测试账号（Dev环境）

```json
{
  "code": "test_code_dev"
}
```

返回的Token可用于后续接口测试。

---

## 📦 打包部署

### 1. 打包

```bash
mvn clean package -Dmaven.test.skip=true
```

生成文件：`target/activity-assistant-1.0.0.jar`

### 2. 运行

```bash
# 开发环境
java -jar target/activity-assistant-1.0.0.jar --spring.profiles.active=dev

# 生产环境
java -jar target/activity-assistant-1.0.0.jar --spring.profiles.active=prod
```

### 3. Docker部署（可选）

```bash
# 构建镜像
docker build -t activity-assistant:1.0.0 .

# 运行容器
docker run -d -p 8080:8080 --name activity-backend activity-assistant:1.0.0
```

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|-----|------|------|
| Java | 17 | 编程语言 |
| Spring Boot | 3.2.1 | 应用框架 |
| Spring Data JPA | 3.2.1 | ORM框架 |
| MySQL | 8.0 | 数据库 |
| Redis | 7.0 | 缓存 |
| Lombok | 1.18.30 | 代码简化 |
| MapStruct | 1.5.5 | 对象映射 |
| WxJava | 4.6.0 | 微信SDK |
| SpringDoc OpenAPI | 2.3.0 | API文档 |
| JUnit 5 | 5.10.1 | 测试框架 |

---

## ⚠️ 注意事项

### 安全规范

**重要**：务必遵守 `../API_SECURITY_SPEC.md` 中的安全规范！

关键要点：
- ✅ 所有API必须进行Token认证
- ✅ 权限校验在后端执行，不信任前端
- ✅ 用户ID从Token获取，不信任前端传参
- ✅ 所有用户输入进行XSS和SQL注入防护
- ✅ 敏感信息（手机号）脱敏返回

### 数据库注意事项

- 使用 `utf8mb4` 字符集（支持emoji）
- JSON字段不要作为高频查询条件
- 定期备份数据库
- 生产环境使用连接池

---

## 🤝 贡献指南

### 开发流程

1. 从 `main` 分支创建功能分支
2. 编写代码并提交（遵循 Commit 规范）
3. 运行测试确保通过
4. 提交 Pull Request

### Commit 规范

```
feat(module): 新功能描述
fix(module): Bug修复描述
docs(module): 文档更新
style: 代码格式调整
refactor: 重构代码
test: 测试相关
chore: 构建/工具变动
```

---

## 📞 联系方式

**项目负责人**：用户
**技术支持**：Claude (AI)
**开始日期**：2025-01-08

---

## 📄 License

MIT License

---

**最后更新**：2025-11-10

---

## 📈 开发进度

### 已完成
- ✅ **阶段0**：项目准备（100%）
  - 文档编写完成
  - 环境搭建完成
  - 数据库初始化完成

- ✅ **阶段1**：用户认证模块（100%）
  - 项目框架搭建
  - 用户登录/注册
  - JWT认证授权
  - Spring Security集成
  - 5个API接口上线

### 进行中
- 🔜 **阶段2**：活动管理模块（0%）
  - 计划开始时间：待定

### 计划中
- ⏳ **阶段3**：报名管理模块
- ⏳ **阶段4**：签到与统计模块

**详细进度**：查看 [开发进度文档](docs/DEVELOPMENT_PROGRESS.md)
