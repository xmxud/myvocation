import { useState, useCallback, useRef, useEffect } from 'react';
import ThemeListPage from '../ThemeListPage.jsx';
import PhaseListPage from '../PhaseListPage.jsx';
import PlanManagementPage from '../PlanManagementPage.jsx';
import TagListPage from '../TagListPage.jsx';
import TaskExecutionPage from '../TaskExecutionPage.jsx';
import MistakesPage from '../MistakesPage.jsx';
import PhaseCheckpointsPage from '../PhaseCheckpointsPage.jsx';

// ── Menu Configuration ──
const MENU_CONFIG = [
  {
    id: 'console',
    label: '控制台',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
    children: [
      { id: 'console-dashboard', label: '统计分析' },
      { id: '__dashboard', label: '前台主页', external: true },
    ],
  },
  {
    id: 'theme',
    label: '主题管理',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    children: [
      { id: 'theme-list', label: '主题列表' },
      { id: 'phase-planning', label: '阶段规划' },
      { id: 'plan-management', label: '计划管理' },
      { id: 'tag-management', label: '标签管理' },
    ],
  },
  {
    id: 'execution',
    label: '执行管理',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    children: [
      { id: 'task-execution', label: '任务执行' },
      { id: 'action-statistics', label: '行动统计' },
    ],
  },
  {
    id: 'evaluation',
    label: '检查评估',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    children: [
      { id: 'effect-evaluation', label: '阶段成果' },
      { id: 'phase-checkpoints', label: '阶段检查点' },
    ],
  },
  {
    id: 'review',
    label: '行动复盘',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    ),
    children: [
      { id: 'error-analysis', label: '错题管理' },
      { id: 'key-knowledge', label: '重点知识' },
    ],
  },
  {
    id: 'system',
    label: '系统管理',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    children: [
      { id: 'user-management', label: '用户管理' },
      { id: 'system-config', label: '系统配置' },
    ],
  },
];

// ── Placeholder page component ──
function PlaceholderPage({ title, description }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: 64, height: 64,
        borderRadius: '50%',
        background: 'var(--color-primary-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.5rem',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      </div>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.25rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        color: 'var(--color-text-primary)',
        margin: '0 0 0.5rem',
      }}>
        {title}
      </h2>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.875rem',
        color: 'var(--color-text-tertiary)',
        margin: 0,
        maxWidth: 360,
      }}>
        {description || '功能开发中，敬请期待...'}
      </p>
    </div>
  );
}

// ── Page registry ──
const PAGE_MAP = {
  'console-dashboard': { title: '统计分析', description: '系统概览面板，关键指标和数据一览' },
  'theme-list': { title: '主题列表', description: '管理和浏览所有主题，创建、编辑和删除主题条目' },
  'phase-planning': { title: '阶段规划', description: '为每个主题制定阶段目标和里程碑计划' },
  'plan-management': { title: '计划管理', description: '管理年度、月度计划，追踪执行进度' },
  'task-execution': { title: '任务执行', description: '执行每日任务打卡，记录执行情况' },
  'action-statistics': { title: '行动统计', description: '统计行动执行数据，分析完成率和趋势' },
  'effect-evaluation': { title: '阶段成果', description: '评估各项计划和行动的执行效果' },
  'phase-checkpoints': { title: '阶段检查点', description: '查看和管理阶段检查点，追踪关键里程碑' },
  'error-analysis': { title: '错题管理', description: '收集和管理错题，识别薄弱环节' },
  'key-knowledge': { title: '重点知识', description: '整理和回顾重点知识，强化记忆' },
  'user-management': { title: '用户管理', description: '管理系统用户，分配角色和权限' },
  'system-config': { title: '系统配置', description: '配置系统参数、通知和基础设置' },
};

// ── Logo ──
function LogoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" stroke="#00FF66" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="18" stroke="#00FF66" strokeWidth="0.75" opacity="0.4" />
      <polygon points="24,6 26,22 24,24 22,22" fill="#00FF66" opacity="0.9" />
      <polygon points="24,42 22,26 24,24 26,26" fill="#00FF66" opacity="0.3" />
      <polygon points="6,24 22,22 24,24 22,26" fill="#00FF66" opacity="0.3" />
      <polygon points="42,24 26,26 24,24 26,22" fill="#00FF66" opacity="0.3" />
      <circle cx="24" cy="24" r="3" fill="#00FF66" />
      <line x1="24" y1="3" x2="24" y2="5" stroke="#00FF66" strokeWidth="1.5" />
      <line x1="24" y1="43" x2="24" y2="45" stroke="#00FF66" strokeWidth="1.5" />
      <line x1="3" y1="24" x2="5" y2="24" stroke="#00FF66" strokeWidth="1.5" />
      <line x1="43" y1="24" x2="45" y2="24" stroke="#00FF66" strokeWidth="1.5" />
    </svg>
  );
}

export default function AdminLayout({ onBack, onNavigate, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(new Set(MENU_CONFIG.map((m) => m.id)));
  const [activePage, setActivePage] = useState('console-dashboard');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })();

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleGroup = useCallback((groupId) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const handleMenuClick = useCallback((childId) => {
    if (childId === '__dashboard') {
      onNavigate('home');
      return;
    }
    setActivePage(childId);
  }, [onNavigate]);

  const pageInfo = PAGE_MAP[activePage] || { title: '未知页面', description: '' };

  // Build breadcrumb from active menu item
  const breadcrumb = (() => {
    for (const group of MENU_CONFIG) {
      const child = group.children.find((c) => c.id === activePage);
      if (child) return { group: group.label, page: child.label };
    }
    return { group: '', page: activePage };
  })();

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${collapsed ? 'admin-sidebar--collapsed' : ''}`}>
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__logo">
            <LogoIcon />
          </div>
          {!collapsed && <span className="admin-sidebar__title">行动小助理</span>}
        </div>

        <nav className="admin-sidebar__nav">
          {MENU_CONFIG.map((group) => (
            <div key={group.id} className="admin-menu-group">
              <button
                className="admin-menu-group__trigger"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={expandedGroups.has(group.id)}
              >
                <span className="admin-menu-group__icon">{group.icon}</span>
                {!collapsed && (
                  <>
                    <span className="admin-menu-group__label">{group.label}</span>
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`admin-menu-group__arrow ${expandedGroups.has(group.id) ? 'is-open' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </>
                )}
              </button>
              {expandedGroups.has(group.id) && !collapsed && (
                <div className="admin-menu-group__children">
                  {group.children.map((child) => (
                    <button
                      key={child.id}
                      className={`admin-menu-item ${activePage === child.id ? 'admin-menu-item--active' : ''} ${child.external ? 'admin-menu-item--external' : ''}`}
                      onClick={() => handleMenuClick(child.id)}
                    >
                      <span className="admin-menu-item__dot" />
                      <span className="admin-menu-item__label">{child.label}</span>
                      {child.external && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', opacity: 0.5 }}>
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          {!collapsed && <span className="admin-sidebar__version">v2.0.0</span>}
        </div>
      </aside>

      {/* Main area */}
      <div className="admin-main">
        {/* Top bar */}
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button className="admin-topbar__collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label="切换侧边栏">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="admin-topbar__breadcrumb">
              <span className="admin-topbar__breadcrumb-group">{breadcrumb.group}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="admin-topbar__breadcrumb-current">{breadcrumb.page}</span>
            </div>
          </div>
          <div className="admin-topbar__right">
            <button className="admin-topbar__back-btn" onClick={onBack} title="返回前台主页">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
              <span className="admin-topbar__back-text">前台主页</span>
            </button>
            <div className="admin-topbar__user-menu" ref={userMenuRef}>
              <button
                className="admin-topbar__user-trigger"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="用户菜单"
                aria-expanded={userMenuOpen}
              >
                <div className="admin-topbar__avatar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span className="admin-topbar__username">{user?.display_name || user?.username || '用户'}</span>
                <svg
                  width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {userMenuOpen && (
                <div className="admin-topbar__dropdown">
                  <button className="admin-topbar__dropdown-item" onClick={() => { setUserMenuOpen(false); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    个人信息
                  </button>
                  <div className="admin-topbar__dropdown-divider" />
                  <button className="admin-topbar__dropdown-item admin-topbar__dropdown-item--danger" onClick={() => { onLogout(); setUserMenuOpen(false); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="admin-content">
          {activePage === 'theme-list' ? (
            <ThemeListPage embedded onNavigate={onNavigate} />
          ) : activePage === 'phase-planning' ? (
            <PhaseListPage embedded onNavigate={onNavigate} />
          ) : activePage === 'plan-management' ? (
            <PlanManagementPage embedded onNavigate={onNavigate} />
          ) : activePage === 'tag-management' ? (
            <TagListPage embedded onNavigate={onNavigate} />
          ) : activePage === 'task-execution' ? (
            <TaskExecutionPage embedded onNavigate={onNavigate} mode="today" />
          ) : activePage === 'error-analysis' ? (
            <MistakesPage embedded />
          ) : activePage === 'phase-checkpoints' ? (
            <PhaseCheckpointsPage embedded onNavigate={onNavigate} />
          ) : (
            <>
              <div className="admin-content__header">
                <h1 className="admin-content__title">{pageInfo.title}</h1>
              </div>
              <div className="admin-content__body">
                <PlaceholderPage title={pageInfo.title} description={pageInfo.description} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}