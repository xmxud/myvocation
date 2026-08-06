import { useState, useEffect } from 'react';

/* ========================================
   SVG ICONS (HUD style: stroke=currentColor, fill=none, strokeWidth=2)
   ======================================== */

function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M12 2L2 22h20L12 2z" />
      <line x1="12" y1="10" x2="12" y2="16" />
      <circle cx="12" cy="19" r="0.5" fill="currentColor" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <circle cx="8" cy="8" r="7" />
      <polyline points="5,8 7,10 11,6" />
    </svg>
  );
}

function UncheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <circle cx="8" cy="8" r="7" />
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

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <line x1="8" y1="3" x2="8" y2="13" />
      <line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <circle cx="8" cy="8" r="7" />
      <polyline points="8,3 8,8 11,9" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M2 2h5l7 7-5 5-7-7V2z" />
      <circle cx="5" cy="5" r="0.8" fill="currentColor" />
    </svg>
  );
}

/* ========================================
   MOCK DATA — 后续替换为 API 调用
   ======================================== */

function getToday() {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date());
}

// 倒计时目标日期
const GAOKAO_DATE = new Date('2027-06-07');
const TINGKOU_DATE = new Date('2026-12-12');

function calcDaysLeft(targetDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = targetDate.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Mock 今日任务清单
const MOCK_TASKS = [
  {
    id: 1,
    subject: '英语',
    priority: '紧急',
    title: '每日词汇小红本5页背诵 + 四会自测',
    estimatedMin: 45,
    completed: false,
    actualMin: null,
    requirement: null,
    tags: [],
    note: '',
  },
  {
    id: 2,
    subject: '英语',
    priority: '常规',
    title: '天学网定制版口语每日演练',
    estimatedMin: 30,
    completed: true,
    actualMin: 30,
    requirement: null,
    tags: ['顺利掌握'],
    note: '口语连读稍生疏',
  },
  {
    id: 3,
    subject: '数学',
    priority: '基础',
    title: '《天利38套》模拟题第1套-限时完成',
    estimatedMin: 120,
    completed: false,
    actualMin: null,
    requirement: '需黑笔作答，红蓝笔改错',
    tags: [],
    note: '',
  },
  {
    id: 4,
    subject: '语文',
    priority: '长效',
    title: '实虚词150词背诵 + 《红楼梦》21-40回精读',
    estimatedMin: 60,
    completed: false,
    actualMin: null,
    requirement: null,
    tags: [],
    note: '',
  },
  {
    id: 5,
    subject: '体育',
    priority: '常规',
    title: '30分钟跑操/有氧慢跑 + 仰卧起坐拉伸',
    estimatedMin: 30,
    completed: false,
    actualMin: null,
    requirement: null,
    tags: [],
    note: '',
  },
];

// 当前阶段攻克焦点
const CURRENT_FOCUS = {
  subject: '英语',
  label: '英语薄弱专项提高',
  reason: '听口倒计时130天，最短板优先突破',
};

/* ========================================
   COMPONENTS
   ======================================== */

function CountdownBar() {
  const [gaokaoDays, setGaokaoDays] = useState(calcDaysLeft(GAOKAO_DATE));
  const [tingkouDays, setTingkouDays] = useState(calcDaysLeft(TINGKOU_DATE));

  useEffect(() => {
    const timer = setInterval(() => {
      setGaokaoDays(calcDaysLeft(GAOKAO_DATE));
      setTingkouDays(calcDaysLeft(TINGKOU_DATE));
    }, 60000); // 每分钟刷新
    return () => clearInterval(timer);
  }, []);

  const englishTasksAllDone = MOCK_TASKS
    .filter((t) => t.subject === '英语')
    .every((t) => t.completed);

  return (
    <div className="dashboard-countdown-bar">
      <div className="countdown-item countdown-gaokao">
        <span className="countdown-icon">🎯</span>
        <span className="countdown-label">高考倒计时</span>
        <span className="countdown-number">{gaokaoDays}</span>
        <span className="countdown-unit">天</span>
      </div>
      <div className="countdown-divider" />
      <div className={`countdown-item countdown-tingkou ${!englishTasksAllDone ? 'countdown-warning' : ''}`}>
        <span className="countdown-icon">{!englishTasksAllDone ? '🔴' : '⏰'}</span>
        <span className="countdown-label">英语听口倒计时</span>
        <span className="countdown-number">{tingkouDays}</span>
        <span className="countdown-unit">天</span>
        {!englishTasksAllDone && (
          <span className="countdown-alert-tag">最短板</span>
        )}
      </div>
      {!englishTasksAllDone && (
        <div className="countdown-alert-text">
          <WarningIcon /> 英语薄弱短板为绝对优先级，必须保障每天听说演练时间
        </div>
      )}
    </div>
  );
}

function ProgressBar({ completedMin, totalMin }) {
  const percent = totalMin > 0 ? Math.min(100, Math.round((completedMin / totalMin) * 100)) : 0;
  const isFull = percent >= 100;

  return (
    <div className="dashboard-progress-section">
      <div className="progress-info">
        <div className="progress-label-row">
          <ClockIcon />
          <span className="progress-label">今日净学习时长</span>
        </div>
        <div className="progress-value">
          <span className="progress-current">{completedMin / 60}</span>
          <span className="progress-sep">/</span>
          <span className="progress-target">{totalMin / 60} h</span>
        </div>
      </div>
      <div className={`progress-track ${isFull ? 'progress-full' : ''}`}>
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="progress-hint">
        {isFull ? (
          <span className="hint-success">🎯 今日自律达标！保持在校作息，远离昼夜颠倒</span>
        ) : (
          <span className="hint-normal">🏫 保持在校作息，避免昼夜颠倒</span>
        )}
      </div>
    </div>
  );
}

function FocusPanel() {
  return (
    <div className="dashboard-focus-panel">
      <div className="focus-header">
        <TargetIcon />
        <span>本周单科破局焦点</span>
      </div>
      <div className="focus-body">
        <span className="focus-star">★</span>
        <span className="focus-subject">{CURRENT_FOCUS.label}</span>
      </div>
      <div className="focus-reason">{CURRENT_FOCUS.reason}</div>
    </div>
  );
}

function QuickConsole() {
  return (
    <div className="dashboard-quick-console">
      <button className="console-btn console-btn-primary">
        <PlusIcon />
        <span>编辑阶段计划</span>
      </button>
      <button className="console-btn console-btn-accent">
        <TimerIcon />
        <span>开启专注计时</span>
      </button>
    </div>
  );
}

function TaskItem({ task, index }) {
  const [showDetail, setShowDetail] = useState(false);

  const priorityClass =
    task.priority === '紧急'
      ? 'task-priority-urgent'
      : task.priority === '基础'
        ? 'task-priority-basic'
        : 'task-priority-normal';

  return (
    <div className={`dash-task-item ${task.completed ? 'task-done' : ''}`}>
      <div className="task-main-row" onClick={() => setShowDetail(!showDetail)}>
        <div className="task-check-icon">
          {task.completed ? <CheckIcon /> : <UncheckIcon />}
        </div>
        <div className="task-content">
          <div className="task-header-row">
            <span className={`task-priority-tag ${priorityClass}`}>
              [{task.subject}-{task.priority}]
            </span>
            <span className="task-title">{task.title}</span>
          </div>
          <div className="task-meta-row">
            <span className="task-estimate">
              {task.completed ? '已执行' : '预计耗时'}：{task.actualMin || task.estimatedMin} 分钟
            </span>
          </div>
        </div>
        <div className="task-action-area" onClick={(e) => e.stopPropagation()}>
          {!task.completed ? (
            <button className="task-checkin-btn" onClick={() => setShowDetail(!showDetail)}>
              进入打卡
            </button>
          ) : (
            <div className="task-completed-info">
              {task.tags.length > 0 && (
                <span className="task-tag">
                  <TagIcon /> {task.tags.join(', ')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 展开详情 */}
      {showDetail && !task.completed && (
        <div className="task-detail-panel">
          {task.requirement && (
            <div className="detail-requirement">
              <span className="req-label">⚠ 要求：</span>
              <span>{task.requirement}</span>
            </div>
          )}
          <div className="detail-actions">
            <button className="checkin-action-btn checkin-declare">
              <CheckIcon /> 确认订正声明
            </button>
            <button className="checkin-action-btn checkin-photo">
              📷 上传练习照片
            </button>
            <button className="checkin-action-btn checkin-submit">
              确认打卡
            </button>
          </div>
          {task.note && (
            <div className="detail-note">
              心得：{task.note}
            </div>
          )}
        </div>
      )}

      {showDetail && task.completed && (
        <div className="task-detail-panel task-detail-done">
          <span className="done-tag">#顺利掌握</span>
          <span className="done-note">心得：{task.note}</span>
        </div>
      )}
    </div>
  );
}

function TaskFilterBar({ activeFilter, onFilterChange }) {
  const filters = [
    { key: 'all', label: '全部' },
    { key: 'english', label: '最薄弱英语' },
    { key: 'pe', label: '体育' },
  ];

  return (
    <div className="task-filter-bar">
      <span className="filter-label">【今日任务清单与执行跟踪】</span>
      <div className="filter-buttons">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`filter-btn ${activeFilter === f.key ? 'filter-active' : ''}`}
            onClick={() => onFilterChange(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ========================================
   MAIN DASHBOARD COMPONENT
   ======================================== */

export default function DashboardPage({ onBack, onNavigate }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [tasks, setTasks] = useState(MOCK_TASKS);

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'english') return t.subject === '英语';
    if (activeFilter === 'pe') return t.subject === '体育';
    return true;
  });

  const completedMin = tasks
    .filter((t) => t.completed)
    .reduce((sum, t) => sum + (t.actualMin || 0), 0);
  const totalMin = tasks.reduce((sum, t) => sum + t.estimatedMin, 0);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="dashboard-page">
      {/* Navigation Header */}
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
            <span className="breadcrumb-item breadcrumb-current">DASHBOARD</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="dashboard-hero">
        <div className="plan-hero-grid tactical-grid"></div>
        <div className="plan-hero-scanline scan-line"></div>
        <div className="plan-hero-content">
          <div className="plan-hero-corner-box">
            <p className="text-caption plan-hero-caption">
              G3-PRO 学习引擎 // PERSONAL COMMAND DASHBOARD
            </p>
            <h1 className="text-display plan-hero-title">高三备考主看板</h1>
            <div className="dashboard-hero-meta">
              <span className="dashboard-date">{getToday()}</span>
              <span className="hero-status">
                <span className="status-dot"></span>
                SYSTEM ACTIVE
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown Bar */}
      <CountdownBar />

      {/* Progress Bar */}
      <ProgressBar completedMin={completedMin} totalMin={totalMin} />

      {/* Focus + Quick Console */}
      <section className="dashboard-control-row">
        <FocusPanel />
        <QuickConsole />
      </section>

      {/* Task List */}
      <section className="dashboard-tasks-section">
        <TaskFilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        {/* 完成进度概览 */}
        <div className="task-summary">
          今日任务：{completedCount} / {totalCount} 已完成
          {totalCount > 0 && `（${Math.round((completedCount / totalCount) * 100)}%）`}
        </div>

        <div className="dash-task-list">
          {filteredTasks.map((task, idx) => (
            <TaskItem key={task.id} task={task} index={idx} />
          ))}
        </div>
      </section>

      {/* Bottom Nav */}
      <section className="dashboard-bottom-nav">
        <button className="dash-nav-btn" onClick={() => onNavigate && onNavigate('plans')}>
          📋 我的规划
        </button>
        <button className="dash-nav-btn dash-nav-btn-active">
          🎯 今日看板
        </button>
        <button className="dash-nav-btn" onClick={() => onNavigate && onNavigate('statistics')}>
          📊 统计分析
        </button>
      </section>

      {/* Footer */}
      <footer className="global-footer" role="contentinfo">
        <div className="footer-accent-line"></div>
        <div className="footer-inner">
          <div className="footer-brand">
            <p className="footer-brand-name">2026 IN MOTION</p>
            <p className="footer-brand-desc">
              G3-PRO 学习引擎 — 高三备考智能追踪系统。
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
