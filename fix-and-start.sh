#!/bin/bash

###############################################
# ActivityAssistant 一键修复和启动脚本
# 版本: 1.0
# 功能: 自动诊断、清理、修复并启动应用
###############################################

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
APP_JAR="/home/aap/activity-assistant-1.0.0.jar"
LOG_FILE="/home/aap/log/application.log"
START_SCRIPT="/home/aap/start-app.sh"
DB_HOST="rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com"
DB_PORT="3306"
DB_NAME="activity_assistant"
DB_USERNAME="aapDBU"
DB_PASSWORD="aapDBUP@sswrd!5678"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ActivityAssistant 一键修复脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

###############################################
# 步骤1: 诊断当前状态
###############################################
echo -e "${YELLOW}[步骤1] 诊断当前状态...${NC}"

# 检查进程
PROCESS_COUNT=$(ps aux | grep "activity-assistant-1.0.0.jar" | grep -v grep | wc -l)
echo "当前运行的进程数: $PROCESS_COUNT"

if [ $PROCESS_COUNT -gt 0 ]; then
    echo "发现运行中的进程:"
    ps aux | grep "activity-assistant-1.0.0.jar" | grep -v grep | awk '{print "  PID:", $2, " 运行时间:", $10}'
fi

# 检查JAR文件
if [ ! -f "$APP_JAR" ]; then
    echo -e "${RED}错误: JAR文件不存在: $APP_JAR${NC}"
    echo "请先上传JAR文件到服务器"
    exit 1
fi

echo -e "${GREEN}✓ JAR文件存在${NC}"
ls -lh "$APP_JAR"

# 检查数据库连接
echo ""
echo "测试数据库连接..."
mysql -h "$DB_HOST" -u "$DB_USERNAME" -p"$DB_PASSWORD" -e "SELECT 1" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 数据库连接正常${NC}"
else
    echo -e "${RED}✗ 数据库连接失败${NC}"
    echo "请检查数据库配置"
fi

echo ""

###############################################
# 步骤2: 停止所有相关进程
###############################################
echo -e "${YELLOW}[步骤2] 停止所有相关进程...${NC}"

# 停止所有Java进程（包含activity-assistant）
PIDS=$(ps aux | grep "activity-assistant-1.0.0.jar" | grep -v grep | awk '{print $2}')
if [ ! -z "$PIDS" ]; then
    echo "正在停止进程: $PIDS"
    echo "$PIDS" | xargs kill -9 2>/dev/null
    sleep 2
    echo -e "${GREEN}✓ 所有进程已停止${NC}"
else
    echo "没有运行中的进程"
fi

# 检查systemd服务
if systemctl is-active --quiet activity-assistant 2>/dev/null; then
    echo "发现systemd服务正在运行，停止中..."
    sudo systemctl stop activity-assistant 2>/dev/null
    echo -e "${GREEN}✓ systemd服务已停止${NC}"
fi

# 再次确认所有进程已停止
sleep 3
REMAINING=$(ps aux | grep "activity-assistant-1.0.0.jar" | grep -v grep | wc -l)
if [ $REMAINING -gt 0 ]; then
    echo -e "${RED}警告: 仍有进程在运行，强制结束...${NC}"
    killall -9 java 2>/dev/null
    sleep 2
fi

echo ""

###############################################
# 步骤3: 清理旧文件
###############################################
echo -e "${YELLOW}[步骤3] 清理旧文件...${NC}"

# 备份旧日志
if [ -f "$LOG_FILE" ]; then
    BACKUP_LOG="${LOG_FILE}.$(date +%Y%m%d_%H%M%S).bak"
    mv "$LOG_FILE" "$BACKUP_LOG"
    echo "旧日志已备份: $BACKUP_LOG"
fi

# 清理nohup.out
if [ -f "/home/aap/nohup.out" ]; then
    rm -f /home/aap/nohup.out
    echo "已删除 nohup.out"
fi

# 确保日志目录存在
mkdir -p /home/aap/log

echo -e "${GREEN}✓ 清理完成${NC}"
echo ""

###############################################
# 步骤4: 创建启动脚本
###############################################
echo -e "${YELLOW}[步骤4] 创建启动脚本...${NC}"

cat > "$START_SCRIPT" << 'STARTSCRIPT'
#!/bin/bash

# ActivityAssistant 启动脚本（自动生成）
export SPRING_PROFILES_ACTIVE=prod
export DB_HOST=rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com
export DB_PORT=3306
export DB_NAME=activity_assistant
export DB_USERNAME=aapDBU
export DB_PASSWORD='aapDBUP@sswrd!5678'
export JWT_SECRET=HLUKzIBeh1cai5lRu8bjrWVynSmMPQgG
export WECHAT_APP_ID=wx92bf60c1218c0abc
export WECHAT_APP_SECRET=9830896ed8dc4314e44b2285a9c211e4

APP_JAR="/home/aap/activity-assistant-1.0.0.jar"
LOG_FILE="/home/aap/log/application.log"

mkdir -p /home/aap/log

nohup java -jar -Xms512m -Xmx1024m -Dspring.profiles.active=prod -Dspring.datasource.url='jdbc:mysql://rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com:3306/activity_assistant?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true' -Dspring.datasource.username=aapDBU -Dspring.datasource.password='aapDBUP@sswrd!5678' "${APP_JAR}" > "${LOG_FILE}" 2>&1 &

echo "应用已启动，PID: $!"
STARTSCRIPT

chmod +x "$START_SCRIPT"
echo -e "${GREEN}✓ 启动脚本已创建: $START_SCRIPT${NC}"
echo ""

###############################################
# 步骤5: 启动应用
###############################################
echo -e "${YELLOW}[步骤5] 启动应用...${NC}"

"$START_SCRIPT"

echo "等待应用启动（20秒）..."
sleep 20

echo ""

###############################################
# 步骤6: 验证部署
###############################################
echo -e "${YELLOW}[步骤6] 验证部署...${NC}"

# 检查进程
NEW_PID=$(ps aux | grep "activity-assistant-1.0.0.jar" | grep -v grep | awk '{print $2}')
if [ ! -z "$NEW_PID" ]; then
    echo -e "${GREEN}✓ 应用进程运行中 (PID: $NEW_PID)${NC}"
else
    echo -e "${RED}✗ 应用进程未找到${NC}"
fi

# 检查端口
PORT_CHECK=$(netstat -tuln 2>/dev/null | grep ":8082" || ss -tuln 2>/dev/null | grep ":8082")
if [ ! -z "$PORT_CHECK" ]; then
    echo -e "${GREEN}✓ 端口8082已监听${NC}"
else
    echo -e "${RED}✗ 端口8082未监听${NC}"
fi

# 检查日志中的关键信息
echo ""
echo "日志分析:"
if grep -q "HikariPool-1 - Start completed" "$LOG_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓ 数据库连接池启动成功${NC}"
else
    echo -e "${RED}✗ 数据库连接池启动失败${NC}"
fi

if grep -q "Started ActivityApplication" "$LOG_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓ 应用启动成功${NC}"
else
    echo -e "${RED}✗ 应用启动失败${NC}"
fi

# 健康检查
echo ""
echo "执行健康检查..."
HEALTH_RESPONSE=$(curl -s http://localhost:8082/actuator/health 2>/dev/null)
if [ ! -z "$HEALTH_RESPONSE" ]; then
    echo -e "${GREEN}✓ 健康检查通过${NC}"
    echo "响应: $HEALTH_RESPONSE"
else
    echo -e "${YELLOW}⚠ 健康检查无响应（应用可能仍在启动中）${NC}"
fi

echo ""

###############################################
# 步骤7: 显示日志摘要
###############################################
echo -e "${YELLOW}[步骤7] 日志摘要（最后30行）${NC}"
echo "----------------------------------------"
tail -30 "$LOG_FILE" 2>/dev/null || echo "日志文件为空或不存在"
echo "----------------------------------------"
echo ""

###############################################
# 完成总结
###############################################
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  部署完成${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "常用命令:"
echo "  查看日志: tail -f $LOG_FILE"
echo "  实时监控: tail -f $LOG_FILE | grep -E 'HikariPool|Started|ERROR'"
echo "  健康检查: curl http://localhost:8082/actuator/health"
echo "  停止应用: kill -9 $NEW_PID"
echo "  重新启动: $START_SCRIPT"
echo ""

# 最终状态判断
if [ ! -z "$NEW_PID" ] && [ ! -z "$PORT_CHECK" ]; then
    echo -e "${GREEN}✓✓✓ 部署成功！应用正在运行 ✓✓✓${NC}"
    exit 0
else
    echo -e "${RED}✗✗✗ 部署失败，请检查日志 ✗✗✗${NC}"
    echo "请执行: tail -50 $LOG_FILE"
    exit 1
fi
