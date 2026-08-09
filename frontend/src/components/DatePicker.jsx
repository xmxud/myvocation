import { useState, useEffect, useRef } from 'react';

// 中文星期表头（周一在前）
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

function pad(n) { return String(n).padStart(2, '0'); }

/** 轻量日期选择组件（HUD 风格），value/onChange 使用 'YYYY-MM-DD' 字符串，空串表示未选择 */
export default function DatePicker({ value, onChange, placeholder = '选择日期', width = 140 }) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const selected = value ? new Date(value + 'T00:00:00') : null;
  const [viewYear, setViewYear] = useState((selected || today).getFullYear());
  const [viewMonth, setViewMonth] = useState((selected || today).getMonth()); // 0-11
  const rootRef = useRef(null);

  // 点击组件外部时收起
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // 打开时把视图定位到已选日期所在月份
  const toggleOpen = () => {
    if (!open && selected) { setViewYear(selected.getFullYear()); setViewMonth(selected.getMonth()); }
    setOpen(!open);
  };

  const shiftMonth = (delta) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
  };

  // 生成当月日历格子（含前后月补位，周一开头）
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // 周一=0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const pick = (d) => {
    onChange(`${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`);
    setOpen(false);
  };

  const isToday = (d) => d && viewYear === today.getFullYear() && viewMonth === today.getMonth() && d === today.getDate();
  const isSelected = (d) => d && selected && viewYear === selected.getFullYear() && viewMonth === selected.getMonth() && d === selected.getDate();

  const btnBase = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)',
    fontSize: '0.8125rem', padding: '4px 6px', lineHeight: 1,
  };

  return (
    <span ref={rootRef} style={{ position: 'relative', display: 'inline-block', width }}>
      <button type="button" className="form-input" onClick={toggleOpen}
        style={{ width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: value ? 'inherit' : 'var(--color-text-tertiary)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{value || placeholder}</span>
        <span style={{ fontSize: '0.625rem', opacity: 0.6 }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 1000,
          background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)', padding: '0.625rem', width: 238,
        }}>
          {/* 月份导航 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
            <button type="button" style={btnBase} onClick={() => shiftMonth(-1)}>‹</button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--color-text-accent)', letterSpacing: '0.05em' }}>
              {viewYear}-{pad(viewMonth + 1)}
            </span>
            <button type="button" style={btnBase} onClick={() => shiftMonth(1)}>›</button>
          </div>

          {/* 星期表头 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '0.25rem' }}>
            {WEEKDAYS.map(w => (
              <span key={w} style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>{w}</span>
            ))}
          </div>

          {/* 日期格子 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', rowGap: 2 }}>
            {cells.map((d, i) => (
              <button type="button" key={i} disabled={!d} onClick={() => pick(d)}
                style={{
                  ...btnBase,
                  visibility: d ? 'visible' : 'hidden',
                  color: isSelected(d) ? 'var(--color-bg-base)' : isToday(d) ? 'var(--color-text-accent)' : 'var(--color-text-secondary)',
                  background: isSelected(d) ? 'var(--color-text-accent)' : 'none',
                  border: isToday(d) && !isSelected(d) ? '1px solid var(--color-border-primary)' : '1px solid transparent',
                  borderRadius: 2,
                }}>
                {d || '·'}
              </button>
            ))}
          </div>

          {/* 底部快捷操作 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.375rem' }}>
            <button type="button" style={{ ...btnBase, color: 'var(--color-text-accent)' }}
              onClick={() => { onChange(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`); setOpen(false); }}>
              今天
            </button>
            <button type="button" style={btnBase} onClick={() => { onChange(''); setOpen(false); }}>清除</button>
          </div>
        </div>
      )}
    </span>
  );
}
