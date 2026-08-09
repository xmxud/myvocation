import { getFocusIcon } from './FocusIcons.jsx';

/* ========================================
   轻量递归树组件 — 渲染 planning_nodes 节点树
   node: getFullTree 返回的节点（含递归 children）
   renderActions(node, depth): 可选，返回行内操作按钮（如重点的编辑/删除）
   ======================================== */

/* 节点类型的中文标签 */
const TYPE_LABELS = {
  THEME: '主题',
  FOCUS_ITEM: '重点',
  TASK: '任务',
  SUBTASK: '子任务',
};

export default function NodeTree({ node, depth = 0, renderActions = null }) {
  if (!node) return null;
  const children = node.children || [];
  const isFocus = node.node_type === 'FOCUS_ITEM';
  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 0',
        paddingLeft: depth * 20,
        borderBottom: '1px solid var(--color-border-subtle)',
      }}>
        {isFocus && (
          <span style={{ width: '20px', height: '20px', color: 'var(--color-text-accent)', flexShrink: 0, display: 'inline-flex' }}>
            {getFocusIcon(node)}
          </span>
        )}
        <span style={{ fontWeight: depth === 0 ? 700 : 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.title}
        </span>
        {node.node_type && TYPE_LABELS[node.node_type] && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.625rem',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border-default)',
            padding: '1px 6px',
            flexShrink: 0,
          }}>
            {TYPE_LABELS[node.node_type]}
          </span>
        )}
        {renderActions && renderActions(node, depth)}
      </div>
      {children.map((child) => (
        <NodeTree key={child.id} node={child} depth={depth + 1} renderActions={renderActions} />
      ))}
    </div>
  );
}
