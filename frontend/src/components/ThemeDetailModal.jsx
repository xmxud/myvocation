import { useState, useEffect, useCallback } from 'react';
import { themesApi, nodesApi, phasesApi } from '../utils/api.js';
import Modal from './Modal.jsx';
import NodeTree from './NodeTree.jsx';
import { buildPhaseTree, PHASE_STATUS_LABELS } from '../utils/phaseTree.js';

/* ========================================
   主题详情弹窗 — 只读展示
   主题基本信息 + 重点树 + 阶段及要点
   ======================================== */

/* 信息条目：标签 + 值 */
function InfoItem({ label, children }) {
  return (
    <div>
      <p className="form-label" style={{ marginBottom: '4px' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '0.875rem' }}>{children}</p>
    </div>
  );
}

/* 区块标题 */
function SectionTitle({ children }) {
  return (
    <p className="text-label section-label" style={{ margin: '1.25rem 0 0.5rem' }}>{children}</p>
  );
}

export default function ThemeDetailModal({ open, onClose, theme }) {
  const [detail, setDetail] = useState(null);   // 主题基本信息
  const [tree, setTree] = useState(null);       // 重点树
  const [phases, setPhases] = useState([]);     // 阶段（含要点）
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDetail = useCallback(async () => {
    if (!theme) return;
    setLoading(true);
    setError('');
    try {
      const [themeData, treeData, phasesData] = await Promise.all([
        themesApi.getTheme(theme.id),
        nodesApi.getFullTree(theme.id),
        phasesApi.getPhasesByNode(theme.id),
      ]);
      setDetail(themeData);
      setTree(treeData);
      setPhases(phasesData || []);
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [theme]);

  useEffect(() => {
    if (open) loadDetail();
  }, [open, loadDetail]);

  const phaseTree = buildPhaseTree(phases);

  // 阶段树只读渲染（递归，含要点）
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
      </div>
      {(phase.points || []).map((point) => (
        <div key={point.id} style={{ padding: `4px 0 4px ${depth * 20 + 20}px`, fontSize: '0.8125rem' }}>
          <span style={{ color: 'var(--color-text-accent)' }}>▸ </span>{point.content}
        </div>
      ))}
      {(phase.children || []).map((child) => renderPhase(child, depth + 1))}
    </div>
  );

  return (
    <Modal
      title={`主题详情 — ${theme ? theme.title : ''}`}
      open={open}
      onClose={onClose}
      panelStyle={{ maxWidth: '720px' }}
      footer={<button className="action-btn" onClick={onClose}>关闭</button>}
    >
      {error && (
        <div style={{ padding: '8px 12px', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--state-error)', fontSize: '0.8125rem' }}>
          {error}
        </div>
      )}
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>正在同步主题详情...</p>
      ) : (
        <>
          {/* ── 基本信息 ── */}
          {detail && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <InfoItem label="标题">{detail.title}</InfoItem>
              <InfoItem label="代号">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--color-text-accent)' }}>
                  {detail.codename}
                </span>
              </InfoItem>
              <InfoItem label="标签">
                {detail.tag
                  ? <span className="status-badge status-badge--active">{detail.tag}</span>
                  : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
              </InfoItem>
              <InfoItem label="状态">
                <span className={`status-badge ${detail.is_completed ? 'status-badge--done' : 'status-badge--active'}`}>
                  {detail.is_completed ? 'DONE' : 'ACTIVE'}
                </span>
              </InfoItem>
              {detail.description && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <InfoItem label="描述">{detail.description}</InfoItem>
                </div>
              )}
            </div>
          )}

          {/* ── 重点树 ── */}
          <SectionTitle>重点 FOCUS</SectionTitle>
          {!tree || !tree.children || tree.children.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>暂无重点</p>
          ) : (
            <NodeTree node={tree} />
          )}

          {/* ── 阶段及要点 ── */}
          <SectionTitle>阶段 PHASES</SectionTitle>
          {phaseTree.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>暂无阶段</p>
          ) : (
            phaseTree.map((phase) => renderPhase(phase))
          )}
        </>
      )}
    </Modal>
  );
}
