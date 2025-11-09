# Cursor Java 开发环境配置指南

本指南提供使用 **Cursor** 代替 IntelliJ IDEA 进行 ActivityAssistant 后端开发的完整配置步骤。

**适用对象**: 熟悉 VS Code/Cursor，不想安装 IntelliJ IDEA 的开发者
**预计用时**: 30-60 分钟
**难度等级**: ⭐⭐⭐（需要一定的配置经验）

---

## 📋 目录

- [一、前置条件](#一前置条件)
- [二、安装必需的 Java 扩展](#二安装必需的-java-扩展)
- [三、配置 Java 环境](#三配置-java-环境)
- [四、配置项目工作区](#四配置项目工作区)
- [五、安装和配置 Lombok](#五安装和配置-lombok)
- [六、导入项目并运行](#六导入项目并运行)
- [七、调试配置](#七调试配置)
- [八、常见问题](#八常见问题)

---

## 一、前置条件

### 1.1 必需安装的软件

在配置 Cursor 前，必须先安装以下工具：

| 工具 | 版本 | 安装指南 |
|-----|------|---------|
| **JDK** | 17 (LTS) | 参考 `SETUP_GUIDE.md` 第二节 |
| **Maven** | 3.9+ | 参考 `SETUP_GUIDE.md` 第三节 |
| **Cursor** | 最新版 | https://cursor.sh/ |

### 1.2 验证环境

打开 **命令提示符 (CMD)** 或 **PowerShell**，执行以下命令：

```bash
# 验证 JDK
java -version
# 期望输出: java version "17.0.x"

# 验证 Maven
mvn -v
# 期望输出: Apache Maven 3.9.x
```

**如果命令未找到**，请先完成 `SETUP_GUIDE.md` 中的 JDK 和 Maven 安装步骤！

---

## 二、安装必需的 Java 扩展

### 2.1 安装扩展包

在 Cursor 中按 `Ctrl + Shift + X` 打开扩展面板，搜索并安装以下扩展：

#### 核心扩展（必装）

| 扩展名称 | 扩展 ID | 用途 |
|---------|--------|------|
| **Extension Pack for Java** | vscjava.vscode-java-pack | Java 开发核心包（包含以下组件） |
| → Language Support for Java | redhat.java | Java 语言支持（语法高亮、代码提示） |
| → Debugger for Java | vscjava.vscode-java-debug | Java 调试器 |
| → Test Runner for Java | vscjava.vscode-java-test | 单元测试运行 |
| → Maven for Java | vscjava.vscode-maven | Maven 项目管理 |
| → Project Manager for Java | vscjava.vscode-java-dependency | 项目依赖管理 |

#### Spring Boot 扩展（必装）

| 扩展名称 | 扩展 ID | 用途 |
|---------|--------|------|
| **Spring Boot Extension Pack** | vmware.vscode-boot-dev-pack | Spring Boot 开发包 |
| → Spring Boot Tools | vmware.vscode-spring-boot | Spring Boot 配置支持 |
| → Spring Boot Dashboard | vscjava.vscode-spring-boot-dashboard | Spring Boot 应用管理面板 |
| → Spring Initializr | vscjava.vscode-spring-initializr | 快速创建 Spring 项目 |

#### 辅助扩展（推荐）

| 扩展名称 | 扩展 ID | 用途 |
|---------|--------|------|
| **Lombok Annotations Support** | GabrielBB.vscode-lombok | Lombok 支持（自动生成 getter/setter） |
| **SonarLint** | SonarSource.sonarlint-vscode | 代码质量检查 |
| **Thunder Client** | rangav.vscode-thunder-client | API 测试工具（Postman 替代） |
| **Rainbow Brackets** | 2gua.rainbow-brackets | 彩虹括号 |

### 2.2 快速安装方式

在 Cursor 终端（`` Ctrl + ` ``）中执行：

```bash
# 安装核心扩展
code --install-extension vscjava.vscode-java-pack
code --install-extension vmware.vscode-boot-dev-pack
code --install-extension GabrielBB.vscode-lombok
code --install-extension SonarSource.sonarlint-vscode
code --install-extension rangav.vscode-thunder-client
```

**注意**: 如果 `code` 命令不可用，需要手动在扩展面板中安装。

---

## 三、配置 Java 环境

### 3.1 配置 Java Home

按 `Ctrl + Shift + P` 打开命令面板，输入 `Preferences: Open User Settings (JSON)`，添加以下配置：

```json
{
  // Java 配置
  "java.home": "C:\\Program Files\\Java\\jdk-17",
  "java.configuration.runtimes": [
    {
      "name": "JavaSE-17",
      "path": "C:\\Program Files\\Java\\jdk-17",
      "default": true
    }
  ],

  // Maven 配置
  "maven.executable.path": "C:\\Program Files\\Apache\\maven\\bin\\mvn.cmd",
  "maven.terminal.useJavaHome": true,

  // Lombok 配置
  "java.jdt.ls.lombokSupport.enabled": true,

  // 代码格式化
  "java.format.settings.url": "https://raw.githubusercontent.com/google/styleguide/gh-pages/eclipse-java-google-style.xml",

  // 自动导入优化
  "java.saveActions.organizeImports": true,

  // 调试配置
  "java.debug.settings.hotCodeReplace": "auto",
  "java.debug.settings.enableRunDebugCodeLens": true
}
```

**重要**: 将路径替换为你实际的 JDK 和 Maven 安装路径！

### 3.2 验证 Java 配置

1. 按 `Ctrl + Shift + P`
2. 输入 `Java: Configure Java Runtime`
3. 确认显示 **JDK 17** 和正确的安装路径

---

## 四、配置项目工作区

### 4.1 打开项目

1. 启动 Cursor
2. **File** → **Open Folder**
3. 选择 `D:\Project\ActivityAssistantProject\backend`
4. 点击 **选择文件夹**

### 4.2 等待项目加载

首次打开，Java 语言服务器会：
- 索引项目文件（右下角显示 `$(sync~spin) Building...`）
- 下载 Maven 依赖（查看 `OUTPUT` → `Maven` 面板）
- 编译源代码

**耐心等待 5-10 分钟**，直到右下角显示 `$(thumbsup) Build Successful`

### 4.3 创建工作区配置

现在我将创建项目专用的配置文件...

---

## 五、安装和配置 Lombok

### 5.1 验证 Lombok 扩展已安装

按 `Ctrl + Shift + X`，搜索 `Lombok`，确认已安装：
- **Lombok Annotations Support for VS Code** (GabrielBB.vscode-lombok)

### 5.2 配置 Lombok 支持

在用户设置中添加：

```json
{
  "java.jdt.ls.lombokSupport.enabled": true
}
```

### 5.3 验证 Lombok 是否生效

打开任意包含 `@Data` 注解的类（如 `User.java`），尝试调用 `user.getName()`，如果没有报错，说明 Lombok 生效。

---

## 六、导入项目并运行

### 6.1 查看项目结构

在左侧 **JAVA PROJECTS** 面板（如果没有，点击左侧栏的 Java 图标），应该看到：

```
backend
├─ com.activityassistant
│  ├─ controller
│  ├─ service
│  ├─ repository
│  ├─ entity
│  └─ ActivityApplication.java
└─ Maven Dependencies
   ├─ spring-boot-starter-web
   ├─ spring-boot-starter-data-jpa
   └─ ...
```

### 6.2 配置数据库连接

编辑 `src/main/resources/application-dev.yml`，确保数据库配置正确：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/activity_assistant?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=Asia/Shanghai
    username: activity_user
    password: Activity@2025  # 修改为你的实际密码
    driver-class-name: com.mysql.cj.jdbc.Driver
```

### 6.3 运行项目

**方式 1: 使用 Spring Boot Dashboard**

1. 点击左侧栏的 **Spring Boot 图标**（齿轮形状）
2. 在 **APPS** 下找到 `activity-assistant`
3. 点击播放按钮 ▶️ 启动

**方式 2: 使用 Java 运行**

1. 打开 `ActivityApplication.java`
2. 在 `main` 方法上方，点击 `Run` 或 `Debug`

**方式 3: 使用终端**

在 Cursor 终端中执行：

```bash
cd D:\Project\ActivityAssistantProject\backend
mvn clean spring-boot:run
```

### 6.4 验证启动成功

看到以下日志说明启动成功：

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.2.1)

Started ActivityApplication in 5.234 seconds
```

访问 http://localhost:8080/swagger-ui.html 查看 API 文档！

---

## 七、调试配置

### 7.1 自动生成调试配置

1. 打开 `ActivityApplication.java`
2. 点击 `main` 方法上方的 `Debug`
3. Cursor 会自动在 `.vscode/launch.json` 中生成配置

### 7.2 手动配置调试

创建 `.vscode/launch.json`（稍后我将为你创建）

---

## 八、常见问题

### Q1: Java 语言服务器无法启动

**错误**: `Language server exited with code xxx`

**解决**:
1. 按 `Ctrl + Shift + P` → `Java: Clean Java Language Server Workspace`
2. 重启 Cursor
3. 确认 `java.home` 配置正确

### Q2: Maven 依赖下载失败

**错误**: `Could not resolve dependencies`

**解决**:
1. 配置阿里云镜像（参考 `SETUP_GUIDE.md` 第 3.4 节）
2. 在终端执行: `mvn clean install -U`
3. 删除损坏的本地仓库: `C:\Users\你的用户名\.m2\repository`

### Q3: Lombok 不生效

**错误**: 找不到 `getXxx()` 方法

**解决**:
1. 确认安装 `Lombok Annotations Support` 扩展
2. 确认 `java.jdt.ls.lombokSupport.enabled: true`
3. 按 `Ctrl + Shift + P` → `Reload Window`

### Q4: 无法连接数据库

**错误**: `Communications link failure`

**解决**:
1. 确认 MySQL 服务已启动
2. 检查 `application-dev.yml` 中的密码
3. 在终端测试连接: `mysql -u activity_user -p`

### Q5: 端口 8080 被占用

**错误**: `Port 8080 was already in use`

**解决**:
1. 查找占用进程: `netstat -ano | findstr 8080`
2. 结束进程: `taskkill /F /PID 进程号`
3. 或修改端口: `application-dev.yml` → `server.port: 8081`

### Q6: 代码提示慢或无提示

**解决**:
1. 增加 Java 语言服务器内存:
   ```json
   {
     "java.jdt.ls.vmargs": "-noverify -Xmx2G -XX:+UseG1GC -XX:+UseStringDeduplication"
   }
   ```
2. 禁用不必要的扩展（保留 Java 相关扩展）
3. 等待索引完成（右下角状态栏）

---

## 九、对比 IntelliJ IDEA

### Cursor 优势
- ✅ 轻量级，启动快
- ✅ AI 辅助编程（Cursor 特色）
- ✅ 免费
- ✅ 熟悉的 VS Code 界面

### Cursor 劣势
- ❌ Java 代码提示不如 IDEA 智能
- ❌ 重构功能较弱
- ❌ Maven 管理不如 IDEA 直观
- ❌ 调试体验稍差

### 建议
- **个人项目**: Cursor 完全够用
- **团队协作**: 建议使用 IntelliJ IDEA
- **学习 Java**: 推荐 IntelliJ IDEA（更专业的工具链）

---

## 十、下一步

环境配置完成后，请参考：

- 📘 **开发进度追踪**: `DEVELOPMENT_PROGRESS.md`
- 📘 **API 接口文档**: `API_SPECIFICATION.md`
- 📘 **数据库设计**: `DATABASE_DESIGN.md`

**准备开始开发了吗？** 🚀

---

**文档版本**: v1.0
**最后更新**: 2025-01-09
**维护者**: Claude
