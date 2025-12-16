# 📚 打包部署文档索引

本目录包含完整的项目打包和部署文档。

---

## 🚀 快速开始

**推荐阅读顺序:**

1. ✅ **快速检查清单** - `QUICK_DEPLOYMENT_CHECKLIST.md`
   - 最快速的打包部署流程
   - 适合熟悉项目的开发者
   - 5-10分钟完成打包

2. 📖 **完整部署指南** - `BUILD_AND_DEPLOYMENT_GUIDE.md`
   - 详细的图文步骤
   - 包含故障排查
   - 适合首次部署

3. 📋 **配置清单** - `PRODUCTION_CONFIG_CHECKLIST.md`
   - 所有配置项检查
   - 必须配置的参数
   - 配置文件汇总

---

## 📁 文档列表

### 核心文档

| 文档 | 说明 | 适用场景 |
|------|------|---------|
| `QUICK_DEPLOYMENT_CHECKLIST.md` | 快速部署清单 | 快速打包部署 |
| `BUILD_AND_DEPLOYMENT_GUIDE.md` | 完整部署指南 | 详细步骤说明 |
| `PRODUCTION_CONFIG_CHECKLIST.md` | 生产配置清单 | 配置参数检查 |

### 数据库相关

| 文档 | 说明 | 位置 |
|------|------|------|
| `DATABASE_DEPLOYMENT.md` | 数据库部署完整指南 | `backend/sql/` |
| `DEPLOYMENT_CHECKLIST.md` | 数据库部署检查清单 | `backend/sql/` |
| `README.md` | 数据库脚本说明 | `backend/sql/` |

### 部署脚本

| 脚本 | 说明 | 适用系统 |
|------|------|---------|
| `backend/deploy.sh` | 自动部署脚本 | Linux/macOS |
| `backend/deploy.bat` | 自动部署脚本 | Windows |
| `backend/sql/backup.sh` | 数据库备份脚本 | Linux/macOS |
| `backend/sql/backup.bat` | 数据库备份脚本 | Windows |
| `backend/sql/restore.sh` | 数据库恢复脚本 | Linux/macOS |
| `backend/sql/restore.bat` | 数据库恢复脚本 | Windows |

---

## 🎯 不同场景下的使用指南

### 场景 1: 首次部署

**步骤:**
1. 阅读 `PRODUCTION_CONFIG_CHECKLIST.md` - 了解所有配置项
2. 阅读 `BUILD_AND_DEPLOYMENT_GUIDE.md` - 按步骤操作
3. 阅读 `backend/sql/DATABASE_DEPLOYMENT.md` - 初始化数据库
4. 使用部署脚本自动化部署

**时间:** 约 30-60 分钟

### 场景 2: 日常更新部署

**步骤:**
1. 使用 `QUICK_DEPLOYMENT_CHECKLIST.md` 快速打包
2. 上传 JAR 包到服务器
3. 重启应用

**时间:** 约 5-10 分钟

### 场景 3: 问题排查

**步骤:**
1. 查看 `BUILD_AND_DEPLOYMENT_GUIDE.md` 的"常见问题"章节
2. 检查日志文件
3. 验证配置是否正确

---

## 📦 打包流程概览

### 后端打包（IDEA）

```
打开 IDEA
  ↓
打开 Maven 面板
  ↓
执行 clean → package
  ↓
等待打包完成
  ↓
获取 JAR 文件
(backend/target/activity-assistant-1.0.0.jar)
```

**详细步骤:** `BUILD_AND_DEPLOYMENT_GUIDE.md` 第2章

### 前端打包（微信开发者工具）

```
打开微信开发者工具
  ↓
修改 utils/config.js
(切换到 production 环境)
  ↓
点击"上传"按钮
  ↓
填写版本信息
  ↓
上传完成
```

**详细步骤:** `BUILD_AND_DEPLOYMENT_GUIDE.md` 第3章

---

## 🚢 部署流程概览

### 手动部署

```
准备服务器环境
(Java 17+, MySQL 8.0+)
  ↓
初始化数据库
(执行 init_all.sql)
  ↓
上传 JAR 包
(使用 SCP/WinSCP)
  ↓
配置环境变量
(创建 .env 文件)
  ↓
启动应用
(java -jar)
  ↓
验证部署
(健康检查)
```

### 自动部署（推荐）

**Linux:**
```bash
# 上传 JAR 包和部署脚本
scp activity-assistant-1.0.0.jar root@47.104.94.67:/app/
scp deploy.sh root@47.104.94.67:/app/

# SSH 登录服务器
ssh root@47.104.94.67

# 执行部署脚本
cd /app
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```cmd
# 复制 JAR 包和部署脚本到 C:\app\
# 运行部署脚本
cd C:\app
deploy.bat
```

---

## ✅ 部署前检查清单

### 配置检查

- [x] 小程序 AppID: `wx92bf60c1218c0abc`
- [x] 腾讯地图 Key: `56PBZ-QQ2KW-W4FRG-YP6XS-HBKXZ-5HFNZ`
- [x] 服务器地址: `47.104.94.67:8082`
- [x] 数据库地址: `47.104.94.67:3306`
- [x] JWT 密钥: 已配置
- [x] 微信 AppSecret: 已配置

### 环境检查

- [ ] JDK 17+ 已安装
- [ ] MySQL 8.0+ 已安装并初始化
- [ ] 服务器端口 8082 已开放
- [ ] 防火墙规则已配置

### 功能检查

- [ ] 后端 API 健康检查通过
- [ ] 小程序可以连接后端
- [ ] 微信登录功能正常
- [ ] 数据库连接正常

详细检查清单请查看: `PRODUCTION_CONFIG_CHECKLIST.md`

---

## 🆘 常见问题

### 打包问题

**Q: Maven 打包失败?**
- 查看 `BUILD_AND_DEPLOYMENT_GUIDE.md` 的"常见问题 - 后端打包问题"

**Q: 小程序上传失败?**
- 查看 `BUILD_AND_DEPLOYMENT_GUIDE.md` 的"常见问题 - 前端打包问题"

### 部署问题

**Q: 应用无法启动?**
- 查看 `BUILD_AND_DEPLOYMENT_GUIDE.md` 的"常见问题 - 部署问题"

**Q: 无法连接数据库?**
- 查看 `backend/sql/DATABASE_DEPLOYMENT.md` 的"常见问题"

### 配置问题

**Q: 需要配置哪些参数?**
- 查看 `PRODUCTION_CONFIG_CHECKLIST.md` 的"还需要您配置的参数"

---

## 📞 技术支持

### 相关文档

- **项目说明**: `README.md`
- **开发指南**: `CLAUDE.md`
- **API 安全**: `API_SECURITY_SPEC.md`
- **需求文档**: `plan.md`

### 日志位置

**后端日志:**
- Linux: `/var/log/activity-assistant/application.log`
- Windows: `C:\logs\activity-assistant\application.log`

**查看日志:**
```bash
# Linux
tail -f /var/log/activity-assistant/application.log

# 或使用 systemd
journalctl -u activity-assistant -f

# Windows
type C:\logs\activity-assistant\application.log
```

---

## 🎓 学习资源

### 新手入门

1. 先阅读 `README.md` 了解项目
2. 再阅读 `CLAUDE.md` 了解架构
3. 然后阅读 `BUILD_AND_DEPLOYMENT_GUIDE.md` 学习部署

### 进阶学习

1. `backend/sql/DATABASE_DEPLOYMENT.md` - 数据库高级配置
2. `API_SECURITY_SPEC.md` - API 安全规范
3. `DEPLOYMENT_OPTIMIZATION.md` - 性能优化

---

## 🔄 版本更新

### 更新流程

1. **打包新版本**
   ```bash
   # 后端
   mvn clean package -DskipTests

   # 前端
   # 在微信开发者工具中点击"上传"
   ```

2. **备份当前版本**
   ```bash
   # 备份数据库
   ./backend/sql/backup.sh

   # 备份应用
   cp /app/activity-assistant-1.0.0.jar /app/backup/
   ```

3. **部署新版本**
   ```bash
   # 停止应用
   systemctl stop activity-assistant

   # 替换 JAR 包
   cp activity-assistant-1.1.0.jar /app/

   # 启动应用
   systemctl start activity-assistant
   ```

4. **验证新版本**
   ```bash
   # 健康检查
   curl http://47.104.94.67:8082/actuator/health

   # 查看日志
   tail -f /var/log/activity-assistant/application.log
   ```

---

## 📊 部署状态跟踪

### 部署记录模板

建议创建部署记录，记录每次部署：

```
部署日期: 2025-01-30
部署人员: [您的名字]
版本号: 1.0.0
部署环境: 生产环境
变更内容:
  - 初始版本部署
  - 包含所有核心功能
部署结果: ✅ 成功
验证情况:
  - [x] 健康检查通过
  - [x] API 测试通过
  - [x] 小程序功能正常
备注: 无
```

---

**文档版本:** 1.0
**最后更新:** 2025-01-30
**维护者:** ActivityAssistant 开发团队

祝您部署顺利！ 🚀
