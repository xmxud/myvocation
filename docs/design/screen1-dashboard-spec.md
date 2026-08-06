# Screen 1：高三备考主看板 — 需求设计与功能逻辑规格

> 版本：2026-08-06  
> 状态：UI 原型已完成，数据为 Mock，待对接后端 API  
> 文件：`frontend/pages/DashboardPage.jsx`

---

## 一、页面整体结构（自上而下）

```
┌─ Navigation Header ──────────────────────────────┐
│  ← 返回   HOME › DASHBOARD                        │
├─ Hero ────────────────────────────────────────────┤
│  高考冲刺行动力表    2026年8月1日 星期一             │
├─ Countdown Bar ───────────────────────────────────┤
│  300天 GAOKAO 2027.06.07  │  130天 LISTENING 短板  │
├─ Phase Bar ───────────────────────────────────────┤
│  阶段规划 › 当前阶段 · 暑假冲刺习惯养成  62% 25天   │
├─ Progress Bar ────────────────────────────────────┤
│  今日净学习时长 0.5h/12h │ 今日待办 5项 得分 14    │
├─ Current Reminder ────────────────────────────────┤
│  当前应做提醒 3项  14:35                            │
│  [英语] 词汇小红本 08:30-09:15  [开始]             │
├─ Task List ───────────────────────────────────────┤
│  今日任务 [重点攻克][全部][英语]... 编辑计划 →      │
│  1/6 已完成 · 17%                                  │
│  ┌─ [英语] URGENT 词汇小红本  08:30-09:15 ────────┐│
│  │  [开始] [打卡]                                   ││
│  └─────────────────────────────────────────────────┘│
├─ Review Section ──────────────────────────────────┤
│  今日复习资料  [今日] [更早资料 →]                  │
│  [全部] [英语] [数学]...                           │
│  掌握程度：☑未掌握 ☑初步理解 ☑已掌握               │
│  ┌─ 英语 天学网口语 评分85 [熟练程度▼] ───────────┐│
│  │  #顺利掌握 口语连读稍生疏                        ││
│  │  [+加入次日计划] [+类似题目/体会]                ││
│  └─────────────────────────────────────────────────┘│
├─ Footer ──────────────────────────────────────────┤
└────────────────────────────────────────────────────┘
```

---

## 二、区域功能详解

### 2.1 Countdown Bar（倒计时双引擎）

| 字段 | 说明 | 数据来源 |
|------|------|----------|
| 高考倒计时 | 目标 2027-06-07，实时天数 | 前端 `calcDaysLeft(GAOKAO_DATE)` |
| 英语听口倒计时 | 目标 2026-12-12，实时天数 | 前端 `calcDaysLeft(TINGKOU_DATE)` |
| 短板预警 | 英语任务未完成→听口红色闪烁+「短板」标签 | `englishWarning` 计算属性 |

**交互**：每分钟自动刷新天数；英语短板触发脉冲动画。

---

### 2.2 Phase Bar（阶段状态条）

| 字段 | 说明 | 数据来源 |
|------|------|----------|
| 阶段规划链接 | 点击跳转计划编辑页 | `onNavigate('plans')` |
| 阶段名称 | 当前阶段标题 | `phase.name` |
| 日期范围 | 起止日期 | `phase.dateRange` |
| 进度% | 完成百分比 | `phase.progressPercent` |
| 剩余天数 | 距结束天数 | `phase.daysLeft` |
| 主攻学科 | 当前核心攻克科目 | `phase.focusSubject` |

**API 占位**：`GET /api/phases/active` → `setPhase(data)`

---

### 2.3 Progress Bar（进度条 — 两列布局）

| 左列 | 右列 |
|------|------|
| 今日净学习时长 | 今日待办 |
| `2.5 h / 12h` | `5` 项待办（琥珀色，可点击跳转任务列表） |
| | `得分 14`（绿色加粗） |
| | mini 进度条（完成%） |

**计算公式**：
- 待办数 = 总任务数 - 已完成数
- 得分 = round(Σ已完成得分 / (任务总数×100) × 100)
- 完成% = round(已完成数 / 总任务数 × 100)

---

### 2.4 Current Reminder（当前应做提醒）

| 逻辑 | 说明 |
|------|------|
| 匹配规则 | `plannedStart ≤ 当前时间` 且未完成 |
| 高亮规则 | `plannedStart ≤ 当前时间 ≤ plannedEnd` → 绿色发光边框 |
| 空状态 | 「暂无应做任务」 |
| 开始/结束 | 点击开始→实时计时→点击结束记录耗时 |

**每个任务项显示**：科目色标、任务名、计划时间、[开始]/[3min 结束]

---

### 2.5 Task List（今日任务列表）

**过滤标签**：`[重点攻克] [全部] [英语] [数学] [语文] [体育] [编辑计划 →]`

| 过滤键 | 逻辑 |
|--------|------|
| 重点攻克 | `priority === '紧急'` |
| 全部 | 不过滤 |
| 学科 | `subject === key` |
| 编辑计划 | `onNavigate('plans')` |

**默认选中**：`重点攻克`

**排序**：紧急 > 基础 > 常规 > 长效

**任务卡片结构**：
```
[科目色标] [优先级] 任务标题
  08:30 — 09:15  预计 45min  [开始] [打卡]
```

**打卡面板（展开）**：

| 字段 | 类型 | API 占位 |
|------|------|----------|
| 实际开始 | `time` 输入 | `recordActualStart(task.id)` |
| 实际结束 | `time` 输入 | `recordActualEnd(task.id)` |
| 执行时间 | `number` 输入 | `submitCheckin(task.id, {actualMin})` |
| 执行评分 | `number` 1-100 | `submitCheckin(task.id, {score})` |
| 积累内容 | `textarea` + 📷上传 | `submitCheckin(task.id, {gains})` / `uploadImage(task.id, 'gains')` |
| 待提高项 | `textarea` + 📷上传 | `submitCheckin(task.id, {improvements})` / `uploadImage(task.id, 'improvements')` |
| 确认订正 | 按钮 | `declareCheckin(task.id)` |
| 上传照片 | 按钮 | `uploadPhoto(task.id)` |
| 确认打卡 | 按钮 | `submitCheckin(task.id, {...})` |
| 归因标签 | 预设按钮 | `addTag(task.id, tag)` |

---

### 2.6 Review Section（今日复习资料）

**标题栏**：`今日复习资料  整理复习重点 · 制定次日计划  [今日] [更早资料 →]`

**科目标签**：`[全部(N)] [英语(N)] [数学(N)] ...` 点击筛选

**掌握程度复选框**（仅选中具体科目时显示）：
```
掌握程度：☑未掌握(红) ☑初步理解(黄) ☑已掌握(绿)
```

**复习项结构**：
```
[科目色标] 任务标题  评分 85  [熟练程度 ▼]
  #顺利掌握
  口语连读稍生疏
  [＋ 加入次日计划] [＋ 类似题目/体会]
```

**数据来源**：已完成且有 `note` 或 `tags` 的任务

**API 占位**：

| 功能 | API |
|------|-----|
| 加载今日复习数据 | 从 tasks 中筛选（本地） |
| 加载更早资料 | `GET /api/review?period=week\|all` → 跳转 review 页 |
| 保存熟练程度 | `PUT /api/review/:taskId/mastery` |
| 加入次日计划 | `POST /api/plans/next-day` |
| 添加类似题目/体会 | `POST /api/review/:taskId/similar` |

---

## 三、数据模型

### 3.1 Task 对象（Mock 结构，对应后端 daily_tasks）

```typescript
interface Task {
  id: number;
  subject: string;           // 学科：英语/数学/语文/物理/化学/生物/体育
  priority: '紧急' | '基础' | '常规' | '长效';
  title: string;             // 任务名称
  estimatedMin: number;      // 预计耗时（分钟）
  plannedStart: string;      // 计划开始 HH:MM
  plannedEnd: string;        // 计划结束 HH:MM
  completed: boolean;        // 是否完成
  actualMin: number | null;  // 实际耗时
  actualStart: string | null;// 实际开始 HH:MM
  actualEnd: string | null;  // 实际结束 HH:MM
  score: number | null;      // 自评分数 1-100
  requirement: string | null;// 打卡要求说明
  tags: string[];            // 归因标签
  note: string;              // 备注/心得
  gains?: string;            // 积累内容（预留）
  improvements?: string;     // 待提高项（预留）
}
```

### 3.2 Phase 对象

```typescript
interface Phase {
  name: string;
  dateRange: string;
  daysLeft: number;
  totalDays: number;
  progressPercent: number;
  focusSubject: string;
  focusLabel: string;
}
```

---

## 四、API 对接清单（TODO）

| 序号 | API 端点 | 方法 | 说明 | 优先级 |
|------|---------|------|------|--------|
| 1 | `/api/daily-tasks?date=today` | GET | 获取今日任务列表 | P0 |
| 2 | `/api/phases/active` | GET | 获取当前激活阶段 | P0 |
| 3 | `/api/tasks/:id/start` | POST | 记录任务实际开始时间 | P1 |
| 4 | `/api/tasks/:id/end` | POST | 记录任务实际结束时间 | P1 |
| 5 | `/api/tasks/:id/checkin` | POST | 提交打卡（含 score/gains/improvements/tags） | P1 |
| 6 | `/api/tasks/:id/declare` | POST | 确认订正声明 | P1 |
| 7 | `/api/tasks/:id/photo` | POST | 上传练习照片 | P2 |
| 8 | `/api/tasks/:id/tag` | POST | 添加归因标签 | P2 |
| 9 | `/api/review/:taskId/mastery` | PUT | 设置复习项掌握程度 | P2 |
| 10 | `/api/review?period=week\|all` | GET | 加载更早期复习资料 | P2 |
| 11 | `/api/plans/next-day` | POST | 将复习项加入次日计划 | P2 |
| 12 | `/api/review/:taskId/similar` | POST | 添加类似题目/复习体会 | P3 |
| 13 | `/api/tasks/:id/image/:field` | POST | 上传积累/待提高项配图 | P3 |

---

## 五、UI 常量

### 5.1 学科色标

```js
SUBJECT_COLORS = {
  英语: { border: '#ef4444', bg: 'rgba(239,68,68,0.1)', text: '#fca5a5' },
  数学: { border: '#3b82f6', ... },
  语文: { border: '#22c55e', ... },
  物理: { border: '#8b5cf6', ... },
  化学: { border: '#f59e0b', ... },
  生物: { border: '#06b6d4', ... },
  体育: { border: '#a3e635', ... },
}
```

### 5.2 优先级

```js
PRIORITY_LABELS = {
  紧急: { color: '#ef4444', label: 'URGENT' },
  基础: { color: '#f59e0b', label: 'BASIC' },
  常规: { color: '#3b82f6', label: 'NORMAL' },
  长效: { color: '#22c55e', label: 'DAILY' },
}
```

---

## 六、组件树

```
DashboardPage
├── CountdownBar          (倒计时)
├── PhaseBar              (阶段状态 + 阶段规划链接)
├── ProgressBar           (进度条两列)
├── CurrentReminder        (当前应做)
│   └── CurrentTaskCard    (提醒任务卡片)
├── TaskList               (任务列表区域)
│   ├── TaskFilterBar      (过滤 + 编辑链接)
│   └── TaskItem           (任务卡片)
│       ├── TaskTimer      (开始/结束按钮)
│       └── TaskCheckinPanel (打卡面板)
└── ReviewSection          (复习区域)
    └── (复习项列表)
```

---

## 七、响应式断点

| 断点 | 适配 |
|------|------|
| >768px | 完整两列布局 |
| ≤768px | 控制行单列、阶段信息竖排 |
| ≤480px | 倒计时竖排、卡片堆叠、打卡按钮全宽 |
