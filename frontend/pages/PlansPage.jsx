import { useState } from 'react';

/* ========================================
   SVG ICONS (HUD Style: stroke=currentColor, fill=none, strokeWidth=2)
   ======================================== */

function TravelIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <circle cx="24" cy="24" r="18" />
      <path d="M4 24h40" />
      <path d="M24 6c-6 6-6 30 0 36" />
      <path d="M24 6c6 6 6 30 0 36" />
      <circle cx="24" cy="24" r="4" fill="currentColor" />
    </svg>
  );
}

function RobotIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <rect x="10" y="14" width="28" height="24" rx="2" />
      <circle cx="18" cy="24" r="3" fill="currentColor" />
      <circle cx="30" cy="24" r="3" fill="currentColor" />
      <line x1="18" y1="32" x2="30" y2="32" />
      <line x1="24" y1="14" x2="24" y2="8" />
      <circle cx="24" cy="6" r="2" fill="currentColor" />
      <line x1="10" y1="20" x2="4" y2="20" />
      <line x1="38" y1="20" x2="44" y2="20" />
      <line x1="14" y1="38" x2="14" y2="44" />
      <line x1="34" y1="38" x2="34" y2="44" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M24 6c-5 0-9 4-9 9-3 1-5 4-5 7s2 6 5 7c0 4 3 7 7 7 2 0 4-1 5-3 1 2 3 3 5 3 4 0 7-3 7-7 3-1 5-4 5-7s-2-6-5-7c0-5-4-9-9-9-1 0-2 0-3 1-1-1-2-1-3-1z" />
      <line x1="24" y1="12" x2="24" y2="38" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" />
      <circle cx="30" cy="20" r="1.5" fill="currentColor" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M6 8v32l18-6 18 6V8l-18 6L6 8z" />
      <path d="M24 14v26" />
      <line x1="12" y1="16" x2="20" y2="14" />
      <line x1="12" y1="22" x2="20" y2="20" />
    </svg>
  );
}

function MathIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <rect x="6" y="6" width="36" height="36" />
      <line x1="14" y1="18" x2="34" y2="18" />
      <line x1="24" y1="14" x2="24" y2="34" />
      <line x1="14" y1="28" x2="20" y2="28" />
      <line x1="28" y1="28" x2="34" y2="28" />
      <line x1="14" y1="34" x2="20" y2="34" />
      <line x1="28" y1="34" x2="34" y2="34" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <circle cx="24" cy="24" r="18" />
      <ellipse cx="24" cy="24" rx="8" ry="18" />
      <line x1="6" y1="16" x2="42" y2="16" />
      <line x1="6" y1="32" x2="42" y2="32" />
      <line x1="24" y1="6" x2="24" y2="42" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <rect x="4" y="8" width="40" height="32" />
      <line x1="4" y1="16" x2="44" y2="16" />
      <circle cx="10" cy="12" r="1.5" fill="currentColor" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" />
      <circle cx="20" cy="12" r="1.5" fill="currentColor" />
      <polyline points="16,24 20,28 16,32" />
      <polyline points="32,24 28,28 32,32" />
      <line x1="24" y1="22" x2="28" y2="34" />
    </svg>
  );
}

function DumbbellIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <rect x="4" y="18" width="6" height="12" />
      <rect x="38" y="18" width="6" height="12" />
      <rect x="10" y="20" width="4" height="8" />
      <rect x="34" y="20" width="4" height="8" />
      <line x1="14" y1="24" x2="34" y2="24" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M4 10v28l20-6 20 6V10l-20 6L4 10z" />
      <path d="M24 16v22" />
      <path d="M4 10l20 6 20-6" />
    </svg>
  );
}

function GamepadIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M10 16h28a6 6 0 016 6v4a6 6 0 01-6 6h-4l-4-4h-12l-4 4h-4a6 6 0 01-6-6v-4a6 6 0 016-6z" />
      <line x1="14" y1="22" x2="18" y2="22" />
      <line x1="16" y1="20" x2="16" y2="24" />
      <circle cx="32" cy="22" r="1.5" fill="currentColor" />
      <circle cx="36" cy="26" r="1.5" fill="currentColor" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <rect x="10" y="22" width="28" height="20" rx="2" />
      <path d="M16 22v-6a8 8 0 0116 0v6" />
      <circle cx="24" cy="32" r="2" fill="currentColor" />
      <line x1="24" y1="34" x2="24" y2="38" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <polyline points="4,7 10,13 16,7" />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <polyline points="10,3 5,8 10,13" />
      <line x1="5" y1="8" x2="14" y2="8" />
    </svg>
  );
}

/* ========================================
   DATA CONSTANTS
   ======================================== */

const THEMES = [
  { id: 'summer', name: '暑期规划', codename: 'SUMMER OPS', status: 'active' },
  { id: 'autumn', name: '秋季学期', codename: 'AUTUMN TERM', status: 'locked' },
  { id: 'winter', name: '寒假规划', codename: 'WINTER OPS', status: 'locked' },
  { id: 'spring', name: '春季学期', codename: 'SPRING TERM', status: 'locked' },
];

const VACATION_TASKS = [
  { id: 'travel',    name: '暑期旅游',     codename: 'TRAVEL',     icon: <TravelIcon />,    priority: 'high',   activityId: 'travel' },
  { id: 'robot',     name: '制作机器人',   codename: 'ROBOTICS',   icon: <RobotIcon />,     priority: 'high',   activityId: 'robot' },
  { id: 'zhilifang', name: '智力方课题',   codename: 'ZHILIFANG',  icon: <BrainIcon />,     priority: 'high',   activityId: null },
  { id: 'homework',  name: '暑假作业',     codename: 'HOMEWORK',   icon: <BookIcon />,      priority: 'high',   activityId: 'dailylearn' },
  { id: 'math',      name: '数学学习',     codename: 'MATH',       icon: <MathIcon />,      priority: 'medium', activityId: 'dailylearn' },
  { id: 'english',   name: '英语学习',     codename: 'ENGLISH',    icon: <GlobeIcon />,     priority: 'medium', activityId: 'dailylearn' },
  { id: 'aicode',    name: 'AI编程',       codename: 'AI CODE',    icon: <CodeIcon />,      priority: 'medium', activityId: 'dailylearn' },
  { id: 'sports',    name: '运动',         codename: 'SPORTS',     icon: <DumbbellIcon />,  priority: 'medium', activityId: 'sports' },
  { id: 'reading',   name: '阅读',         codename: 'READING',    icon: <BookOpenIcon />,  priority: 'low',    activityId: 'reading' },
  { id: 'gaming',    name: '游戏',         codename: 'GAMING',     icon: <GamepadIcon />,   priority: 'low',    activityId: 'gaming' },
];

const TIMELINE_PHASES = [
  {
    id: 'phase1',
    label: '第一阶段',
    codename: 'PHASE 01',
    period: '7月4日 — 7月25日',
    title: '临界点·破局行动',
    tasks: ['猛攻数学，闭环学习', '英语多听多读', '每日暑假作业', 'AI编程实践', '运动习惯养成'],
    status: 'active',
  },
  {
    id: 'phase2',
    label: '第二阶段',
    codename: 'PHASE 02',
    period: '7月26日 — 8月3日',
    title: '破壁行动·新视界',
    tasks: ['在西昌亲戚参加婚礼', '在昆明体验松弛与慢生活', '在西双版纳沉浸式感受热带雨林', '旅途中坚持阅读和英语学习'],
    status: 'upcoming',
  },
  {
    id: 'phase3',
    label: '第三阶段',
    codename: 'PHASE 03',
    period: '8月5日 — 8月20日',
    title: '满血·重装上阵',
    tasks: ['数学闭环学习，多学多练', '机器人项目收尾', '强化英语学习，准备KET', '持续运动打卡', '作品整理归档'],
    status: 'upcoming',
  },
  {
    id: 'phase4',
    label: '第四阶段',
    codename: 'PHASE 04',
    period: '8月20日 — 8月30日',
    title: '战前整备',
    tasks: ['作业收尾检查', '新学期内容预习', '完成智立方课题', '开学装备准备', '暑期总结复盘'],
    status: 'upcoming',
  },
];

const ACTIVITIES = [
  {
    id: 'dailylearn',
    name: '每日学习生活',
    codename: 'DAILY STUDY',
    icon: <BookIcon />,
    summary: '每日日常学习生活安排',
    details: [
      { label: '早读', value: '每天1小时，8：00-8：30，每日大声朗读语文，英语' },
      { label: '数学', value: '每天1小时，8：30-9：30，每日计算 +课后作业 + 加油包 +温故知新' },
      { label: '英语', value: '每天1小时， 10：00-11：00阅读RAZ 2本 + RE 听读 20分钟 + 背单词4000词打靶15分钟 +睡前故事 ' },
      { label: '作品制作', value: '每天2小时，14：00-16：00 项目实战驱动' },
      { label: '看视频', value: '每天1小时：16：00-17：00 科技博主+语文+历史人文' },
      { label: '玩+运动', value: '每天3小时，上午11点-12点，下午17点-19点' },
      { label: '语文阅读+听英语', value: '每天2小时，早读半小时古文朗读，晚上20点-21:30' },
    ],
  },
  {
    id: 'travel',
    name: '旅游规划',
    codename: 'TRAVEL PLAN',
    icon: <TravelIcon />,
    summary: '目的地探索、行程安排、预算规划',
    details: [
      { label: '目的地', value: '西昌 / 昆明 / 西双版纳' },
      { label: '时间窗口', value: '7月26-8月4日，约8天' },
      { label: '准备事项', value: '攻略查阅、行李清单、车票/酒店预订' },
      { label: '记录方式', value: '拍照 + 旅行日志' },
      { label: '预算', value: '交通、住宿、美食、购物' },
      { label: '具体安排', value: '交通、住宿、美食、购物' },
    ],
  },
  {
    id: 'robot',
    name: '机器人制作',
    codename: 'ROBOTICS PROJECT',
    icon: <RobotIcon />,
    summary: '从零到一搭建可编程机器人项目',
    details: [
      { label: '阶段一', value: '硬件选型、材料采购与清单整理' },
      { label: '阶段二', value: '机械结构组装与基础调试' },
      { label: '阶段三', value: '编程控制、传感器集成与测试' },
      { label: '阶段四', value: '功能演示、文档记录与作品展示' },
    ],
  },
  {
    id: 'sports',
    name: '运动计划',
    codename: 'FITNESS OPS',
    icon: <DumbbellIcon />,
    summary: '保持体能，规律锻炼，增强体质',
    details: [
      { label: '晨跑', value: '每周3-4次，每次30分钟' },
      { label: '球类', value: '每周1-2次足球' },
      { label: '游泳', value: '每周1次，耐力训练' },
      { label: '拳击', value: '每周2次拳击训练' },
    ],
  },
  {
    id: 'reading',
    name: '阅读清单',
    codename: 'READING LIST',
    icon: <BookOpenIcon />,
    summary: '暑期书单规划与阅读进度追踪',
    details: [
      { label: '科技类', value: '《AI未来》《代码大全》选读' },
      { label: '文学类', value: '2-3本经典小说/散文' },
      { label: '方法类', value: '《学习之道》等自我提升书籍' },
      { label: '进度追踪', value: '每周至少读完1本，做读书笔记' },
    ],
  },
  {
    id: 'gaming',
    name: '游戏娱乐',
    codename: 'RECREATION TIME',
    icon: <GamepadIcon />,
    summary: '适度游戏放松，平衡学习与娱乐',
    details: [
      { label: '时间控制', value: '工作日每天不超过30分钟' },
      { label: '周末放宽', value: '周末可适当延长娱乐时间' },
      { label: '游戏选择', value: '策略类 / 动作类 / 独立游戏' },
      { label: '原则', value: '完成每日任务后再进行游戏' },
    ],
  },
];

/* ========================================
   MAIN COMPONENT
   ======================================== */

export default function PlansPage({ onBack }) {
  const [activeTheme, setActiveTheme] = useState('summer');
  const [expandedActivity, setExpandedActivity] = useState(null);

  const toggleActivity = (id) => {
    setExpandedActivity(expandedActivity === id ? null : id);
  };

  const handleTaskClick = (activityId) => {
    if (!activityId) return;
    setExpandedActivity(activityId);
    setTimeout(() => {
      const el = document.getElementById(`activity-${activityId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleThemeClick = (theme) => {
    if (theme.status === 'locked') return;
    setActiveTheme(theme.id);
  };

  const priorityClass = (p) => `task-priority ${p}`;

  return (
    <div className="plans-page">
      {/* Page Navigation Header */}
      <nav className="plan-nav-header" role="navigation" aria-label="页面导航">
        <div className="nav-scanlines"></div>
        <div className="plan-nav-inner">
          <button className="back-button" onClick={onBack}>
            <BackArrowIcon />
            <span>返回指挥中心</span>
          </button>
          <div className="plan-breadcrumb">
            <span className="breadcrumb-item">HOME</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-item">STRATEGIC PLAN</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-item breadcrumb-current">SUMMER OPS</span>
          </div>
        </div>
      </nav>

      {/* Plan Hero Section */}
      <section className="plan-hero">
        <div className="plan-hero-grid tactical-grid"></div>
        <div className="plan-hero-scanline scan-line"></div>
        <div className="plan-hero-content">
          <div className="plan-hero-corner-box">
            <p className="text-caption plan-hero-caption">
              STRATEGIC PLANNING MODULE // 2026 SUMMER
            </p>
            <h1 className="text-display plan-hero-title">我的规划</h1>
            <h2 className="text-heading plan-hero-subtitle">
              MISSION PLANNING &amp; EXECUTION TRACKING
            </h2>
            <div className="hero-status" style={{ marginTop: 'var(--space-6)' }}>
              <span className="status-dot"></span>
              <span>CURRENT THEME: 暑期规划 [ACTIVE]</span>
            </div>

            <div className="plan-stats-bar">
              <div className="stat-item">
                <div className="stat-value">10</div>
                <div className="stat-label">项重点任务</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">4</div>
                <div className="stat-label">个执行阶段</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">6</div>
                <div className="stat-label">项明细规划</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">0%</div>
                <div className="stat-label">完成进度</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Theme Selector */}
      <section className="plan-section plan-section-alt">
        <div className="plan-section-header">
          <p className="text-label section-label">PLANNING THEMES</p>
          <h2 className="text-display section-title">规划主题</h2>
        </div>
        <div className="theme-selector">
          {THEMES.map((theme) => (
            <div
              key={theme.id}
              className={`theme-card ${theme.status} ${activeTheme === theme.id ? 'selected' : ''}`}
              onClick={() => handleThemeClick(theme)}
              title={theme.status === 'locked' ? '敬请期待' : ''}
            >
              {theme.status === 'active' && (
                <div className="theme-status-badge">ACTIVE</div>
              )}
              {theme.status === 'locked' && (
                <>
                  <div className="theme-lock-icon">
                    <svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                      <rect x="10" y="22" width="28" height="20" rx="2" />
                      <path d="M16 22v-6a8 8 0 0116 0v6" />
                      <circle cx="24" cy="32" r="2" fill="currentColor" />
                    </svg>
                  </div>
                  <p className="theme-locked-text">敬请期待</p>
                </>
              )}
              <p className={`theme-codename ${theme.status === 'locked' ? 'locked' : ''}`}>{theme.codename}</p>
              <h3 className={`theme-name ${theme.status === 'locked' ? 'locked' : ''}`}>{theme.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Vacation Focus - 10 Tasks */}
      <section className="plan-section" id="focus-section">
        <div className="plan-section-header">
          <p className="text-label section-label">MISSION PRIORITIES</p>
          <h2 className="text-display section-title">假期重点</h2>
        </div>
        <div className="tasks-grid">
          {VACATION_TASKS.map((task) => (
            <div
              key={task.id}
              className="task-card"
              onClick={() => handleTaskClick(task.activityId)}
              style={{ cursor: task.activityId ? 'pointer' : 'default' }}
            >
              <div className={priorityClass(task.priority)}>
                {task.priority === 'high' ? 'HIGH' : task.priority === 'medium' ? 'MED' : 'LOW'}
              </div>
              <div className="task-icon">{task.icon}</div>
              <h3 className="task-name">{task.name}</h3>
              <p className="task-codename">{task.codename}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline - Phase Planning */}
      <section className="plan-section plan-section-alt">
        <div className="plan-section-header">
          <p className="text-label section-label">OPERATIONAL TIMELINE</p>
          <h2 className="text-display section-title">假期阶段规划</h2>
        </div>
        <div className="timeline-container">
          <div className="timeline-axis"></div>
          {TIMELINE_PHASES.map((phase) => (
            <div key={phase.id} className={`phase-item ${phase.status === 'active' ? 'phase-active' : ''}`}>
              <div className={`phase-node ${phase.status === 'active' ? 'active' : ''}`}></div>
              <div className={`phase-card ${phase.status === 'active' ? 'active' : ''}`}>
                <p className="phase-codename text-caption">{phase.codename}</p>
                <p className="phase-period">{phase.period}</p>
                <h3 className="phase-title">{phase.label} · {phase.title}</h3>
                <ul className="phase-tasks">
                  {phase.tasks.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Activity Details - Accordion */}
      <section className="plan-section" id="activities-section">
        <div className="plan-section-header">
          <p className="text-label section-label">ACTIVITY DETAILS</p>
          <h2 className="text-display section-title">各项活动明细规划</h2>
        </div>
        <div className="activities-list">
          {ACTIVITIES.map((activity) => (
            <div
              key={activity.id}
              id={`activity-${activity.id}`}
              className={`activity-card ${expandedActivity === activity.id ? 'expanded' : ''}`}
            >
              <div
                className="activity-header"
                onClick={() => toggleActivity(activity.id)}
              >
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-info">
                  <div className="activity-name-row">
                    <h3 className="activity-name">{activity.name}</h3>
                    <p className="activity-codename">{activity.codename}</p>
                  </div>
                  <p className="activity-summary">{activity.summary}</p>
                </div>
                <div className="activity-expand-icon">
                  <ChevronDownIcon />
                </div>
              </div>
              <div className="activity-details">
                <div className="activity-details-inner">
                  <div className="details-grid">
                    {activity.details.map((d, i) => (
                      <div key={i} className="detail-item">
                        <span className="detail-label">{d.label}</span>
                        <span className="detail-value">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="plan-footer-cta">
        <button className="cta-button" onClick={onBack}>
          返回指挥中心
        </button>
      </section>

      {/* Page Footer */}
      <footer className="global-footer" role="contentinfo">
        <div className="footer-accent-line"></div>
        <div className="footer-inner">
          <div className="footer-brand">
            <p className="footer-brand-name">2026 IN MOTION</p>
            <p className="footer-brand-desc">
              2026我在行动 — 个人年度指挥中心。<br />规划目标、记录成长、追踪进度、管理生活。
            </p>
          </div>
          <div className="footer-copyright">
            &copy; 2026 MY VOCATION. ALL SYSTEMS OPERATIONAL.
          </div>
        </div>
      </footer>
    </div>
  );
}
