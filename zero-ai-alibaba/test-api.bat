@echo off
REM Zero AI Alibaba API 测试脚本 (Windows)

set BASE_URL=http://localhost:8080

echo =========================================
echo Zero AI Alibaba API 测试
echo =========================================
echo.

REM 测试 1: GET 请求
echo 测试 1: GET 请求 - 基础天气查询
echo ----------------------------------------
curl -X GET "%BASE_URL%/api/agent/chat?message=今天天气怎么样" -H "Content-Type: application/json"
echo.
echo.

REM 测试 2: POST 请求
echo 测试 2: POST 请求 - 带 Thread ID
echo ----------------------------------------
curl -X POST "%BASE_URL%/api/agent/chat" -H "Content-Type: application/json" -d "{\"message\": \"今天天气怎么样？\", \"userId\": \"1\"}"
echo.
echo.

REM 测试 3: 位置查询
echo 测试 3: 位置相关查询
echo ----------------------------------------
curl -X POST "%BASE_URL%/api/agent/chat" -H "Content-Type: application/json" -d "{\"message\": \"我所在位置的天气如何？\", \"userId\": \"1\"}"
echo.
echo.

echo =========================================
echo 测试完成！
echo =========================================
pause

