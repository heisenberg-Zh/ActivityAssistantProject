#!/bin/bash

# ============================================
# ActivityAssistant 生产环境启动脚本（修复版）
# ============================================

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ActivityAssistant 启动脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 配置参数
APP_NAME="activity-assistant"
APP_JAR="/home/aap/activity-assistant-1.0.0.jar"
APP_DIR="/home/aap"
LOG_DIR="/home/aap/logs"
LOG_FILE="${LOG_DIR}/application.log"
PID_FILE="${APP_DIR}/${APP_NAME}.pid"

# 数据库配置
export SPRING_PROFILES_ACTIVE=prod
export DB_USERNAME=aapDBU
export DB_PASSWORD='aapDBUP@sswrd!5678'

# 应用配置
export JWT_SECRET=HLUKzIBeh1cai5lRu8bjrWVynSmMPQgG
export WECHAT_APP_ID=wx92bf60c1218c0abc
export WECHAT_APP_SECRET=9830896ed8dc4314e44b2285a9c211e4

# JVM 参数
JVM_OPTS="-Xms512m -Xmx1024m"
JVM_OPTS="${JVM_OPTS} -XX:+UseG1GC"
JVM_OPTS="${JVM_OPTS} -XX:MaxGCPauseMillis=200"
JVM_OPTS="${JVM_OPTS} -Dfile.encoding=UTF-8"
JVM_OPTS="${JVM_OPTS} -Duser.timezone=Asia/Shanghai"

# 创建日志目录
mkdir -p "${LOG_DIR}"

# 检查 JAR 文件是否存在
if [ ! -f "${APP_JAR}" ]; then
    echo -e "${RED}✗ 错误: JAR 文件不存在: ${APP_JAR}${NC}"
    exit 1
fi

echo -e "${YELLOW}[步骤1] 检查并停止旧进程...${NC}"

# 检查旧进程
OLD_PID=$(ps aux | grep "${APP_JAR}" | grep -v grep | awk '{print $2}')
if [ ! -z "$OLD_PID" ]; then
    echo -e "${YELLOW}⚠ 发现旧进程 (PID: $OLD_PID)，正在停止...${NC}"
    kill -15 $OLD_PID
    sleep 5

    # 如果还在运行，强制停止
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠ 进程未停止，强制结束...${NC}"
        kill -9 $OLD_PID
        sleep 2
    fi
    echo -e "${GREEN}✓ 旧进程已停止${NC}"
else
    echo -e "${GREEN}✓ 没有运行中的旧进程${NC}"
fi

echo ""
echo -e "${YELLOW}[步骤2] 启动应用...${NC}"

# 启动应用（单行完整命令）
nohup java ${JVM_OPTS} -jar "${APP_JAR}" --spring.profiles.active=prod > "${LOG_FILE}" 2>&1 &

# 获取新进程 PID
NEW_PID=$!
echo $NEW_PID > "${PID_FILE}"

echo -e "${GREEN}✓ 应用已启动 (PID: $NEW_PID)${NC}"
echo "日志文件: ${LOG_FILE}"
echo ""

echo "等待应用启动（25秒）..."
sleep 25

echo ""
echo -e "${YELLOW}[步骤3] 验证部署...${NC}"

# 检查进程是否还在运行
if ps -p $NEW_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 应用进程运行中 (PID: $NEW_PID)${NC}"
else
    echo -e "${RED}✗ 应用进程已退出${NC}"
    echo "请查看日志: tail -100 ${LOG_FILE}"
    exit 1
fi

# 检查端口监听
PORT_CHECK=$(netstat -tuln 2>/dev/null | grep ":8082" || ss -tuln 2>/dev/null | grep ":8082")
if [ ! -z "$PORT_CHECK" ]; then
    echo -e "${GREEN}✓ 端口 8082 已监听${NC}"
else
    echo -e "${RED}✗ 端口 8082 未监听${NC}"
fi

echo ""
echo -e "${YELLOW}[步骤4] 日志分析...${NC}"

# 检查数据库连接
if grep -q "HikariPool-1 - Start completed" "${LOG_FILE}" 2>/dev/null; then
    echo -e "${GREEN}✓ 数据库连接池启动成功${NC}"
elif grep -q "HikariPool" "${LOG_FILE}" 2>/dev/null; then
    echo -e "${YELLOW}⚠ 数据库连接池正在初始化...${NC}"
else
    echo -e "${RED}✗ 数据库连接池启动失败${NC}"
fi

# 检查应用启动状态
if grep -q "Started ActivityApplication" "${LOG_FILE}" 2>/dev/null; then
    echo -e "${GREEN}✓ 应用启动成功${NC}"
elif grep -q "Starting ActivityApplication" "${LOG_FILE}" 2>/dev/null; then
    echo -e "${YELLOW}⚠ 应用正在启动中...${NC}"
else
    echo -e "${RED}✗ 应用启动失败${NC}"
fi

# 检查错误信息
if [ -f "${LOG_FILE}" ]; then
    ERROR_COUNT=$(grep -c "ERROR" "${LOG_FILE}" 2>/dev/null || echo "0")
    ERROR_COUNT=$(echo "$ERROR_COUNT" | tr -d '\n\r' | xargs)
    if [ "$ERROR_COUNT" -gt 0 ] 2>/dev/null; then
        echo -e "${RED}⚠ 发现 ${ERROR_COUNT} 个错误${NC}"
    fi
fi

echo ""
echo -e "${YELLOW}[步骤5] 健康检查...${NC}"

# 健康检查
HEALTH_RESPONSE=$(curl -s http://localhost:8082/actuator/health 2>/dev/null)
if [ ! -z "$HEALTH_RESPONSE" ]; then
    echo -e "${GREEN}✓ 健康检查通过${NC}"
    echo "响应: $HEALTH_RESPONSE"
else
    # 再尝试一次简单的接口
    API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8082/ 2>/dev/null)
    if [ "$API_RESPONSE" != "000" ]; then
        echo -e "${YELLOW}⚠ 健康检查端点无响应，但应用端口可访问 (HTTP $API_RESPONSE)${NC}"
    else
        echo -e "${RED}✗ 健康检查无响应${NC}"
    fi
fi

echo ""
echo -e "${YELLOW}[步骤6] 日志摘要（最后 50 行）${NC}"
echo "========================================"
tail -50 "${LOG_FILE}" 2>/dev/null || echo "日志文件为空或不存在"
echo "========================================"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  部署完成${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "常用命令:"
echo "  查看实时日志: tail -f ${LOG_FILE}"
echo "  查看错误日志: grep ERROR ${LOG_FILE}"
echo "  健康检查: curl http://localhost:8082/actuator/health"
echo "  停止应用: kill \$(cat ${PID_FILE})"
echo "  重新启动: $0"
echo ""

# 最终判断
if ps -p $NEW_PID > /dev/null 2>&1 && [ ! -z "$PORT_CHECK" ]; then
    echo -e "${GREEN}✓✓✓ 部署成功！应用正在运行 ✓✓✓${NC}"
    exit 0
else
    echo -e "${RED}✗✗✗ 部署可能失败，请检查日志 ✗✗✗${NC}"
    echo "请执行: tail -100 ${LOG_FILE}"
    exit 1
fi
