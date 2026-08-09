/* ========================================
   公共弹窗组件 — 从 ThemeListPage 抽取
   样式类见 css/styles.css（modal-overlay / modal-panel / modal-header ...）
   panelStyle 可选，用于个别弹窗调整面板宽度等内联样式
   ======================================== */

export default function Modal({ title, open, onClose, children, footer, panelStyle }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
