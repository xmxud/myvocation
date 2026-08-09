import { useState, useEffect, useCallback } from 'react';
import { phasesApi } from '../utils/api.js';
import Modal from './Modal.jsx';
import { buildPhaseTree, PHASE_STATUS_LABELS } from '../utils/phaseTree.js';

/* ========================================
   阶段编辑弹窗 — 编辑指定主题下的阶段（phases_v2）
   阶段按 parent_id 组成树展示（大阶段 → 子阶段缩进嵌套）
   支持阶段增删改（含 parent_id / sort_order）与要点（points）的添加/删除
   ======================================== */

const EMPTY_FORM = { title: '', phase_number: '', parent_id: '', start_date: '', end_date: '', status: 'upcoming', sort_order: '' };

export default function ThemePhasesModal({ open, onClose, theme }) {
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // 阶段编辑表单（嵌套弹窗）
  const [formOpen, setFormOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [phaseForm, setPhaseForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  // 各阶段的新要点输入：{ [phaseId]: string }
  const [newPointText, setNewPointText] = useState({});

  const loadPhases = useCallback(async () => {
    if (!theme) return;
    setLoading(true);
    setError('');
    try {
      const data = await phasesApi.getPhasesByNode(theme.id);
      setPhases(data || []);
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [theme]);

  useEffect(() => {
    if (open) loadPhases();
  }, [open, loadPhases]);

  const phaseTree = buildPhaseTree(phases);

  // ── 阶段表单 ──
  const openPhaseForm = (phase = null, parent = null) => {
    if (phase) {
      setEditingPhase(phase);
      setPhaseForm({
        title: phase.title || '',
        phase_number: String(phase.phase_number ?? ''),
        parent_id: phase.parent_id ? String(phase.parent_id) : '',
        start_date: phase.start_date || '',
        end_date: phase.end_date || '',
        status: phase.status || 'upcoming',
        sort_order: phase.sort_order != null ? String(phase.sort_order) : '',
      });
    } else {
      // 新增：自动生成阶段编号（顶层为数量+1，子阶段为 父编号.数量+1）
      let phase_number;
      if (parent) {
        const siblingCount = phases.filter((p) => p.parent_id === parent.id).length;
        phase_number = `${parent.phase_number}.${siblingCount + 1}`;
      } else {
        phase_number = String(phaseTree.length + 1);
      }
      setEditingPhase(null);
      setPhaseForm({ ...EMPTY_FORM, phase_number, parent_id: parent ? String(parent.id) : '' });
    }
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phaseForm.title.trim() || !phaseForm.start_date || !phaseForm.end_date) {
      setFormError('标题、开始日期、结束日期不能为空');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editingPhase) {
        // 后端 PhaseUpdate 不支持修改 parent_id，仅更新以下字段
        await phasesApi.updatePhase(editingPhase.id, {
          phase_number: phaseForm.phase_number.trim() || undefined,
          title: phaseForm.title.trim(),
          start_date: phaseForm.start_date,
          end_date: phaseForm.end_date,
          status: phaseForm.status,
          sort_order: phaseForm.sort_order !== '' ? Number(phaseForm.sort_order) : undefined,
        });
      } else {
        await phasesApi.createPhase({
          node_id: theme.id,
          parent_id: phaseForm.parent_id ? Number(phaseForm.parent_id) : null,
          phase_number: phaseForm.phase_number.trim() || String(phases.length + 1),
          title: phaseForm.title.trim(),
          start_date: phaseForm.start_date,
          end_date: phaseForm.end_date,
          status: phaseForm.status,
        });
      }
      setFormOpen(false);
      await loadPhases();
    } catch (err) {
      setFormError(err.message || '阶段保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (phase) => {
    if (!confirm(`确定删除阶段「${phase.title}」吗？其子阶段与要点将一并删除。`)) return;
    try {
      await phasesApi.deletePhase(phase.id);
      await loadPhases();
    } catch (err) {
      setError(err.message || '删除失败');
    }
  };

  // ── 阶段要点 ──
  const handleAddPoint = async (phaseId) => {
    const text = (newPointText[phaseId] || '').trim();
    if (!text) return;
    try {
      await phasesApi.addPoint(phaseId, { point_type: 'action', content: text });
      setNewPointText((prev) => ({ ...prev, [phaseId]: '' }));
      await loadPhases();
    } catch (err) {
      setError(err.message || '要点添加失败');
    }
  };

  const handleDeletePoint = async (pointId) => {
    try {
      await phasesApi.deletePoint(pointId);
      await loadPhases();
    } catch (err) {
      setError(err.message || '要点删除失败');
    }
  };

  // ── 阶段树渲染（递归） ──
  const renderPhase = (phase, depth = 0) => (
    <div key={phase.id}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 0',
        paddingLeft: depth * 20,
        borderBottom: '1px solid var(--color-border-subtle)',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-accent)', flexShrink: 0 }}>
          {phase.phase_number}
        </span>
        <span style={{ fontWeight: depth === 0 ? 600 : 500, flex: 1, minWidth: 0 }}>{phase.title}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
          {phase.start_date} ~ {phase.end_date}
        </span>
        <span className={`status-badge ${phase.status === 'completed' ? 'status-badge--done' : 'status-badge--active'}`} style={{ flexShrink: 0 }}>
          {PHASE_STATUS_LABELS[phase.status] || phase.status}
        </span>
        <div className="action-buttons" style={{ flexShrink: 0 }}>
          <button className="action-btn" onClick={() => openPhaseForm(phase)} title="编辑阶段">编辑</button>
          <button className="action-btn" onClick={() => openPhaseForm(null, phase)} title="新增子阶段">子阶段</button>
          <button className="action-btn action-btn--danger" onClick={() => handleDelete(phase)} title="删除阶段">删除</button>
        </div>
      </div>
      {/* 要点列表 */}
      <div style={{ paddingLeft: depth * 20 + 20 }}>
        {(phase.points || []).map((point) => (
          <div key={point.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '0.8125rem' }}>
            <span style={{ color: 'var(--color-text-accent)' }}>▸</span>
            <span style={{ flex: 1, minWidth: 0 }}>{point.content}</span>
            <button className="action-btn action-btn--danger" onClick={() => handleDeletePoint(point.id)} title="删除要点">×</button>
          </div>
        ))}
        {/* 添加要点 */}
        <div style={{ display: 'flex', gap: '8px', padding: '6px 0' }}>
          <input
            className="form-input"
            style={{ flex: 1, padding: '6px 10px', fontSize: '0.8125rem' }}
            value={newPointText[phase.id] || ''}
            onChange={(e) => setNewPointText((prev) => ({ ...prev, [phase.id]: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPoint(phase.id); } }}
            placeholder="输入要点，回车添加"
          />
          <button className="action-btn" onClick={() => handleAddPoint(phase.id)}>添加</button>
        </div>
      </div>
      {(phase.children || []).map((child) => renderPhase(child, depth + 1))}
    </div>
  );

  return (
    <>
      <Modal
        title={`阶段管理 — ${theme ? theme.title : ''}`}
        open={open}
        onClose={onClose}
        panelStyle={{ maxWidth: '720px' }}
        footer={
          <>
            <button className="action-btn" onClick={onClose}>关闭</button>
            <button className="cta-button" onClick={() => openPhaseForm()} style={{ padding: '10px 24px', fontSize: '0.8125rem' }}>
              + 新增阶段
            </button>
          </>
        }
      >
        {error && (
          <div style={{ padding: '8px 12px', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--state-error)', fontSize: '0.8125rem' }}>
            {error}
          </div>
        )}
        {loading ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>正在同步阶段数据...</p>
        ) : phaseTree.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>暂无阶段，点击下方「新增阶段」开始</p>
        ) : (
          phaseTree.map((phase) => renderPhase(phase))
        )}
      </Modal>

      {/* ── 阶段新增 / 编辑表单（嵌套弹窗） ── */}
      <Modal
        title={editingPhase ? '编辑阶段' : '新增阶段'}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button className="action-btn" onClick={() => setFormOpen(false)}>取消</button>
            <button className="cta-button" onClick={handleSubmit} disabled={saving}
              style={{ padding: '10px 24px', fontSize: '0.8125rem', opacity: saving ? 0.6 : 1 }}>
              {saving ? '保存中...' : (editingPhase ? '更新' : '创建')}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          {formError && (
            <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--state-error)', fontSize: '0.8125rem' }}>
              {formError}
            </div>
          )}
          <label>
            <span className="form-label">阶段标题 *</span>
            <input className="form-input" value={phaseForm.title}
              onChange={(e) => setPhaseForm({ ...phaseForm, title: e.target.value })}
              placeholder="例如 临界点·破局行动" autoFocus />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label>
              <span className="form-label">阶段编号</span>
              <input className="form-input" value={phaseForm.phase_number}
                onChange={(e) => setPhaseForm({ ...phaseForm, phase_number: e.target.value })}
                placeholder="如 1 或 1.1" />
            </label>
            <label>
              <span className="form-label">父阶段{editingPhase ? '（不可修改）' : ''}</span>
              <select className="filter-select" style={{ width: '100%', padding: '10px 14px' }}
                value={phaseForm.parent_id}
                disabled={!!editingPhase}
                onChange={(e) => setPhaseForm({ ...phaseForm, parent_id: e.target.value })}>
                <option value="">无（顶层阶段）</option>
                {phases.filter((p) => !editingPhase || p.id !== editingPhase.id).map((p) => (
                  <option key={p.id} value={p.id}>{p.phase_number} {p.title}</option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label>
              <span className="form-label">开始日期 *</span>
              <input className="form-input" type="date" value={phaseForm.start_date}
                onChange={(e) => setPhaseForm({ ...phaseForm, start_date: e.target.value })} />
            </label>
            <label>
              <span className="form-label">结束日期 *</span>
              <input className="form-input" type="date" value={phaseForm.end_date}
                onChange={(e) => setPhaseForm({ ...phaseForm, end_date: e.target.value })} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label>
              <span className="form-label">状态</span>
              <select className="filter-select" style={{ width: '100%', padding: '10px 14px' }}
                value={phaseForm.status}
                onChange={(e) => setPhaseForm({ ...phaseForm, status: e.target.value })}>
                <option value="upcoming">即将开始</option>
                <option value="active">进行中</option>
                <option value="completed">已完成</option>
              </select>
            </label>
            <label>
              <span className="form-label">排序（sort_order）</span>
              <input className="form-input" type="number" value={phaseForm.sort_order}
                onChange={(e) => setPhaseForm({ ...phaseForm, sort_order: e.target.value })}
                placeholder="留空默认 0" />
            </label>
          </div>
        </form>
      </Modal>
    </>
  );
}
