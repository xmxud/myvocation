import { useState, useEffect, useCallback } from 'react';
import { themesApi, nodesApi, phasesApi, learningRecordsApi, tagsApi } from '../src/utils/api.js';

/* ========================================
   MISTAKES PAGE
   错题管理：筛选 + 列表 + 新增/编辑弹窗
   ======================================== */

// record_tags 中的系统保留种类标记，其余逗号分隔项为用户标签
const RESERVED_KINDS = ['mistake', 'knowledge', 'reflection'];

// 掌握程度三档（整数 0/1/2 存储）
const MASTERY_LEVELS = [
  { value: '0', label: '未掌握', color: '#ef4444' },
  { value: '1', label: '基本熟悉', color: '#f59e0b' },
  { value: '2', label: '已掌握', color: '#22c55e' },
];

// 题型能力标签类型名（其余类型均视为知识点标签）
const ABILITY_TAG_TYPE = '题型能力标签';

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

// 图片附件类型
const IMAGE_TYPES = ['原题', '空白题目', '解答过程', '知识点整理', '反思备注'];

// 解析附件 JSON 数组（元素：{id, type, note, url, key, name, uploaded_at}）
function parseAttachments(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(a => a && a.url) : [];
  } catch {
    return [];
  }
}

// 旧版三个图片列 → 附件结构（编辑旧记录时转换展示）
function legacyToAttachments(record) {
  const out = [];
  const push = (raw, type) => parseImages(raw).forEach(img => out.push({
    id: `legacy-${type}-${img.key || img.url}`,
    type,
    note: '',
    key: img.key,
    url: img.url,
    name: img.name || '',
    uploaded_at: null,
  }));
  push(record.question_images, '原题');
  push(record.knowledge_images, '知识点整理');
  push(record.reflection_images, '反思备注');
  return out;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  subject_id: '',
  phase_id: '',
  record_date: todayStr(),
  question_text: '',
  attachments: [],
  reflection_text: '',
  mastery_level: '0',
  record_tags: 'mistake',
  knowledge_tags: [],
  ability_tags: [],
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
  const [masteryFilter, setMasteryFilter] = useState('');
  // 标签过滤：联动下拉的类型 + 已选中的多个标签
  const [filterType, setFilterType] = useState('');
  const [filterTags, setFilterTags] = useState([]);

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

  // 标签选择：全部已有标签（供下拉选择）+ 两组手动输入框文本
  const [tagOptions, setTagOptions] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [abilityTagInput, setAbilityTagInput] = useState('');
  // 当前展开下拉列表的标签分组（knowledge_tags / ability_tags / null）
  const [openTagMenu, setOpenTagMenu] = useState(null);

  const loadTagOptions = useCallback(async () => {
    try {
      // /api/tags 按一级标签分页、二级标签嵌在 children 里：取大页并拍平成完整标签列表
      const data = await tagsApi.list(undefined, 1, 1000);
      const flat = [];
      for (const t of data.tags || []) {
        flat.push(t);
        for (const c of t.children || []) flat.push(c);
      }
      setTagOptions(flat);
    } catch { setTagOptions([]); }
  }, []);

  // 加载主题与标签库
  useEffect(() => {
    themesApi.getThemes(1, 50).then(d => setThemes(d.themes || [])).catch(() => {});
    loadTagOptions();
  }, [loadTagOptions]);

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

  // 加载错题列表（只传非空筛选值，tags = mistake 种类 + 已选标签，多个取交集）
  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { tags: ['mistake', ...filterTags].join(',') };
      if (subjectFilter) params.subject_id = subjectFilter;
      if (phaseFilter) params.phase_id = phaseFilter;
      if (masteryFilter !== '') params.mastery_level = masteryFilter;
      const data = await learningRecordsApi.list(params);
      setRecords(data || []);
    } catch (e) {
      setError(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [subjectFilter, phaseFilter, masteryFilter, filterTags]);

  // 筛选条件变化自动刷新
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

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
    setTagInput('');
    setAbilityTagInput('');
    // 默认沿用当前筛选的主题/科目，减少重复选择
    setModalThemeId(themeFilter || '');
    setForm(f => ({ ...f, subject_id: subjectFilter || '', phase_id: phaseFilter || '' }));
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = async (record) => {
    setEditingRecord(record);
    // 从 record_tags 拆出用户标签（去掉系统保留种类），按标签库类型分成知识点/题型能力两组
    const abilityNames = new Set(tagOptions.filter(t => t.type_name === ABILITY_TAG_TYPE).map(t => t.name));
    const allTags = (record.record_tags || '').split(',').map(s => s.trim()).filter(s => s && !RESERVED_KINDS.includes(s));
    setForm({
      subject_id: record.subject_id ? String(record.subject_id) : '',
      phase_id: record.phase_id ? String(record.phase_id) : '',
      record_date: record.record_date || todayStr(),
      question_text: record.question_text || '',
      // 优先读新附件列；旧记录无附件时把三个旧图片列按类型转换过来
      attachments: (() => {
        const a = parseAttachments(record.attachments);
        return a.length ? a : legacyToAttachments(record);
      })(),
      reflection_text: record.reflection_text || '',
      mastery_level: record.mastery_level !== null && record.mastery_level !== undefined ? String(record.mastery_level) : '0',
      record_tags: record.record_tags || 'mistake',
      knowledge_tags: allTags.filter(n => !abilityNames.has(n)),
      ability_tags: allTags.filter(n => abilityNames.has(n)),
    });
    setTagInput('');
    setAbilityTagInput('');
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

  // 附件上传：多选逐个上传，追加到附件数组（默认类型「原题」，可再改）
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const info = await learningRecordsApi.uploadAttachment(file);
        setForm(prev => ({
          ...prev,
          attachments: [...prev.attachments, {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: '原题',
            note: '',
            key: info.key,
            url: info.url,
            name: info.name || file.name,
            uploaded_at: new Date().toISOString(),
          }],
        }));
      }
    } catch (err) {
      setFormError(err.message || '上传失败');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const updateAttachment = (id, patch) => {
    setForm(prev => ({
      ...prev,
      attachments: prev.attachments.map(a => (a.id === id ? { ...a, ...patch } : a)),
    }));
  };

  const removeAttachment = (id) => {
    setForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter(a => a.id !== id),
    }));
  };

  // 添加标签（下拉选择或手动输入）到指定分组，trim + 去重
  const addTag = (field, name) => {
    const s = (name || '').trim();
    if (!s) return;
    setForm(prev => prev[field].includes(s) ? prev : { ...prev, [field]: [...prev[field], s] });
    if (field === 'knowledge_tags') setTagInput('');
    else setAbilityTagInput('');
  };

  const removeTag = (field, name) => {
    setForm(prev => ({ ...prev, [field]: prev[field].filter(t => t !== name) }));
  };

  // 标签编辑区：chips + 可输入过滤的组合框（输入过滤已有标签，点选加入；回车把输入作为新标签加入）
  const renderTagEditor = (field, label, options, inputValue, setInput, showType = true) => {
    const kw = inputValue.trim();
    const filtered = kw ? options.filter(t => t.name.includes(kw)) : options;
    return (
      <div>
        <span className="form-label">{label}</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4, marginBottom: 6 }}>
          {form[field].map(t => (
            <span key={t} className="status-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {t}
              <button type="button" onClick={() => removeTag(field, t)} title="移除"
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1 }}>&times;</button>
            </span>
          ))}
          {form[field].length === 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>暂无标签，输入关键字筛选或直接新增</span>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <input className="form-input" value={inputValue}
            onChange={e => { setInput(e.target.value); setOpenTagMenu(field); }}
            onFocus={() => setOpenTagMenu(field)}
            onBlur={() => setTimeout(() => setOpenTagMenu(null), 150)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(field, inputValue); setOpenTagMenu(null); } }}
            placeholder="输入文字过滤标签，回车新增" />
          {openTagMenu === field && filtered.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30,
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)',
              maxHeight: 200, overflowY: 'auto',
            }}>
              {filtered.map(t => (
                <div key={t.id}
                  onMouseDown={e => { e.preventDefault(); addTag(field, t.name); setOpenTagMenu(null); }}
                  style={{ padding: '6px 12px', fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-sunken)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  {t.name}{showType && t.type_name ? `（${t.type_name}）` : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
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
      // record_tags = 系统保留种类（编辑时保留原有种类，确保含 mistake）+ 用户标签
      const kinds = editingRecord
        ? (editingRecord.record_tags || 'mistake').split(',').map(s => s.trim()).filter(s => RESERVED_KINDS.includes(s))
        : ['mistake'];
      if (!kinds.includes('mistake')) kinds.unshift('mistake');
      // 旧的三个图片列按类型同步（'[]' 表示清空），兼容任务执行页等读旧列的页面
      const byType = (t) => form.attachments.filter(a => a.type === t).map(a => ({ key: a.key, url: a.url, name: a.name }));
      const payload = {
        subject_id: Number(form.subject_id),
        phase_id: form.phase_id ? Number(form.phase_id) : null,
        record_date: form.record_date || null,
        question_text: form.question_text.trim() || null,
        attachments: JSON.stringify(form.attachments),
        question_images: JSON.stringify(byType('原题')),
        knowledge_images: JSON.stringify(byType('知识点整理')),
        reflection_text: form.reflection_text.trim() || null,
        reflection_images: JSON.stringify(byType('反思备注')),
        mastery_level: form.mastery_level !== '' ? Number(form.mastery_level) : null,
        record_tags: [...kinds, ...form.knowledge_tags, ...form.ability_tags].join(','),
        tag_names: form.knowledge_tags,
        ability_tag_names: form.ability_tags,
      };
      if (editingRecord) {
        await learningRecordsApi.update(editingRecord.id, payload);
      } else {
        await learningRecordsApi.create(payload);
      }
      setModalOpen(false);
      await loadRecords();
      loadTagOptions(); // 手动输入的新标签已入库，刷新下拉选项
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

  // 知识点标签下拉：选中重点后按「类型名前缀 = 重点名」关联（如 数学 → 数学知识标签），
  // 同时保留 focus_id 直接关联的标签（手动创建的标签走这个通道）；题型能力标签跨科目通用不过滤。
  // 两组均按名称去重，排除已在任一组选中的
  const subjectTitle = modalFocusItems.find(f => String(f.id) === String(form.subject_id))?.title || '';
  const selectedTags = new Set([...form.knowledge_tags, ...form.ability_tags]);
  const availableKnowledgeOptions = [];
  const seenKnowledge = new Set();
  for (const t of tagOptions) {
    if (t.type_name === ABILITY_TAG_TYPE) continue;
    if (form.subject_id) {
      const matchType = subjectTitle && t.type_name && t.type_name.startsWith(subjectTitle);
      const matchFocus = String(t.focus_id || '') === String(form.subject_id);
      if (!matchType && !matchFocus) continue;
    }
    if (selectedTags.has(t.name) || seenKnowledge.has(t.name)) continue;
    seenKnowledge.add(t.name);
    availableKnowledgeOptions.push(t);
  }
  const availableAbilityOptions = [];
  const seenAbility = new Set();
  for (const t of tagOptions) {
    if (t.type_name !== ABILITY_TAG_TYPE) continue;
    if (selectedTags.has(t.name) || seenAbility.has(t.name)) continue;
    seenAbility.add(t.name);
    availableAbilityOptions.push(t);
  }

  // 标签过滤：类型列表（由标签库 derive）+ 当前类型下未选中的标签（联动、去重）
  const filterTypeNames = [...new Set(tagOptions.map(t => t.type_name).filter(Boolean))];
  const filterTagItems = [];
  const seenFilterNames = new Set();
  for (const t of tagOptions) {
    if (filterType && t.type_name !== filterType) continue;
    if (filterTags.includes(t.name) || seenFilterNames.has(t.name)) continue;
    seenFilterNames.add(t.name);
    filterTagItems.push(t);
  }

  // 阶段 id → 显示文案（用筛选区已加载的 phases 映射，找不到则显示编号）
  const phaseLabel = (phaseId) => {    if (!phaseId) return null;
    const p = phases.find(x => String(x.id) === String(phaseId));
    return p ? `${p.phase_number}. ${p.title}` : `阶段 #${phaseId}`;
  };

  const renderMastery = (level) => {
    // 兼容旧的 0-5 星数据：超出 2 的按已掌握显示
    const n = Math.min(Math.max(Number(level) || 0, 0), 2);
    const lv = MASTERY_LEVELS[n];
    return (
      <span style={{ color: lv.color, fontSize: '0.75rem', fontWeight: 600 }} title="掌握程度">
        {lv.label}
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
          <div className="toolbar-left" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
            {/* 第一行：主题/重点/阶段 + 查询 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
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
              <button className="action-btn" onClick={() => loadRecords()}>查询</button>
              {error && <span style={{ color: 'var(--state-error)', fontSize: '0.8125rem' }}>{error}</span>}
            </div>
            {/* 第二行：标签过滤（类型联动 + 多选 chips）+ 掌握程度 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              <select className="filter-select" style={{ minWidth: 140 }}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}>
                <option value="">-- 标签类型 --</option>
                {filterTypeNames.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <select className="filter-select" style={{ minWidth: 140 }}
                value=""
                onChange={(e) => {
                  const name = e.target.value;
                  if (name && !filterTags.includes(name)) setFilterTags([...filterTags, name]);
                }}>
                <option value="">-- 选择标签 --</option>
                {filterTagItems.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
              {filterTags.map(name => (
                <span key={name} className="status-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {name}
                  <button type="button" onClick={() => setFilterTags(filterTags.filter(t => t !== name))} title="移除过滤"
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1 }}>&times;</button>
                </span>
              ))}
              <select className="filter-select" style={{ minWidth: 120 }}
                value={masteryFilter}
                onChange={(e) => setMasteryFilter(e.target.value)}>
                <option value="">掌握程度：全部</option>
                {MASTERY_LEVELS.map(lv => (
                  <option key={lv.value} value={lv.value}>{lv.label}</option>
                ))}
              </select>
            </div>
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
                const atts = parseAttachments(record.attachments);
                const qImages = atts.length ? atts : parseImages(record.question_images);
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
                    <span style={{ flexShrink: 0 }}>{renderMastery(record.mastery_level)}</span>
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
                  <span className="form-label">图片附件（可多次上传，逐张选择类型与说明）</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4, marginBottom: 6 }}>
                    {form.attachments.map(att => (
                      <div key={att.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <a href={att.url} target="_blank" rel="noreferrer" style={{ flexShrink: 0 }}>
                          <img src={att.url} alt={att.name || '附件'}
                            style={{ width: 48, height: 48, objectFit: 'cover', border: '1px solid var(--color-border-default)', display: 'block' }} />
                        </a>
                        <select className="filter-select" style={{ padding: '6px 10px', minWidth: 110 }}
                          value={att.type}
                          onChange={e => updateAttachment(att.id, { type: e.target.value })}>
                          {IMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input className="form-input" style={{ flex: 1, minWidth: 120, padding: '6px 10px' }}
                          value={att.note || ''} placeholder="图片说明（可选）"
                          onChange={e => updateAttachment(att.id, { note: e.target.value })} />
                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                          {att.uploaded_at ? att.uploaded_at.replace('T', ' ').slice(5, 16) : ''}
                        </span>
                        <button type="button" className="action-btn action-btn--danger" style={{ padding: '4px 10px' }}
                          onClick={() => removeAttachment(att.id)}>删除</button>
                      </div>
                    ))}
                  </div>
                  <label className="action-btn" style={{ cursor: 'pointer' }}>
                    {uploading ? '上传中...' : '📤 上传图片（可多选）'}
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                      disabled={uploading}
                      onChange={handleImageUpload} />
                  </label>
                </div>
                <label>
                  <span className="form-label">反思说明</span>
                  <textarea className="form-textarea" value={form.reflection_text}
                    onChange={e => setForm({ ...form, reflection_text: e.target.value })}
                    placeholder="错误反思、改进思路（可选）" rows={2} />
                </label>
                {renderTagEditor('knowledge_tags', '知识点标签（可多选，按重点联动过滤）', availableKnowledgeOptions, tagInput, setTagInput)}
                {renderTagEditor('ability_tags', '题型能力标签（可多选）', availableAbilityOptions, abilityTagInput, setAbilityTagInput, false)}
                <label>
                  <span className="form-label">掌握程度</span>
                  <select className="filter-select" style={{ width: '100%', padding: '10px 14px' }}
                    value={form.mastery_level}
                    onChange={e => setForm({ ...form, mastery_level: e.target.value })}>
                    {MASTERY_LEVELS.map(lv => (
                      <option key={lv.value} value={lv.value}>{lv.label}</option>
                    ))}
                  </select>
                </label>
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
