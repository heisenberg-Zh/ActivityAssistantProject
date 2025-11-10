# 开发环境搭建指南

本指南提供 Windows 环境下从零搭建 ActivityAssistant 后端开发环境的详细步骤。

**目标环境**：Windows 10/11
**预计用时**：1-2小时
**难度等级**：⭐⭐（适合初学者）

---

## 📋 目录

- [一、环境清单](#一环境清单)
- [二、JDK 17 安装](#二jdk-17-安装)
- [三、Maven 安装](#三maven-安装)
- [四、IntelliJ IDEA 安装](#四intellij-idea-安装)
- [五、MySQL 8.0 安装](#五mysql-80-安装)
- [六、Redis 安装（可选）](#六redis-安装可选)
- [七、Postman 安装](#七postman-安装)
- [八、项目导入和配置](#八项目导入和配置)
- [九、数据库初始化](#九数据库初始化)
- [十、启动项目](#十启动项目)
- [十一、常见问题](#十一常见问题)

---

## 一、环境清单

### 必需工具

| 工具 | 版本 | 用途 | 下载地址 |
|-----|------|------|---------|
| JDK | 17 (LTS) | Java运行环境 | https://www.oracle.com/java/technologies/downloads/ |
| Maven | 3.9+ | 项目构建工具 | https://maven.apache.org/download.cgi |
| IntelliJ IDEA | 2023.2+ | Java IDE | https://www.jetbrains.com/idea/download/ |
| MySQL | 8.0+ | 数据库 | https://dev.mysql.com/downloads/mysql/ |
| Postman | 最新版 | API测试工具 | https://www.postman.com/downloads/ |

### 可选工具

| 工具 | 用途 | 下载地址 |
|-----|------|---------|
| Redis | 缓存（后期） | https://github.com/tporadowski/redis/releases |
| Navicat | 数据库管理 | https://www.navicat.com/ |
| Git | 版本控制 | https://git-scm.com/downloads |

---

## 二、JDK 17 安装

### 2.1 下载JDK

1. 访问：https://www.oracle.com/java/technologies/downloads/#java17
2. 选择 **Windows** → **x64 Installer**
3. 下载文件：`jdk-17_windows-x64_bin.exe`（约150MB）

### 2.2 安装步骤

1. 双击运行 `jdk-17_windows-x64_bin.exe`
2. 点击 **Next** → 选择安装路径（建议：`C:\Program Files\Java\jdk-17`）
3. 点击 **Next** → **Close** 完成安装

### 2.3 配置环境变量

**Windows 10/11 步骤**：

1. 右键 **此电脑** → **属性** → **高级系统设置**
2. 点击 **环境变量**
3. 在 **系统变量** 中点击 **新建**：
   ```
   变量名：JAVA_HOME
   变量值：C:\Program Files\Java\jdk-17
   ```
4. 找到 **Path** 变量，点击 **编辑** → **新建**：
   ```
   %JAVA_HOME%\bin
   ```
5. 点击 **确定** 保存

### 2.4 验证安装

打开 **CMD**（Windows + R → 输入 `cmd`）：

```bash
java -version
```

**期望输出**：
```
java version "17.0.x" 2024-xx-xx LTS
Java(TM) SE Runtime Environment (build 17.0.x+x-LTS-xxx)
Java HotSpot(TM) 64-Bit Server VM (build 17.0.x+x-LTS-xxx, mixed mode, sharing)
```

如果显示版本号，说明安装成功！✅

---

## 三、Maven 安装

### 3.1 下载Maven

1. 访问：https://maven.apache.org/download.cgi
2. 下载 **Binary zip archive**：`apache-maven-3.9.6-bin.zip`

### 3.2 安装步骤

1. 解压到 `C:\Program Files\Apache\apache-maven-3.9.6`
2. （可选）重命名为 `C:\Program Files\Apache\maven`

### 3.3 配置环境变量

1. 新建系统变量：
   ```
   变量名：MAVEN_HOME
   变量值：C:\Program Files\Apache\maven
   ```
2. 编辑 **Path**，新建：
   ```
   %MAVEN_HOME%\bin
   ```

### 3.4 配置Maven镜像（加速下载）

编辑文件：`C:\Program Files\Apache\maven\conf\settings.xml`

在 `<mirrors>` 标签内添加（推荐阿里云镜像）：

```xml
<mirror>
  <id>aliyun</id>
  <mirrorOf>central</mirrorOf>
  <name>Aliyun Maven</name>
  <url>https://maven.aliyun.com/repository/public</url>
</mirror>
```

### 3.5 验证安装

```bash
mvn -v
```

**期望输出**：
```
Apache Maven 3.9.6 (xxxxx)
Maven home: C:\Program Files\Apache\maven
Java version: 17.0.x, vendor: Oracle Corporation
```

---

## 四、IntelliJ IDEA 安装

### 4.1 下载IDEA

1. 访问：https://www.jetbrains.com/idea/download/?section=windows
2. 下载 **Community Edition**（免费版）或 **Ultimate**（付费版，有30天试用）

**建议**：Ultimate版包含Spring Boot支持，更方便开发

### 4.2 安装步骤

1. 运行安装包 `ideaIU-2023.x.x.exe`
2. 选择安装路径（建议：`C:\Program Files\JetBrains\IntelliJ IDEA 2023`）
3. 勾选选项：
   - ✅ 64-bit launcher
   - ✅ Add "bin" folder to the PATH
   - ✅ .java 文件关联
   - ✅ Add "Open Folder as Project"
4. 点击 **Install** → 完成后启动IDEA

### 4.3 初次启动配置

1. **选择UI主题**：Dark（暗色）或 Light（亮色）
2. **安装插件（推荐）**：
   - ✅ Lombok（自动生成getter/setter）
   - ✅ Rainbow Brackets（彩虹括号）
   - ✅ Alibaba Java Coding Guidelines（阿里代码规范）
   - ✅ MyBatisX（如果用MyBatis）

### 4.4 配置Maven

1. 启动IDEA → **File** → **Settings**
2. 搜索 **Maven**
3. 配置：
   ```
   Maven home directory: C:\Program Files\Apache\maven
   User settings file: C:\Program Files\Apache\maven\conf\settings.xml
   Local repository: C:\Users\你的用户名\.m2\repository
   ```

---

## 五、MySQL 8.0 安装

### 5.1 下载MySQL

1. 访问：https://dev.mysql.com/downloads/mysql/
2. 选择 **Windows (x86, 64-bit), ZIP Archive**
3. 下载文件：`mysql-8.0.35-winx64.zip`（约350MB）

**或者使用 MySQL Installer（推荐新手）**：
- 下载：`mysql-installer-community-8.0.35.0.msi`
- 自动安装MySQL Server、MySQL Workbench等

### 5.2 安装步骤（使用Installer）

1. 运行 `mysql-installer-community-8.0.35.0.msi`
2. 选择 **Custom** 安装类型
3. 勾选：
   - ✅ MySQL Server 8.0.35
   - ✅ MySQL Workbench 8.0.35（数据库管理工具）
   - ✅ MySQL Shell
4. 点击 **Next** → **Execute** 开始安装
5. 配置MySQL Server：
   - **Config Type**: Development Computer
   - **Port**: 3306（默认）
   - **Root Password**: 设置root密码（**务必记住！**）
   - **Windows Service**: 勾选（开机自启）
   - **Service Name**: MySQL80
6. 点击 **Execute** → **Finish**

### 5.3 验证安装

打开 **CMD**：

```bash
mysql -u root -p
```

输入刚才设置的root密码，看到以下提示说明成功：

```
Welcome to the MySQL monitor.  Commands end with ; or \g.
mysql>
```

输入 `exit` 退出。

### 5.4 创建数据库

```bash
mysql -u root -p
```

输入以下SQL：

```sql
CREATE DATABASE activity_assistant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建应用用户（推荐，不直接使用root）
CREATE USER 'activity_user'@'localhost' IDENTIFIED BY 'Activity@2025';
GRANT ALL PRIVILEGES ON activity_assistant.* TO 'activity_user'@'localhost';
FLUSH PRIVILEGES;

-- 验证
SHOW DATABASES;
```

**期望输出**：
```
+----------------------+
| Database             |
+----------------------+
| activity_assistant   |
| information_schema   |
| mysql                |
| ...                  |
+----------------------+
```

---

## 六、Redis 安装（可选）

Redis 主要用于缓存和Session管理，开发初期可以不安装。

### 6.1 下载Redis（Windows版）

1. 访问：https://github.com/tporadowski/redis/releases
2. 下载最新版：`Redis-x64-5.0.14.1.zip`

### 6.2 安装步骤

1. 解压到 `C:\Program Files\Redis`
2. 打开CMD，进入Redis目录：
   ```bash
   cd C:\Program Files\Redis
   redis-server.exe
   ```
3. 看到 `Ready to accept connections` 说明启动成功

### 6.3 安装为Windows服务（推荐）

在Redis目录下执行：

```bash
redis-server --service-install redis.windows.conf
redis-server --service-start
```

验证：
```bash
redis-cli
ping
```

返回 `PONG` 说明成功！

---

## 七、Postman 安装

### 7.1 下载Postman

访问：https://www.postman.com/downloads/

### 7.2 安装

1. 运行安装包（自动安装到 `C:\Users\你的用户名\AppData\Local\Postman`）
2. 启动Postman
3. 可选：注册账号（可跳过，选择 **Skip and go to the app**）

### 7.3 导入接口集合（后续提供）

后续会提供 `postman_collection.json`，可以一键导入所有接口。

---

## 八、项目导入和配置

### 8.1 打开项目

1. 启动 IntelliJ IDEA
2. 选择 **Open**
3. 找到项目路径：`D:\Project\ActivityAssistantProject\backend`
4. 点击 **OK**

### 8.2 等待Maven下载依赖

首次打开项目，IDEA会自动下载依赖包（约5-10分钟，取决于网速）。

右下角会显示：
```
Indexing...
Downloading: xxx.jar
```

**耐心等待，直到所有依赖下载完成！**

### 8.3 配置application-dev.yml

编辑文件：`backend/src/main/resources/application-dev.yml`

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/activity_assistant?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=Asia/Shanghai
    username: activity_user
    password: Activity@2025
    driver-class-name: com.mysql.cj.jdbc.Driver
```

**确保数据库密码与你设置的一致！**

### 8.4 配置Lombok插件

1. **File** → **Settings** → **Plugins**
2. 搜索 **Lombok**
3. 点击 **Install** → **Restart IDE**

### 8.5 启用Annotation Processing

1. **File** → **Settings**
2. 搜索 **Annotation Processors**
3. 勾选 **Enable annotation processing**
4. 点击 **Apply**

---

## 九、数据库初始化

### 9.1 运行建表脚本

在MySQL中执行：

```bash
mysql -u activity_user -p activity_assistant < D:\Project\ActivityAssistantProject\backend\scripts\init-schema.sql
```

或者在MySQL Workbench中：
1. 打开 `backend/scripts/init-schema.sql`
2. 点击 **Execute**（闪电图标）


### 9.2 导入测试数据

```bash
mysql -u activity_user -p activity_assistant < D:\Project\ActivityAssistantProject\backend\scripts\init-data.sql
```


### 9.3 验证数据

```sql
USE activity_assistant;
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM activities;
```

**期望输出**：
```
+------------------------+
| Tables_in_activity_assistant |
+------------------------+
| activities             |
| checkins               |
| messages               |
| registrations          |
| users                  |
+------------------------+

COUNT(*): 6  (用户数)
COUNT(*): 30 (活动数)
```

---

## 十、启动项目

### 10.1 找到启动类

文件路径：`backend/src/main/java/com/activityassistant/ActivityApplication.java`

### 10.2 运行项目

**方式1：IDEA运行**
1. 右键 `ActivityApplication.java`
2. 点击 **Run 'ActivityApplication'**

**方式2：Maven命令**
```bash
cd D:\Project\ActivityAssistantProject\backend
mvn spring-boot:run
```

### 10.3 验证启动成功

看到以下日志说明启动成功：

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.2.1)

2025-01-08 10:00:00.000  INFO 12345 --- [main] c.a.ActivityApplication: Started ActivityApplication in 5.234 seconds (JVM running for 6.123)
```

### 10.4 访问Swagger文档

打开浏览器：http://localhost:8080/swagger-ui.html

看到API文档页面说明成功！

### 10.5 测试登录接口

使用Postman发送请求：

```
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "code": "test_code_dev"
}
```

**期望返回**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzUxMiJ9...",
    "userInfo": {
      "id": "u1",
      "nickname": "张小北",
      "avatar": "/activityassistant_avatar_01.png"
    }
  }
}
```

✅ 恭喜！项目启动成功！

---

## 十一、常见问题

### Q1: JDK版本不对

**错误**：`java.lang.UnsupportedClassVersionError`

**解决**：
1. 确认JDK版本：`java -version`
2. 确认IDEA使用的JDK：**File** → **Project Structure** → **Project SDK**
3. 确保都是JDK 17

### Q2: Maven下载依赖超时

**错误**：`Could not resolve dependencies`

**解决**：
1. 检查网络连接
2. 配置阿里云镜像（见3.4节）
3. 删除本地仓库损坏的文件：`C:\Users\你的用户名\.m2\repository`

### Q3: MySQL连接失败

**错误**：`Communications link failure`

**解决**：
1. 确认MySQL服务已启动：**服务** → **MySQL80**
2. 确认端口3306未被占用：`netstat -ano | findstr 3306`
3. 检查 `application-dev.yml` 中的密码

### Q4: 端口8080被占用

**错误**：`Port 8080 was already in use`

**解决**：
1. 查找占用进程：`netstat -ano | findstr 8080`
2. 结束进程：`taskkill /F /PID 进程号`
3. 或修改配置：`application-dev.yml` → `server.port: 8081`

### Q5: Lombok不生效

**错误**：找不到 `getXxx()` 方法

**解决**：
1. 确认安装Lombok插件（见8.4节）
2. 启用Annotation Processing（见8.5节）
3. 重启IDEA

### Q6: 数据库中文乱码

**解决**：
1. 创建数据库时指定字符集：
   ```sql
   CREATE DATABASE activity_assistant
   CHARACTER SET utf8mb4
   COLLATE utf8mb4_unicode_ci;
   ```
2. 修改 `my.ini`（MySQL配置文件）：
   ```ini
   [mysqld]
   character-set-server=utf8mb4
   collation-server=utf8mb4_unicode_ci
   ```

---

## 十二、下一步

环境搭建完成后，请参考：

- 📘 **开发进度追踪**：`docs/DEVELOPMENT_PROGRESS.md`
- 📘 **API接口文档**：`docs/API_SPECIFICATION.md`
- 📘 **数据库设计**：`docs/DATABASE_DESIGN.md`

**准备开始开发了吗？** 🚀

---

**文档版本**：v1.0
**最后更新**：2025-01-08
**维护者**：Claude
