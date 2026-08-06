import { useState, useEffect, useMemo } from 'react';

/* ========================================
   HUD SVG ICONS
   ======================================== */

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M12 2L2 22h20L12 2z" />
      <line x1="12" y1="10" x2="12" y2="16" />
      <circle cx="12" cy="19" r="0.5" fill="currentColor" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
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

function FireIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M12 22c4-3 8-6 8-12a8 8 0 00-16 0c0 6 4 9 8 12z" />
      <path d="M12 22V12" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <rect x="2" y="3" width="12" height="11" rx="1" />
      <line x1="2" y1="7" x2="14" y2="7" />
      <line x1="5" y1="1" x2="5" y2="5" />
      <line x1="11" y1="1" x2="11" y2="5" />
    </svg>
  );
}

/* ========================================
   CONSTANTS & HELPERS
   ======================================== */

const GAOKAO_DATE = new Date('2027-06-07');
const TINGKOU_DATE = new Date('2026-12-12');

function calcDaysLeft(targetDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = targetDate.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function getToday() {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
}

// 学科色标
const SUBJECT_COLORS = {
  '英语': { border: '#ef4444', bg: 'rgba(239,68,68,0.1)', text: '#fca5a5' },
  '数学': { border: '#3b82f6', bg: 'rgba(59,130,246,0.1)', text: '#93c5fd' },
  '语文': { border: '#22c55e', bg: 'rgba(34,197,94,0.1)', text: '#86efac' },
  '物理': { border: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', text: '#c4b5fd' },
  '化学': { border: '#f59e0b', bg: 'rgba(245,158,11,0.1)', text: '#fcd34d' },
  '生物': { border: '#06b6d4', bg: 'rgba(6,182,212,0.1)', text: '#67e8f9' },
  '体育': { border: '#a3e635', bg: 'rgba(163,230,53,0.1)', text: '#bef264' },
};

const PRIORITY_LABELS = {
  '紧急': { color: '#ef4444', label: 'URGENT' },
  '基础': { color: '#f59e0b', label: 'BASIC' },
  '常规': { color: '#3b82f6', label: 'NORMAL' },
  '长效': { color: '#22c55e', label: 'DAILY' },
};

/* ========================================
   MOCK DATA (后续替换为 API)
   ======================================== */

// TODO: 替换为 API — GET /api/daily-tasks?date=today
const DEFAULT_TASKS = [
  { id: 1, subject: '英语', priority: '紧急', title: '每日词汇小红本5页背诵 + 四会自测', estimatedMin: 45, plannedStart: '08:30', plannedEnd: '09:15', completed: false, actualMin: null, actualStart: null, actualEnd: null, score: null, requirement: null, tags: [], note: '' },
  { id: 2, subject: '英语', priority: '常规', title: '天学网定制版口语每日演练', estimatedMin: 30, plannedStart: '10:00', plannedEnd: '10:30', completed: true, actualMin: 30, actualStart: '10:02', actualEnd: '10:28', score: 85, requirement: null, tags: ['顺利掌握'], note: '口语连读稍生疏' },
  { id: 3, subject: '数学', priority: '基础', title: '《天利38套》模拟题第1套 — 限时完成', estimatedMin: 120, plannedStart: '13:15', plannedEnd: '15:15', completed: false, actualMin: null, actualStart: null, actualEnd: null, score: null, requirement: '需黑笔作答，红蓝笔改错', tags: [], note: '' },
  { id: 4, subject: '语文', priority: '长效', title: '实虚词150词背诵 + 《红楼梦》21-40回精读', estimatedMin: 60, plannedStart: '10:45', plannedEnd: '11:45', completed: false, actualMin: null, actualStart: null, actualEnd: null, score: null, requirement: null, tags: [], note: '' },
  { id: 5, subject: '物理', priority: '基础', title: '海淀期末卷 — 力学专项限时训练', estimatedMin: 90, plannedStart: '15:00', plannedEnd: '16:30', completed: false, actualMin: null, actualStart: null, actualEnd: null, score: null, requirement: '限时90分钟，独立完成', tags: [], note: '' },
  { id: 6, subject: '体育', priority: '常规', title: '30分钟跑操/有氧慢跑 + 仰卧起坐拉伸', estimatedMin: 30, plannedStart: '17:00', plannedEnd: '17:30', completed: false, actualMin: null, actualStart: null, actualEnd: null, score: null, requirement: null, tags: [], note: '' },
];

// TODO: 替换为 API — GET /api/phases/by-node/:themeId?status=active
const CURRENT_PHASE = {
  name: '当前阶段 · 暑假冲刺习惯养成',
  dateRange: '2026-08-01 — 2026-08-31',
  daysLeft: 25,
  totalDays: 30,
  progressPercent: 62,
  score:78,
  focusSubject: '补充各科基础/强攻英语',
  focusLabel: '英语薄弱专项提高',
};

/* ========================================
   SUB-COMPONENTS
   ======================================== */

/** 顶部倒计时双引擎 */
function CountdownBar({ gaokaoDays, tingkouDays, englishWarning }) {
  return (
    <div className="dash-countdown">
      {/* 高考 */}
      <div className="dash-countdown-item dash-countdown-gaokao">
        <div className="countdown-ring">
          <span className="countdown-num">{gaokaoDays}</span>
          <span className="countdown-suffix">天</span>
        </div>
        <div className="countdown-info">
          <span className="countdown-name">高考</span>
          <span className="countdown-date">2027.06.07</span>
        </div>
      </div>

      <div className="dash-countdown-divider" />

      {/* 听口 */}
      <div className={`dash-countdown-item dash-countdown-tingkou ${englishWarning ? 'dash-countdown-alert' : ''}`}>
        <div className="countdown-ring">
          <span className="countdown-num">{tingkouDays}</span>
          <span className="countdown-suffix">天</span>
        </div>
        <div className="countdown-info">
          <span className="countdown-name">听口</span>
          <span className="countdown-date">2026.12.12</span>
        </div>
        {englishWarning && <span className="countdown-badge">短板</span>}
      </div>
    </div>
  );
}

/** 阶段状态条 */
function PhaseBar({ phase, onNavigate }) {
  const pct = phase.progressPercent || 0;
  return (
    <div className="dash-phase-bar">
      <div className="dash-phase-header">
        <div className="dash-phase-title-row">
          <CalendarIcon />
          <span className="dash-phase-link" onClick={() => onNavigate && onNavigate('plan-editor')}>阶段规划</span>
          <span className="dash-phase-sep">›</span>
          <span className="dash-phase-name">{phase.name}</span>
          <span className="dash-phase-range">{phase.dateRange}</span>
        </div>
        <div className="dash-phase-stats">
          <div className="dash-phase-stat">
            <span className="dash-phase-stat-val">{pct}%</span>
            <span className="dash-phase-stat-label">进度</span>
          </div>
          <div className="dash-phase-stat">
            <span className="dash-phase-stat-val">{phase.daysLeft}</span>
            <span className="dash-phase-stat-label">剩余天数</span>
          </div>
          <div className="dash-phase-stat">
            <span className="dash-phase-stat-val">{phase.focusSubject}</span>
            <span className="dash-phase-stat-label">主攻学科</span>
          </div>
        </div>
      </div>
      <div className="dash-phase-track">
        <div className="dash-phase-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** 任务完成进度条 */
function ProgressBar({ completedMin, completedCount, totalCount, totalScore }) {
  const taskPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const pendingCount = totalCount - completedCount;

  const scrollToTasks = () => {
    const el = document.getElementById('dash-tasks');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="dash-progress">
      <div className="dash-progress-row">
        <div className="dash-progress-item">
          <div className="dash-progress-item-top">
            <ClockIcon />
            <span className="dash-progress-item-label">今日净学习时长</span>
          </div>
          <div className="dash-progress-item-val">
            <span className="dash-progress-item-num">{(completedMin / 60).toFixed(1)}</span>
            <span className="dash-progress-item-unit">h / 12h</span>
          </div>
        </div>
        <div className="dash-progress-divider" />
        <div className="dash-progress-item">
          <div className="dash-progress-item-top">
            <CheckIcon />
            <span className="dash-progress-item-label">今日待办</span>
          </div>
          <div className="dash-progress-item-val" onClick={scrollToTasks} style={{ cursor: 'pointer' }}>
            <span className="dash-progress-item-num dash-progress-pending">{pendingCount}</span>
            <span className="dash-progress-item-unit">项待办</span>
            {totalScore != null && <span className="dash-progress-score">得分 {totalScore}</span>}
          </div>
          <div className="dash-progress-mini-track">
            <div className="dash-progress-mini-fill" style={{ width: `${taskPct}%` }} />
          </div>
        </div>
      </div>
      <div className="dash-progress-track">
        <div className="dash-progress-fill" style={{ width: `${taskPct}%` }} />
      </div>
      <div className="dash-progress-hint">
        {taskPct >= 100 ? '全部完成' : `还有 ${pendingCount} 项待办`}
      </div>
    </div>
  );
}

function CurrentReminder({ tasks }) {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // 应该已经开始但未完成的任务
  const overdue = tasks.filter((t) =>
    !t.completed && t.plannedStart && t.plannedStart <= currentTime
  );
  const inProgress = overdue.filter((t) => t.plannedEnd && currentTime <= t.plannedEnd);

  return (
    <div className="dash-reminder">
      <div className="dash-reminder-header">
        <ClockIcon />
        <span className="dash-reminder-title">当前应做提醒</span>
        <span className="dash-reminder-count">{overdue.length} 项</span>
        <span className="dash-reminder-now">{currentTime}</span>
      </div>
      {overdue.length === 0 ? (
        <div className="dash-reminder-empty">暂无应做任务</div>
      ) : (
        <div className="dash-reminder-list">
          {overdue.map((task) => (
            <CurrentTaskCard key={task.id} task={task} active={inProgress.some((t) => t.id === task.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function CurrentTaskCard({ task, active }) {
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const sc = SUBJECT_COLORS[task.subject] || SUBJECT_COLORS['英语'];

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 60000));
    }, 1000);
    return () => clearInterval(t);
  }, [running, startTime]);

  const handleStart = () => {
    const now = new Date();
    setStartTime(now);
    setRunning(true);
    // TODO: API — recordActualStart(task.id)
  };

  const handleEnd = () => {
    const endTime = new Date();
    const mins = Math.floor((endTime - startTime) / 60000);
    setRunning(false);
    setElapsed(0);
    // TODO: API — recordActualEnd(task.id, elapsedMin: mins)
  };

  return (
    <div className={`dash-reminder-task ${active ? 'dash-reminder-task-active' : ''}`} style={{ borderLeftColor: sc.border }}>
      <div className="dash-reminder-task-info">
        <span className="dash-reminder-subject" style={{ color: sc.text }}>{task.subject}</span>
        <span className="dash-reminder-task-title">{task.title}</span>
        <span className="dash-reminder-task-time">{task.plannedStart} — {task.plannedEnd}</span>
      </div>
      <div className="dash-reminder-task-actions">
        {running ? (
          <>
            <span className="dash-reminder-elapsed">{elapsed}min</span>
            <button className="dash-reminder-btn dash-reminder-btn-end" onClick={handleEnd}>结束</button>
          </>
        ) : (
          <button className="dash-reminder-btn dash-reminder-btn-start" onClick={handleStart}>开始</button>
        )}
      </div>
    </div>
  );
}

function TaskCheckinPanel({ task, compact }) {
  const [actualStart, setActualStart] = useState('');
  const [actualEnd, setActualEnd] = useState('');
  const [actualMin, setActualMin] = useState('');
  const [score, setScore] = useState('');
  const [gains, setGains] = useState('');
  const [improvements, setImprovements] = useState('');

  return (
    <div className={`dash-checkin ${compact ? 'dash-checkin-compact' : ''}`}>
      {(task.plannedStart || task.plannedEnd) && (
        <div className="dash-checkin-planned">
          计划时间：{task.plannedStart} — {task.plannedEnd}
        </div>
      )}
      <div className="dash-checkin-grid">
        <label className="dash-checkin-field">
          <span>实际开始</span>
          <input type="time" value={actualStart} onChange={(e) => setActualStart(e.target.value)} />
        </label>
        <label className="dash-checkin-field">
          <span>实际结束</span>
          <input type="time" value={actualEnd} onChange={(e) => setActualEnd(e.target.value)} />
        </label>
      </div>
      <div className="dash-checkin-grid">
        <label className="dash-checkin-field">
          <span>执行时间（分钟）</span>
          <input type="number" value={actualMin} onChange={(e) => setActualMin(e.target.value)} placeholder={`预计 ${task.estimatedMin}min`} />
        </label>
        <label className="dash-checkin-field">
          <span>执行评分（1-100）</span>
          <input type="number" min="1" max="100" value={score} onChange={(e) => setScore(e.target.value)} placeholder="自评分数" />
        </label>
      </div>
      <label className="dash-checkin-field">
        <div className="dash-checkin-label-row">
          <span>积累内容</span>
          <button className="dash-checkin-upload" onClick={() => { /* TODO: uploadImage(task.id, 'gains') */ }}>📷 上传图片</button>
        </div>
        <textarea rows="2" value={gains} onChange={(e) => setGains(e.target.value)} placeholder="今天学到了什么、掌握了哪些知识点…" />
      </label>
      <label className="dash-checkin-field">
        <div className="dash-checkin-label-row">
          <span>待提高项</span>
          <button className="dash-checkin-upload" onClick={() => { /* TODO: uploadImage(task.id, 'improvements') */ }}>📷 上传图片</button>
        </div>
        <textarea rows="2" value={improvements} onChange={(e) => setImprovements(e.target.value)} placeholder="哪些地方还需要加强、遇到的困难…" />
      </label>
      <div className="dash-checkin-actions">
        {task.requirement && <div className="dash-task-req"><WarningIcon /> {task.requirement}</div>}
        <button className="dash-task-act" onClick={() => { /* TODO: declareCheckin(task.id) */ }}><CheckIcon /> 确认订正</button>
        <button className="dash-task-act" onClick={() => { /* TODO: uploadPhoto(task.id) */ }}>📷 上传照片</button>
        <button className="dash-task-act dash-task-act-submit" onClick={() => { /* TODO: submitCheckin(task.id, {actualMin,score,gains,improvements}) */ }}>确认打卡</button>
      </div>
      <div className="dash-task-tags-row">
        <span className="dash-task-tags-hint">归因：</span>
        {['顺利掌握', '题目偏难', '概念模糊', '专注度下滑', '审题不清', '计算失误'].map((t) => (
          <button key={t} className="dash-task-tag-btn" onClick={() => { /* TODO: addTag(task.id, t) */ }}>{t}</button>
        ))}
      </div>
    </div>
  );
}

function ReviewSection({ tasks, onNavigate }) {
  const [reviewFilter, setReviewFilter] = useState('all');
  const [masteryFilter, setMasteryFilter] = useState([]); // 多选
  const [mastery, setMastery] = useState({});

  const subjects = ['all', ...new Set(tasks.map((t) => t.subject))];
  const levels = [
    { key: '未掌握', label: '未掌握', color: '#ef4444' },
    { key: '初步理解', label: '初步理解', color: '#f59e0b' },
    { key: '已掌握', label: '已掌握', color: '#22c55e' },
  ];

  const reviewed = tasks.filter((t) => t.completed && (t.note || t.tags.length > 0));
  if (reviewed.length === 0) return null;

  let filtered = reviewFilter === 'all'
    ? reviewed
    : reviewed.filter((t) => t.subject === reviewFilter);

  if (masteryFilter.length > 0) {
    filtered = filtered.filter((t) => masteryFilter.includes(mastery[t.id]));
  }

  const toggleMastery = (key) => {
    setMasteryFilter((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <section className="dash-review-section">
      <div className="dash-review-header">
        <span className="dash-review-title">今日复习资料</span>
        <span className="dash-review-subtitle">整理复习重点 · 制定次日计划</span>
        <div className="dash-review-period">
          <span className="dash-review-period-btn active">今日</span>
          <button className="dash-review-period-btn" onClick={() => onNavigate && onNavigate('review')}>更早资料 →</button>
        </div>
      </div>

      <div className="dash-review-filters">
        <div className="dash-review-filter">
          {subjects.map((s) => {
            const sc = s === 'all' ? { text: '#fff', border: 'rgba(255,255,255,0.3)' } : (SUBJECT_COLORS[s] || SUBJECT_COLORS['英语']);
            const count = s === 'all' ? reviewed.length : reviewed.filter((t) => t.subject === s).length;
            return (
              <button key={s} className={`dash-review-filter-btn ${reviewFilter === s ? 'active' : ''}`}
                style={reviewFilter === s ? { borderColor: sc.border, color: sc.text } : {}}
                onClick={() => setReviewFilter(s)}>
                {s === 'all' ? '全部' : s} ({count})
              </button>
            );
          })}
        </div>

        {reviewFilter !== 'all' && (
          <div className="dash-review-mastery-row">
            <span className="dash-review-mastery-label">掌握程度：</span>
            {levels.map((lv) => (
              <label key={lv.key} className={`dash-review-mastery-cb ${masteryFilter.includes(lv.key) ? 'checked' : ''}`}
                style={masteryFilter.includes(lv.key) ? { borderColor: lv.color, color: lv.color, background: `${lv.color}18` } : {}}>
                <input type="checkbox" checked={masteryFilter.includes(lv.key)} onChange={() => toggleMastery(lv.key)} />
                {lv.label}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="dash-review-list">
        {filtered.length === 0 ? (
          <div className="dash-review-empty">暂无匹配的复习资料</div>
        ) : (
          filtered.map((task) => {
            const sc = SUBJECT_COLORS[task.subject] || SUBJECT_COLORS['英语'];
            const curMastery = mastery[task.id] || '';
            return (
              <div key={task.id} className="dash-review-item" style={{ borderLeftColor: sc.border }}>
                <div className="dash-review-item-head">
                  <span className="dash-review-item-subject" style={{ color: sc.text, borderColor: sc.border }}>{task.subject}</span>
                  <span className="dash-review-item-title">{task.title}</span>
                  {task.score != null && <span className="dash-review-item-score">评分 {task.score}</span>}
                  <select className="dash-review-mastery" value={curMastery}
                    onChange={(e) => setMastery((p) => ({ ...p, [task.id]: e.target.value }))}
                    onClick={(e) => e.stopPropagation()}>
                    <option value="">熟练程度</option>
                    <option value="未掌握">未掌握</option>
                    <option value="初步理解">初步理解</option>
                    <option value="已掌握">已掌握</option>
                  </select>
                </div>
                {task.tags.length > 0 && (
                  <div className="dash-review-item-tags">
                    {task.tags.map((tag, i) => <span key={i} className="dash-review-tag">#{tag}</span>)}
                  </div>
                )}
                {task.note && <div className="dash-review-item-note">{task.note}</div>}
                <div className="dash-review-item-actions">
                  <button className="dash-review-btn" onClick={() => { /* TODO: addToNextPlan(task) */ }}>＋ 加入次日计划</button>
                  <button className="dash-review-btn" onClick={() => { /* TODO: addSimilar(task) */ }}>＋ 类似题目/体会</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function TaskTimer({ task }) {
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 60000)), 1000);
    return () => clearInterval(t);
  }, [running, startTime]);

  const handleStart = (e) => { e.stopPropagation(); setStartTime(Date.now()); setRunning(true); /* TODO: API */ };
  const handleEnd = (e) => { e.stopPropagation(); setRunning(false); setElapsed(0); /* TODO: API */ };

  if (running) return (
    <span className="dash-task-timer dash-task-timer-running" onClick={(e) => e.stopPropagation()}>
      {elapsed}min <button className="dash-timer-end" onClick={handleEnd}>结束</button>
    </span>
  );
  return <button className="dash-task-timer" onClick={handleStart}>开始</button>;
}

/** 任务过滤 */
function TaskFilterBar({ activeFilter, onFilterChange, onNavigate }) {
  const filters = [
    { key: 'urgent', label: '重点攻克' },
    { key: 'all', label: '全部' },
    { key: '英语', label: '英语' },
    { key: '数学', label: '数学' },
    { key: '语文', label: '语文' },
    { key: '体育', label: '体育' },
  ];
  return (
    <div className="dash-filter">
      <span className="dash-filter-label">今日任务</span>
      <div className="dash-filter-btns">
        {filters.map((f) => (
          <button key={f.key} className={`dash-filter-btn ${activeFilter === f.key ? 'active' : ''}`} onClick={() => onFilterChange(f.key)}>
            {f.label}
          </button>
        ))}
        <span className="dash-filter-link" onClick={() => onNavigate && onNavigate('plan-editor')}>编辑计划 →</span>
      </div>
    </div>
  );
}

/** 单项任务卡片 */
function TaskItem({ task }) {
  const [expanded, setExpanded] = useState(false);
  const sc = SUBJECT_COLORS[task.subject] || SUBJECT_COLORS['英语'];
  const pr = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS['常规'];

  return (
    <div className={`dash-task ${task.completed ? 'dash-task-done' : ''}`} style={{ borderLeftColor: task.completed ? 'rgba(255,255,255,0.1)' : sc.border }}>
      {/* 主体行 */}
      <div className="dash-task-row" onClick={() => setExpanded(!expanded)}>
        <div className="dash-task-check">
          {task.completed ? <CheckIcon /> : <UncheckIcon />}
        </div>

        <div className="dash-task-core">
          <div className="dash-task-top">
            <span className="dash-task-subject" style={{ color: sc.text, background: sc.bg, borderColor: sc.border }}>
              {task.subject}
            </span>
            <span className="dash-task-priority" style={{ color: pr.color }}>{pr.label}</span>
            <span className="dash-task-title">{task.title}</span>
          </div>
          <div className="dash-task-meta">
            {(task.plannedStart || task.plannedEnd) && (
              <span className="dash-task-planned">{task.plannedStart} — {task.plannedEnd}</span>
            )}
            <span className="dash-task-time">{task.completed ? `已执行 ${task.actualMin}min` : `预计 ${task.estimatedMin}min`}</span>
            {task.score != null && (
              <span className="dash-task-score" style={{ color: task.score >= 80 ? '#4ade80' : task.score >= 60 ? '#fbbf24' : '#f87171' }}>
                评分 {task.score}
              </span>
            )}
            {task.tags.length > 0 && task.tags.map((t, i) => (
              <span key={i} className="dash-task-tag">#{t}</span>
            ))}
          </div>
        </div>

        <div className="dash-task-action" onClick={(e) => e.stopPropagation()}>
          {!task.completed && (
            <TaskTimer task={task} />
          )}
          {!task.completed ? (
            <button className="dash-task-btn" onClick={() => setExpanded(!expanded)}>
              {expanded ? '收起' : '打卡'}
            </button>
          ) : (
            <span className="dash-task-done-icon">✓</span>
          )}
        </div>
      </div>

      {/* 展开面板 */}
      {expanded && !task.completed && <TaskCheckinPanel task={task} />}

      {expanded && task.completed && (
        <div className="dash-task-panel dash-task-panel-done">
          <span>{task.note || '无备注'}</span>
        </div>
      )}
    </div>
  );
}

/* ========================================
   MAIN COMPONENT
   ======================================== */

export default function DashboardPage({ onBack, onNavigate }) {
  const [gaokaoDays, setGaokaoDays] = useState(calcDaysLeft(GAOKAO_DATE));
  const [tingkouDays, setTingkouDays] = useState(calcDaysLeft(TINGKOU_DATE));
  const [activeFilter, setActiveFilter] = useState('urgent');

  // TODO: 替换为 API 数据源
  // const [tasks, setTasks] = useState([]);
  // const [phase, setPhase] = useState(null);
  // useEffect(() => {
  //   fetch('/api/daily-tasks?date=today').then(r => r.json()).then(d => setTasks(d.data));
  //   fetch('/api/phases/active').then(r => r.json()).then(d => setPhase(d.data));
  // }, []);
  const [tasks] = useState(DEFAULT_TASKS);
  const phase = CURRENT_PHASE;

  // 倒计时每分钟刷新
  useEffect(() => {
    const t = setInterval(() => { setGaokaoDays(calcDaysLeft(GAOKAO_DATE)); setTingkouDays(calcDaysLeft(TINGKOU_DATE)); }, 60000);
    return () => clearInterval(t);
  }, []);

  // 过滤 + 排序：紧急 > 基础 > 常规 > 长效
  const sortedTasks = useMemo(() => {
    const order = { '紧急': 0, '基础': 1, '常规': 2, '长效': 3 };
    let list = [...tasks];
    if (activeFilter === 'urgent') list = list.filter((t) => t.priority === '紧急');
    else if (activeFilter !== 'all') list = list.filter((t) => t.subject === activeFilter);
    list.sort((a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9));
    return list;
  }, [tasks, activeFilter]);

  const completedMin = tasks.filter((t) => t.completed).reduce((s, t) => s + (t.actualMin || 0), 0);
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalScore = tasks.length > 0
    ? Math.round(tasks.filter((t) => t.completed && t.score != null).reduce((s, t) => s + t.score, 0) / (tasks.length * 100) * 100)
    : 0;
  const englishWarning = tasks.filter((t) => t.subject === '英语').some((t) => !t.completed);

  return (
    <div className="dashboard-page">
      {/* Navigation Header */}
      <nav className="plan-nav-header">
        <div className="nav-scanlines"></div>
        <div className="plan-nav-inner">
          <button className="back-button" onClick={onBack}>
            <BackArrowIcon />
            <span>返回</span>
          </button>
          <div className="plan-breadcrumb">
            <span className="breadcrumb-item">HOME</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-item breadcrumb-current">DASHBOARD</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="dashboard-hero">
        <div className="plan-hero-grid tactical-grid"></div>
        <div className="plan-hero-scanline scan-line"></div>
        <div className="plan-hero-content">
          <div className="plan-hero-corner-box">
            <h1 className="text-display plan-hero-title">高考冲刺行动力表</h1>
            <p className="dashboard-date">{getToday()}</p>
          </div>
        </div>
      </section>

      {/* 倒计时双引擎 */}
      <CountdownBar gaokaoDays={gaokaoDays} tingkouDays={tingkouDays} englishWarning={englishWarning} />

      {/* 阶段状态条 */}
      <PhaseBar phase={phase} onNavigate={onNavigate} />

      {/* 进度条 */}
      <ProgressBar completedMin={completedMin} completedCount={completedCount} totalCount={tasks.length} totalScore={totalScore} />

      {/* 当前应做提醒 */}
      <CurrentReminder tasks={tasks} />

      {/* 任务列表 */}
      <section className="dash-tasks-section" id="dash-tasks">
        <TaskFilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} onNavigate={onNavigate} />

        <div className="dash-tasks-summary">
          {completedCount}/{tasks.length} 已完成
          {tasks.length > 0 && ` · ${Math.round((completedCount / tasks.length) * 100)}%`}
          {englishWarning && <span className="dash-tasks-warn"><WarningIcon /> 英语任务未完成</span>}
        </div>

        <div className="dash-tasks-list">
          {sortedTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </section>

      {/* 今日复习区域 */}
      <ReviewSection tasks={tasks} onNavigate={onNavigate} />

      {/* Footer */}
      <footer className="global-footer">
        <div className="footer-accent-line"></div>
        <div className="footer-inner">
          <div className="footer-brand">
            <p className="footer-brand-name">2026 IN MOTION</p>
            <p className="footer-brand-desc">G3-PRO 学习引擎 — 高三备考智能追踪系统</p>
          </div>
          <div className="footer-copyright">&copy; 2026 MY VOCATION. ALL SYSTEMS OPERATIONAL.</div>
        </div>
      </footer>
    </div>
  );
}
