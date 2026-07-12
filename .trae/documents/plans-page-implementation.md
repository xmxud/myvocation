# 我的规划页面实现计划

## 概要

在现有 React + Vite 项目中新增"我的规划"页面，延续三角洲行动军事科技 HUD 风格（黑色 + #00FF66 霓虹绿主题）。第一个主题为"暑期规划"（激活态），同时预留其他学期规划的锁定占位卡片。页面包含三大板块：假期重点（10项任务网格）、假期阶段规划（垂直时间轴）、各项活动明细规划（手风琴可展开卡片）。通过首页"我的规划"卡片点击跳转进入。不引入额外路由库，使用 React 顶层状态做页面切换。

## 当前状态分析

- 项目位于 `d:\shawncodes\myvocation2026\frontend`，React 18 + Vite 5
- 当前无路由库，`App.jsx` 直接渲染 `HomePage`
- `HomePage.jsx` 已有5个 domain-card，其中"我的规划"卡片当前执行页内锚点滚动
- `css/styles.css` 已有完整的 HUD 主题变量体系和首页样式（约1100行）
- 视觉语言：Orbitron 标题字体、JetBrains Mono 等宽标签、角标装饰(::before/::after)、扫描线、战术网格、发光效果

## 拟修改文件清单

### 1. 修改 `src/App.jsx`
- **What**: 增加页面状态管理，条件渲染 HomePage / PlansPage
- **Why**: 不引入 react-router，用 useState 做轻量页面切换
- **How**:
  - 引入 `useState`、`useCallback`
  - 引入 `PlansPage` 组件
  - 状态 `currentPage: 'home' | 'plans'`
  - `navigateTo(page)` 回调：切换页面并 `scrollTo(0,0)`
  - `currentPage === 'plans'` 时渲染 `<PlansPage onBack={() => navigateTo('home')} />`
  - 否则渲染 `<HomePage onNavigate={navigateTo} />`
  - 架构预留后续扩展（learn/works/play/daily）

### 2. 修改 `pages/HomePage.jsx`
- **What**: 让"我的规划"卡片可跳转到规划页面
- **Why**: 实现从首页到规划页的导航
- **How**:
  - 函数签名改为接收 `onNavigate` prop
  - "我的规划" domain-card 的 onClick：判断 `domain.id === 'plans'` 时调用 `onNavigate('plans')`，其他仍执行 `scrollToSection`
  - CTA 按钮"开始行动"改为调用 `onNavigate('plans')`
  - 处理 `onNavigate` 为 undefined 的防御性判断

### 3. 新建 `pages/PlansPage.jsx`
- **What**: 规划页面主组件，包含所有子区块
- **Why**: 核心新页面
- **How**: 组件结构如下（所有子组件内联定义，不拆分文件）：
  - **数据常量**（文件顶部）：
    - `THEMES`: 4个主题（暑期规划[active]、秋季学期[locked]、寒假规划[locked]、春季学期[locked]）
    - `VACATION_TASKS`: 10项假期重点任务（含id、名称、codename、图标、优先级high/medium/low）
    - `TIMELINE_PHASES`: 4个阶段（休整启动期/核心攻坚期/深化巩固期/收心准备期，含时间段、任务列表、状态active/upcoming）
    - `ACTIVITIES`: 6项活动明细（旅游规划、每日学习、机器人制作、运动计划、阅读清单、游戏娱乐，每项含summary和details键值对）
  - **内联SVG图标**（约10个，与首页风格统一：stroke=currentColor, fill=none, strokeWidth=2, strokeLinecap=square, 48x48 viewBox）
  - **组件内部状态**：
    - `activeTheme`: 当前选中主题（默认'summer'）
    - `expandedActivity`: 当前展开的活动ID（手风琴效果，同时只展开一个）
  - **JSX区块**：
    1. **PageNavHeader**：固定顶部导航栏，左侧返回按钮（左箭头SVG+"返回指挥中心"+codename "RETREAT"），右侧面包屑 `HOME > STRATEGIC PLAN > SUMMER OPS`，底部保持渐变发光线
    2. **PlanHero**：页面标题区（暗色背景+战术网格+扫描线+四角装饰），caption "STRATEGIC PLANNING MODULE // 2026 SUMMER"，主标题"我的规划"，副标题"MISSION PLANNING & EXECUTION TRACKING"，状态行（脉冲绿点+CURRENT THEME），小型统计条（10项任务/4个阶段/6项明细/完成度0%）
    3. **ThemeSelector**：横向卡片组，4个主题卡片。激活态：绿色边框+发光+左上角绿条+右上角[ACTIVE]标签；锁定态：opacity 0.45+灰色调+锁图标+"敬请期待"+cursor:not-allowed。响应式：桌面4列/平板2列/手机1列
    4. **VacationFocusSection**：假期重点，Section header "MISSION PRIORITIES / 假期重点"，10项任务网格（桌面5列x2行/平板3列/手机2列）。每个task-card含图标、名称、codename、优先级角标（HIGH绿色/MEDIUM橙色/LOW灰色），hover时边框变绿+微上浮+发光。点击任务卡片可联动滚动到活动明细并展开对应项
    5. **TimelineSection**：阶段规划时间轴，Section header "OPERATIONAL TIMELINE / 假期阶段规划"。中央绿色发光竖线，桌面端4个阶段节点左右交替，手机端全部在右侧。每个phase-card含圆形节点（active实心绿+脉冲动画，upcoming空心绿圈）、阶段标签、codename、时间段（等宽字体）、阶段标题、任务列表（▸前缀绿色箭头）。激活阶段加绿色左边框+亮背景
    6. **ActivityDetailsSection**：活动明细，Section header "ACTIVITY DETAILS / 各项活动明细规划"。手风琴卡片列表，每张activity-card含头部（图标+名称+codename+摘要+展开箭头）和详情区（max-height过渡动画展开/收起）。详情为2列网格（桌面）/1列（手机）的label-value对（label等宽绿色，value常规白色）。展开的卡片加绿色边框+发光，箭头旋转180度
    7. **PlanFooterCTA**：页面底部"返回指挥中心"按钮
  - **交互逻辑**：
    - 手风琴：点击头部切换展开/收起，同时只展开一个
    - 任务联动：点击假期重点任务，通过id映射找到对应活动，展开并滚动到该卡片
    - 锁定主题：点击无反应（not-allowed）
    - 返回按钮：调用 `onBack()` 回调

### 4. 修改 `css/styles.css`
- **What**: 追加规划页所有新样式
- **Why**: 保持单文件CSS约定，与项目一致
- **How**: 在文件末尾追加以下区块，类名统一用 `plan-`/`theme-`/`task-`/`phase-`/`activity-` 前缀避免冲突：
  - `.plans-page` 页面级布局（padding-top:64px为固定导航留空间）
  - `.plan-nav-header` 返回导航栏样式（固定定位、毛玻璃、渐变底线、返回按钮样式、面包屑样式）
  - `.plan-hero` 标题区样式（背景网格/扫描线/角标装饰/统计条）
  - `.plan-section` 通用Section框架（交替背景色：base/elevated，与首页一致）
  - `.theme-selector` / `.theme-card` 主题选择器网格和卡片样式（active/locked两种状态）
  - `.tasks-grid` / `.task-card` 任务网格和卡片样式（优先级标签high/medium/low颜色区分，角标装饰）
  - `.timeline-container` / `.timeline-axis` / `.phase-item` / `.phase-node` / `.phase-card` 时间轴样式（中央轴线、左右交替布局、节点脉冲动画）
  - `.activities-list` / `.activity-card` / `.activity-header` / `.activity-details` / `.details-grid` / `.detail-item` 手风琴活动卡片样式（max-height展开动画、箭头旋转、label-value对）
  - `.plan-footer-cta` 底部CTA区域样式
  - 移动端媒体查询覆盖（导航面包屑隐藏、网格降级为1-2列、时间轴右侧单边布局）
  - 复用现有 `@keyframes pulse-dot` 和 `.tactical-grid`/`.scan-line`/`.status-dot` 等工具类

## 关键决策与假设

1. **不引入路由库**：使用 App 级 useState 做页面切换，刷新会回到首页（已知限制，后续可用 hash 路由解决）
2. **内联所有图标**：不引入图标库，用内联 SVG 保持风格统一
3. **不拆分子组件文件**：PlansPage 内部所有子区块作为函数组件写在同一文件，避免文件碎片
4. **阶段内容**：4个阶段的时间段和任务为合理示例内容（7月上旬到开学），用户可后续自行调整具体日期和任务
5. **活动明细映射**：旅游→travel、数学/英语/AI编程/暑假作业→dailylearn（每日学习）、机器人→robot、运动→sports、阅读→reading、游戏→gaming；智力方课题暂无独立明细卡片（归入核心攻坚阶段描述）
6. **单CSS文件**：所有新样式追加到现有 styles.css，不新建CSS文件
7. **响应式断点**：沿用首页的 768px(md)/1024px(lg) 断点体系
8. **默认展开状态**：活动明细默认全部折叠，用户点击展开

## 验证步骤

1. **构建验证**：`npx vite build` 无报错，产物正常生成
2. **页面跳转**：
   - 首页"我的规划"卡片点击后正确跳转到规划页面
   - 首页 CTA"开始行动"按钮点击后跳转到规划页面
   - 规划页顶部返回按钮和底部返回按钮均能正确返回首页
   - 切换页面时自动滚动到顶部
3. **导航栏**：
   - 固定顶部，背景毛玻璃效果，底部渐变发光线
   - 返回按钮hover有绿色发光效果
   - 移动端面包屑隐藏
4. **主题选择器**：
   - "暑期规划"卡片为激活态（绿色边框+发光+ACTIVE标签）
   - 其他3个主题为锁定态（半透明+锁图标+敬请期待），点击无反应
5. **假期重点网格**：
   - 桌面端5列x2行，10个任务卡片完整显示
   - 每个卡片有图标、名称、英文codename、优先级标签
   - hover效果正常（边框变绿+上浮+发光）
   - 点击有明细的任务卡片能滚动到活动区并展开对应项
6. **时间轴**：
   - 中央绿色竖线贯穿
   - 桌面端阶段卡片左右交替，手机端右侧单边
   - 第一阶段节点为实心绿+脉冲动画（active），其他为空心绿圈
   - 每个阶段的任务列表有绿色▸前缀
7. **活动明细**：
   - 6个活动卡片，点击头部展开/收起
   - 同时只能展开一个卡片
   - 展开动画平滑，展开的卡片绿色边框+发光，箭头旋转180度
   - 详情区label绿色等宽字体，value白色常规字体，桌面2列/手机1列
8. **风格一致性**：
   - 所有角标装饰（左上角绿条、右上角角框、四角装饰）与首页一致
   - 字体（Orbitron/Inter/JetBrains Mono）与首页一致
   - 颜色（#00FF66霓虹绿、各级暗色背景）与首页一致
   - 扫描线、战术网格背景效果正常
9. **响应式**：在手机(375px)、平板(768px)、桌面(1280px+)宽度下布局正常无错位
