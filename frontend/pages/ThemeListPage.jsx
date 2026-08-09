import { useState, useEffect, useCallback } from 'react';
import { themesApi, authApi, nodesApi } from '../src/utils/api.js';
import Modal from '../src/components/Modal.jsx';
import ThemeFocusModal from '../src/components/ThemeFocusModal.jsx';
import ThemePhasesModal from '../src/components/ThemePhasesModal.jsx';
import ThemeDetailModal from '../src/components/ThemeDetailModal.jsx';

/* ========================================
   MAIN COMPONENT
   ======================================== */

export default function ThemeListPage({ onNavigate, embedded }) {
  const [themes, setThemes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [formData, setFormData] = useState({ title: '', codename: '', description: '', tag: '', user_id: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // 行内操作弹窗状态：'focus' | 'phases' | 'detail' | null
  const [actionModal, setActionModal] = useState(null);
  const [actionTheme, setActionTheme] = useState(null);

  const openAction = (type, theme) => {
    setActionTheme(theme);
    setActionModal(type);
  };
  const closeAction = () => setActionModal(null);

  // ── Drawer: 重点管理 ──
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTheme, setDrawerTheme] = useState(null);
  const [focusItems, setFocusItems] = useState([]);
  const [focusPage, setFocusPage] = useState(1);
  const [focusTotal, setFocusTotal] = useState(0);
  const [focusLoading, setFocusLoading] = useState(false);
  const [editingFocus, setEditingFocus] = useState(null);
  const [focusForm, setFocusForm] = useState({ title: '', codename: '', priority: 'MEDIUM', description: '' });
  const focusPageSize = 10;

  const openFocusDrawer = async (theme) => {
    setDrawerTheme(theme);
    setDrawerOpen(true);
    setFocusPage(1);
    await loadFocusItems(theme.id, 1);
  };

  const loadFocusItems = async (themeId, p) => {
    setFocusLoading(true);
    try {
      const items = await nodesApi.getChildren(themeId);
      // Simple client-side pagination since API returns all children
      const offset = (p - 1) * focusPageSize;
      setFocusItems((items || []).slice(offset, offset + focusPageSize));
      setFocusTotal((items || []).length);
    } catch { setFocusItems([]); }
    finally { setFocusLoading(false); }
  };

  const handleFocusPage = (p) => {
    setFocusPage(p);
    if (drawerTheme) loadFocusItems(drawerTheme.id, p);
  };

  const startEditFocus = (item) => {
    setEditingFocus(item || { _new: true });
    setFocusForm({
      title: item?.title || '',
      codename: item?.codename || '',
      priority: item?.priority || 'MEDIUM',
      description: item?.description || '',
    });
  };

  const cancelEditFocus = () => setEditingFocus(null);

  const saveFocus = async () => {
    if (!focusForm.title.trim()) return;
    try {
      const payload = {
        node_type: 'FOCUS_ITEM',
        title: focusForm.title.trim(),
        codename: focusForm.codename.trim() || focusForm.title.trim().toUpperCase(),
        priority: focusForm.priority,
        description: focusForm.description.trim(),
      };
      if (editingFocus?.id) {
        await nodesApi.updateNode(editingFocus.id, payload);
      } else {
        payload.parent_id = drawerTheme.id;
        await nodesApi.createNode(payload);
      }
      setEditingFocus(null);
      await loadFocusItems(drawerTheme.id, focusPage);
    } catch (e) {
      setError(e.message || '保存失败');
    }
  };

  const deleteFocus = async (item) => {
    if (!confirm(`确定删除「${item.title}」吗？`)) return;
    try {
      await nodesApi.deleteNode(item.id);
      await loadFocusItems(drawerTheme.id, focusPage);
    } catch (e) {
      setError(e.message || '删除失败');
    }
  };

  const loadThemes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await themesApi.getThemes(page, pageSize);
      setThemes(data.themes || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadThemes(); }, [loadThemes]);

  useEffect(() => { authApi.getUsers().then(setUsers).catch(() => {}); }, []);

  // ── Modal handlers ──
  const openCreate = () => {
    setEditingTheme(null);
    setFormData({ title: '', codename: '', description: '', tag: '', user_id: '' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (theme) => {
    setEditingTheme(theme);
    setFormData({
      title: theme.title || '',
      codename: theme.codename || '',
      description: theme.description || '',
      tag: theme.tag || '',
      user_id: theme.user_id ? String(theme.user_id) : '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('标题不能为空');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        node_type: 'THEME',
        title: formData.title.trim(),
        codename: formData.codename.trim() || formData.title.trim().toUpperCase(),
        description: formData.description.trim(),
        tag: formData.tag.trim() || null,
        user_id: formData.user_id ? Number(formData.user_id) : 1,
      };
      if (editingTheme) {
        await themesApi.updateTheme(editingTheme.id, payload);
      } else {
        await themesApi.createTheme(payload);
      }
      setModalOpen(false);
      await loadThemes();
    } catch (err) {
      setFormError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (theme) => {
    if (!confirm(`确定删除主题「${theme.title}」吗？此操作不可撤销。`)) return;
    try {
      await themesApi.deleteTheme(theme.id);
      await loadThemes();
    } catch (err) {
      setError(err.message || '删除失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className={embedded ? '' : 'plans-page'}>
      {/* Top Nav — skip when embedded */}
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
              <span className="breadcrumb-current">主题管理</span>
            </div>
          </div>
        </nav>
      )}

      <div style={embedded ? { padding: '0 1.5rem' } : { padding: '80px 1.5rem 0', maxWidth: '72rem', margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="text-label section-label">THEME MANAGEMENT</p>
          <h1 className="text-display" style={{ marginBottom: 0 }}>主题管理</h1>
        </div>

        {/* Toolbar */}
        <div className="toolbar" style={{ marginBottom: '1.25rem' }}>
          <div className="toolbar-left">
            {error && <span style={{ color: 'var(--state-error)', fontSize: '0.8125rem' }}>{error}</span>}
          </div>
          <button className="cta-button" onClick={openCreate} style={{ padding: '10px 24px', fontSize: '0.8125rem' }}>
            + 新建主题
          </button>
        </div>

        {/* Table */}
        <div style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-default)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>标题</th>
                <th>代号</th>
                <th>标签</th>
                <th>所属用户</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center">正在同步主题数据...</td></tr>
              ) : themes.length === 0 ? (
                <tr><td colSpan={6} className="text-center">暂无主题，点击「新建主题」开始</td></tr>
              ) : themes.map((theme) => {
                const owner = users.find(u => u.id === theme.user_id);
                return (
                <tr key={theme.id}>
                  <td style={{ fontWeight: 600 }}>{theme.title}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-accent)' }}>
                    {theme.codename}
                  </td>
                  <td>
                    {theme.tag ? (
                      <span className="status-badge status-badge--active">{theme.tag}</span>
                    ) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>
                    {owner ? owner.display_name : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                  </td>
                  <td>
                    <span className={`status-badge ${theme.is_completed ? 'status-badge--done' : 'status-badge--active'}`}>
                      {theme.is_completed ? 'DONE' : 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn" onClick={() => openFocusDrawer(theme)}
                        title="管理重点">重点</button>
                      <button className="action-btn" onClick={() => openEdit(theme)} title="编辑">编辑</button>
                      <button className="action-btn" onClick={() => openAction('detail', theme)}
                        title="查看详情">详情</button>
                      <button className="action-btn action-btn--danger" onClick={() => handleDelete(theme)}
                        title="删除">删除</button>
                    </div>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>

          {/* Pagination */}
          {total > pageSize && (
            <div className="pagination-bar">
              <button className="action-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                ◂ 上一页
              </button>
              <span className="pagination-info">
                第 {page} / {totalPages} 页（共 {total} 条）
              </span>
              <button className="action-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                下一页 ▸
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      <Modal
        title={editingTheme ? '编辑主题' : '新建主题'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="action-btn" onClick={() => setModalOpen(false)}>取消</button>
            <button className="cta-button" onClick={handleSubmit} disabled={saving}
              style={{ padding: '10px 24px', fontSize: '0.8125rem', opacity: saving ? 0.6 : 1 }}>
              {saving ? '保存中...' : (editingTheme ? '更新' : '创建')}
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
            <span className="form-label">标题 *</span>
            <input className="form-input" value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="输入主题标题" autoFocus />
          </label>
          <label>
            <span className="form-label">代号</span>
            <input className="form-input" value={formData.codename}
              onChange={(e) => setFormData({ ...formData, codename: e.target.value })}
              placeholder="如 SUMMER OPS（留空自动生成）" />
          </label>
          <label>
            <span className="form-label">标签</span>
            <input className="form-input" value={formData.tag}
              onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
              placeholder="如 summer" />
          </label>
          <label>
            <span className="form-label">所属用户</span>
            <select className="filter-select" style={{ width: '100%', padding: '10px 14px' }}
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}>
              <option value="">默认 (admin)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.display_name} ({u.username})</option>
              ))}
            </select>
          </label>
          <label>
            <span className="form-label">描述</span>
            <textarea className="form-textarea" value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="简要说明" rows={3} />
          </label>
        </form>
      </Modal>

      {/* ── 重点管理 Drawer ── */}
      {drawerOpen && drawerTheme && (
        <div className="drawer-overlay" onClick={() => { setDrawerOpen(false); setEditingFocus(null); }}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 className="drawer-title">重点管理 · {drawerTheme.title}</h2>
              <button className="drawer-close" onClick={() => { setDrawerOpen(false); setEditingFocus(null); }}>&times;</button>
            </div>
            <div className="drawer-body">
              <div className="drawer-toolbar">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                  共 {focusTotal} 项
                </span>
                <button className="cta-button" style={{ padding: '6px 16px', fontSize: '0.75rem' }}
                  onClick={() => startEditFocus(null)}>
                  + 新增重点
                </button>
              </div>

              {/* Edit form */}
              {editingFocus !== null && (
                <div style={{
                  background: 'var(--color-primary-light)',
                  border: '1px solid var(--color-border-primary)',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <input className="form-input" value={focusForm.title}
                      onChange={(e) => setFocusForm({ ...focusForm, title: e.target.value })}
                      placeholder="名称 *" autoFocus />
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <input className="form-input" value={focusForm.codename}
                        onChange={(e) => setFocusForm({ ...focusForm, codename: e.target.value })}
                        placeholder="代号" style={{ flex: 1 }} />
                      <select className="filter-select" value={focusForm.priority}
                        onChange={(e) => setFocusForm({ ...focusForm, priority: e.target.value })}
                        style={{ width: 100 }}>
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </div>
                    <input className="form-input" value={focusForm.description}
                      onChange={(e) => setFocusForm({ ...focusForm, description: e.target.value })}
                      placeholder="描述（可选）" />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
                    <button className="action-btn" onClick={cancelEditFocus}>取消</button>
                    <button className="cta-button" onClick={saveFocus}
                      style={{ padding: '6px 16px', fontSize: '0.75rem' }}>
                      {editingFocus?.id ? '更新' : '创建'}
                    </button>
                  </div>
                </div>
              )}

              {/* List */}
              {focusLoading ? (
                <div className="drawer-empty">加载中...</div>
              ) : focusItems.length === 0 ? (
                <div className="drawer-empty">暂无重点项，点击「新增重点」添加</div>
              ) : (
                <>
                  {focusItems.map((item) => (
                    <div key={item.id} className={`drawer-item-row ${editingFocus?.id === item.id ? 'editing' : ''}`}>
                      <span className="drawer-item-title">{item.title}</span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: '0.75rem', color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.description || '—'}
                      </span>
                      <span className="drawer-item-codename">
                        {item.priority === 'HIGH' ? 'HIGH' : item.priority === 'MEDIUM' ? 'MED' : 'LOW'}
                      </span>
                      <div className="drawer-item-actions">
                        <button className="action-btn" onClick={() => startEditFocus(item)}>编辑</button>
                        <button className="action-btn action-btn--danger" onClick={() => deleteFocus(item)}>删除</button>
                      </div>
                    </div>
                  ))}
                  {focusTotal > focusPageSize && (
                    <div className="drawer-pagination">
                      <button className="action-btn" disabled={focusPage <= 1}
                        onClick={() => handleFocusPage(focusPage - 1)}>◂</button>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                        {focusPage} / {Math.ceil(focusTotal / focusPageSize)}
                      </span>
                      <button className="action-btn" disabled={focusPage >= Math.ceil(focusTotal / focusPageSize)}
                        onClick={() => handleFocusPage(focusPage + 1)}>▸</button>
                    </div>
                  )}
                </>
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
