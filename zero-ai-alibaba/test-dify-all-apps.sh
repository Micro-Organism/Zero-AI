#!/bin/bash

# Dify 所有应用测试脚本
# 支持选择应用进行测试

# 配置信息
DIFY_API_URL="http://10.133.0.147:18082"

# 应用列表（格式：应用ID|应用名称|API Key|API类型|请求体模板）
APPS=(
    "c46e6278-529e-4baf-9689-82e36f71ccfd|文本生成应用测试|app-Li1IQ3aoUALUG9QafnY5xl5c|completion|{\"inputs\":{\"meeting_content\":\"Hello, world!\"},\"response_mode\":\"blocking\",\"user\":\"test-user-123\"}"
    "c41834f1-e70c-4c96-8722-eabbbffa1969|面试官助手|app-UfeIMKXQH4Zz2J84DnneAsdR|chat|{\"inputs\":{\"jobname\":\"Java开发工程师\"},\"query\":\"请介绍一下你自己\",\"response_mode\":\"blocking\",\"user\":\"test-user-123\"}"
    "99a1cba2-8c35-472a-b98b-58f2ad261f3f|调研分析报告编写助手|app-CnnfpV7PIkChjh033STaWOtp|chat|{\"inputs\":{\"user_request\":\"官网\",\"knowledge_base\":\"官网\"},\"query\":\"介绍下平果13promax\",\"response_mode\":\"streaming\",\"user\":\"user-123\"}"
    "59cdfbd2-7826-4f34-83a6-cec16224bc57|分析报告生成助手|app-0KfaUnJxjA4IVqsXVj1m0SZI|chat|{\"inputs\":{},\"query\":\"请介绍一下你自己\",\"response_mode\":\"blocking\",\"user\":\"test-user-123\"}"
    "38f38794-bc62-49ab-b054-4669732e8ed0|测试知识库问答|app-3TM6x4lKsId9bnPUbKcLYBIM|workflow|{\"inputs\":{\"query\":\"什么是人工智能？\"},\"response_mode\":\"streaming\",\"user\":\"abc-123\"}"
)

echo "=========================================="
echo "Dify 所有应用测试脚本"
echo "=========================================="
echo ""
echo "可用应用列表:"
echo "  1. 文本生成应用测试 (completion)"
echo "  2. 面试官助手 (chat)"
echo "  3. 调研分析报告编写助手 (chat)"
echo "  4. 分析报告生成助手 (chat)"
echo "  5. 测试知识库问答 (workflow)"
echo ""
echo -n "请选择要测试的应用 (1-5): "
read choice

# 验证输入
if ! [[ "$choice" =~ ^[1-5]$ ]]; then
    echo "❌ 无效的选择，请输入 1-5"
    exit 1
fi

# 解析应用信息（数组索引从0开始，所以需要减1）
index=$((choice - 1))
appInfo="${APPS[$index]}"
appId=$(echo "$appInfo" | cut -d'|' -f1)
appName=$(echo "$appInfo" | cut -d'|' -f2)
apiKey=$(echo "$appInfo" | cut -d'|' -f3)
apiType=$(echo "$appInfo" | cut -d'|' -f4)
requestBody=$(echo "$appInfo" | cut -d'|' -f5)

echo ""
echo "=========================================="
echo "测试应用: $appName"
echo "应用ID: $appId"
echo "API类型: $apiType"
echo "=========================================="
echo ""

# 根据API类型选择不同的端点和请求格式
if [ "$apiType" = "workflow" ]; then
    # workflow API
    API_URL="${DIFY_API_URL}/v1/workflows/run"
    echo "API URL: $API_URL"
    echo "请求体:"
    echo "$requestBody" | jq '.' 2>/dev/null || echo "$requestBody"
    echo ""
    
    response=$(curl -X POST "$API_URL" \
      --header "Authorization: Bearer ${apiKey}" \
      --header "Content-Type: application/json" \
      --data-raw "$requestBody" \
      -w "\nHTTP_CODE:%{http_code}" \
      -s)
    
elif [ "$apiType" = "chat" ]; then
    # chat-messages API
    API_URL="${DIFY_API_URL}/v1/chat-messages"
    echo "API URL: $API_URL"
    echo "请求体:"
    echo "$requestBody" | jq '.' 2>/dev/null || echo "$requestBody"
    echo ""
    
    response=$(curl -X POST "$API_URL" \
      --header "Authorization: Bearer ${apiKey}" \
      --header "Content-Type: application/json" \
      --data-raw "$requestBody" \
      -w "\nHTTP_CODE:%{http_code}" \
      -s)
    
else
    # completion-messages API
    API_URL="${DIFY_API_URL}/v1/completion-messages"
    echo "API URL: $API_URL"
    echo "请求体:"
    echo "$requestBody" | jq '.' 2>/dev/null || echo "$requestBody"
    echo ""
    
    response=$(curl -X POST "$API_URL" \
      --header "Authorization: Bearer ${apiKey}" \
      --header "Content-Type: application/json" \
      --data-raw "$requestBody" \
      -w "\nHTTP_CODE:%{http_code}" \
      -s)
fi

# 提取 HTTP 状态码和响应体
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

echo "=========================================="
echo "响应结果"
echo "=========================================="
if [ -n "$body" ]; then
    # 如果是流式响应，只显示前20行
    if [ "$apiType" = "workflow" ] || echo "$requestBody" | grep -q "streaming"; then
        echo "$body" | head -20
        if [ $(echo "$body" | wc -l) -gt 20 ]; then
            echo "... (流式响应，已截断)"
        fi
    else
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
else
    echo "(空响应)"
fi
echo ""
echo "HTTP状态码: $http_code"
echo ""

# 判断结果
if [ "$http_code" = "200" ]; then
    echo "✅ 测试成功"
    echo ""
    echo "推荐请求格式:"
    echo "$requestBody" | jq '.' 2>/dev/null || echo "$requestBody"
    exit 0
elif [ "$http_code" = "400" ]; then
    echo "⚠️  参数错误"
    echo ""
    echo "可能的原因："
    echo "1. 请求体格式不正确"
    echo "2. 缺少必需的参数"
    echo "3. 参数值不符合要求"
    exit 1
elif [ "$http_code" = "401" ]; then
    echo "❌ 认证失败"
    echo ""
    echo "可能的原因："
    echo "1. API Key 无效或已过期"
    echo "2. API Key 没有访问该应用的权限"
    exit 1
else
    echo "❌ 测试失败 (HTTP $http_code)"
    exit 1
fi

