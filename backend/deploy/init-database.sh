#!/bin/bash

# ============================================
# 数据库初始化脚本
# 用于在生产环境初始化数据库表和测试数据
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 数据库连接配置
DB_HOST="rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com"
DB_PORT="3306"
DB_NAME="activity_assistant"
DB_USER="aapDBU"
DB_PASS="aapDBUP@sswrd!5678"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  数据库初始化${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查 mysql 客户端
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}✗ mysql 客户端未安装${NC}"
    echo "安装命令："
    echo "  CentOS/RHEL: sudo yum install mysql -y"
    echo "  Ubuntu/Debian: sudo apt-get install mysql-client -y"
    exit 1
fi

# 测试数据库连接
echo -e "${YELLOW}[步骤1] 测试数据库连接...${NC}"
if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 数据库连接成功${NC}"
else
    echo -e "${RED}✗ 数据库连接失败${NC}"
    exit 1
fi

# 检查数据库是否存在
echo ""
echo -e "${YELLOW}[步骤2] 检查数据库...${NC}"
DB_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
    -e "SHOW DATABASES LIKE '$DB_NAME';" | grep -c "$DB_NAME")

if [ "$DB_EXISTS" -eq 0 ]; then
    echo -e "${YELLOW}⚠ 数据库不存在，正在创建...${NC}"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
        -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    echo -e "${GREEN}✓ 数据库创建成功${NC}"
else
    echo -e "${GREEN}✓ 数据库已存在${NC}"
fi

# 检查表是否存在
echo ""
echo -e "${YELLOW}[步骤3] 检查表结构...${NC}"
TABLE_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
    "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | wc -l)

echo "当前表数量: $((TABLE_COUNT - 1))"

if [ "$TABLE_COUNT" -le 1 ]; then
    echo -e "${YELLOW}⚠ 数据库为空，需要初始化${NC}"
    NEED_INIT=1
else
    echo -e "${GREEN}✓ 数据库已包含表${NC}"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
        "$DB_NAME" -e "SHOW TABLES;"

    echo ""
    read -p "是否重新初始化数据库？(会删除所有现有数据) [y/N]: " CONFIRM
    if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
        NEED_INIT=1
    else
        NEED_INIT=0
    fi
fi

# 执行初始化
if [ "$NEED_INIT" -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}[步骤4] 执行数据库初始化...${NC}"

    # 上传 SQL 文件的路径
    SQL_DIR="/home/aap/sql"

    if [ -f "$SQL_DIR/01_schema.sql" ]; then
        echo "执行: 01_schema.sql (建表)"
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SQL_DIR/01_schema.sql"
        echo -e "${GREEN}✓ 表结构创建完成${NC}"
    else
        echo -e "${YELLOW}⚠ 未找到 01_schema.sql，跳过${NC}"
    fi

    if [ -f "$SQL_DIR/02_initial_data.sql" ]; then
        echo "执行: 02_initial_data.sql (初始数据)"
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SQL_DIR/02_initial_data.sql"
        echo -e "${GREEN}✓ 初始数据插入完成${NC}"
    else
        echo -e "${YELLOW}⚠ 未找到 02_initial_data.sql，跳过${NC}"
    fi

    if [ -f "$SQL_DIR/03_optimization.sql" ]; then
        echo "执行: 03_optimization.sql (索引优化)"
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SQL_DIR/03_optimization.sql"
        echo -e "${GREEN}✓ 索引优化完成${NC}"
    else
        echo -e "${YELLOW}⚠ 未找到 03_optimization.sql，跳过${NC}"
    fi
fi

# 验证结果
echo ""
echo -e "${YELLOW}[步骤5] 验证初始化结果...${NC}"

# 显示所有表
echo "数据库表列表："
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
    "$DB_NAME" -e "SHOW TABLES;"

# 检查 activity 表数据
echo ""
echo "activity 表数据统计："
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
    "$DB_NAME" << 'EOFSQL'
SELECT
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'published' THEN 1 END) as published_count,
    COUNT(CASE WHEN is_public = 1 THEN 1 END) as public_count
FROM activity;
EOFSQL

echo ""
echo "activity 表前 5 条记录："
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
    "$DB_NAME" -e "SELECT id, title, status, is_public, start_time FROM activity LIMIT 5;"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  初始化完成${NC}"
echo -e "${BLUE}========================================${NC}"
