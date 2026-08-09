import { useState, useEffect, useCallback } from 'react';
import { nodesApi } from '../utils/api.js';
import Modal from './Modal.jsx';
import NodeTree from './NodeTree.jsx';
import { ICON_OPTIONS, FOCUS_ICON_MAP, BookIcon } from './FocusIcons.jsx';

/* ========================================
   重点编辑弹窗 — 编辑指定主题下的重点（FOCUS_ITEM）
   树形展示：主题 → 重点 → 子节点（重点层级可增删改，更深层级只读）
   CRUD 逻辑复用自 PlansPage 的重点编辑
   ======================================== */

const EMPTY_FORM = { title: '', codename: '', priority: 'MEDIUM', description: '', icon: '' };

export default function ThemeFocusModal({ open, onClose, theme }) {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // 重点编辑表单（嵌套弹窗）
  const [formOpen, setFormOpen] = useState(false);
  const [editingFocus, setEditingFocus] = useState(null);
  const [focusForm, setFocusForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadTree = useCallback(async () => {
    if (!theme) return;
    setLoading(true);
    setError('');
    try {
      const data = await nodesApi.getFullTree(theme.id);
      setTree(data);
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [theme]);

  useEffect(() => {
    if (open) loadTree();
  }, [open, loadTree]);

  // ── 重点表单 ──
  const openFocusForm = (item = null) => {
    if (item) {
      let savedIcon = '';
      try { const ex = JSON.parse(item.extra_data || '{}'); savedIcon = ex.icon || ''; } catch (_) { /* */ }
      setEditingFocus(item);
      setFocusForm({
        title: item.title || '',
        codename: item.codename || '',
        priority: item.priority || 'MEDIUM',
        description: item.description || '',
        icon: savedIcon,
      });
    } else {
      setEditingFocus(null);
      setFocusForm(EMPTY_FORM);
    }
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!focusForm.title.trim()) {
      setFormError('名称不能为空');
      return;
    }
    // 合并已有 extra_data，只更新 icon
    let existingExtra = {};
    if (editingFocus) { try { existingExtra = JSON.parse(editingFocus.extra_data || '{}'); } catch (_) { /* */ } }
    const extra = { ...existingExtra };
    if (focusForm.icon) extra.icon = focusForm.icon;
    // 编辑时保留原代号，防止自动生成中文代号导致图标匹配失败
    const codename = focusForm.codename.trim() || (editingFocus ? editingFocus.codename : focusForm.title.trim().toUpperCase());

    const payload = {
      node_type: 'FOCUS_ITEM',
      parent_id: theme.id,
      title: focusForm.title.trim(),
      codename,
      priority: focusForm.priority,
      description: focusForm.description.trim(),
      extra_data: Object.keys(extra).length > 0 ? JSON.stringify(extra) : null,
    };
    setSaving(true);
    setFormError('');
    try {
      if (editingFocus) {
        await nodesApi.updateNode(editingFocus.id, payload);
      } else {
        await nodesApi.createNode(payload);
      }
      setFormOpen(false);
      await loadTree();
    } catch (err) {
      setFormError(err.message || '重点保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`确定删除重点「${item.title}」吗？其下子节点将一并删除。`)) return;
    try {
      await nodesApi.deleteNode(item.id);
      await loadTree();
    } catch (err) {
      setError(err.message || '删除失败');
    }
  };

  // 仅重点（FOCUS_ITEM）层级提供编辑/删除，更深的子节点只读
  const renderActions = (node) => {
    if (node.node_type !== 'FOCUS_ITEM') return null;
    return (
      <div className="action-buttons" style={{ flexShrink: 0 }}>
        <button className="action-btn" onClick={() => openFocusForm(node)} title="编辑重点">编辑</button>
        <button className="action-btn action-btn--danger" onClick={() => handleDelete(node)} title="删除重点">删除</button>
      </div>
    );
  };

  return (
    <>
      <Modal
        title={`重点管理 — ${theme ? theme.title : ''}`}
        open={open}
        onClose={onClose}
        panelStyle={{ maxWidth: '640px' }}
        footer={
          <>
            <button className="action-btn" onClick={onClose}>关闭</button>
            <button className="cta-button" onClick={() => openFocusForm()} style={{ padding: '10px 24px', fontSize: '0.8125rem' }}>
              + 新增重点
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
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>正在同步重点数据...</p>
        ) : !tree || !tree.children || tree.children.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>暂无重点，点击下方「新增重点」开始</p>
        ) : (
          <NodeTree node={tree} renderActions={renderActions} />
        )}
      </Modal>

      {/* ── 重点新增 / 编辑表单（嵌套弹窗） ── */}
      <Modal
        title={editingFocus ? '编辑重点' : '新增重点'}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button className="action-btn" onClick={() => setFormOpen(false)}>取消</button>
            <button className="cta-button" onClick={handleSubmit} disabled={saving}
              style={{ padding: '10px 24px', fontSize: '0.8125rem', opacity: saving ? 0.6 : 1 }}>
              {saving ? '保存中...' : (editingFocus ? '更新' : '创建')}
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
            <span className="form-label">名称 *</span>
            <input className="form-input" value={focusForm.title}
              onChange={(e) => setFocusForm({ ...focusForm, title: e.target.value })}
              placeholder="例如 暑期旅游" autoFocus />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label>
              <span className="form-label">代号</span>
              <input className="form-input" value={focusForm.codename}
                onChange={(e) => setFocusForm({ ...focusForm, codename: e.target.value })}
                placeholder="例如 TRAVEL" />
            </label>
            <label>
              <span className="form-label">优先级</span>
              <select className="filter-select" style={{ width: '100%', padding: '10px 14px' }}
                value={focusForm.priority}
                onChange={(e) => setFocusForm({ ...focusForm, priority: e.target.value })}>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </label>
          </div>
          <label>
            <span className="form-label">描述</span>
            <input className="form-input" value={focusForm.description}
              onChange={(e) => setFocusForm({ ...focusForm, description: e.target.value })}
              placeholder="简要描述" />
          </label>
          <label>
            <span className="form-label">图标</span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select className="filter-select" style={{ flex: 1, padding: '10px 14px' }}
                value={focusForm.icon}
                onChange={(e) => setFocusForm({ ...focusForm, icon: e.target.value })}>
                <option value="">自动（根据代号匹配）</option>
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div style={{ width: '32px', height: '32px', color: 'var(--color-text-accent)', flexShrink: 0 }}>
                {focusForm.icon
                  ? (ICON_OPTIONS.find((o) => o.value === focusForm.icon)?.component || <BookIcon />)
                  : (FOCUS_ICON_MAP[focusForm.codename.trim().toUpperCase() || ''] || <BookIcon />)}
              </div>
            </div>
          </label>
        </form>
      </Modal>
    </>
  );
}
