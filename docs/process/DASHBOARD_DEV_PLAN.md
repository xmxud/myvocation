# 主看板（Dashboard）功能开发计划

主看板 `frontend/pages/DashboardPage.jsx` 当前全部使用 mock 数据（`DEFAULT_TASKS` / `CURRENT_PHASE`），
各交互按钮均为 TODO。本计划将其逐项接入真实后端接口。

## 现状分析

### 可直接复用的接口（后台已存在）
| 功能 | 接口 | 说明 |
|------|------|------|
| 打卡提交 | `PUT /api/daily-executions/{id}` | 支持 is_done / actual_start_time / actual_end_time / duration_minutes / result_score / notes / attachments（TaskExecutionPage 已在用） |
| 新建任务 | `POST /api/daily-executions` | 用于「加入次日计划」 |
| 图片上传 | `POST /api/daily-executions/upload-attachment` | OSS 上传，返回 {key,url,name} |

### 需要新增的接口
| 功能 | 接口 | 说明 |
|------|------|------|
| 今日任务（跨主题） | `GET /api/daily-executions?date=` | 现有列表接口必须带 node_id，看板需要跨全部主题查询；JOIN planning_nodes 取节点标题（学科）和优先级 |
| 当前活跃阶段 | `GET /api/phases/active` | 当天日期落在 start_date~end_date 内的阶段，JOIN 节点取主题标题；需声明在 `/phases/{phase_id}` 之前避免路由冲突 |

### 字段映射（看板任务卡 → daily_executions）
| 看板字段 | 数据字段 |
|----------|----------|
| subject | planning_nodes.title（节点标题） |
| priority | planning_nodes.priority |
| plannedStart / plannedEnd | planned_start_time / +planned_duration 推算 |
| estimatedMin / actualMin | planned_duration / duration_minutes |
| completed | is_done |
| score | result_score |
| note | notes（积累内容 + 待提高项合并写入） |

## 实施步骤

- [x] 1. 编写本计划
- [x] 2. 后端：新增 `GET /api/daily-executions`（跨主题按日期查询）
- [x] 3. 后端：新增 `GET /api/phases/active`（当前活跃阶段）
- [x] 4. 前端 api.js：封装两个新接口
- [x] 5. DashboardPage：真实数据替换 mock（任务列表 + 阶段状态条 + 进度条 + 应做提醒随之自动生效）
- [x] 6. 打卡面板接通：确认打卡（is_done/实际时间/时长/评分/notes）、计时器开始/结束（actual_start_time/actual_end_time）
- [x] 7. 今日回顾「加入次日计划」接通 `POST /api/daily-executions`（execution_date=明天）

## 后续迭代（本次不做，保留 TODO）
- 打卡面板图片上传（接 upload-attachment，写入 attachments JSON）
- 归因标签（积累/待提高的结构化存储，或对接统一标签库）
- 回顾区掌握程度持久化（当前为本地状态）
- 倒计时目标日期可配置（当前硬编码高考 2027-06-07 / 听口 2026-12-12）
