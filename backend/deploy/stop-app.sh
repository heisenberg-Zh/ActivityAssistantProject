#!/bin/bash

# ============================================
# ActivityAssistant 停止脚本
# ============================================

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

APP_NAME="activity-assistant"
APP_JAR="/home/aap/activity-assistant-1.0.0.jar"
PID_FILE="/home/aap/${APP_NAME}.pid"

echo -e "${YELLOW}正在停止 ActivityAssistant...${NC}"

# 方法1: 通过 PID 文件停止
if [ -f "${PID_FILE}" ]; then
    PID=$(cat "${PID_FILE}")
    if ps -p $PID > /dev/null 2>&1; then
        echo "发现进程 (PID: $PID)，正在停止..."
        kill -15 $PID
        sleep 5

        # 检查是否还在运行
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${YELLOW}进程未停止，强制结束...${NC}"
            kill -9 $PID
            sleep 2
        fi

        rm -f "${PID_FILE}"
        echo -e "${GREEN}✓ 应用已停止${NC}"
    else
        echo -e "${YELLOW}⚠ PID 文件存在但进程未运行${NC}"
        rm -f "${PID_FILE}"
    fi
fi

# 方法2: 通过进程名停止
RUNNING_PID=$(ps aux | grep "${APP_JAR}" | grep -v grep | awk '{print $2}')
if [ ! -z "$RUNNING_PID" ]; then
    echo "发现运行中的进程 (PID: $RUNNING_PID)，正在停止..."
    kill -15 $RUNNING_PID
    sleep 5

    if ps -p $RUNNING_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}进程未停止，强制结束...${NC}"
        kill -9 $RUNNING_PID
        sleep 2
    fi

    echo -e "${GREEN}✓ 应用已停止${NC}"
else
    echo -e "${GREEN}✓ 没有运行中的应用进程${NC}"
fi

# 验证端口是否已释放
sleep 2
PORT_CHECK=$(netstat -tuln 2>/dev/null | grep ":8082" || ss -tuln 2>/dev/null | grep ":8082")
if [ -z "$PORT_CHECK" ]; then
    echo -e "${GREEN}✓ 端口 8082 已释放${NC}"
else
    echo -e "${RED}✗ 端口 8082 仍被占用${NC}"
fi
