# Cursor 快速开始指南

**5 分钟快速配置 Cursor Java 开发环境**

## 📋 配置清单

### 第一步：安装前置软件（必需）

**⚠️ 如果未安装，请先完成以下步骤**：

1. **JDK 17** - 参考 `docs/SETUP_GUIDE.md` 第二节
2. **Maven 3.9+** - 参考 `docs/SETUP_GUIDE.md` 第三节
3. **MySQL 8.0** - 参考 `docs/SETUP_GUIDE.md` 第五节
4. **Cursor** - 下载地址: https://cursor.sh/

### 第二步：验证环境

打开终端（CMD 或 PowerShell），执行：

```bash
java -version   # 应显示 java version "17.0.x"
mvn -v          # 应显示 Apache Maven 3.9.x
mysql --version # 应显示 mysql Ver 8.0.x
```

如果任何命令失败，请先完成前置软件安装！

---

## 🚀 快速配置步骤

### 1. 打开项目

1. 启动 **Cursor**
2. **File** → **Open Folder**
3. 选择 `D:\Project\ActivityAssistantProject\backend`
4. 点击 **选择文件夹**

### 2. 安装推荐扩展

Cursor 会自动提示安装推荐扩展，点击 **Install All** 即可。

**如果没有提示**，按 `Ctrl + Shift + X`，搜索并安装以下扩展：

| 扩展名称 | 扩展 ID |
|---------|--------|
| Extension Pack for Java | `vscjava.vscode-java-pack` |
| Spring Boot Extension Pack | `vmware.vscode-boot-dev-pack` |
| Lombok Annotations Support | `GabrielBB.vscode-lombok` |

### 3. 配置 Java 和 Maven 路径

按 `Ctrl + Shift + P`，输入 `Preferences: Open User Settings (JSON)`，添加以下配置：

```json
{
  "java.home": "C:\\Program Files\\Java\\jdk-17",
  "maven.executable.path": "C:\\Program Files\\Apache\\maven\\bin\\mvn.cmd",
  "java.jdt.ls.lombokSupport.enabled": true
}
```

**⚠️ 重要**: 将路径替换为你的实际安装路径！

### 4. 等待项目加载

首次打开项目，Java 语言服务器会：
- 索引项目文件（右下角显示 `Building...`）
- 下载 Maven 依赖（约 5-10 分钟）
- 编译源代码

**耐心等待**，直到右下角显示 ✅ `Build Successful`

### 5. 配置数据库

编辑 `src/main/resources/application-dev.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/activity_assistant?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=Asia/Shanghai
    username: activity_user
    password: Activity@2025  # 修改为你的数据库密码
```

### 6. 初始化数据库

在 Cursor 终端（`` Ctrl + ` ``）中执行：

```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE activity_assistant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'activity_user'@'localhost' IDENTIFIED BY 'Activity@2025';
GRANT ALL PRIVILEGES ON activity_assistant.* TO 'activity_user'@'localhost';
FLUSH PRIVILEGES;
exit;

# 初始化表结构
mysql -u activity_user -p activity_assistant < scripts/init-schema.sql

# 导入测试数据
mysql -u activity_user -p activity_assistant < scripts/init-data.sql
```

### 7. 运行项目

**方式 1: 使用 Spring Boot Dashboard（推荐）**

1. 点击左侧栏的 **Spring Boot 图标**（齿轮形状）
2. 在 APPS 下找到 `activity-assistant`
3. 点击播放按钮 ▶️ 启动

**方式 2: 使用调试配置**

1. 打开 `src/main/java/com/activityassistant/ActivityApplication.java`
2. 按 `F5` 或点击 `Run` → `Start Debugging`
3. 选择 **Spring Boot - ActivityApplication (dev)**

**方式 3: 使用终端**

```bash
mvn spring-boot:run
```

### 8. 验证启动成功

看到以下日志说明成功：

```
Started ActivityApplication in 5.234 seconds
```

访问 http://localhost:8080/swagger-ui.html 查看 API 文档！

---

## 🎯 常用快捷键

| 功能 | 快捷键 |
|-----|--------|
| 打开命令面板 | `Ctrl + Shift + P` |
| 打开终端 | `` Ctrl + ` `` |
| 查找文件 | `Ctrl + P` |
| 全局搜索 | `Ctrl + Shift + F` |
| 运行调试 | `F5` |
| 停止调试 | `Shift + F5` |
| 设置断点 | `F9` |
| 单步跳过 | `F10` |
| 单步进入 | `F11` |
| 格式化代码 | `Shift + Alt + F` |
| 查看定义 | `F12` |
| 查看引用 | `Shift + F12` |

---

## 🔧 常用任务

按 `Ctrl + Shift + P`，输入 `Tasks: Run Task`，可以执行以下任务：

- **Maven: Clean** - 清理编译产物
- **Maven: Compile** - 编译项目
- **Maven: Package** - 打包项目（跳过测试）
- **Maven: Test** - 运行测试
- **Spring Boot: Run (dev)** - 以开发模式运行
- **Spring Boot: Run (prod)** - 以生产模式运行

---

## 📚 完整文档

需要更详细的配置说明？请参考：

- **详细配置指南**: `docs/CURSOR_SETUP_GUIDE.md`
- **环境搭建指南**: `docs/SETUP_GUIDE.md`
- **开发进度追踪**: `docs/DEVELOPMENT_PROGRESS.md`
- **API 接口文档**: `docs/API_SPECIFICATION.md`

---

## ❓ 常见问题

### Q1: 代码没有提示或提示很慢

**解决**:
1. 等待项目索引完成（右下角状态栏）
2. 按 `Ctrl + Shift + P` → `Java: Clean Java Language Server Workspace`
3. 重启 Cursor

### Q2: Lombok 不生效（找不到 getXxx() 方法）

**解决**:
1. 确认安装 `Lombok Annotations Support` 扩展
2. 确认用户设置中有 `"java.jdt.ls.lombokSupport.enabled": true`
3. 按 `Ctrl + Shift + P` → `Reload Window`

### Q3: Maven 依赖下载失败

**解决**:
1. 配置阿里云镜像（编辑 Maven `settings.xml`）
2. 在终端执行: `mvn clean install -U`
3. 删除损坏的本地仓库: `C:\Users\<用户名>\.m2\repository`

### Q4: 无法连接数据库

**解决**:
1. 确认 MySQL 服务已启动（`services.msc` → MySQL80）
2. 检查 `application-dev.yml` 中的密码
3. 在终端测试: `mysql -u activity_user -p`

### Q5: 端口 8080 被占用

**解决**:
```bash
# 查找占用进程
netstat -ano | findstr 8080

# 结束进程（管理员权限）
taskkill /F /PID <进程号>

# 或修改端口（application-dev.yml）
server:
  port: 8081
```

---

## ✅ 配置完成检查清单

完成以下检查，确保环境配置正确：

- [ ] JDK 17 已安装并配置环境变量
- [ ] Maven 3.9+ 已安装并配置环境变量
- [ ] MySQL 8.0 已安装并运行
- [ ] Cursor 已安装所有推荐扩展
- [ ] 项目索引完成（右下角无 `Building...` 提示）
- [ ] Maven 依赖下载完成（无红色错误提示）
- [ ] 数据库已创建并初始化
- [ ] 项目可以成功启动
- [ ] 可以访问 http://localhost:8080/swagger-ui.html

---

**准备开始开发了吗？** 🚀

如有问题，请参考 `docs/CURSOR_SETUP_GUIDE.md` 获取详细帮助。

---

**文档版本**: v1.0
**最后更新**: 2025-01-09
**维护者**: Claude
