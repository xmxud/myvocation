import { useState, useEffect } from 'react';
import { themesApi, phasesApi } from '../src/utils/api.js';

/* ========================================
   PHASE CHECKPOINTS PAGE
   阶段检查点：选择主题 → 阶段，逐行勾选检查点完成情况

   每条检查点记录（phase_points）的 content 按行拆分，每行是一个可勾选的检查项。
   完成情况存于 extra_data JSON：
   {
     "items": { "0": {"is_completed":true,"completed_at":"..."}, ... },  // 行索引 → 完成情况
     "is_completed": bool,        // 派生字段：全部行完成时为 true
     "completed_at": iso|null     // 派生字段：全部完成的时间
   }
   兼容旧数据：无 items 字段时，按旧的整条的 is_completed 视为所有行同状态。
   ======================================== */

// 解析 extra_data JSON，容忍空值/非法 JSON
function parseExtra(raw) {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

// content 按行拆分为检查项（去空白行）
const splitLines = (content) =>
  String(content || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);

// 某一行的完成状态：优先 items[i]，无 items 的旧记录回退到整体 is_completed
function lineState(extra, idx) {
  if (extra.items && typeof extra.items === 'object') {
    const it = extra.items[String(idx)];
    return { done: Boolean(it && it.is_completed), at: (it && it.completed_at) || null };
  }
  return { done: Boolean(extra.is_completed), at: extra.completed_at || null };
}

export default function PhaseCheckpointsPage({ embedded, onNavigate }) {
  const [themes, setThemes] = useState([]);
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [phases, setPhases] = useState([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [togglingKey, setTogglingKey] = useState(null); // `${pointId}:${lineIdx}`

  useEffect(() => { themesApi.getThemes(1, 50).then(d => setThemes(d.themes || [])).catch(() => {}); }, []);

  // 选主题后加载阶段（by-node 接口每个阶段自带 points，检查点直接从本地过滤）
  useEffect(() => {
    if (selectedThemeId) {
      setLoading(true); setError('');
      phasesApi.getPhasesByNode(selectedThemeId)
        .then(d => setPhases(d || []))
        .catch(e => { setPhases([]); setError(e.message || '加载阶段失败'); })
        .finally(() => setLoading(false));
    } else {
      setPhases([]);
    }
    setSelectedPhaseId('');
  }, [selectedThemeId]);

  const selectedPhase = phases.find(p => String(p.id) === String(selectedPhaseId));
  const checkpoints = ((selectedPhase && selectedPhase.points) || [])
    .filter(p => p.point_type === 'checkpoint');

  // 按行统计总进度
  let totalLines = 0;
  let doneLines = 0;
  for (const pt of checkpoints) {
    const extra = parseExtra(pt.extra_data);
    splitLines(pt.content).forEach((_, i) => {
      totalLines += 1;
      if (lineState(extra, i).done) doneLines += 1;
    });
  }

  // 勾选/取消某一行：更新 extra_data.items[lineIdx]，并派生整条记录的 is_completed
  const toggleLine = async (pt, lineIdx) => {
    if (togglingKey) return;
    const extra = parseExtra(pt.extra_data);
    const items = { ...(extra.items || {}) };
    const now = new Date().toISOString();
    const done = !lineState(extra, lineIdx).done;
    items[String(lineIdx)] = { is_completed: done, completed_at: done ? now : null };

    const lines = splitLines(pt.content);
    const allDone = lines.length > 0 && lines.every((_, i) =>
      (items[String(i)] && items[String(i)].is_completed) || (!extra.items && extra.is_completed && items[String(i)] === undefined));
    const newExtraRaw = JSON.stringify({
      ...extra,
      items,
      is_completed: allDone,
      completed_at: allDone ? now : null,
    });

    const key = `${pt.id}:${lineIdx}`;
    setTogglingKey(key);
    try {
      await phasesApi.updatePoint(pt.id, { extra_data: newExtraRaw });
      // 本地同步，避免整表重载
      setPhases(prev => prev.map(ph => String(ph.id) !== String(selectedPhaseId) ? ph : {
        ...ph,
        points: (ph.points || []).map(p => p.id === pt.id ? { ...p, extra_data: newExtraRaw } : p),
      }));
    } catch (e) {
      alert('更新失败: ' + (e.message || e));
    } finally {
      setTogglingKey(null);
    }
  };

  return (
    <div className={embedded ? '' : 'plans-page'}>
      {!embedded && (
        <nav className="plan-nav-header">
          <div className="nav-scanlines"></div>
          <div className="plan-nav-inner">
            <button className="back-button" onClick={() => onNavigate && onNavigate('home')}><span>返回首页</span></button>
            <span className="breadcrumb-current" style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>阶段检查点</span>
          </div>
        </nav>
      )}
      <div style={embedded ? { padding: '0 1.5rem' } : { padding: '80px 1.5rem 0', maxWidth: '72rem', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="text-label section-label">PHASE CHECKPOINTS</p>
          <h1 className="text-display" style={{ marginBottom: 0 }}>阶段检查点</h1>
        </div>

        {/* 筛选栏：主题 → 阶段 */}
        <div className="toolbar" style={{ marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div className="toolbar-left" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
            <select className="filter-select" value={selectedThemeId}
              onChange={e => setSelectedThemeId(e.target.value)}>
              <option value="">选择主题</option>
              {themes.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <select className="filter-select" value={selectedPhaseId}
              onChange={e => setSelectedPhaseId(e.target.value)}
              disabled={!selectedThemeId}>
              <option value="">选择阶段</option>
              {phases.map(p => <option key={p.id} value={p.id}>{p.phase_number}. {p.title}</option>)}
            </select>
          </div>
          {selectedPhase && totalLines > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
              完成 {doneLines} / {totalLines}
            </span>
          )}
        </div>

        {error && <div style={{ marginBottom: '1rem', color: 'var(--state-error)', fontSize: '0.8125rem' }}>{error}</div>}

        {/* 阶段信息条 */}
        {selectedPhase && (
          <div style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', background: 'var(--color-bg-sunken)', border: '1px solid var(--color-border-subtle)', display: 'flex', gap: '2rem', flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            <span>{selectedPhase.phase_number}. {selectedPhase.title}</span>
            <span>{selectedPhase.start_date} → {selectedPhase.end_date}</span>
          </div>
        )}

        {/* 检查点列表：每条记录按行拆分为检查项 */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', minHeight: 200 }}>
          {loading ? (
            <div className="drawer-empty" style={{ border: 'none' }}>加载中...</div>
          ) : !selectedPhase ? (
            <div className="drawer-empty" style={{ border: 'none' }}>请选择主题和阶段查看检查点</div>
          ) : checkpoints.length === 0 ? (
            <div className="drawer-empty" style={{ border: 'none' }}>该阶段暂无检查点条目</div>
          ) : (
            <div style={{ padding: '0.5rem 0' }}>
              {checkpoints.map(pt => {
                const extra = parseExtra(pt.extra_data);
                const lines = splitLines(pt.content);
                const ptDone = lines.filter((_, i) => lineState(extra, i).done).length;
                return (
                  <div key={pt.id} className="drawer-item-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '0.375rem' }}>
                    {lines.length > 1 && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                        {ptDone} / {lines.length} 项完成
                      </div>
                    )}
                    {lines.map((line, i) => {
                      const st = lineState(extra, i);
                      const key = `${pt.id}:${i}`;
                      return (
                        <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', width: '100%', cursor: 'pointer' }}>
                          <input type="checkbox"
                            checked={st.done}
                            disabled={togglingKey === key}
                            onChange={() => toggleLine(pt, i)}
                            style={{ marginTop: 3, flexShrink: 0, cursor: 'pointer' }} />
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{
                              fontSize: '0.875rem',
                              fontWeight: st.done ? 400 : 600,
                              color: st.done ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                              textDecoration: st.done ? 'line-through' : 'none',
                            }}>
                              {line}
                            </span>
                            {st.done && st.at && (
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginLeft: '0.75rem' }}>
                                {String(st.at).replace('T', ' ').slice(0, 16)}
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
