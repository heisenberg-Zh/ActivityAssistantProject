# 后端服务启动指南

**项目名称**：ActivityAssistant 后端系统
**创建日期**：2025-11-11
**版本**：v1.0

---

## 📋 目录

1. [环境要求](#环境要求)
2. [数据库准备](#数据库准备)
3. [启动方式](#启动方式)
   - [方式一：使用IDE启动（推荐）](#方式一使用ide启动推荐)
   - [方式二：使用Maven命令行启动](#方式二使用maven命令行启动)
4. [验证启动成功](#验证启动成功)
5. [常见问题](#常见问题)

---

## 环境要求

### 必需环境

- **Java**：JDK 17 或更高版本
- **MySQL**：8.0 或更高版本
- **Maven**：3.8+ （如使用命令行启动）

### 检查环境

```bash
# 检查Java版本
java -version
# 应显示：java version "17.x.x"

# 检查MySQL是否运行
# Windows
sc query MySQL80  # 或 MySQL84
# Linux/Mac
mysql --version
```

---

## 数据库准备

### 1. 确认MySQL服务运行

**Windows PowerShell**：
```powershell
Get-Service -Name MySQL*
```

**Windows CMD**：
```cmd
sc query MySQL80
```

如果未运行，启动MySQL：
```cmd
net start MySQL80
```

### 2. 验证数据库和数据

连接到MySQL并检查：

```bash
# 连接到MySQL
mysql -u activity_user -pActivity@2025

# 检查数据库
SHOW DATABASES LIKE 'activity_assistant';

# 检查表
USE activity_assistant;
SHOW TABLES;

# 检查测试数据
SELECT COUNT(*) FROM users;      # 应有7个用户
SELECT COUNT(*) FROM activities; # 应有5个活动
```

如果数据库或数据缺失，运行初始化脚本：

```bash
# 初始化数据库结构
mysql -u activity_user -pActivity@2025 < E:\project\ActivityAssistantProject\backend\scripts\init-schema.sql

# 导入测试数据
mysql -u activity_user -pActivity@2025 activity_assistant < E:\project\ActivityAssistantProject\backend\scripts\init-data.sql
```

---

## 启动方式

### 方式一：使用IDE启动（推荐）

#### IntelliJ IDEA

1. **打开项目**
   - 启动 IntelliJ IDEA
   - 选择 `File > Open`
   - 选择 `E:\project\ActivityAssistantProject\backend` 目录
   - 等待Maven依赖自动下载

2. **配置运行配置**
   - 找到主类：`com.activityassistant.ActivityAssistantApplication.java`
   - 右键点击 > `Run 'ActivityAssistantApplication'`

   或者：
   - 点击顶部工具栏的 `Run > Edit Configurations`
   - 点击 `+` 添加 `Spring Boot` 配置
   - Main class: `com.activityassistant.ActivityAssistantApplication`
   - Active profiles: `dev`
   - 点击 `OK` 保存

3. **启动应用**
   - 点击绿色运行按钮 ▶️
   - 查看控制台输出，等待启动完成

#### Eclipse / Spring Tool Suite

1. **导入项目**
   - `File > Import > Maven > Existing Maven Projects`
   - Root directory: `E:\project\ActivityAssistantProject\backend`
   - 点击 `Finish`

2. **配置Spring Boot配置**
   - 右键点击项目 > `Run As > Spring Boot App`

3. **配置环境**
   - 右键点击项目 > `Run As > Run Configurations`
   - 在 `Spring Boot App` 中选择你的应用
   - `Profile` 标签页添加：`dev`
   - 点击 `Apply` 和 `Run`

#### VS Code

1. **安装扩展**
   - Java Extension Pack
   - Spring Boot Extension Pack

2. **打开项目**
   ```bash
   code E:\project\ActivityAssistantProject\backend
   ```

3. **运行**
   - 打开 `ActivityAssistantApplication.java`
   - 点击编辑器顶部的 `Run` 或 `Debug`

---

### 方式二：使用Maven命令行启动

#### 前提条件

1. **安装Maven**
   - 下载：https://maven.apache.org/download.cgi
   - 解压到：`C:\Program Files\Apache\Maven`
   - 添加环境变量：
     ```
     MAVEN_HOME = C:\Program Files\Apache\Maven\apache-maven-3.9.x
     PATH = %MAVEN_HOME%\bin
     ```
   - 验证安装：`mvn -version`

2. **配置Maven镜像（可选，加速下载）**

   编辑 `~/.m2/settings.xml`：
   ```xml
   <mirrors>
     <mirror>
       <id>aliyun</id>
       <mirrorOf>central</mirrorOf>
       <name>Aliyun Maven</name>
       <url>https://maven.aliyun.com/repository/public</url>
     </mirror>
   </mirrors>
   ```

#### 启动命令

```bash
# 方法1：使用Spring Boot Maven插件
cd E:\project\ActivityAssistantProject\backend
mvn spring-boot:run

# 方法2：先打包再运行
cd E:\project\ActivityAssistantProject\backend
mvn clean package -DskipTests
java -jar target/activity-assistant-1.0.0.jar --spring.profiles.active=dev

# 方法3：指定开发环境配置
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

---

## 验证启动成功

### 1. 检查控制台输出

启动成功的标志：
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/

ActivityAssistant :: Spring Boot :: (v3.2.1)

2025-11-11 18:30:00 [main] INFO  c.a.ActivityAssistantApplication - Starting ActivityAssistantApplication
2025-11-11 18:30:02 [main] INFO  o.s.b.w.embedded.tomcat.TomcatWebServer - Tomcat started on port(s): 8082 (http)
2025-11-11 18:30:02 [main] INFO  c.a.ActivityAssistantApplication - Started ActivityAssistantApplication in 3.456 seconds
```

### 2. 检查健康检查端点

打开浏览器或使用curl：

```bash
# 健康检查
curl http://localhost:8082/api/health
# 应返回：{"status":"UP","version":"1.0.0"}

# Swagger API文档
# 浏览器访问：http://localhost:8082/swagger-ui.html
```

### 3. 测试登录接口

使用开发环境的模拟登录：

```bash
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code_dev"}'
```

应返回包含token和userInfo的JSON响应。

### 4. 检查端口占用

```bash
# Windows
netstat -ano | findstr :8082

# 应该看到类似输出：
# TCP    0.0.0.0:8082    0.0.0.0:0    LISTENING    12345
```

---

## 常见问题

### 问题1：端口8082已被占用

**错误信息**：
```
Web server failed to start. Port 8082 was already in use.
```

**解决方法**：

方法A - 停止占用端口的进程：
```bash
# 1. 找到占用端口的进程ID
netstat -ano | findstr :8082
# 输出：TCP  0.0.0.0:8082  0.0.0.0:0  LISTENING  12345

# 2. 终止该进程
taskkill /F /PID 12345
```

方法B - 修改端口：
```yaml
# 编辑 backend/src/main/resources/application-dev.yml
server:
  port: 8083  # 改为其他端口
```

### 问题2：无法连接到MySQL数据库

**错误信息**：
```
Communications link failure
```

**解决步骤**：

1. 检查MySQL服务是否运行
2. 验证数据库连接信息：
   ```yaml
   # application-dev.yml
   spring:
     datasource:
       url: jdbc:mysql://localhost:3306/activity_assistant...
       username: activity_user
       password: Activity@2025
   ```
3. 测试数据库连接：
   ```bash
   mysql -u activity_user -pActivity@2025 -e "SELECT 1"
   ```

### 问题3：Maven依赖下载失败

**错误信息**：
```
Could not resolve dependencies
```

**解决方法**：

1. 配置阿里云镜像（见上文）
2. 清除Maven缓存：
   ```bash
   cd %USERPROFILE%\.m2\repository
   # 删除损坏的依赖
   ```
3. 重新下载：
   ```bash
   mvn clean install -U
   ```

### 问题4：Java版本不匹配

**错误信息**：
```
Unsupported class file major version
```

**解决方法**：

确保使用Java 17：
```bash
# 检查版本
java -version

# 如有多个Java版本，设置JAVA_HOME
set JAVA_HOME=C:\Program Files\Java\jdk-17
```

### 问题5：数据库表不存在

**错误信息**：
```
Table 'activity_assistant.users' doesn't exist
```

**解决方法**：

运行建表脚本：
```bash
mysql -u activity_user -pActivity@2025 < E:\project\ActivityAssistantProject\backend\scripts\init-schema.sql
mysql -u activity_user -pActivity@2025 activity_assistant < E:\project\ActivityAssistantProject\backend\scripts\init-data.sql
```

---

## 后续步骤

启动成功后，可以：

1. **查看API文档**：http://localhost:8082/swagger-ui.html
2. **运行测试脚本**：
   ```bash
   python backend/test_api.py
   python backend/test_registration_api.py
   python backend/test_checkin_statistics_api.py
   ```
3. **配置前端调用后端**：
   - 前端已配置为调用 `http://localhost:8082`
   - 在微信开发者工具中启动前端项目
   - 测试前后端集成

---

## 相关文档

- **开发进度**：`DEVELOPMENT_PROGRESS.md`
- **API规范**：`API_SPECIFICATION.md`
- **数据库设计**：`DATABASE_DESIGN.md`
- **环境搭建**：`SETUP_GUIDE.md`

---

**文档维护**：Claude AI
**最后更新**：2025-11-11
**版本**：v1.0
