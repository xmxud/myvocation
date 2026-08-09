/* ========================================
   重点（FOCUS_ITEM）图标库 — 抽取自 PlansPage
   HUD 风格 SVG：stroke=currentColor, fill=none, strokeWidth=2
   供 ThemeFocusModal / ThemeDetailModal / NodeTree 复用
   ======================================== */

export function TravelIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <circle cx="24" cy="24" r="18" />
      <path d="M4 24h40" />
      <path d="M24 6c-6 6-6 30 0 36" />
      <path d="M24 6c6 6 6 30 0 36" />
      <circle cx="24" cy="24" r="4" fill="currentColor" />
    </svg>
  );
}

export function RobotIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <rect x="10" y="14" width="28" height="24" rx="2" />
      <circle cx="18" cy="24" r="3" fill="currentColor" />
      <circle cx="30" cy="24" r="3" fill="currentColor" />
      <line x1="18" y1="32" x2="30" y2="32" />
      <line x1="24" y1="14" x2="24" y2="8" />
      <circle cx="24" cy="6" r="2" fill="currentColor" />
      <line x1="10" y1="20" x2="4" y2="20" />
      <line x1="38" y1="20" x2="44" y2="20" />
      <line x1="14" y1="38" x2="14" y2="44" />
      <line x1="34" y1="38" x2="34" y2="44" />
    </svg>
  );
}

export function BrainIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M24 6c-5 0-9 4-9 9-3 1-5 4-5 7s2 6 5 7c0 4 3 7 7 7 2 0 4-1 5-3 1 2 3 3 5 3 4 0 7-3 7-7 3-1 5-4 5-7s-2-6-5-7c0-5-4-9-9-9-1 0-2 0-3 1-1-1-2-1-3-1z" />
      <line x1="24" y1="12" x2="24" y2="38" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" />
      <circle cx="30" cy="20" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function BookIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M6 8v32l18-6 18 6V8l-18 6L6 8z" />
      <path d="M24 14v26" />
      <line x1="12" y1="16" x2="20" y2="14" />
      <line x1="12" y1="22" x2="20" y2="20" />
    </svg>
  );
}

export function MathIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <rect x="6" y="6" width="36" height="36" />
      <line x1="14" y1="18" x2="34" y2="18" />
      <line x1="24" y1="14" x2="24" y2="34" />
      <line x1="14" y1="28" x2="20" y2="28" />
      <line x1="28" y1="28" x2="34" y2="28" />
      <line x1="14" y1="34" x2="20" y2="34" />
      <line x1="28" y1="34" x2="34" y2="34" />
    </svg>
  );
}

export function GlobeIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <circle cx="24" cy="24" r="18" />
      <ellipse cx="24" cy="24" rx="8" ry="18" />
      <line x1="6" y1="16" x2="42" y2="16" />
      <line x1="6" y1="32" x2="42" y2="32" />
      <line x1="24" y1="6" x2="24" y2="42" />
    </svg>
  );
}

export function CodeIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <rect x="4" y="8" width="40" height="32" />
      <line x1="4" y1="16" x2="44" y2="16" />
      <circle cx="10" cy="12" r="1.5" fill="currentColor" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" />
      <circle cx="20" cy="12" r="1.5" fill="currentColor" />
      <polyline points="16,24 20,28 16,32" />
      <polyline points="32,24 28,28 32,32" />
      <line x1="24" y1="22" x2="28" y2="34" />
    </svg>
  );
}

export function DumbbellIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <rect x="4" y="18" width="6" height="12" />
      <rect x="38" y="18" width="6" height="12" />
      <rect x="10" y="20" width="4" height="8" />
      <rect x="34" y="20" width="4" height="8" />
      <line x1="14" y1="24" x2="34" y2="24" />
    </svg>
  );
}

export function BookOpenIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M4 10v28l20-6 20 6V10l-20 6L4 10z" />
      <path d="M24 16v22" />
      <path d="M4 10l20 6 20-6" />
    </svg>
  );
}

export function GamepadIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M10 16h28a6 6 0 016 6v4a6 6 0 01-6 6h-4l-4-4h-12l-4 4h-4a6 6 0 01-6-6v-4a6 6 0 016-6z" />
      <line x1="14" y1="22" x2="18" y2="22" />
      <line x1="16" y1="20" x2="16" y2="24" />
      <circle cx="32" cy="22" r="1.5" fill="currentColor" />
      <circle cx="36" cy="26" r="1.5" fill="currentColor" />
    </svg>
  );
}

/* 按代号自动匹配的兜底图标 */
export const FOCUS_ICON_MAP = {
  TRAVEL: <TravelIcon />,
  ROBOTICS: <RobotIcon />,
  ZHILIFANG: <BrainIcon />,
  HOMEWORK: <BookIcon />,
  MATH: <MathIcon />,
  ENGLISH: <GlobeIcon />,
  'AI CODE': <CodeIcon />,
  SPORTS: <DumbbellIcon />,
  READING: <BookOpenIcon />,
  GAMING: <GamepadIcon />,
};

/* 重点编辑表单中的可选图标 */
export const ICON_OPTIONS = [
  { label: '旅行',  value: 'TravelIcon',    component: <TravelIcon /> },
  { label: '机器人', value: 'RobotIcon',     component: <RobotIcon /> },
  { label: '大脑',  value: 'BrainIcon',     component: <BrainIcon /> },
  { label: '书本',  value: 'BookIcon',      component: <BookIcon /> },
  { label: '数学',  value: 'MathIcon',      component: <MathIcon /> },
  { label: '地球',  value: 'GlobeIcon',     component: <GlobeIcon /> },
  { label: '代码',  value: 'CodeIcon',      component: <CodeIcon /> },
  { label: '健身',  value: 'DumbbellIcon',  component: <DumbbellIcon /> },
  { label: '阅读',  value: 'BookOpenIcon',  component: <BookOpenIcon /> },
  { label: '游戏',  value: 'GamepadIcon',   component: <GamepadIcon /> },
];

/* 解析重点节点图标：优先 extra_data.icon，否则按代号匹配，兜底书本 */
export function getFocusIcon(item) {
  try {
    const extra = item.extra_data ? JSON.parse(item.extra_data) : null;
    if (extra && extra.icon) {
      const match = ICON_OPTIONS.find((o) => o.value === extra.icon);
      if (match) return match.component;
    }
  } catch (_) { /* ignore */ }
  return FOCUS_ICON_MAP[item.codename] || <BookIcon />;
}
