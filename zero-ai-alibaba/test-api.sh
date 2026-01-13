#!/bin/bash

# Zero AI Alibaba API 测试脚本

BASE_URL="http://localhost:8080"

echo "========================================="
echo "Zero AI Alibaba API 测试"
echo "========================================="
echo ""

# 测试 1: GET 请求
echo "测试 1: GET 请求 - 基础天气查询"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/api/agent/chat?message=今天天气怎么样" \
  -H "Content-Type: application/json" \
  -w "\n\n状态码: %{http_code}\n\n"
echo ""

# 测试 2: POST 请求
echo "测试 2: POST 请求 - 带 Thread ID"
echo "----------------------------------------"
THREAD_ID=$(curl -s -X POST "${BASE_URL}/api/agent/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "今天天气怎么样？",
    "userId": "1"
  }' | grep -o '"threadId":"[^"]*' | cut -d'"' -f4)

echo "生成的 Thread ID: ${THREAD_ID}"
echo ""

# 测试 3: 使用 Thread ID 继续对话
if [ ! -z "$THREAD_ID" ]; then
  echo "测试 3: 使用 Thread ID 继续对话"
  echo "----------------------------------------"
  curl -X POST "${BASE_URL}/api/agent/chat" \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"明天呢？\",
      \"threadId\": \"${THREAD_ID}\",
      \"userId\": \"1\"
    }" \
    -w "\n\n状态码: %{http_code}\n\n"
  echo ""
fi

# 测试 4: 位置查询
echo "测试 4: 位置相关查询"
echo "----------------------------------------"
curl -X POST "${BASE_URL}/api/agent/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "我所在位置的天气如何？",
    "userId": "1"
  }' \
  -w "\n\n状态码: %{http_code}\n\n"

echo ""
echo "========================================="
echo "测试完成！"
echo "========================================="

