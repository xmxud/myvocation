import { useState, useEffect, useCallback } from 'react';
import { themesApi, nodesApi, executionsApi } from '../src/utils/api.js';

/* ========================================
   DAILY PLAN EDIT PAGE（移动端优先）
   编辑某日（当日或之后）的计划项：增 / 删 / 改 / 上下移动排序
   排序持久化到 daily_executions.sort_order
   ======================================== */

const todayStr = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({ themeId: '', focusId: '', title: '', plannedStart: '', plannedDuration: '' });

// 触屏友好的大按钮
const btnBase = {
  minWidth: 40, minHeight: 36, padding: '6px 10px',
  fontSize: '0.875rem', cursor: 'pointer', flexShrink: 0,
};

export default function DailyPlanEditPage({ onNavigate }) {
  const [date, setDate] = useState(todayStr());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [themes, setThemes] = useState([]);
  const [focusItems, setFocusItems] = useState([]);

  // 新增/编辑表单（editingId 为空=新增模式）
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [moving, setMoving] = useState(false);

  useEffect(() => { themesApi.getThemes(1, 50).then(d => setThemes(d.themes || [])).catch(() => {}); }, []);

  // 表单里选主题后加载其重点项（新增时可选挂到重点项下，看板学科显示更精确）
  useEffect(() => {
    if (form.themeId) {
      nodesApi.getChildren(form.themeId).then(d => setFocusItems(d || [])).catch(() => setFocusItems([]));
    } else {
      setFocusItems([]);
    }
  }, [form.themeId]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const d = await executionsApi.getTodayExecutions(date);
      setTasks(d || []);
    } catch (e) {
      setTasks([]); setError(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  // ── 新增 / 编辑 ──
  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (t) => {
    setEditingId(t.id);
    setForm({
      themeId: '', focusId: '',
      title: t.title || '',
      plannedStart: t.planned_start_time || '',
      plannedDuration: t.planned_duration || '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { alert('请填写计划内容'); return; }
    setSaving(true);
    try {
      if (editingId) {
        // 编辑：只改内容/时间/时长，不改动所属节点
        await executionsApi.updateExecution(editingId, {
          title: form.title.trim(),
          planned_start_time: form.plannedStart || null,
          planned_duration: form.plannedDuration ? Number(form.plannedDuration) : null,
        });
      } else {
        const nodeId = form.focusId || form.themeId;
        if (!nodeId) { alert('请选择所属主题'); setSaving(false); return; }
        await executionsApi.createExecution({
          node_id: Number(nodeId),
          execution_date: date,
          title: form.title.trim(),
          planned_start_time: form.plannedStart || null,
          planned_duration: form.plannedDuration ? Number(form.plannedDuration) : null,
          sort_order: tasks.length ? Math.max(...tasks.map(t => t.sort_order || 0)) + 1 : 1,
        });
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      alert('保存失败: ' + (e.message || e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t) => {
    if (!confirm(`确定删除计划项「${t.title}」？`)) return;
    try {
      await executionsApi.deleteExecution(t.id);
      await load();
    } catch (e) {
      alert('删除失败: ' + (e.message || e));
    }
  };

  // ── 排序：上移/下移，按新位置整体重排 sort_order ──
  const move = async (idx, dir) => {
    if (moving) return;
    const target = idx + dir;
    if (target < 0 || target >= tasks.length) return;
    const next = [...tasks];
    [next[idx], next[target]] = [next[target], next[idx]];
    setTasks(next);
    setMoving(true);
    try {
      await Promise.all(next.map((t, i) =>
        (t.sort_order || 0) !== i + 1
          ? executionsApi.updateExecution(t.id, { sort_order: i + 1 })
          : Promise.resolve()));
      await load();
    } catch (e) {
      alert('排序保存失败: ' + (e.message || e));
      await load();
    } finally {
      setMoving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)' }}>
      {/* 顶部：返回看板 + 标题 + 日期选择 */}
      <nav className="plan-nav-header">
        <div className="nav-scanlines"></div>
        <div className="plan-nav-inner">
          <button className="back-button" onClick={() => onNavigate && onNavigate('dashboard')}>
            <span>← 返回看板</span>
          </button>
          <span className="breadcrumb-current" style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>编辑计划</span>
        </div>
      </nav>

      <div style={{ padding: '80px 1rem 2rem', maxWidth: '40rem', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <h1 className="text-display" style={{ margin: 0, fontSize: '1.25rem', flex: 1 }}>编辑计划</h1>
          <input type="date" className="form-input" style={{ width: 'auto', padding: '8px 12px' }}
            value={date} min={todayStr()}
            onChange={e => setDate(e.target.value || todayStr())} />
        </div>
        <p style={{ margin: '0 0 1rem', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
          仅支持编辑今天及之后的计划；用 ↑ ↓ 调整顺序，序号即执行顺序。
        </p>

        {error && <div style={{ marginBottom: '1rem', color: 'var(--state-error)', fontSize: '0.8125rem' }}>{error}</div>}

        {/* 计划项列表 */}
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {loading ? (
            <div className="drawer-empty">加载中...</div>
          ) : tasks.length === 0 ? (
            <div className="drawer-empty">该日期暂无计划项，点击下方「新增计划项」添加</div>
          ) : (
            tasks.map((t, idx) => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.625rem 0.75rem',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-default)',
                opacity: t.is_done ? 0.6 : 1,
              }}>
                {/* 序号 */}
                <span style={{
                  width: 28, height: 28, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: '0.8125rem',
                  border: '1px solid var(--color-border-primary)', color: 'var(--color-text-accent)',
                }}>{idx + 1}</span>

                {/* 内容 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'pre-wrap' }}>{t.title}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    {t.planned_start_time || '—'}
                    {t.planned_duration ? ` · ${t.planned_duration}min` : ''}
                    {t.is_done ? ' · 已完成' : ''}
                  </div>
                </div>

                {/* 操作：排序 + 编辑 + 删除 */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button className="action-btn" style={btnBase} disabled={idx === 0 || moving}
                    onClick={() => move(idx, -1)} title="上移">↑</button>
                  <button className="action-btn" style={btnBase} disabled={idx === tasks.length - 1 || moving}
                    onClick={() => move(idx, 1)} title="下移">↓</button>
                  <button className="action-btn" style={btnBase} onClick={() => openEdit(t)}>编辑</button>
                  <button className="action-btn action-btn--danger" style={btnBase}
                    onClick={() => handleDelete(t)}>删</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 新增按钮 */}
        <button className="cta-button" style={{ width: '100%', marginTop: '1rem', padding: '12px', fontSize: '0.875rem' }}
          onClick={openCreate}>
          ＋ 新增计划项
        </button>

        {/* 新增/编辑表单（内联面板，移动端友好） */}
        {formOpen && (
          <div style={{
            marginTop: '1rem', padding: '1rem',
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)',
            display: 'grid', gap: '0.75rem',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8125rem', color: 'var(--color-text-accent)' }}>
              {editingId ? '编辑计划项' : '新增计划项'} · {date}
            </div>

            {!editingId && (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <select className="filter-select" style={{ width: '100%', padding: '10px' }}
                  value={form.themeId} onChange={e => setForm({ ...form, themeId: e.target.value, focusId: '' })}>
                  <option value="">选择所属主题 *</option>
                  {themes.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
                {focusItems.length > 0 && (
                  <select className="filter-select" style={{ width: '100%', padding: '10px' }}
                    value={form.focusId} onChange={e => setForm({ ...form, focusId: e.target.value })}>
                    <option value="">（可选）挂到重点项</option>
                    {focusItems.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                  </select>
                )}
              </div>
            )}

            <textarea className="form-input" rows={2} style={{ width: '100%', resize: 'vertical' }}
              placeholder="计划内容，如：数学模拟卷第 2 套 — 限时完成"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                计划开始时间
                <input type="time" className="form-input" style={{ padding: '10px' }}
                  value={form.plannedStart} onChange={e => setForm({ ...form, plannedStart: e.target.value })} />
              </label>
              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                预计时长（分钟）
                <input type="number" min="0" className="form-input" style={{ padding: '10px' }}
                  placeholder="如 60"
                  value={form.plannedDuration} onChange={e => setForm({ ...form, plannedDuration: e.target.value })} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="action-btn" style={{ flex: 1, padding: '10px' }}
                onClick={() => setFormOpen(false)}>取消</button>
              <button className="cta-button" style={{ flex: 2, padding: '10px', fontSize: '0.8125rem' }}
                disabled={saving} onClick={handleSave}>
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
