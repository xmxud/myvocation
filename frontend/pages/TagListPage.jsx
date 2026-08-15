import { useState, useEffect, useCallback } from 'react';
import { tagsApi, themesApi, nodesApi } from '../src/utils/api.js';
import Modal from '../src/components/Modal.jsx';

/* ========================================
   TAG LIST PAGE
   统一标签库：标签类型 + 标签（树形结构），Excel 导入
   ======================================== */

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M11 2l3 3-9 9H2v-3l9-9z" /><line x1="9" y1="5" x2="11" y2="7" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M2 4h12" /><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
      <path d="M13 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V4" />
      <line x1="6" y1="7" x2="6" y2="11" /><line x1="10" y1="7" x2="10" y2="11" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  );
}

const TAG_COLORS = [
  { value: '', label: '默认', color: '#00FF66' },
  { value: '#00FF66', label: '霓虹绿', color: '#00FF66' },
  { value: '#3B82F6', label: '蓝色', color: '#3B82F6' },
  { value: '#EF4444', label: '红色', color: '#EF4444' },
  { value: '#F59E0B', label: '橙色', color: '#F59E0B' },
  { value: '#8B5CF6', label: '紫色', color: '#8B5CF6' },
  { value: '#EC4899', label: '粉色', color: '#EC4899' },
  { value: '#14B8A6', label: '青色', color: '#14B8A6' },
];

const fieldLabel = { display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' };

export default function TagListPage({ onNavigate, embedded }) {
  const [tagTypes, setTagTypes] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeType, setActiveType] = useState('');   // 当前过滤的标签类型名（''=全部）
  const [expandedIds, setExpandedIds] = useState(new Set());
  // 分页状态（按一级标签分页）
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [allTopTags, setAllTopTags] = useState([]);  // 全量一级标签（用于父标签下拉）

  // 标签弹窗
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [form, setForm] = useState({ name: '', type_name: '', parent_id: '', color: '', description: '', focus_id: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [focusOptions, setFocusOptions] = useState([]);  // 关联重点选项（主题下的重点项）

  // 标签类型弹窗
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [typeError, setTypeError] = useState('');

  // 导入状态
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const loadTagTypes = useCallback(async () => {
    try {
      const list = await tagsApi.listTypes();
      setTagTypes(list || []);
    } catch { setTagTypes([]); }
  }, []);

  const loadTags = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await tagsApi.list(activeType || undefined, page, pageSize);
      setTags(data.tags || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 0);
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [activeType, page, pageSize]);

  // 全量一级标签（用于父标签下拉，不分页）
  const loadAllTopTags = useCallback(async () => {
    try {
      const data = await tagsApi.list(undefined, 1, 1000);
      setAllTopTags(data.tags || []);
    } catch { setAllTopTags([]); }
  }, []);

  const loadFocusOptions = useCallback(async () => {
    try {
      const data = await themesApi.getThemes(1, 100);
      const themes = data.themes || [];
      const opts = [];
      for (const theme of themes) {
        try {
          const items = await nodesApi.getChildren(theme.id);
          for (const f of items) {
            if (f.node_type === 'FOCUS_ITEM') {
              opts.push({ id: f.id, title: f.title, theme_title: theme.title });
            }
          }
        } catch { /* 单个主题失败忽略 */ }
      }
      setFocusOptions(opts);
    } catch { setFocusOptions([]); }
  }, []);

  useEffect(() => { loadTagTypes(); }, [loadTagTypes]);
  useEffect(() => { loadTags(); }, [loadTags]);
  useEffect(() => { loadFocusOptions(); }, [loadFocusOptions]);
  useEffect(() => { loadAllTopTags(); }, [loadAllTopTags]);

  // 树形组装（tags 已是分页返回的一级标签，含 children）
  const topTags = tags;
  const childrenOf = (id) => topTags.find((t) => t.id === id)?.children || [];

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── 标签弹窗 ──
  const openCreate = () => {
    setEditingTag(null);
    setForm({ name: '', type_name: activeType || (tagTypes[0]?.name || ''), parent_id: '', color: '', description: '', focus_id: '' });
    setFormError('');
    setModalOpen(true);
  };

  // 从某个标签直接新增其下级标签（预设类型与父标签）
  const openCreateChild = (parent) => {
    setEditingTag(null);
    setForm({ name: '', type_name: parent.type_name || '', parent_id: String(parent.id), color: '', description: '', focus_id: parent.focus_id ? String(parent.focus_id) : '' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (tag) => {
    setEditingTag(tag);
    setForm({
      name: tag.name || '',
      type_name: tag.type_name || '',
      parent_id: tag.parent_id ? String(tag.parent_id) : '',
      color: tag.color || '',
      description: tag.description || '',
      focus_id: tag.focus_id ? String(tag.focus_id) : '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const parentOptions = allTopTags.filter((t) => t.type_name === form.type_name && (!editingTag || t.id !== editingTag.id));
  // 预设父标签本身不在一级标签选项中时（如给二级标签再新增下级），补充进下拉框保证能回显
  const presetParent = form.parent_id && !parentOptions.some((t) => String(t.id) === String(form.parent_id))
    ? allTopTags.find((t) => String(t.id) === String(form.parent_id))
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setFormError('标签名不能为空');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name,
        type_name: form.type_name || null,
        parent_id: form.parent_id ? Number(form.parent_id) : null,
        color: form.color || null,
        description: form.description || null,
        focus_id: form.focus_id ? Number(form.focus_id) : null,
      };
      if (editingTag) {
        await tagsApi.update(editingTag.id, payload);
      } else {
        await tagsApi.create(payload);
      }
      setModalOpen(false);
      await loadTags();
      await loadAllTopTags();
    } catch (err) {
      setFormError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tag) => {
    const childCount = childrenOf(tag.id).length;
    const msg = childCount > 0
      ? `确定删除标签「${tag.name}」吗？其下 ${childCount} 个二级标签也会一并删除。`
      : `确定删除标签「${tag.name}」吗？`;
    if (!confirm(msg)) return;
    try {
      await tagsApi.delete(tag.id);
      // 乐观更新：立即移除已删除的标签及其子标签，避免选中失效的父标签
      const childIds = new Set(childrenOf(tag.id).map((c) => c.id));
      const remaining = tags.filter((t) => t.id !== tag.id && !childIds.has(t.id));
      setTags(remaining);
      if (remaining.length === 0 && page > 1) {
        setPage(page - 1);  // 当前页删空则回退一页
      } else {
        await loadTags();
      }
      await loadAllTopTags();
    } catch (err) {
      setError(err.message || '删除失败');
    }
  };

  // ── 标签类型弹窗 ──
  const openCreateType = () => { setTypeName(''); setTypeError(''); setTypeModalOpen(true); };
  const handleCreateType = async () => {
    const name = typeName.trim();
    if (!name) { setTypeError('类型名不能为空'); return; }
    try {
      await tagsApi.createType(name);
      setTypeModalOpen(false);
      await loadTagTypes();
    } catch (err) {
      setTypeError(err.message || '新增失败');
    }
  };

  const handleDeleteType = async () => {
    if (!activeType) { alert('请先在下方下拉框选择要删除的标签类型'); return; }
    const type = tagTypes.find((t) => t.name === activeType);
    if (!type) return;
    if (!confirm(`确定删除标签类型「${type.name}」吗？该类型下的所有标签也会一并删除。`)) return;
    try {
      await tagsApi.deleteType(type.id);
      // 乐观更新：立即移除该类型下所有标签
      setTags((prev) => prev.filter((t) => t.type_name !== type.name));
      setActiveType('');
      setPage(1);
      await loadTagTypes();
      await loadTags();
      await loadAllTopTags();
    } catch (err) {
      setError(err.message || '删除失败');
    }
  };

  // ── 导入 ──
  const handleImport = async () => {
    if (!importFile || importing) return;
    setImporting(true);
    setImportResult(null);
    setError('');
    try {
      const payload = await tagsApi.importExcel(importFile);
      alert(payload.message || '导入完成');
      setImportOpen(false);
      setImportFile(null);
      await loadTagTypes();
      await loadTags();
      await loadAllTopTags();
    } catch (err) {
      setImportResult({ error: err.message || '导入失败' });
    } finally {
      setImporting(false);
    }
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
            <div className="plan-breadcrumb">
              <span className="breadcrumb-item">HOME</span>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-current">标签管理</span>
            </div>
          </div>
        </nav>
      )}

      <div style={embedded ? { padding: '0 1.5rem' } : { padding: '80px 1.5rem 0', maxWidth: '72rem', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="text-label section-label">TAG MANAGEMENT</p>
          <h1 className="text-display" style={{ marginBottom: 0 }}>标签管理</h1>
        </div>

        {/* 标签类型过滤 + 管理 */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="filter-select" style={{ minWidth: 180 }}
            value={activeType}
            onChange={(e) => { setActiveType(e.target.value); setPage(1); }}>
            <option value="">全部标签类型</option>
            {tagTypes.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
          <button className="action-btn" style={{ borderColor: 'var(--color-border-primary)', color: 'var(--color-text-accent)' }} onClick={openCreateType}>+ 新增类型</button>
          <button className="action-btn action-btn--danger" onClick={handleDeleteType}>删除类型</button>
        </div>

        {/* 工具栏 */}
        <div className="toolbar" style={{ marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div className="toolbar-left">
            {error && <span style={{ color: 'var(--state-error)', fontSize: '0.8125rem' }}>{error}</span>}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <a className="action-btn" style={{ textDecoration: 'none', borderColor: 'var(--color-border-primary)', color: 'var(--color-text-accent)' }}
              href={tagsApi.exportUrl(activeType)} download>⬇ 导出标签</a>
            <button className="action-btn" style={{ borderColor: 'var(--color-border-primary)', color: 'var(--color-text-accent)' }}
              onClick={() => { setImportOpen(true); setImportFile(null); setImportResult(null); }}>📤 导入标签</button>
            <button className="cta-button" onClick={openCreate} style={{ padding: '10px 24px', fontSize: '0.8125rem' }}>+ 新建标签</button>
          </div>
        </div>

        {/* 标签列表 */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', overflow: 'hidden' }}>
          {loading ? (
            <div className="drawer-empty">正在加载标签...</div>
          ) : topTags.length === 0 ? (
            <div className="drawer-empty" style={{ border: 'none' }}>暂无标签，点击「新建标签」或「导入标签」开始</div>
          ) : (
            <div>
              {topTags.map((tag) => {
                const children = childrenOf(tag.id);
                const expanded = expandedIds.has(tag.id);
                return (
                  <div key={tag.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    {/* 一级标签行 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px' }}>
                      <button onClick={() => toggleExpand(tag.id)} title={expanded ? '收起' : '展开'}
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        {children.length > 0 ? <ChevronIcon open={expanded} /> : <span style={{ width: 12 }} />}
                      </button>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: tag.color || 'var(--color-primary)', flexShrink: 0, boxShadow: tag.color ? `0 0 6px ${tag.color}` : 'none' }} />
                      <span style={{ fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tag.name}</span>
                      <span className="status-badge" style={{ fontSize: '0.625rem' }}>{tag.type_name || '—'}</span>
                      {tag.focus_title && <span className="status-badge" style={{ fontSize: '0.625rem', borderColor: 'rgba(245,158,11,0.4)', color: '#F59E0B' }} title={`关联重点：${tag.focus_title}`}>🔗 {tag.focus_title}</span>}
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tag.description || ''}>{tag.description || '—'}</span>
                      <div className="action-buttons">
                        <button className="action-btn" onClick={() => openCreateChild(tag)} title="新增下级标签"><PlusIcon /></button>
                        <button className="action-btn" onClick={() => openEdit(tag)} title="编辑"><EditIcon /></button>
                        <button className="action-btn action-btn--danger" onClick={() => handleDelete(tag)} title="删除"><DeleteIcon /></button>
                      </div>
                    </div>
                    {/* 二级标签行 */}
                    {expanded && children.map((child) => (
                      <div key={child.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px 8px 52px', borderTop: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-sunken)' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: child.color || 'var(--color-primary)', flexShrink: 0, opacity: 0.7 }} />
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>{child.name}</span>
                        <span className="status-badge" style={{ fontSize: '0.625rem', opacity: 0.7 }}>{child.type_name || '—'}</span>
                        {child.focus_title && <span className="status-badge" style={{ fontSize: '0.625rem', opacity: 0.8, borderColor: 'rgba(245,158,11,0.4)', color: '#F59E0B' }} title={`关联重点：${child.focus_title}`}>🔗 {child.focus_title}</span>}
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={child.description || ''}>{child.description || '—'}</span>
                        <div className="action-buttons">
                          <button className="action-btn" onClick={() => openCreateChild(child)} title="新增下级标签"><PlusIcon /></button>
                          <button className="action-btn" onClick={() => openEdit(child)} title="编辑"><EditIcon /></button>
                          <button className="action-btn action-btn--danger" onClick={() => handleDelete(child)} title="删除"><DeleteIcon /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button className="action-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>← 上一页</button>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              第 {page} / {totalPages} 页 · 共 {total} 个一级标签
            </span>
            <button className="action-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>下一页 →</button>
          </div>
        )}
      </div>

      {/* 新建/编辑标签弹窗 */}
      <Modal
        title={editingTag ? '编辑标签' : '新建标签'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        panelStyle={{ maxWidth: '30rem' }}
        footer={
          <>
            <button className="action-btn" onClick={() => setModalOpen(false)}>取消</button>
            <button className="cta-button" onClick={handleSubmit} disabled={saving}
              style={{ padding: '10px 24px', fontSize: '0.8125rem', opacity: saving ? 0.6 : 1 }}>
              {saving ? '保存中...' : (editingTag ? '更新' : '创建')}
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
          <label style={fieldLabel}>
            标签名 *
            <input className="form-input" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="输入标签名称" autoFocus />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label style={fieldLabel}>
              标签类型
              <select className="filter-select" style={{ width: '100%', padding: '10px 14px' }}
                value={form.type_name}
                onChange={(e) => setForm({ ...form, type_name: e.target.value, parent_id: '' })}>
                <option value="">— 选择类型 —</option>
                {tagTypes.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </label>
            <label style={fieldLabel}>
              颜色
              <select className="filter-select" style={{ width: '100%', padding: '10px 14px' }}
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}>
                {TAG_COLORS.map((c) => (
                  <option key={c.value || 'default'} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label style={fieldLabel}>
            父标签（可选，选择后成为二级标签）
            <select className="filter-select" style={{ width: '100%', padding: '10px 14px' }}
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
              <option value="">无（作为一级标签）</option>
              {parentOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
              {presetParent && <option value={presetParent.id}>{presetParent.name}</option>}
            </select>
          </label>
          <label style={fieldLabel}>
            关联重点（可选）
            <select className="filter-select" style={{ width: '100%', padding: '10px 14px' }}
              value={form.focus_id}
              onChange={(e) => setForm({ ...form, focus_id: e.target.value })}>
              <option value="">无（不关联）</option>
              {focusOptions.map((f) => (
                <option key={f.id} value={f.id}>{f.theme_title} / {f.title}</option>
              ))}
            </select>
          </label>
          <label style={fieldLabel}>
            说明
            <textarea className="form-textarea" value={form.description} rows={2}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="标签说明（可选）" />
          </label>
        </form>
      </Modal>

      {/* 新增标签类型弹窗 */}
      <Modal title="新增标签类型" open={typeModalOpen} onClose={() => setTypeModalOpen(false)} panelStyle={{ maxWidth: '24rem' }}
        footer={
          <>
            <button className="action-btn" onClick={() => setTypeModalOpen(false)}>取消</button>
            <button className="cta-button" style={{ padding: '8px 20px', fontSize: '0.8125rem' }} onClick={handleCreateType}>新增</button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {typeError && <div style={{ color: 'var(--state-error)', fontSize: '0.8125rem' }}>{typeError}</div>}
          <input className="form-input" value={typeName} onChange={(e) => setTypeName(e.target.value)}
            placeholder="输入标签类型名称" autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreateType()} />
        </div>
      </Modal>

      {/* 导入弹窗 */}
      <Modal title="导入标签" open={importOpen} onClose={() => setImportOpen(false)} panelStyle={{ maxWidth: '30rem' }}
        footer={
          <>
            <button className="action-btn" onClick={() => setImportOpen(false)}>关闭</button>
            <button className="cta-button" style={{ padding: '8px 20px', fontSize: '0.8125rem' }} onClick={handleImport} disabled={!importFile || importing}>
              {importing ? '导入中...' : '开始导入'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            按模板填写标签：每行一个标签，列依次为「标签类型」「一级标签」「二级标签」「说明」「颜色」。
            标签类型不存在时自动新增；「二级标签」留空则作为一级标签。同名标签不会重复导入。
          </p>
          <a className="action-btn" style={{ alignSelf: 'flex-start', textDecoration: 'none' }} href={tagsApi.templateUrl} download="标签导入模版.xlsx">⬇ 下载模板</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label className="action-btn" style={{ cursor: 'pointer' }}>选择文件
              <input type="file" accept=".xlsx" style={{ display: 'none' }}
                onChange={(e) => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }} />
            </label>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
              {importFile ? importFile.name : '未选择文件（.xlsx）'}
            </span>
          </div>
          {importResult?.error && (
            <div style={{ padding: '0.75rem 1rem', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-sunken)', lineHeight: 1.7 }}>
              <span style={{ color: 'var(--state-error)' }}>导入失败：{importResult.error}</span>
            </div>
          )}
        </div>
      </Modal>

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
