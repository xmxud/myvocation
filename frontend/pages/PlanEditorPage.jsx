import { useState, useEffect, useCallback } from 'react';
import { themesApi, phasesApi } from '../src/utils/api.js';

/* ========================================
   SVG Icons (HUD Style)
   ======================================== */

function BackArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <polyline points="10,3 5,8 10,13" /><line x1="5" y1="8" x2="14" y2="8" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M11 2l3 3-9 9H2v-3l9-9z" /><line x1="9" y1="5" x2="11" y2="7" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M2 4h12" /><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
      <path d="M13 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V4" />
      <line x1="6" y1="7" x2="6" y2="11" /><line x1="10" y1="7" x2="10" y2="11" />
    </svg>
  );
}

/* ========================================
   MAIN COMPONENT
   ======================================== */

export default function PlanEditorPage({ onNavigate, embedded }) {
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);

  // Phase tree navigation stack
  const [navStack, setNavStack] = useState([]); // [{phase}] — breadcrumb
  const [phases, setPhases] = useState([]);
  const [allPhases, setAllPhases] = useState([]); // all phases of theme for child count
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [form, setForm] = useState({
    phase_number: '', title: '', start_date: '', end_date: '',
    description: '', status: 'upcoming',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Points
  const [newPointText, setNewPointText] = useState({});

  useEffect(() => {
    themesApi.getThemes(1, 50).then(d => setThemes(d.themes || [])).catch(() => {});
  }, []);

  const loadPhases = async (themeId) => {
    setLoading(true);
    try {
      const data = await phasesApi.getPhasesByNode(themeId);
      setAllPhases(data || []);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  // Filter phases for current level
  useEffect(() => {
    const currentParentId = navStack.length > 0 ? navStack[navStack.length - 1].id : null;
    setPhases(
      (allPhases || [])
        .filter(p => (currentParentId ? p.parent_id === currentParentId : !p.parent_id))
        .sort((a, b) => String(a.phase_number).localeCompare(String(b.phase_number), undefined, { numeric: true }))
        .map(p => ({
          ...p,
          _childCount: (allPhases || []).filter(c => c.parent_id === p.id).length,
        }))
    );
  }, [allPhases, navStack]);

  const selectTheme = (theme) => {
    setSelectedTheme(theme);
    setNavStack([]);
    loadPhases(theme.id);
  };

  const drillDown = (phase) => {
    setNavStack(prev => [...prev, phase]);
  };

  const goUp = () => {
    setNavStack(prev => prev.slice(0, -1));
  };

  // Phase CRUD
  const openCreate = () => {
    setEditingPhase(null);
    setForm({ phase_number: '', title: '', start_date: '', end_date: '', description: '', status: 'upcoming' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (phase) => {
    setEditingPhase(phase);
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
      const currentParentId = navStack.length > 0 ? navStack[navStack.length - 1].id : null;
      const payload = {
        node_id: selectedTheme.id,
        phase_number: form.phase_number || String(phases.length + 1),
        title: form.title.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        description: form.description.trim(),
        status: form.status,
        ...(currentParentId ? { parent_id: currentParentId } : {}),
      };
      if (editingPhase) {
        await phasesApi.updatePhase(editingPhase.id, payload);
      } else {
        await phasesApi.createPhase(payload);
      }
      setModalOpen(false);
      await loadPhases(selectedTheme.id);
    } catch (e) {
      setFormError(e.message || '保存失败');
    } finally { setSaving(false); }
  };

  const handleDelete = async (phase) => {
    if (!confirm(`确定删除「${phase.title}」吗？`)) return;
    try {
      await phasesApi.deletePhase(phase.id);
      await loadPhases(selectedTheme.id);
    } catch (e) { setError(e.message || '删除失败'); }
  };

  // Points
  const handleAddPoint = async (phaseId) => {
    const text = (newPointText[phaseId] || '').trim();
    if (!text) return;
    try {
      await phasesApi.addPoint(phaseId, { content: text });
      setNewPointText(prev => ({ ...prev, [phaseId]: '' }));
      await loadPhases(selectedTheme.id);
    } catch (e) { setError(e.message || '添加失败'); }
  };

  const handleDeletePoint = async (phaseId, pointId) => {
    try {
      await phasesApi.deletePoint(phaseId, pointId);
      await loadPhases(selectedTheme.id);
    } catch (e) { setError(e.message || '删除失败'); }
  };

  return (
    <div className={embedded ? '' : 'plans-page'}>
      {!embedded && (
        <nav className="plan-nav-header" role="navigation">
          <div className="nav-scanlines"></div>
          <div className="plan-nav-inner">
            <button className="back-button" onClick={() => onNavigate && onNavigate('home')}>
              <BackArrowIcon /><span>返回首页</span>
            </button>
            <span className="breadcrumb-current" style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
              规划编辑
            </span>
          </div>
        </nav>
      )}

      <div style={embedded ? { padding: '0 1.5rem' } : { padding: '80px 1.5rem 0', maxWidth: '72rem', margin: '0 auto' }}>
        {/* ── Theme Cards (horizontal scroll, single row) ── */}
        <section style={{ marginBottom: '2rem' }}>
          <p className="text-label section-label">PLANNING THEMES</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="text-display" style={{ margin: 0 }}>规划主题</h2>
          </div>
          <div style={{
            display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.25rem',
            scrollSnapType: 'x mandatory',
          }}>
            {themes.map(theme => (
              <div key={theme.id}
                className={`theme-card ${selectedTheme?.id === theme.id ? 'selected' : ''} ${theme.is_completed ? 'locked' : ''}`}
                onClick={() => selectTheme(theme)}
                style={{ minWidth: 200, maxWidth: 220, flex: '0 0 auto', cursor: 'pointer', scrollSnapAlign: 'start' }}>
                <p className="theme-codename">{theme.codename}</p>
                <h3 className="theme-name">{theme.title}</h3>
                <div className="theme-status-badge">{selectedTheme?.id === theme.id ? 'SELECTED' : ''}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Phase Timeline ── */}
        {selectedTheme && (
          <section className="plan-section plan-section-alt" style={{ padding: '2rem 1.5rem' }}>
            {/* Header with breadcrumb */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p className="text-label section-label">OPERATIONAL TIMELINE</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 className="text-display" style={{ margin: 0 }}>{selectedTheme.title} 阶段</h2>
                  {navStack.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                        {selectedTheme.title}
                      </span>
                      {navStack.map((p, i) => (
                        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>›</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-text-accent)' }}>
                            {p.title}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {navStack.length > 0 && (
                    <button className="action-btn" onClick={goUp}>
                      <BackArrowIcon /> <span style={{ marginLeft: 4 }}>返回上级</span>
                    </button>
                  )}
                  <button className="cta-button" onClick={openCreate} style={{ padding: '8px 20px', fontSize: '0.8125rem' }}>
                    + 新建阶段
                  </button>
                </div>
              </div>
            </div>

            {error && <p style={{ color: 'var(--state-error)', fontSize: '0.8125rem', marginBottom: '1rem' }}>{error}</p>}

            {/* Timeline */}
            <div className="timeline-container">
              <div className="timeline-axis"></div>
              {loading ? (
                <div className="drawer-empty">加载中...</div>
              ) : phases.length === 0 ? (
                <div className="drawer-empty">
                  {navStack.length > 0 ? '暂无子阶段' : '暂无阶段，点击「新建阶段」开始'}
                </div>
              ) : (
                phases.map(phase => (
                  <div key={phase.id} className={`phase-item ${phase.status === 'active' ? 'phase-active' : ''}`}
                    onClick={() => phase._childCount > 0 && drillDown(phase)}
                    style={{ cursor: phase._childCount > 0 ? 'pointer' : 'default' }}>
                    <div className={`phase-node ${phase.status === 'active' ? 'active' : ''}`} />
                    <div className={`phase-card ${phase.status === 'active' ? 'active' : ''}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <p className="phase-codename text-caption">PHASE {String(phase.phase_number).padStart(2, '0')}</p>
                          <p className="phase-period">{phase.start_date} — {phase.end_date}</p>
                          <h3 className="phase-title">{phase.title}</h3>
                          {phase._childCount > 0 && (
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-text-accent)', marginTop: '0.5rem' }}>
                              ├─ {phase._childCount} 个子阶段 — 点击进入
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                          <button className="theme-action-button" onClick={() => openEdit(phase)} title="编辑"><EditIcon /></button>
                          <button className="theme-action-button theme-action-button-delete" onClick={() => handleDelete(phase)} title="删除"><DeleteIcon /></button>
                        </div>
                      </div>
                      {/* Points */}
                      {phase.points && phase.points.length > 0 && (
                        <ul className="phase-tasks">
                          {phase.points.map((p, i) => (
                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{p.content}</span>
                              <button onClick={(e) => { e.stopPropagation(); handleDeletePoint(phase.id, p.id); }}
                                style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '14px', padding: '0 4px', lineHeight: 1 }}>×</button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }} onClick={e => e.stopPropagation()}>
                        <input value={newPointText[phase.id] || ''}
                          onChange={e => setNewPointText(prev => ({ ...prev, [phase.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && handleAddPoint(phase.id)}
                          placeholder="添加要点..." style={{ flex: 1, padding: '6px 10px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff', fontSize: '0.75rem' }} />
                        <button onClick={() => handleAddPoint(phase.id)}
                          style={{ padding: '6px 12px', border: '1px solid var(--color-border-primary)', background: 'var(--color-primary-subtle)', color: 'var(--color-text-accent)', cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>＋</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingPhase ? '编辑阶段' : '新建阶段'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gap: '0.75rem' }}>
                {formError && <div className="login-error" style={{ marginBottom: 0 }}>{formError}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label><span className="form-label">阶段编号</span>
                    <input className="form-input" value={form.phase_number} onChange={e => setForm({ ...form, phase_number: e.target.value })} placeholder="1 或 1.1" />
                  </label>
                  <label><span className="form-label">状态</span>
                    <select className="filter-select" style={{ width: '100%', padding: '10px 14px' }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="upcoming">即将开始</option><option value="active">进行中</option><option value="completed">已完成</option>
                    </select>
                  </label>
                </div>
                <label><span className="form-label">标题 *</span>
                  <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="阶段标题" autoFocus />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label><span className="form-label">开始日期 *</span>
                    <input className="form-input" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                  </label>
                  <label><span className="form-label">结束日期 *</span>
                    <input className="form-input" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                  </label>
                </div>
                <label><span className="form-label">描述</span>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="阶段描述" rows={2} />
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn" onClick={() => setModalOpen(false)}>取消</button>
                <button type="submit" className="cta-button" disabled={saving} style={{ padding: '10px 24px', fontSize: '0.8125rem' }}>
                  {saving ? '保存中...' : (editingPhase ? '更新' : '创建')}
                </button>
              </div>
            </form>
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
