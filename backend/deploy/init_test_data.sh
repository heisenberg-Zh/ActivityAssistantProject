#!/bin/bash

# ============================================
# 测试数据一键初始化脚本
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 数据库配置
DB_HOST="rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com"
DB_PORT="3306"
DB_NAME="activity_assistant"
DB_USER="aapDBU"
DB_PASS="aapDBUP@sswrd!5678"

SQL_FILE="/home/aap/insert_test_data.sql"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  测试数据初始化${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查SQL文件是否存在
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}✗ SQL文件不存在: $SQL_FILE${NC}"
    echo "请先上传 insert_test_data.sql 到 /home/aap/ 目录"
    exit 1
fi

# 检查mysql客户端
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}✗ mysql 客户端未安装${NC}"
    echo "安装命令: sudo yum install mysql -y"
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

# 检查是否已有测试数据
echo ""
echo -e "${YELLOW}[步骤2] 检查现有测试数据...${NC}"

EXISTING_USERS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
    "$DB_NAME" -e "SELECT COUNT(*) FROM users WHERE id LIKE 'test_user_%';" 2>/dev/null | tail -1)

EXISTING_ACTIVITIES=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
    "$DB_NAME" -e "SELECT COUNT(*) FROM activities WHERE id LIKE 'test_act_%';" 2>/dev/null | tail -1)

if [ "$EXISTING_USERS" -gt 0 ] || [ "$EXISTING_ACTIVITIES" -gt 0 ]; then
    echo -e "${YELLOW}⚠ 发现现有测试数据：${NC}"
    echo "  - 测试用户: $EXISTING_USERS 个"
    echo "  - 测试活动: $EXISTING_ACTIVITIES 个"
    echo ""
    read -p "是否删除并重新创建测试数据? [y/N]: " CONFIRM

    if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
        echo "正在清理旧数据..."
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
            "$DB_NAME" << 'EOFSQL'
DELETE FROM activities WHERE id LIKE 'test_act_%';
DELETE FROM users WHERE id LIKE 'test_user_%';
EOFSQL
        echo -e "${GREEN}✓ 旧数据已清理${NC}"
    else
        echo "取消操作"
        exit 0
    fi
else
    echo -e "${GREEN}✓ 无现有测试数据${NC}"
fi

# 执行SQL脚本
echo ""
echo -e "${YELLOW}[步骤3] 执行测试数据插入...${NC}"

if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
    "$DB_NAME" < "$SQL_FILE" 2>&1 | tail -10; then
    echo -e "${GREEN}✓ 测试数据插入成功${NC}"
else
    echo -e "${RED}✗ 测试数据插入失败${NC}"
    exit 1
fi

# 验证结果
echo ""
echo -e "${YELLOW}[步骤4] 验证结果...${NC}"

NEW_USERS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
    "$DB_NAME" -e "SELECT COUNT(*) FROM users WHERE id LIKE 'test_user_%';" 2>/dev/null | tail -1)

NEW_ACTIVITIES=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
    "$DB_NAME" -e "SELECT COUNT(*) FROM activities WHERE id LIKE 'test_act_%';" 2>/dev/null | tail -1)

echo "测试用户数量: $NEW_USERS"
echo "测试活动数量: $NEW_ACTIVITIES"

if [ "$NEW_USERS" -eq 5 ] && [ "$NEW_ACTIVITIES" -eq 10 ]; then
    echo -e "${GREEN}✓ 验证通过！${NC}"
else
    echo -e "${YELLOW}⚠ 数据量异常，请检查${NC}"
fi

# 显示活动列表
echo ""
echo -e "${YELLOW}[步骤5] 测试活动列表${NC}"
echo "----------------------------------------"

mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
    "$DB_NAME" << 'EOFSQL'
SELECT
    id as '活动ID',
    title as '活动标题',
    type as '类型',
    total as '人数',
    DATE_FORMAT(start_time, '%m-%d %H:%i') as '开始时间',
    place as '地点'
FROM activities
WHERE id LIKE 'test_act_%'
ORDER BY start_time;
EOFSQL

echo "----------------------------------------"
echo ""

# 测试API
echo -e "${YELLOW}[步骤6] 测试后端API...${NC}"

API_RESPONSE=$(curl -s "http://localhost:8082/api/activities?status=published&isPublic=true&page=0&size=50")

# 检查响应是否包含test活动
if echo "$API_RESPONSE" | grep -q "Test"; then
    echo -e "${GREEN}✓ API响应正常，包含测试活动${NC}"

    # 统计返回的活动数量
    ACTIVITY_COUNT=$(echo "$API_RESPONSE" | grep -o '"id"' | wc -l)
    echo "API返回活动数量: $ACTIVITY_COUNT"
else
    echo -e "${YELLOW}⚠ API响应中未找到test活动${NC}"
    echo "响应片段: $(echo "$API_RESPONSE" | head -c 200)"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  初始化完成${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "后续操作："
echo "1. 在微信开发者工具中打开小程序首页"
echo "2. 下拉刷新页面"
echo "3. 应该能看到10个测试活动"
echo ""
echo "清理测试数据："
echo "  mysql -h $DB_HOST -u $DB_USER -p'$DB_PASS' $DB_NAME"
echo "  > DELETE FROM activities WHERE id LIKE 'test_act_%';"
echo "  > DELETE FROM users WHERE id LIKE 'test_user_%';"
echo ""
