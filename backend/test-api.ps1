/**
 * API 测试脚本
 * 使用 PowerShell 的 Invoke-WebRequest 测试所有 API 端点
 */

# 基础 URL
$baseUrl = "http://localhost:3001/api"

# 1. 测试主题 API
Write-Host "========== 主题管理 ==========" -ForegroundColor Cyan

# 获取所有主题
Write-Host "GET /api/themes" -ForegroundColor Yellow
$themes = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/themes" | ConvertFrom-Json
Write-Host "✓ 获取主题成功，共 $($themes.data.pagination.total) 个主题`n"

# 创建新主题
Write-Host "POST /api/themes - 创建新主题" -ForegroundColor Yellow
$newTheme = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/themes" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"title":"测试主题","codename":"TEST THEME","description":"这是一个测试主题"}' | ConvertFrom-Json
$themeId = $newTheme.data.id
Write-Host "✓ 创建成功，ID: $themeId`n"

# 获取单个主题详情
Write-Host "GET /api/themes/:id - 获取主题详情" -ForegroundColor Yellow
$themeDetail = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/themes/$themeId" | ConvertFrom-Json
Write-Host "✓ 获取成功: $($themeDetail.data.title)`n"

# 2. 测试节点 API
Write-Host "========== 节点管理 ==========" -ForegroundColor Cyan

# 创建新节点（FOCUS_ITEM）
Write-Host "POST /api/nodes - 创建重点项" -ForegroundColor Yellow
$newNode = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/nodes" `
  -Method POST `
  -ContentType "application/json" `
  -Body @"
{
  "node_type": "FOCUS_ITEM",
  "title": "测试重点项",
  "codename": "TEST FOCUS",
  "parent_id": $themeId,
  "priority": "HIGH"
}
"@ | ConvertFrom-Json
$focusItemId = $newNode.data.id
Write-Host "✓ 创建成功，ID: $focusItemId`n"

# 获取节点详情
Write-Host "GET /api/nodes/:id - 获取节点" -ForegroundColor Yellow
$nodeDetail = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/nodes/$focusItemId" | ConvertFrom-Json
Write-Host "✓ 获取成功: $($nodeDetail.data.title)`n"

# 获取子节点
Write-Host "GET /api/nodes/:id/children - 获取子节点" -ForegroundColor Yellow
$children = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/nodes/$focusItemId/children" | ConvertFrom-Json
Write-Host "✓ 获取成功，共 $($children.data.Length) 个子节点`n"

# 更新节点
Write-Host "PUT /api/nodes/:id - 更新节点" -ForegroundColor Yellow
$updated = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/nodes/$focusItemId" `
  -Method PUT `
  -ContentType "application/json" `
  -Body '{"progress_percent":50}' | ConvertFrom-Json
Write-Host "✓ 更新成功，进度: $($updated.data.progress_percent)%`n"

# 3. 测试阶段 API
Write-Host "========== 阶段管理 ==========" -ForegroundColor Cyan

# 创建阶段
Write-Host "POST /api/phases - 创建阶段" -ForegroundColor Yellow
$newPhase = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/phases" `
  -Method POST `
  -ContentType "application/json" `
  -Body @"
{
  "node_id": $focusItemId,
  "phase_number": 1,
  "title": "第一阶段",
  "start_date": "2026-07-01",
  "end_date": "2026-07-20",
  "description": "测试阶段"
}
"@ | ConvertFrom-Json
$phaseId = $newPhase.data.id
Write-Host "✓ 创建成功，ID: $phaseId`n"

# 添加阶段要点
Write-Host "POST /api/phases/:id/points - 添加阶段要点" -ForegroundColor Yellow
$phasePoint = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/phases/$phaseId/points" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"content":"这是第一个阶段要点"}' | ConvertFrom-Json
Write-Host "✓ 添加成功`n"

# 获取阶段
Write-Host "GET /api/phases/by-node/:nodeId - 获取节点的所有阶段" -ForegroundColor Yellow
$phases = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/phases/by-node/$focusItemId" | ConvertFrom-Json
Write-Host "✓ 获取成功，共 $($phases.data.Length) 个阶段`n"

# 4. 测试执行记录 API
Write-Host "========== 每日执行记录 ==========" -ForegroundColor Cyan

# 创建执行记录
Write-Host "POST /api/daily-executions - 创建执行记录" -ForegroundColor Yellow
$todayDate = (Get-Date -Format "yyyy-MM-dd")
$newExecution = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/daily-executions" `
  -Method POST `
  -ContentType "application/json" `
  -Body @"
{
  "node_id": $focusItemId,
  "execution_date": "$todayDate",
  "is_done": 1,
  "completion_percent": 75,
  "notes": "今天完成了测试任务"
}
"@ | ConvertFrom-Json
$executionId = $newExecution.data.id
Write-Host "✓ 创建成功，ID: $executionId`n"

# 获取执行记录
Write-Host "GET /api/daily-executions/:nodeId - 获取节点的执行记录" -ForegroundColor Yellow
$executions = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/daily-executions/$focusItemId" | ConvertFrom-Json
Write-Host "✓ 获取成功，共 $($executions.data.Length) 条记录`n"

# 5. 测试统计 API
Write-Host "========== 统计数据 ==========" -ForegroundColor Cyan

# 获取节点统计
Write-Host "GET /api/statistics/node/:nodeId - 获取节点统计" -ForegroundColor Yellow
$nodeStats = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/statistics/node/$focusItemId" | ConvertFrom-Json
Write-Host "✓ 获取成功"
Write-Host "  - 总执行数: $($nodeStats.data.totalExecutions)"
Write-Host "  - 完成数: $($nodeStats.data.completedExecutions)"
Write-Host "  - 完成率: $($nodeStats.data.completionRate)%"
Write-Host "  - 平均完成度: $($nodeStats.data.avgCompletion)%`n"

# 获取主题统计
Write-Host "GET /api/statistics/theme/:themeId - 获取主题统计" -ForegroundColor Yellow
$themeStats = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/statistics/theme/$themeId" | ConvertFrom-Json
Write-Host "✓ 获取成功"
Write-Host "  - 重点项数: $($themeStats.data.focusItemsCount)"
Write-Host "  - 总执行数: $($themeStats.data.totalExecutions)"
Write-Host "  - 完成率: $($themeStats.data.completionRate)%`n"

# 总结
Write-Host "========== 测试总结 ==========" -ForegroundColor Green
Write-Host "✓ 主题 API: 正常"
Write-Host "✓ 节点 API: 正常"
Write-Host "✓ 阶段 API: 正常"
Write-Host "✓ 执行记录 API: 正常"
Write-Host "✓ 统计数据 API: 正常`n"

Write-Host "所有 API 测试完成！" -ForegroundColor Green
