import { useState, useEffect } from 'react';

/* ========================================
   SVG ICONS
   ======================================== */

function BackArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <polyline points="10,3 5,8 10,13" />
      <line x1="5" y1="8" x2="14" y2="8" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M12 2H4a2 2 0 00-2 2v10l6-3 6 3V4a2 2 0 00-2-2z" />
      <line x1="8" y1="6" x2="8" y2="11" />
      <line x1="5" y1="9" x2="11" y2="9" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M11 2l3 3-9 9H2v-3l9-9z" />
      <line x1="9" y1="5" x2="11" y2="7" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M2 4h12" />
      <path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
      <path d="M13 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V4" />
      <line x1="6" y1="7" x2="6" y2="11" />
      <line x1="10" y1="7" x2="10" y2="11" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <line x1="8" y1="2" x2="8" y2="14" />
      <line x1="2" y1="8" x2="14" y2="8" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M8 2v10M4 8l4 4 4-4" />
      <path d="M2 12v2h12v-2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <rect x="3" y="7" width="10" height="7" rx="1" />
      <path d="M5 7V5a3 3 0 016 0v2" />
      <circle cx="8" cy="10" r="0.8" fill="currentColor" />
    </svg>
  );
}

function ActiveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="square">
      <polyline points="2,8 6,13 14,3" />
    </svg>
  );
}

/* ========================================
   CONSTANTS
   ======================================== */

const SUBJECTS = ['英语', '数学', '语文', '物理', '体育'];
const SUBJECT_COLORS = {
  '英语': { border: '#ef4444', bg: 'rgba(239,68,68,0.08)', text: '#fca5a5' },
  '数学': { border: '#3b82f6', bg: 'rgba(59,130,246,0.08)', text: '#93c5fd' },
  '语文': { border: '#22c55e', bg: 'rgba(34,197,94,0.08)', text: '#86efac' },
  '物理': { border: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', text: '#c4b5fd' },
  '体育': { border: '#a3e635', bg: 'rgba(163,230,53,0.08)', text: '#bef264' },
};

const FREQUENCIES = ['每日', '隔日', '周2次', '周3次', '周4次', '周5次', '选择性'];

const PRIORITY_OPTIONS = [
  { value: '紧急', label: '紧急', color: '#ef4444' },
  { value: '基础', label: '基础', color: '#f59e0b' },
  { value: '常规', label: '常规', color: '#3b82f6' },
  { value: '长效', label: '长效', color: '#22c55e' },
];

/** 预设模板 */
const PRESET_TEMPLATES = {
  '英语突破': {
    label: '导入英语突破预设',
    description: '家长会指导：词汇+听口+阅读三线并行',
    subjects: ['英语'],
    tasks: [
      { subject: '英语', title: '词汇小红本每日5页四会背诵', frequency: '每日', estimatedMin: 45, priority: '紧急', requirement: null },
      { subject: '英语', title: '天学网听口套题周3套演练', frequency: '周3次', estimatedMin: 30, priority: '常规', requirement: null },
      { subject: '英语', title: '完型阅读强化演练', frequency: '隔日', estimatedMin: 40, priority: '基础', requirement: null },
    ],
  },
  '数学基础': {
    label: '导入数学基础预设',
    description: '校方推荐：周2套限时模拟+错题回顾',
    subjects: ['数学'],
    tasks: [
      { subject: '数学', title: '《天利38套》模拟题 — 限时完成', frequency: '周2次', estimatedMin: 120, priority: '基础', requirement: '限时2小时，黑笔作答，红蓝笔改错' },
      { subject: '数学', title: '错题本回顾与重做', frequency: '周2次', estimatedMin: 45, priority: '常规', requirement: null },
    ],
  },
  '语文长效': {
    label: '导入语文长效预设',
    description: '文言实词+红楼梦精读，日积月累',
    subjects: ['语文'],
    tasks: [
      { subject: '语文', title: '实虚词150词背诵', frequency: '每日', estimatedMin: 30, priority: '长效', requirement: null },
      { subject: '语文', title: '《红楼梦》21-40回精读', frequency: '每日', estimatedMin: 30, priority: '长效', requirement: null },
    ],
  },
  '体育健康': {
    label: '导入体育健康预设',
    description: '大脑助推器：每周4-6次规律体能',
    subjects: ['体育'],
    tasks: [
      { subject: '体育', title: '30分钟跑操/有氧慢跑', frequency: '每日', estimatedMin: 30, priority: '常规', requirement: null },
      { subject: '体育', title: '仰卧起坐 + 拉伸组合', frequency: '每日', estimatedMin: 15, priority: '常规', requirement: null },
    ],
  },
};

const PRESET_KEYS = Object.keys(PRESET_TEMPLATES);

/* ========================================
   MOCK DATA (后续替换为 API)
   ======================================== */

// TODO: GET /api/phases/:id → phase + tasks
const MOCK_PHASE = {
  id: 1,
  title: '暑假冲刺习惯养成',
  start_date: '2026-08-01',
  end_date: '2026-08-31',
  status: 'active',
  coreSubject: '英语',
  focusLabel: '英语薄弱专项提高',
};

const MOCK_TASKS = [
  { id: 1, subject: '英语', title: '每日词汇小红本5页背诵 + 四会自测', frequency: '每日', estimatedMin: 45, priority: '紧急', requirement: null, templateSource: '英语突破' },
  { id: 2, subject: '英语', title: '天学网定制版口语每日演练', frequency: '每日', estimatedMin: 30, priority: '常规', requirement: null, templateSource: null },
  { id: 3, subject: '数学', title: '《天利38套》模拟题第1套 — 限时完成', frequency: '周2次', estimatedMin: 120, priority: '基础', requirement: '需黑笔作答，红蓝笔改错', templateSource: '数学基础' },
  { id: 4, subject: '语文', title: '实虚词150词背诵 + 《红楼梦》21-40回精读', frequency: '每日', estimatedMin: 60, priority: '长效', requirement: null, templateSource: '语文长效' },
  { id: 5, subject: '物理', title: '海淀期末卷 — 力学专项限时训练', frequency: '周2次', estimatedMin: 90, priority: '基础', requirement: '限时90分钟，独立完成', templateSource: null },
  { id: 6, subject: '体育', title: '30分钟跑操/有氧慢跑 + 仰卧起坐拉伸', frequency: '每日', estimatedMin: 30, priority: '常规', requirement: null, templateSource: '体育健康' },
];

/* ========================================
   MAIN COMPONENT
   ======================================== */

export default function PlanEditorPage({ onBack, onNavigate }) {
  // TODO: 替换为 API
  // const [phase, setPhase] = useState(null);
  // const [tasks, setTasks] = useState([]);
  // useEffect(() => { fetch('/api/phases/:id').then(r => setPhase(...)); }, [])
  const [phase, setPhase] = useState(MOCK_PHASE);
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [saved, setSaved] = useState(false);
  const [showAddForm, setShowAddForm] = useState(null); // subject key or null
  const [selectedTemplate, setSelectedTemplate] = useState(null); // preset key or null
  const [activeSubject, setActiveSubject] = useState('all');

  // 新增表单
  const [newTask, setNewTask] = useState({ subject: '', title: '', frequency: '每日', estimatedMin: 30, priority: '常规', requirement: '' });

  // 编辑
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({});

  // 汇总统计
  const totalDailyMin = tasks.reduce((s, t) => {
    const mul = t.frequency === '每日' ? 1 : t.frequency === '隔日' ? 0.5 : t.frequency === '周2次' ? 2 / 7 : t.frequency === '周3次' ? 3 / 7 : t.frequency === '周4次' ? 4 / 7 : t.frequency === '周5次' ? 5 / 7 : 0;
    return s + Math.round(t.estimatedMin * mul);
  }, 0);

  /** 导入预设模板 */
  const handleImportPreset = (key) => {
    const preset = PRESET_TEMPLATES[key];
    const baseId = Math.max(0, ...tasks.map((t) => t.id)) + 1;
    const newItems = preset.tasks.map((t, i) => ({
      id: baseId + i,
      ...t,
      templateSource: key,
    }));
    setTasks((prev) => [...prev, ...newItems]);
    setSelectedTemplate(null);
    setSaved(false);
  };

  /** 新增任务 */
  const handleAddTask = () => {
    if (!newTask.subject || !newTask.title.trim()) return;
    const item = {
      id: Math.max(0, ...tasks.map((t) => t.id)) + 1,
      subject: newTask.subject,
      title: newTask.title.trim(),
      frequency: newTask.frequency,
      estimatedMin: Number(newTask.estimatedMin) || 30,
      priority: newTask.priority,
      requirement: newTask.requirement.trim() || null,
      templateSource: null,
    };
    setTasks((prev) => [...prev, item]);
    setNewTask({ subject: '', title: '', frequency: '每日', estimatedMin: 30, priority: '常规', requirement: '' });
    setShowAddForm(null);
    setSaved(false);
  };

  /** 删除任务 */
  const handleDelete = (id) => {
    if (!window.confirm('确定移除此任务？')) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSaved(false);
  };

  /** 开始编辑 */
  const startEdit = (task) => {
    setEditingTask(task.id);
    setEditForm({ ...task });
  };

  /** 保存编辑 */
  const saveEdit = () => {
    setTasks((prev) => prev.map((t) => (t.id === editingTask ? { ...editForm, id: t.id } : t)));
    setEditingTask(null);
    setSaved(false);
  };

  /** 取消编辑 */
  const cancelEdit = () => {
    setEditingTask(null);
  };

  /** 保存计划 (预留 API) */
  const handleSave = () => {
    // TODO: API — PUT /api/phases/:id/plan  { phase, tasks }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  /** 激活计划 (预留 API) */
  const handleActivate = () => {
    // TODO: API — PUT /api/phases/:id/activate
    setPhase((p) => ({ ...p, status: 'active' }));
  };

  // 过滤显示
  const filteredTasks = activeSubject === 'all' ? tasks : tasks.filter((t) => t.subject === activeSubject);

  // 按学科分组
  const groupedTasks = {};
  SUBJECTS.filter((s) => activeSubject === 'all' || s === activeSubject).forEach((s) => {
    groupedTasks[s] = tasks.filter((t) => t.subject === s);
  });

  return (
    <div className="plan-editor-page">
      {/* Navigation Header */}
      <nav className="plan-nav-header">
        <div className="nav-scanlines"></div>
        <div className="plan-nav-inner">
          <button className="back-button" onClick={onBack}>
            <BackArrowIcon />
            <span>返回看板</span>
          </button>
          <div className="plan-breadcrumb">
            <span className="breadcrumb-item">HOME</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-item breadcrumb-current">PLAN EDITOR</span>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="plan-editor-header">
        <div className="plan-hero-grid tactical-grid"></div>
        <div className="plan-hero-scanline scan-line"></div>
        <div className="plan-editor-header-content">
          <div className="plan-editor-title-row">
            <h1 className="text-display plan-editor-title">制定阶段复习计划</h1>
            <div className="plan-editor-actions">
              <button className="plan-editor-btn plan-editor-btn-save" onClick={handleSave}>
                <SaveIcon /> {saved ? '已保存 ✓' : '保存计划'}
              </button>
              {phase.status !== 'active' && (
                <button className="plan-editor-btn plan-editor-btn-activate" onClick={handleActivate}>
                  <ActiveIcon /> 激活计划
                </button>
              )}
            </div>
          </div>

          <div className="plan-editor-meta">
            <div className="plan-editor-meta-item">
              <label>阶段名称</label>
              <input type="text" value={phase.title} onChange={(e) => { setPhase((p) => ({ ...p, title: e.target.value })); setSaved(false); }}
                className="plan-editor-meta-input" />
            </div>
            <div className="plan-editor-meta-item">
              <label>时间范围</label>
              <div className="plan-editor-meta-range">
                <input type="date" value={phase.start_date} onChange={(e) => { setPhase((p) => ({ ...p, start_date: e.target.value })); setSaved(false); }} />
                <span>至</span>
                <input type="date" value={phase.end_date} onChange={(e) => { setPhase((p) => ({ ...p, end_date: e.target.value })); setSaved(false); }} />
              </div>
            </div>
            <div className="plan-editor-meta-item">
              <label>核心突破学科</label>
              <select value={phase.coreSubject} onChange={(e) => { setPhase((p) => ({ ...p, coreSubject: e.target.value })); setSaved(false); }}>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 预设模板导入区 */}
      <section className="plan-presets">
        <div className="plan-presets-header">
          <ImportIcon />
          <span className="plan-presets-title">快速导入校方指南模板</span>
          <span className="plan-presets-hint">家长会指导推荐配比 — 点击即可一键添加</span>
        </div>
        <div className="plan-presets-grid">
          {PRESET_KEYS.map((key) => {
            const preset = PRESET_TEMPLATES[key];
            const alreadyImported = tasks.some((t) => t.templateSource === key);
            return (
              <div key={key} className={`plan-preset-card ${alreadyImported ? 'imported' : ''}`}
                onClick={() => !alreadyImported && handleImportPreset(key)}>
                <div className="plan-preset-card-name">{preset.label}</div>
                <div className="plan-preset-card-desc">{preset.description}</div>
                <div className="plan-preset-card-items">
                  {preset.tasks.map((t, i) => (
                    <span key={i} className="plan-preset-card-item">{t.subject} · {t.title} ({t.estimatedMin}min)</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 任务表头 + 过滤 */}
      <section className="plan-tasks-section">
        <div className="plan-tasks-header">
          <span className="plan-tasks-title">任务明细</span>
          <span className="plan-tasks-summary">
            {tasks.length} 项任务 · 日均约 {totalDailyMin} 分钟 · 覆盖 {[...new Set(tasks.map((t) => t.subject))].length} 学科
          </span>
          <div className="plan-tasks-filter">
            <button className={`plan-tasks-filter-btn ${activeSubject === 'all' ? 'active' : ''}`} onClick={() => setActiveSubject('all')}>全部</button>
            {SUBJECTS.map((s) => (
              <button key={s} className={`plan-tasks-filter-btn ${activeSubject === s ? 'active' : ''}`}
                style={activeSubject === s ? { borderColor: SUBJECT_COLORS[s].border, color: SUBJECT_COLORS[s].text } : {}}
                onClick={() => setActiveSubject(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 学科任务表 */}
        <div className="plan-tasks-body">
          {Object.entries(groupedTasks).map(([subj, subjTasks]) => {
            const sc = SUBJECT_COLORS[subj] || SUBJECT_COLORS['英语'];
            if (subjTasks.length === 0 && activeSubject === subj) {
              return (
                <div key={subj} className="plan-subject-group">
                  <div className="plan-subject-group-header" style={{ borderColor: sc.border }}>
                    <span className="plan-subject-group-name" style={{ color: sc.text }}>{subj}</span>
                    <span className="plan-subject-group-count">0 项</span>
                  </div>
                  <div className="plan-subject-empty">暂无此学科任务</div>
                </div>
              );
            }
            if (subjTasks.length === 0) return null;
            const subjDailyMin = subjTasks.reduce((s, t) => {
              const mul = t.frequency === '每日' ? 1 : t.frequency === '隔日' ? 0.5 : t.frequency === '周2次' ? 2 / 7 : t.frequency === '周3次' ? 3 / 7 : t.frequency === '周4次' ? 4 / 7 : t.frequency === '周5次' ? 5 / 7 : 0;
              return s + Math.round(t.estimatedMin * mul);
            }, 0);
            return (
              <div key={subj} className="plan-subject-group">
                <div className="plan-subject-group-header" style={{ borderColor: sc.border }}>
                  <span className="plan-subject-group-name" style={{ color: sc.text }}>{subj}</span>
                  <span className="plan-subject-group-meta">{subjTasks.length} 项 · 日均 {subjDailyMin}min</span>
                </div>
                <div className="plan-task-table">
                  {subjTasks.map((task) => (
                    <div key={task.id} className={`plan-task-row ${editingTask === task.id ? 'editing' : ''}`}>
                      {editingTask === task.id ? (
                        /* 编辑模式 */
                        <div className="plan-task-edit">
                          <input type="text" className="plan-task-edit-title" value={editForm.title}
                            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
                          <select value={editForm.frequency} onChange={(e) => setEditForm((f) => ({ ...f, frequency: e.target.value }))}>
                            {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                          </select>
                          <input type="number" className="plan-task-edit-min" value={editForm.estimatedMin}
                            onChange={(e) => setEditForm((f) => ({ ...f, estimatedMin: Number(e.target.value) }))} />
                          <span>min</span>
                          <select value={editForm.priority} onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}>
                            {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                          <input type="text" className="plan-task-edit-req" placeholder="执行要求（可选）" value={editForm.requirement || ''}
                            onChange={(e) => setEditForm((f) => ({ ...f, requirement: e.target.value }))} />
                          <button className="plan-task-edit-save" onClick={saveEdit}>保存</button>
                          <button className="plan-task-edit-cancel" onClick={cancelEdit}>取消</button>
                        </div>
                      ) : (
                        /* 展示模式 */
                        <div className="plan-task-row-content">
                          <span className="plan-task-num" style={{ color: SUBJECT_COLORS[task.subject].text }}>●</span>
                          <span className="plan-task-title">{task.title}</span>
                          <span className="plan-task-freq">{task.frequency}</span>
                          <span className="plan-task-min">{task.estimatedMin}min</span>
                          <span className="plan-task-priority" style={{ color: PRIORITY_OPTIONS.find((o) => o.value === task.priority)?.color }}>
                            {task.priority}
                          </span>
                          {task.requirement && <span className="plan-task-req" title={task.requirement}><LockIcon /></span>}
                          <div className="plan-task-row-actions">
                            <button className="plan-task-act" onClick={() => startEdit(task)}><EditIcon /></button>
                            <button className="plan-task-act plan-task-act-del" onClick={() => handleDelete(task.id)}><DeleteIcon /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {/* 添加按钮 */}
                  <div className="plan-task-row plan-task-row-add">
                    {showAddForm === subj ? (
                      <div className="plan-task-edit">
                        <input type="text" className="plan-task-edit-title" placeholder="任务名称"
                          value={newTask.title} onChange={(e) => setNewTask((f) => ({ ...f, subject: subj, title: e.target.value }))} />
                        <select value={newTask.frequency} onChange={(e) => setNewTask((f) => ({ ...f, frequency: e.target.value }))}>
                          {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <input type="number" className="plan-task-edit-min" value={newTask.estimatedMin}
                          onChange={(e) => setNewTask((f) => ({ ...f, estimatedMin: Number(e.target.value) }))} />
                        <span>min</span>
                        <select value={newTask.priority} onChange={(e) => setNewTask((f) => ({ ...f, priority: e.target.value }))}>
                          {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <button className="plan-task-edit-save" onClick={handleAddTask}>添加</button>
                        <button className="plan-task-edit-cancel" onClick={() => setShowAddForm(null)}>取消</button>
                      </div>
                    ) : (
                      <button className="plan-task-add-btn" onClick={() => setShowAddForm(subj)}>
                        <PlusIcon /> 添加任务
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 计划统计与闭环 */}
      <section className="plan-stats-section">
        <div className="plan-stats-header">
          <span className="plan-stats-title">计划概览与执行闭环</span>
        </div>
        <div className="plan-stats-grid">
          <div className="plan-stats-card">
            <div className="plan-stats-card-label">任务总数</div>
            <div className="plan-stats-card-val">{tasks.length}</div>
          </div>
          <div className="plan-stats-card">
            <div className="plan-stats-card-label">覆盖学科</div>
            <div className="plan-stats-card-val">{[...new Set(tasks.map((t) => t.subject))].length}</div>
          </div>
          <div className="plan-stats-card">
            <div className="plan-stats-card-label">日均耗时</div>
            <div className="plan-stats-card-val">{totalDailyMin}<span className="plan-stats-card-unit"> min/天</span></div>
          </div>
          <div className="plan-stats-card">
            <div className="plan-stats-card-label">阶段天数</div>
            <div className="plan-stats-card-val">
              {phase.start_date && phase.end_date
                ? Math.max(1, Math.ceil((new Date(phase.end_date) - new Date(phase.start_date)) / 86400000))
                : '—'}
            </div>
          </div>
          <div className="plan-stats-card plan-stats-card-accent">
            <div className="plan-stats-card-label">数据流转</div>
            <div className="plan-stats-card-desc">
              保存计划 → 激活 → 生成每日任务 → 看板执行 → 打卡反馈 → 复习整理 → 迭代优化
            </div>
          </div>
        </div>
      </section>

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
