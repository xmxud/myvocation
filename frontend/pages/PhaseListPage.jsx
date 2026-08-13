import { useState, useEffect, useCallback } from 'react';
import { themesApi, phasesApi, nodesApi } from '../src/utils/api.js';

/* ========================================
   PHASE LIST PAGE
   选择一个主题 → 查看/编辑树形阶段列表
   ======================================== */

export default function PhaseListPage({ onNavigate, embedded }) {
  const [themes, setThemes] = useState([]);
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [parentId, setParentId] = useState(null);
  const [form, setForm] = useState({
    phase_number: '', title: '', start_date: '', end_date: '',
    description: '', status: 'upcoming',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // ── Planning Drawer ──
  const [planDrawerOpen, setPlanDrawerOpen] = useState(false);
  const [planPhase, setPlanPhase] = useState(null);
  const [planTab, setPlanTab] = useState('goal');
  const [planItems, setPlanItems] = useState([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [planForm, setPlanForm] = useState({ content: '', extra_data: '', node_id: '' });
  const [editingPlan, setEditingPlan] = useState(null);
  const [focusItems, setFocusItems] = useState([]);

  const openPlanDrawer = async (phase) => {
    setPlanPhase(phase);
    setPlanDrawerOpen(true);
    setPlanTab('goal');
    if (selectedThemeId) {
      try { setFocusItems(await nodesApi.getChildren(selectedThemeId) || []); } catch { setFocusItems([]); }
    }
    await loadPlanItems(phase.id, 'goal');
  };

  const loadPlanItems = async (phaseId, type) => {
    setPlanLoading(true);
    try {
      const data = await phasesApi.getPhase(phaseId);
      const all = data?.points || [];
      setPlanItems(all.filter(p => p.point_type === type));
    } catch { setPlanItems([]); }
    finally { setPlanLoading(false); }
  };

  const switchPlanTab = (type) => {
    setPlanTab(type);
    if (planPhase) loadPlanItems(planPhase.id, type);
  };

  const startAddPlan = () => { setEditingPlan({ _new: true }); setPlanForm({ content: '', extra_data: '', node_id: '' }); };
  const startEditPlan = (item) => { setEditingPlan(item); setPlanForm({ content: item.content || '', extra_data: item.extra_data || '', node_id: item.node_id ? String(item.node_id) : '' }); };
  const cancelPlanEdit = () => { setEditingPlan(null); setPlanForm({ content: '', extra_data: '', node_id: '' }); };

  const savePlan = async () => {
    if (!planForm.content.trim()) return;
    try {
      const payload = { content: planForm.content.trim(), extra_data: planForm.extra_data || null, node_id: planForm.node_id ? Number(planForm.node_id) : null };
      if (editingPlan?.id) {
        await phasesApi.updatePoint(editingPlan.id, payload);
      } else {
        await phasesApi.addPoint(planPhase.id, { ...payload, point_type: planTab });
      }
      cancelPlanEdit();
      await loadPlanItems(planPhase.id, planTab);
    } catch (e) { /* ignore */ }
  };

  const deletePlan = async (item) => {
    if (!confirm('确定删除？')) return;
    try { await phasesApi.deletePoint(item.id); await loadPlanItems(planPhase.id, planTab); } catch (e) { /* ignore */ }
  };

  // Load themes
  useEffect(() => {
    themesApi.getThemes(1, 50).then(d => setThemes(d.themes || [])).catch(() => {});
  }, []);

  // Load phases when theme selected
  const loadPhases = useCallback(async (themeId) => {
    if (!themeId) { setPhases([]); return; }
    setLoading(true);
    try {
      const data = await phasesApi.getPhasesByNode(themeId);
      setPhases(data || []);
    } catch (e) {
      setError(e.message || '加载失败');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (selectedThemeId) loadPhases(selectedThemeId);
  }, [selectedThemeId, loadPhases]);

  // Build tree: parent phases, each with sub-phases
  const phaseTree = phases.filter(p => !p.parent_id);
  const getChildren = (parentId) => phases.filter(p => p.parent_id === parentId);

  // Modal handlers
  const openCreate = (pId = null) => {
    setEditingPhase(null);
    setParentId(pId);
    setForm({ phase_number: '', title: '', start_date: '', end_date: '', description: '', status: 'upcoming' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (phase) => {
    setEditingPhase(phase);
    setParentId(null);
    setForm({
      phase_number: phase.phase_number || '',
      title: phase.title || '',
      start_date: phase.start_date || '',
      end_date: phase.end_date || '',
      description: phase.description || '',
      status: phase.status || 'upcoming',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start_date || !form.end_date) {
      setFormError('标题、开始日期、结束日期为必填');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        node_id: Number(selectedThemeId),
        phase_number: form.phase_number || String(phases.length + 1),
        title: form.title.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        description: form.description.trim(),
        status: form.status,
        ...(parentId ? { parent_id: parentId } : {}),
      };
      if (editingPhase) {
        await phasesApi.updatePhase(editingPhase.id, payload);
      } else {
        await phasesApi.createPhase(payload);
      }
      setModalOpen(false);
      await loadPhases(selectedThemeId);
    } catch (e) {
      setFormError(e.message || '保存失败');
    } finally { setSaving(false); }
  };

  const handleDelete = async (phase) => {
    if (!confirm(`确定删除阶段「${phase.title}」吗？子阶段将一并删除。`)) return;
    try {
      await phasesApi.deletePhase(phase.id);
      await loadPhases(selectedThemeId);
    } catch (e) { setError(e.message || '删除失败'); }
  };

  const selectedTheme = themes.find(t => String(t.id) === String(selectedThemeId));

  const renderPhaseRow = (phase, depth = 0) => {
    const children = getChildren(phase.id);
    return (
      <div key={phase.id}>
        <div className="drawer-item-row" style={{ paddingLeft: `${0.75 + depth * 1.5}rem` }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-text-accent)', flexShrink: 0 }}>
            PHASE {phase.phase_number}
          </span>
          <span className="drawer-item-title" style={{ flex: 2 }}>{phase.title}</span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
            {phase.start_date} → {phase.end_date}
          </span>
          <span className="status-badge status-badge--active" style={{ marginLeft: 8 }}>
            {phase.status === 'active' ? 'ACTIVE' : phase.status === 'completed' ? 'DONE' : 'UPCOMING'}
          </span>
          <div className="drawer-item-actions" style={{ marginLeft: 8 }}>
            <button className="action-btn" onClick={() => openCreate(phase.id)} title="添加子阶段">+子</button>
            <button className="action-btn" onClick={() => openPlanDrawer(phase)}>规划</button>
            <button className="action-btn" onClick={() => openEdit(phase)}>编辑</button>
            <button className="action-btn action-btn--danger" onClick={() => handleDelete(phase)}>删除</button>
          </div>
        </div>
        {children.map(child => renderPhaseRow(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className={embedded ? '' : 'plans-page'}>
      {!embedded && (
        <nav className="plan-nav-header" role="navigation">
          <div className="nav-scanlines"></div>
          <div className="plan-nav-inner">
            <button className="back-button" onClick={() => onNavigate && onNavigate('home')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="10,3 5,8 10,13" /><line x1="5" y1="8" x2="14" y2="8" />
              </svg>
              <span>返回首页</span>
            </button>
            <span className="breadcrumb-current" style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
              阶段规划
            </span>
          </div>
        </nav>
      )}

      <div style={embedded ? { padding: '0 1.5rem' } : { padding: '80px 1.5rem 0', maxWidth: '72rem', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="text-label section-label">PHASE PLANNING</p>
          <h1 className="text-display" style={{ marginBottom: 0 }}>阶段规划</h1>
        </div>

        {/* Theme selector + toolbar */}
        <div className="toolbar" style={{ marginBottom: '1.25rem' }}>
          <div className="toolbar-left">
            <select className="filter-select" style={{ minWidth: 200 }}
              value={selectedThemeId}
              onChange={(e) => setSelectedThemeId(e.target.value)}>
              <option value="">-- 选择主题 --</option>
              {themes.map(t => (
                <option key={t.id} value={t.id}>{t.title} ({t.codename})</option>
              ))}
            </select>
            {error && <span style={{ color: 'var(--state-error)', fontSize: '0.8125rem' }}>{error}</span>}
          </div>
          {selectedThemeId && (
            <button className="cta-button" style={{ padding: '8px 20px', fontSize: '0.8125rem' }}
              onClick={() => openCreate(null)}>
              + 新建阶段
            </button>
          )}
        </div>

        {/* Phase tree */}
        <div style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-default)',
          minHeight: 200,
        }}>
          {!selectedThemeId ? (
            <div className="drawer-empty" style={{ border: 'none' }}>请选择一个主题查看其阶段</div>
          ) : loading ? (
            <div className="drawer-empty" style={{ border: 'none' }}>加载中...</div>
          ) : phaseTree.length === 0 ? (
            <div className="drawer-empty" style={{ border: 'none' }}>
              暂无阶段，点击「新建阶段」开始规划
            </div>
          ) : (
            <div style={{ padding: '0.5rem 0' }}>
              {phaseTree.map(p => renderPhaseRow(p))}
            </div>
          )}
        </div>

        {/* Selected theme summary */}
        {selectedTheme && phases.length > 0 && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            background: 'var(--color-bg-sunken)',
            border: '1px solid var(--color-border-subtle)',
            display: 'flex', gap: '2rem', flexWrap: 'wrap',
            fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)',
          }}>
            <span>总阶段: {phases.length}</span>
            <span>进行中: {phases.filter(p => p.status === 'active').length}</span>
            <span>已完成: {phases.filter(p => p.status === 'completed').length}</span>
            <span>即将开始: {phases.filter(p => p.status === 'upcoming').length}</span>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingPhase ? '编辑阶段' : (parentId ? '添加子阶段' : '新建阶段')}
                {selectedTheme && <span style={{ color: 'var(--color-text-accent)', fontSize: '0.75rem', marginLeft: 8 }}>@{selectedTheme.title}</span>}
              </h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gap: '0.75rem' }}>
                {formError && (
                  <div className="login-error" style={{ marginBottom: 0 }}>{formError}</div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label>
                    <span className="form-label">阶段编号</span>
                    <input className="form-input" value={form.phase_number}
                      onChange={e => setForm({ ...form, phase_number: e.target.value })}
                      placeholder="如 1 或 1.1" />
                  </label>
                  <label>
                    <span className="form-label">状态</span>
                    <select className="filter-select" style={{ width: '100%', padding: '10px 14px' }}
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="upcoming">即将开始</option>
                      <option value="active">进行中</option>
                      <option value="completed">已完成</option>
                    </select>
                  </label>
                </div>
                <label>
                  <span className="form-label">标题 *</span>
                  <input className="form-input" value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="阶段标题" autoFocus />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label>
                    <span className="form-label">开始日期 *</span>
                    <input className="form-input" type="date" value={form.start_date}
                      onChange={e => setForm({ ...form, start_date: e.target.value })} />
                  </label>
                  <label>
                    <span className="form-label">结束日期 *</span>
                    <input className="form-input" type="date" value={form.end_date}
                      onChange={e => setForm({ ...form, end_date: e.target.value })} />
                  </label>
                </div>
                <label>
                  <span className="form-label">描述</span>
                  <textarea className="form-textarea" value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="阶段描述（可选）" rows={2} />
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn" onClick={() => setModalOpen(false)}>取消</button>
                <button type="submit" className="cta-button" disabled={saving}
                  style={{ padding: '10px 24px', fontSize: '0.8125rem', opacity: saving ? 0.6 : 1 }}>
                  {saving ? '保存中...' : (editingPhase ? '更新' : '创建')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Planning Drawer ── */}
      {planDrawerOpen && planPhase && (
        <div className="drawer-overlay" onClick={() => { setPlanDrawerOpen(false); cancelPlanEdit(); }}>
          <div className="drawer-panel" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 className="drawer-title">阶段规划 · {planPhase.title}</h2>
              <button className="drawer-close" onClick={() => { setPlanDrawerOpen(false); cancelPlanEdit(); }}>&times;</button>
            </div>
            <div className="drawer-body">
              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-subtle)', marginBottom: '1rem' }}>
                {[
                  { key: 'goal', label: '阶段目标' },
                  { key: 'checkpoint', label: '检查点' },
                  { key: 'action', label: '行动指南' },
                ].map(t => (
                  <button key={t.key}
                    className="login-tab"
                    style={{
                      color: planTab === t.key ? 'var(--color-text-accent)' : 'var(--color-text-muted)',
                      borderBottom: planTab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                    }}
                    onClick={() => switchPlanTab(t.key)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Add form */}
              {editingPlan && (
                <div style={{ background: 'var(--color-primary-light)', border: '1px solid var(--color-border-primary)', padding: '0.75rem', marginBottom: '1rem' }}>
                  <textarea className="form-textarea" value={planForm.content}
                    onChange={e => setPlanForm({ ...planForm, content: e.target.value })}
                    placeholder={
                      planTab === 'goal' ? '目标内容' :
                      planTab === 'checkpoint' ? '检查项内容' :
                      '行动指南内容'
                    }
                    autoFocus style={{ marginBottom: '0.5rem', minHeight: 80, fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }} rows={4} />
                  <select className="filter-select" style={{ width: '100%', padding: '10px 14px', marginBottom: '0.5rem' }}
                    value={planForm.node_id}
                    onChange={e => setPlanForm({ ...planForm, node_id: e.target.value })}>
                    <option value="">关联重点项（可选）</option>
                    {focusItems.map(fi => (
                      <option key={fi.id} value={fi.id}>{fi.title} ({fi.codename})</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="action-btn" onClick={cancelPlanEdit}>取消</button>
                    <button className="cta-button" onClick={savePlan} style={{ padding: '6px 16px', fontSize: '0.75rem' }}>
                      {editingPlan._new ? '添加' : '保存'}
                    </button>
                  </div>
                </div>
              )}

              <button className="cta-button" onClick={startAddPlan}
                style={{ padding: '6px 16px', fontSize: '0.75rem', marginBottom: '1rem' }}>
                + 添加{planTab === 'goal' ? '目标' : planTab === 'checkpoint' ? '检查点' : '指南'}
              </button>
              <a href="http://localhost:3001/api/phases/template/download" className="action-btn"
                style={{ textDecoration: 'none', marginLeft: '0.5rem' }}>
                📥 下载模板
              </a>
              <label className="action-btn" style={{ cursor: 'pointer', marginLeft: '0.5rem' }}>
                📤 导入Excel
                <input type="file" accept=".xlsx" style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const fd = new FormData();
                    fd.append('file', file);
                    try {
                      const token = localStorage.getItem('token');
                      const res = await fetch(`http://localhost:3001/api/phases/${planPhase.id}/import-excel`, {
                        method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd,
                      });
                      const data = await res.json();
                      alert(data.message || '导入完成');
                      await loadPlanItems(planPhase.id, planTab);
                    } catch (err) { alert('导入失败'); }
                    e.target.value = '';
                  }}
                />
              </label>

              {/* List */}
              {planLoading ? (
                <div className="drawer-empty">加载中...</div>
              ) : planItems.length === 0 ? (
                <div className="drawer-empty">
                  暂无{planTab === 'goal' ? '目标' : planTab === 'checkpoint' ? '检查点' : '行动指南'}
                </div>
              ) : (
                planItems.map(item => {
                  const linked = item.node_id ? focusItems.find(f => f.id === item.node_id) : null;
                  return (
                  <div key={item.id} className="drawer-item-row">
                    <span className="drawer-item-title" style={{ whiteSpace: 'pre-wrap', overflow: 'visible', padding: '0.25rem 0' }}>{item.content}</span>
                    {linked && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-text-accent)', flexShrink: 0, marginRight: '0.5rem' }}>
                      @{linked.title}
                    </span>}
                    <div className="drawer-item-actions">
                      <button className="action-btn" onClick={() => startEditPlan(item)}>编辑</button>
                      <button className="action-btn action-btn--danger" onClick={() => deletePlan(item)}>删除</button>
                    </div>
                  </div>
                )})
              )}
            </div>
          </div>
        </div>
      )}

      {!embedded && (
        <footer className="global-footer" role="contentinfo" style={{ marginTop: '4rem' }}>
          <div className="footer-accent-line"></div>
          <div className="footer-inner">
            <div className="footer-copyright">&copy; 2026 MY VOCATION. ALL SYSTEMS OPERATIONAL.</div>
          </div>
        </footer>
      )}
    </div>
  );
}
