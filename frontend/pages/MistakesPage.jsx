import { useState, useEffect, useCallback } from 'react';
import { themesApi, nodesApi, phasesApi, learningRecordsApi } from '../src/utils/api.js';

/* ========================================
   MISTAKES PAGE
   错题管理：筛选 + 列表 + 新增/编辑弹窗
   ======================================== */

// 解析 JSON 图片字段，容忍空值/非法 JSON/纯 URL 字符串元素
function parseImages(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map(item => (typeof item === 'string' ? { key: item, url: item, name: '' } : item))
      .filter(item => item && item.url);
  } catch {
    return [];
  }
}

const todayStr = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  subject_id: '',
  phase_id: '',
  record_date: todayStr(),
  question_text: '',
  question_images: [],
  reflection_text: '',
  reflection_images: [],
  knowledge_point: '',
  mastery_level: '0',
  record_tags: 'mistake',
});

export default function MistakesPage({ onBack, embedded }) {
  // ── 筛选区数据 ──
  const [themes, setThemes] = useState([]);
  const [focusItems, setFocusItems] = useState([]);
  const [phases, setPhases] = useState([]);

  // ── 筛选条件 ──
  const [themeFilter, setThemeFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');
  const [knowledgeFilter, setKnowledgeFilter] = useState('');
  const [masteryFilter, setMasteryFilter] = useState('');

  // ── 列表 ──
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── 弹窗 ──
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  // 弹窗内自己的主题→重点→阶段联动
  const [modalThemeId, setModalThemeId] = useState('');
  const [modalFocusItems, setModalFocusItems] = useState([]);
  const [modalPhases, setModalPhases] = useState([]);

  // 加载主题
  useEffect(() => {
    themesApi.getThemes(1, 50).then(d => setThemes(d.themes || [])).catch(() => {});
  }, []);

  // 主题变化 → 联动加载重点（科目）与阶段，并清空下级筛选
  useEffect(() => {
    setSubjectFilter('');
    setPhaseFilter('');
    if (themeFilter) {
      nodesApi.getChildren(themeFilter).then(d => setFocusItems(d || [])).catch(() => setFocusItems([]));
      phasesApi.getPhasesByNode(themeFilter).then(d => setPhases(d || [])).catch(() => setPhases([]));
    } else {
      setFocusItems([]);
      setPhases([]);
    }
  }, [themeFilter]);

  // 加载错题列表（只传非空筛选值，tags 固定 mistake）
  const loadRecords = useCallback(async (kw) => {
    setLoading(true);
    setError('');
    try {
      const params = { tags: 'mistake' };
      if (subjectFilter) params.subject_id = subjectFilter;
      if (phaseFilter) params.phase_id = phaseFilter;
      if (masteryFilter !== '') params.mastery_level = masteryFilter;
      const kwText = kw !== undefined ? kw : knowledgeFilter;
      if (kwText.trim()) params.knowledge_point = kwText.trim();
      const data = await learningRecordsApi.list(params);
      setRecords(data || []);
    } catch (e) {
      setError(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [subjectFilter, phaseFilter, masteryFilter, knowledgeFilter]);

  // 下拉筛选变化自动刷新；知识点文本输入做 300ms 防抖
  useEffect(() => {
    loadRecords();
  }, [subjectFilter, phaseFilter, masteryFilter, loadRecords]);

  useEffect(() => {
    const timer = setTimeout(() => loadRecords(knowledgeFilter), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knowledgeFilter]);

  // 弹窗主题变化 → 联动加载弹窗内的重点与阶段
  useEffect(() => {
    if (modalThemeId) {
      nodesApi.getChildren(modalThemeId).then(d => setModalFocusItems(d || [])).catch(() => setModalFocusItems([]));
      phasesApi.getPhasesByNode(modalThemeId).then(d => setModalPhases(d || [])).catch(() => setModalPhases([]));
    } else {
      setModalFocusItems([]);
      setModalPhases([]);
    }
  }, [modalThemeId]);

  // 根据 subject_id 反查所属主题（并行查各主题的重点列表，找到即返回）
  const findThemeBySubject = async (subjectId) => {
    try {
      const results = await Promise.all(
        themes.map(t => nodesApi.getChildren(t.id).then(children => ({ themeId: t.id, children: children || [] })).catch(() => ({ themeId: t.id, children: [] })))
      );
      for (const { themeId, children } of results) {
        if (children.some(c => String(c.id) === String(subjectId))) {
          return { themeId, children };
        }
      }
    } catch { /* ignore */ }
    return null;
  };

  const openCreate = () => {
    setEditingRecord(null);
    setForm(emptyForm());
    // 默认沿用当前筛选的主题/科目，减少重复选择
    setModalThemeId(themeFilter || '');
    setForm(f => ({ ...f, subject_id: subjectFilter || '', phase_id: phaseFilter || '' }));
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = async (record) => {
    setEditingRecord(record);
    setForm({
      subject_id: record.subject_id ? String(record.subject_id) : '',
      phase_id: record.phase_id ? String(record.phase_id) : '',
      record_date: record.record_date || todayStr(),
      question_text: record.question_text || '',
      question_images: parseImages(record.question_images),
      reflection_text: record.reflection_text || '',
      reflection_images: parseImages(record.reflection_images),
      knowledge_point: record.knowledge_point || '',
      mastery_level: record.mastery_level !== null && record.mastery_level !== undefined ? String(record.mastery_level) : '0',
      record_tags: record.record_tags || 'mistake',
    });
    setFormError('');
    setModalOpen(true);
    // 反查科目所属主题以便预选；失败则不预选主题，重点下拉单独补一个当前科目选项
    setModalThemeId('');
    if (record.subject_id) {
      const found = await findThemeBySubject(record.subject_id);
      if (found) {
        setModalThemeId(String(found.themeId));
        setModalFocusItems(found.children);
      }
    }
  };

  // 附件上传：多选逐个上传，追加到指定图片数组字段
  const handleImageUpload = async (field, e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const info = await learningRecordsApi.uploadAttachment(file);
        setForm(prev => ({
          ...prev,
          [field]: [...(prev[field] || []), { key: info.key, url: info.url, name: info.name }],
        }));
      }
    } catch (err) {
      setFormError(err.message || '上传失败');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (field, key) => {
    setForm(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter(a => a.key !== key),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject_id) {
      setFormError('请选择科目（重点）');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        subject_id: Number(form.subject_id),
        phase_id: form.phase_id ? Number(form.phase_id) : null,
        record_date: form.record_date || null,
        question_text: form.question_text.trim() || null,
        question_images: form.question_images.length ? JSON.stringify(form.question_images) : null,
        reflection_text: form.reflection_text.trim() || null,
        reflection_images: form.reflection_images.length ? JSON.stringify(form.reflection_images) : null,
        knowledge_point: form.knowledge_point.trim() || null,
        mastery_level: form.mastery_level !== '' ? Number(form.mastery_level) : null,
        record_tags: editingRecord ? (editingRecord.record_tags || 'mistake') : 'mistake',
      };
      if (editingRecord) {
        await learningRecordsApi.update(editingRecord.id, payload);
      } else {
        await learningRecordsApi.create(payload);
      }
      setModalOpen(false);
      await loadRecords();
    } catch (err) {
      setFormError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm('确定删除这条错题记录吗？')) return;
    try {
      await learningRecordsApi.delete(record.id);
      await loadRecords();
    } catch (e) {
      setError(e.message || '删除失败');
    }
  };

  // 阶段 id → 显示文案（用筛选区已加载的 phases 映射，找不到则显示编号）
  const phaseLabel = (phaseId) => {
    if (!phaseId) return null;
    const p = phases.find(x => String(x.id) === String(phaseId));
    return p ? `${p.phase_number}. ${p.title}` : `阶段 #${phaseId}`;
  };

  const renderStars = (level) => {
    const n = Number(level) || 0;
    return (
      <span style={{ color: 'var(--color-text-accent)', letterSpacing: '0.1em' }} title={`掌握程度 ${n}/5`}>
        {'★'.repeat(n)}{'☆'.repeat(5 - n)}
      </span>
    );
  };

  const renderThumb = (img, onRemove) => (
    <span key={img.key || img.url} style={{ position: 'relative', display: 'inline-block' }}>
      <a href={img.url} target="_blank" rel="noreferrer">
        <img src={img.url} alt={img.name || '附件'}
          style={{ width: 48, height: 48, objectFit: 'cover', border: '1px solid var(--color-border-default)', display: 'block' }} />
      </a>
      {onRemove && (
        <button type="button" onClick={() => onRemove(img.key)}
          style={{
            position: 'absolute', top: -6, right: -6, width: 16, height: 16, lineHeight: '14px',
            fontSize: 12, padding: 0, border: 'none', cursor: 'pointer',
            background: 'var(--state-error)', color: '#fff', borderRadius: '50%',
          }}>&times;</button>
      )}
    </span>
  );

  return (
    <div className={embedded ? '' : 'plans-page'}>
      {!embedded && (
      <nav className="plan-nav-header" role="navigation">
        <div className="nav-scanlines"></div>
        <div className="plan-nav-inner">
          <button className="back-button" onClick={() => onBack && onBack()}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="10,3 5,8 10,13" /><line x1="5" y1="8" x2="14" y2="8" />
            </svg>
            <span>返回首页</span>
          </button>
          <span className="breadcrumb-current" style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
            错题管理
          </span>
        </div>
      </nav>
      )}

      <div style={embedded ? { padding: '0 1.5rem' } : { padding: '80px 1.5rem 0', maxWidth: '72rem', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="text-label section-label">MISTAKE REVIEW</p>
          <h1 className="text-display" style={{ marginBottom: 0 }}>错题管理</h1>
        </div>

        {/* 筛选栏 */}
        <div className="toolbar" style={{ marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div className="toolbar-left" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <select className="filter-select" style={{ minWidth: 160 }}
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}>
              <option value="">-- 主题 --</option>
              {themes.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            <select className="filter-select" style={{ minWidth: 160 }}
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}>
              <option value="">-- 重点（科目）--</option>
              {focusItems.map(f => (
                <option key={f.id} value={f.id}>{f.title}</option>
              ))}
            </select>
            <select className="filter-select" style={{ minWidth: 160 }}
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}>
              <option value="">-- 阶段 --</option>
              {phases.map(p => (
                <option key={p.id} value={p.id}>{p.phase_number}. {p.title}</option>
              ))}
            </select>
            <input className="form-input" style={{ width: 160, padding: '8px 12px' }}
              value={knowledgeFilter}
              onChange={(e) => setKnowledgeFilter(e.target.value)}
              placeholder="知识点标签" />
            <select className="filter-select" style={{ minWidth: 120 }}
              value={masteryFilter}
              onChange={(e) => setMasteryFilter(e.target.value)}>
              <option value="">掌握程度：全部</option>
              {[0, 1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n} 星</option>
              ))}
            </select>
            <button className="action-btn" onClick={() => loadRecords()}>查询</button>
            {error && <span style={{ color: 'var(--state-error)', fontSize: '0.8125rem' }}>{error}</span>}
          </div>
          <button className="cta-button" style={{ padding: '8px 20px', fontSize: '0.8125rem' }}
            onClick={openCreate}>
            + 新增错题
          </button>
        </div>

        {/* 错题列表 */}
        <div style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-default)',
          minHeight: 200,
        }}>
          {loading ? (
            <div className="drawer-empty" style={{ border: 'none' }}>加载中...</div>
          ) : records.length === 0 ? (
            <div className="drawer-empty" style={{ border: 'none' }}>
              暂无错题记录，点击「新增错题」开始记录
            </div>
          ) : (
            <div style={{ padding: '0.5rem 0' }}>
              {records.map(record => {
                const qImages = parseImages(record.question_images);
                const phase = phaseLabel(record.phase_id);
                return (
                  <div key={record.id} className="drawer-item-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4, whiteSpace: 'pre-wrap' }}>
                        {(record.question_text || '').slice(0, 120) || '（无错题说明）'}
                        {(record.question_text || '').length > 120 && '…'}
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                        <span>{record.record_date}</span>
                        {record.knowledge_point && (
                          <span style={{ color: 'var(--color-text-accent)' }}>#{record.knowledge_point}</span>
                        )}
                        {phase && <span>{phase}</span>}
                      </div>
                      {record.reflection_text && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                          反思：{record.reflection_text.slice(0, 60)}{record.reflection_text.length > 60 && '…'}
                        </div>
                      )}
                      {qImages.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 6, flexWrap: 'wrap' }}>
                          {qImages.map(img => renderThumb(img, null))}
                        </div>
                      )}
                    </div>
                    <span style={{ flexShrink: 0 }}>{renderStars(record.mastery_level)}</span>
                    <div className="drawer-item-actions" style={{ flexShrink: 0 }}>
                      <button className="action-btn" onClick={() => openEdit(record)}>编辑</button>
                      <button className="action-btn action-btn--danger" onClick={() => handleDelete(record)}>删除</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 新增/编辑弹窗 */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingRecord ? '编辑错题' : '新增错题'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gap: '0.75rem' }}>
                {formError && (
                  <div className="login-error" style={{ marginBottom: 0 }}>{formError}</div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label>
                    <span className="form-label">主题</span>
                    <select className="filter-select" style={{ width: '100%', padding: '10px 14px' }}
                      value={modalThemeId}
                      onChange={e => { setModalThemeId(e.target.value); setForm({ ...form, subject_id: '', phase_id: '' }); }}>
                      <option value="">-- 选择主题 --</option>
                      {themes.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="form-label">科目（重点）*</span>
                    <select className="filter-select" style={{ width: '100%', padding: '10px 14px' }}
                      value={form.subject_id}
                      onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                      <option value="">-- 选择科目 --</option>
                      {modalFocusItems.map(f => (
                        <option key={f.id} value={f.id}>{f.title}</option>
                      ))}
                      {/* 反查主题失败时仍保留当前科目可选 */}
                      {form.subject_id && !modalFocusItems.some(f => String(f.id) === String(form.subject_id)) && (
                        <option value={form.subject_id}>科目 #{form.subject_id}</option>
                      )}
                    </select>
                  </label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label>
                    <span className="form-label">阶段（可选）</span>
                    <select className="filter-select" style={{ width: '100%', padding: '10px 14px' }}
                      value={form.phase_id}
                      onChange={e => setForm({ ...form, phase_id: e.target.value })}>
                      <option value="">-- 不关联阶段 --</option>
                      {modalPhases.map(p => (
                        <option key={p.id} value={p.id}>{p.phase_number}. {p.title}</option>
                      ))}
                      {form.phase_id && !modalPhases.some(p => String(p.id) === String(form.phase_id)) && (
                        <option value={form.phase_id}>阶段 #{form.phase_id}</option>
                      )}
                    </select>
                  </label>
                  <label>
                    <span className="form-label">错题日期</span>
                    <input className="form-input" type="date" value={form.record_date}
                      onChange={e => setForm({ ...form, record_date: e.target.value })} />
                  </label>
                </div>
                <label>
                  <span className="form-label">错题说明</span>
                  <textarea className="form-textarea" value={form.question_text}
                    onChange={e => setForm({ ...form, question_text: e.target.value })}
                    placeholder="题目内容、错误原因等" rows={3} />
                </label>
                <div>
                  <span className="form-label">错题附件</span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: 4, marginBottom: 6 }}>
                    {form.question_images.map(img => renderThumb(img, (key) => removeImage('question_images', key)))}
                  </div>
                  <label className="action-btn" style={{ cursor: 'pointer' }}>
                    {uploading ? '上传中...' : '📤 上传图片'}
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                      disabled={uploading}
                      onChange={(e) => handleImageUpload('question_images', e)} />
                  </label>
                </div>
                <label>
                  <span className="form-label">反思说明</span>
                  <textarea className="form-textarea" value={form.reflection_text}
                    onChange={e => setForm({ ...form, reflection_text: e.target.value })}
                    placeholder="错误反思、改进思路（可选）" rows={2} />
                </label>
                <div>
                  <span className="form-label">反思图片</span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: 4, marginBottom: 6 }}>
                    {form.reflection_images.map(img => renderThumb(img, (key) => removeImage('reflection_images', key)))}
                  </div>
                  <label className="action-btn" style={{ cursor: 'pointer' }}>
                    {uploading ? '上传中...' : '📤 上传图片'}
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                      disabled={uploading}
                      onChange={(e) => handleImageUpload('reflection_images', e)} />
                  </label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label>
                    <span className="form-label">知识点标签</span>
                    <input className="form-input" value={form.knowledge_point}
                      onChange={e => setForm({ ...form, knowledge_point: e.target.value })}
                      placeholder="如：三角函数" />
                  </label>
                  <label>
                    <span className="form-label">掌握程度</span>
                    <select className="filter-select" style={{ width: '100%', padding: '10px 14px' }}
                      value={form.mastery_level}
                      onChange={e => setForm({ ...form, mastery_level: e.target.value })}>
                      {[0, 1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n}>{n} 星</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn" onClick={() => setModalOpen(false)}>取消</button>
                <button type="submit" className="cta-button" disabled={saving || uploading}
                  style={{ padding: '10px 24px', fontSize: '0.8125rem', opacity: (saving || uploading) ? 0.6 : 1 }}>
                  {saving ? '保存中...' : (editingRecord ? '更新' : '创建')}
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
