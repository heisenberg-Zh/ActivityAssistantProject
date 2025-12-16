#!/bin/bash

# ============================================
# ActivityAssistant 环境检查脚本
# 用于诊断部署环境是否满足要求
# ============================================

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ActivityAssistant 环境检查${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查结果统计
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# 检查函数
check_item() {
    local item_name=$1
    local check_command=$2
    local success_msg=$3
    local fail_msg=$4
    local level=${5:-error}  # error 或 warning

    echo -n "检查 ${item_name}... "

    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ ${success_msg}${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
        return 0
    else
        if [ "$level" = "warning" ]; then
            echo -e "${YELLOW}⚠ ${fail_msg}${NC}"
            WARN_COUNT=$((WARN_COUNT + 1))
        else
            echo -e "${RED}✗ ${fail_msg}${NC}"
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
        return 1
    fi
}

echo -e "${YELLOW}[1] 系统环境检查${NC}"
echo "----------------------------------------"

# 检查操作系统
check_item "操作系统" \
    "uname -s | grep -q Linux" \
    "Linux 系统" \
    "非 Linux 系统，脚本可能需要调整" \
    "warning"

# 检查架构
ARCH=$(uname -m)
echo "系统架构: $ARCH"

# 检查 Java 版本
echo ""
echo -e "${YELLOW}[2] Java 环境检查${NC}"
echo "----------------------------------------"

if command -v java > /dev/null 2>&1; then
    JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'"' -f2)
    echo -e "${GREEN}✓ Java 已安装: $JAVA_VERSION${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))

    # 检查 Java 版本是否 >= 17
    JAVA_MAJOR_VERSION=$(echo $JAVA_VERSION | cut -d'.' -f1)
    if [ "$JAVA_MAJOR_VERSION" -ge 17 ]; then
        echo -e "${GREEN}✓ Java 版本满足要求 (需要 >= 17)${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}✗ Java 版本过低 (当前: $JAVA_VERSION, 需要: >= 17)${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
else
    echo -e "${RED}✗ Java 未安装${NC}"
    echo "请安装 Java 17 或更高版本"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# 检查文件和目录
echo ""
echo -e "${YELLOW}[3] 文件检查${NC}"
echo "----------------------------------------"

check_item "JAR 文件" \
    "[ -f /home/aap/activity-assistant-1.0.0.jar ]" \
    "JAR 文件存在" \
    "JAR 文件不存在: /home/aap/activity-assistant-1.0.0.jar"

check_item "启动脚本" \
    "[ -f /home/aap/start-app.sh ]" \
    "启动脚本存在" \
    "启动脚本不存在: /home/aap/start-app.sh" \
    "warning"

check_item "停止脚本" \
    "[ -f /home/aap/stop-app.sh ]" \
    "停止脚本存在" \
    "停止脚本不存在: /home/aap/stop-app.sh" \
    "warning"

# 检查脚本权限
if [ -f /home/aap/start-app.sh ]; then
    check_item "启动脚本权限" \
        "[ -x /home/aap/start-app.sh ]" \
        "启动脚本可执行" \
        "启动脚本无执行权限，请执行: chmod +x /home/aap/start-app.sh"
fi

# 检查日志目录
check_item "日志目录" \
    "[ -d /home/aap/logs ] || mkdir -p /home/aap/logs" \
    "日志目录存在" \
    "无法创建日志目录"

# 检查网络和端口
echo ""
echo -e "${YELLOW}[4] 网络检查${NC}"
echo "----------------------------------------"

# 检查端口 8082 是否被占用
check_item "端口 8082" \
    "! (netstat -tuln 2>/dev/null | grep -q ':8082' || ss -tuln 2>/dev/null | grep -q ':8082')" \
    "端口 8082 空闲" \
    "端口 8082 已被占用" \
    "warning"

# 检查必要的命令工具
echo ""
echo -e "${YELLOW}[5] 系统工具检查${NC}"
echo "----------------------------------------"

check_item "curl" \
    "command -v curl" \
    "curl 已安装" \
    "curl 未安装（建议安装用于健康检查）" \
    "warning"

check_item "netstat/ss" \
    "command -v netstat || command -v ss" \
    "网络工具已安装" \
    "netstat 和 ss 均未安装（建议安装）" \
    "warning"

check_item "grep" \
    "command -v grep" \
    "grep 已安装" \
    "grep 未安装"

# 数据库连接检查
echo ""
echo -e "${YELLOW}[6] 数据库连接检查${NC}"
echo "----------------------------------------"

DB_HOST="rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com"
DB_PORT="3306"
DB_USER="aapDBU"
DB_PASSWORD="aapDBUP@sswrd!5678"
DB_NAME="activity_assistant"

# 检查 telnet 或 nc 是否可用
if command -v telnet > /dev/null 2>&1; then
    echo -n "检查数据库端口可达性（使用 telnet）... "
    if timeout 5 telnet $DB_HOST $DB_PORT < /dev/null 2>&1 | grep -q "Connected\|Escape"; then
        echo -e "${GREEN}✓ 数据库端口可达${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}✗ 数据库端口不可达${NC}"
        echo "  可能原因: 1) 网络不通 2) 防火墙限制 3) 数据库服务未启动"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
elif command -v nc > /dev/null 2>&1; then
    echo -n "检查数据库端口可达性（使用 nc）... "
    if nc -zv -w 5 $DB_HOST $DB_PORT 2>&1 | grep -q "succeeded\|open"; then
        echo -e "${GREEN}✓ 数据库端口可达${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}✗ 数据库端口不可达${NC}"
        echo "  可能原因: 1) 网络不通 2) 防火墙限制 3) 数据库服务未启动"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
else
    echo -e "${YELLOW}⚠ telnet 和 nc 均未安装，跳过数据库端口检查${NC}"
    WARN_COUNT=$((WARN_COUNT + 1))
fi

# 如果安装了 mysql 客户端，尝试连接测试
if command -v mysql > /dev/null 2>&1; then
    echo -n "检查数据库连接（使用 mysql 客户端）... "
    if mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 数据库连接成功${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))

        # 检查数据库是否已初始化
        TABLE_COUNT=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" $DB_NAME -e "SHOW TABLES;" 2>/dev/null | wc -l)
        if [ "$TABLE_COUNT" -gt 1 ]; then
            echo -e "${GREEN}✓ 数据库已包含 $((TABLE_COUNT - 1)) 个表${NC}"
            PASS_COUNT=$((PASS_COUNT + 1))
        else
            echo -e "${YELLOW}⚠ 数据库为空，需要导入表结构${NC}"
            WARN_COUNT=$((WARN_COUNT + 1))
        fi
    else
        echo -e "${RED}✗ 数据库连接失败${NC}"
        echo "  请检查: 1) 用户名密码 2) 数据库是否存在 3) 用户权限"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
else
    echo -e "${YELLOW}⚠ mysql 客户端未安装，跳过数据库连接测试${NC}"
    echo "  建议安装: yum install mysql 或 apt install mysql-client"
    WARN_COUNT=$((WARN_COUNT + 1))
fi

# 系统资源检查
echo ""
echo -e "${YELLOW}[7] 系统资源检查${NC}"
echo "----------------------------------------"

# 检查可用内存
AVAILABLE_MEM=$(free -m | awk 'NR==2{print $7}')
echo "可用内存: ${AVAILABLE_MEM}MB"
if [ "$AVAILABLE_MEM" -gt 1024 ]; then
    echo -e "${GREEN}✓ 内存充足${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${YELLOW}⚠ 可用内存较少（建议 > 1GB）${NC}"
    WARN_COUNT=$((WARN_COUNT + 1))
fi

# 检查磁盘空间
AVAILABLE_DISK=$(df -m /home/aap | awk 'NR==2{print $4}')
echo "可用磁盘空间: ${AVAILABLE_DISK}MB"
if [ "$AVAILABLE_DISK" -gt 1024 ]; then
    echo -e "${GREEN}✓ 磁盘空间充足${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${YELLOW}⚠ 可用磁盘空间较少（建议 > 1GB）${NC}"
    WARN_COUNT=$((WARN_COUNT + 1))
fi

# 检查当前运行的进程
echo ""
echo -e "${YELLOW}[8] 应用进程检查${NC}"
echo "----------------------------------------"

RUNNING_PID=$(ps aux | grep "activity-assistant-1.0.0.jar" | grep -v grep | awk '{print $2}')
if [ ! -z "$RUNNING_PID" ]; then
    echo -e "${YELLOW}⚠ 应用正在运行 (PID: $RUNNING_PID)${NC}"
    echo "  如需重启，请先执行: ./stop-app.sh"
    WARN_COUNT=$((WARN_COUNT + 1))
else
    echo -e "${GREEN}✓ 没有运行中的应用进程${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
fi

# 总结
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  检查结果汇总${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "通过: ${GREEN}${PASS_COUNT}${NC}"
echo -e "警告: ${YELLOW}${WARN_COUNT}${NC}"
echo -e "失败: ${RED}${FAIL_COUNT}${NC}"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    if [ "$WARN_COUNT" -eq 0 ]; then
        echo -e "${GREEN}✓✓✓ 环境检查全部通过，可以部署！✓✓✓${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠⚠⚠ 环境检查基本通过，但有 ${WARN_COUNT} 个警告 ⚠⚠⚠${NC}"
        echo "建议解决警告后再部署，或谨慎继续"
        exit 0
    fi
else
    echo -e "${RED}✗✗✗ 环境检查失败，有 ${FAIL_COUNT} 个严重问题 ✗✗✗${NC}"
    echo "请解决上述问题后再部署"
    exit 1
fi
