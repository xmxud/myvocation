import { useState, useEffect } from 'react';
import heroBg from '../images/hero-bg.jpg';

const NAV_ITEMS = [
  { id: 'dashboard', label: '主看板', codename: 'DASHBOARD' },
  { id: 'plans', label: '我的规划', codename: 'STRATEGIC PLAN' },
  { id: 'learn', label: '学习', codename: 'KNOWLEDGE OPS' },
  { id: 'works', label: '作品', codename: 'CREATIVE WORKS' },
  { id: 'play', label: '游玩', codename: 'RECREATION' },
  { id: 'statistics', label: '统计分析', codename: 'DATA INSIGHT' },
];

const DOMAINS = [
  {
    id: 'dashboard',
    name: '主看板',
    codename: 'DASHBOARD',
    desc: '高三备考指挥中心。倒计时、12h追踪、今日任务清单与执行跟踪，一切尽在掌控。',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
        <circle cx="24" cy="24" r="18" />
        <line x1="24" y1="6" x2="24" y2="18" />
        <line x1="24" y1="30" x2="24" y2="42" />
        <line x1="6" y1="24" x2="18" y2="24" />
        <line x1="30" y1="24" x2="42" y2="24" />
        <polyline points="18,18 6,6" />
        <polyline points="30,18 42,6" />
        <polyline points="18,30 6,42" />
        <polyline points="30,30 42,42" />
        <circle cx="24" cy="24" r="4" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'plans',
    name: '我的规划',
    codename: 'STRATEGIC PLAN',
    desc: '制定年度目标与里程碑，拆解任务，追踪进度。以战术思维规划2026年的每一步行动。',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
        <rect x="4" y="4" width="40" height="40" />
        <line x1="4" y1="16" x2="44" y2="16" />
        <line x1="4" y1="32" x2="44" y2="32" />
        <line x1="16" y1="4" x2="16" y2="44" />
        <line x1="32" y1="4" x2="32" y2="44" />
        <circle cx="24" cy="24" r="4" fill="currentColor" />
        <line x1="24" y1="12" x2="24" y2="18" />
        <line x1="24" y1="30" x2="24" y2="36" />
        <line x1="12" y1="24" x2="18" y2="24" />
        <line x1="30" y1="24" x2="36" y2="24" />
      </svg>
    ),
  },
  {
    id: 'learn',
    name: '学习',
    codename: 'KNOWLEDGE OPS',
    desc: '技术栈升级、读书笔记、课程追踪。持续获取新知识，强化个人核心竞争力。',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M4 8v28l20 8 20-8V8L24 16 4 8z" />
        <path d="M24 16v28" />
        <path d="M12 12l12 6 12-6" />
      </svg>
    ),
  },
  {
    id: 'works',
    name: '作品',
    codename: 'CREATIVE WORKS',
    desc: '项目作品集、代码仓库、设计产出。记录每一次从0到1的创造过程。',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
        <rect x="6" y="6" width="14" height="14" />
        <rect x="28" y="6" width="14" height="14" />
        <rect x="6" y="28" width="14" height="14" />
        <rect x="28" y="28" width="14" height="14" />
        <circle cx="13" cy="13" r="2" fill="currentColor" />
        <path d="M32 13l4 4 4-4" />
        <line x1="10" y1="35" x2="16" y2="35" />
        <rect x="31" y="31" width="8" height="8" />
      </svg>
    ),
  },
  {
    id: 'play',
    name: '游玩',
    codename: 'RECREATION',
    desc: '游戏战绩、旅行足迹、兴趣探索。在娱乐中放松身心，拓宽视野与体验。',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M10 14h28a6 6 0 016 6v8a6 6 0 01-6 6H28l-4 4-4-4H10a6 6 0 01-6-6v-8a6 6 0 016-6z" />
        <line x1="12" y1="22" x2="16" y2="22" />
        <line x1="14" y1="20" x2="14" y2="24" />
        <circle cx="32" cy="22" r="1.5" fill="currentColor" />
        <circle cx="36" cy="26" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'statistics',
    name: '统计分析',
    codename: 'DATA INSIGHT',
    desc: '把执行数据汇总成进展图与完成率，为下一阶段的调整提供清晰依据。',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
        <rect x="6" y="6" width="36" height="36" />
        <line x1="6" y1="16" x2="42" y2="16" />
        <line x1="6" y1="32" x2="42" y2="32" />
        <line x1="16" y1="6" x2="16" y2="42" />
        <line x1="32" y1="6" x2="32" y2="42" />
        <circle cx="24" cy="24" r="6" />
      </svg>
    ),
  },
];

const FEATURES = [
  {
    title: '目标追踪',
    desc: '像执行任务一样管理年度目标，设定关键结果，实时追踪完成进度，确保每一步都在正确的轨道上。',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
        <circle cx="24" cy="24" r="16" />
        <circle cx="24" cy="24" r="8" />
        <circle cx="24" cy="24" r="2" fill="currentColor" />
        <line x1="24" y1="2" x2="24" y2="10" />
        <line x1="24" y1="38" x2="24" y2="46" />
        <line x1="2" y1="24" x2="10" y2="24" />
        <line x1="38" y1="24" x2="46" y2="24" />
      </svg>
    ),
  },
  {
    title: '持续进化',
    desc: '每天进步一点点，通过刻意练习和反馈循环，在学习、工作、生活各方面实现螺旋式上升。',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M24 4L6 12v12c0 10 8 18 18 20 10-2 18-10 18-20V12L24 4z" />
        <path d="M16 24l6 6 10-12" />
      </svg>
    ),
  },
  {
    title: '数据驱动',
    desc: '用量化的数据记录习惯养成、学习时长、项目进度，让成长可见，让决策有据可依。',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
        <rect x="6" y="6" width="36" height="36" />
        <line x1="6" y1="16" x2="42" y2="16" />
        <line x1="6" y1="32" x2="42" y2="32" />
        <line x1="16" y1="6" x2="16" y2="42" />
        <line x1="32" y1="6" x2="32" y2="42" />
        <circle cx="24" cy="24" r="6" />
        <circle cx="24" cy="24" r="1.5" fill="currentColor" />
        <line x1="24" y1="14" x2="24" y2="18" />
        <line x1="24" y1="30" x2="24" y2="34" />
        <line x1="14" y1="24" x2="18" y2="24" />
        <line x1="30" y1="24" x2="34" y2="24" />
      </svg>
    ),
  },
];

function LogoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="2" y="2" width="28" height="28" stroke="#00FF66" strokeWidth="2" />
      <rect x="6" y="6" width="20" height="20" stroke="#00FF66" strokeWidth="1" opacity="0.5" />
      <text x="16" y="21" textAnchor="middle" fill="#00FF66" fontFamily="Orbitron, monospace" fontSize="14" fontWeight="900">
        26
      </text>
      <line x1="2" y1="12" x2="6" y2="12" stroke="#00FF66" strokeWidth="1" />
      <line x1="2" y1="20" x2="6" y2="20" stroke="#00FF66" strokeWidth="1" />
      <line x1="26" y1="12" x2="30" y2="12" stroke="#00FF66" strokeWidth="1" />
      <line x1="26" y1="20" x2="30" y2="20" stroke="#00FF66" strokeWidth="1" />
      <line x1="12" y1="2" x2="12" y2="6" stroke="#00FF66" strokeWidth="1" />
      <line x1="20" y1="2" x2="20" y2="6" stroke="#00FF66" strokeWidth="1" />
      <line x1="12" y1="26" x2="12" y2="30" stroke="#00FF66" strokeWidth="1" />
      <line x1="20" y1="26" x2="20" y2="30" stroke="#00FF66" strokeWidth="1" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <line x1="4" y1="10" x2="16" y2="10" />
      <polyline points="10,4 16,10 10,16" />
    </svg>
  );
}

export default function HomePage({ onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('');
  const [backendStatus, setBackendStatus] = useState('检测中...');

  useEffect(() => {
    fetch('http://localhost:3001/api/health')
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.message || '系统在线'))
      .catch(() => setBackendStatus('离线模式'));
  }, []);

  const handleNavClick = (id) => {
    if (onNavigate && (id === 'dashboard' || id === 'plans' || id === 'statistics')) {
      const pageMap = {
        dashboard: 'dashboard',
        plans: 'plans',
        statistics: 'statistics',
      };
      onNavigate(pageMap[id]);
      setMenuOpen(false);
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMenuOpen(false);
    setActiveNav(id);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMenuOpen(false);
    setActiveNav(id);
  };

  return (
    <>
      {/* Navigation */}
      <nav className="nav-header" role="navigation" aria-label="主导航">
        <div className="nav-scanlines"></div>
        <div className="nav-inner">
          <div className="logo-wrapper">
            <div className="logo-icon">
              <LogoIcon />
            </div>
            <a href="#" className="logo-text" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); setActiveNav(''); setMenuOpen(false); }}>
              2026 IN MOTION
            </a>
          </div>

          <button
            className="nav-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="切换菜单"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`nav-link ${activeNav === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section id="home" className="hero-section">
          <div className="hero-bg">
            <img src={heroBg} alt="Tactical Command Center" />
          </div>
          <div className="hero-overlay"></div>
          <div className="hero-grid tactical-grid"></div>
          <div className="hero-scanline scan-line"></div>

          <div className="hero-content-wrapper">
            <div className="hero-content-container">
              <div className="hero-content-area">
                <p className="text-caption hero-caption">
                  PERSONAL COMMAND CENTER // 2026
                </p>
                <h1 className="text-display-lg hero-title">
                  2026我在行动
                </h1>
                <h2 className="text-heading hero-subtitle">
                  PLAN. LEARN. CREATE. LIVE.
                </h2>
                <p className="text-body hero-desc">
                  2026年，新的战场。以战术思维规划目标，以持续行动书写成长。在这里记录规划、学习、创作、娱乐与日常的每一步，打造属于个人的指挥中心。
                </p>
                <div className="hero-status">
                  <span className="status-dot"></span>
                  <span>SYSTEM STATUS: {backendStatus}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Domains Section - 5 Categories */}
        <section id="domains" className="domains-section">
          <div className="section-header">
            <p className="text-label section-label">MISSION DOMAINS</p>
            <h2 className="text-display section-title">五大行动领域</h2>
          </div>

          <div className="section-container">
            <div className="domains-grid">
              {DOMAINS.map((domain) => (
                <div
                  key={domain.id}
                  id={domain.id}
                  className="domain-card"
                  onClick={() => handleNavClick(domain.id)}
                >
                  <div className="domain-icon">{domain.icon}</div>
                  <h3 className="domain-name">{domain.name}</h3>
                  <p className="domain-codename">{domain.codename}</p>
                  <p className="domain-desc">{domain.desc}</p>
                  <div className="domain-arrow">
                    <ArrowIcon />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section - Core Systems */}
        <section className="features-section">
          <div className="section-header">
            <p className="text-label section-label">CORE SYSTEMS</p>
            <h2 className="text-display section-title">核心能力系统</h2>
          </div>

          <div className="section-container">
            <div className="features-grid">
              {FEATURES.map((feature, idx) => (
                <div key={idx} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-desc">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Stats Bar */}
            <div className="stats-bar">
              <div className="stat-item">
                <div className="stat-value">365</div>
                <div className="stat-label">天行动周期</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">5</div>
                <div className="stat-label">核心领域</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">∞</div>
                <div className="stat-label">成长可能</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">01</div>
                <div className="stat-label">当前月份</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-grid-bg tactical-grid"></div>
          <div className="cta-content">
            <p className="text-caption cta-caption">READY FOR DEPLOYMENT?</p>
            <h2 className="text-display cta-title">开启2026行动</h2>
            <p className="text-body cta-desc">
              每一天都是新的任务。立即开始记录你的行动轨迹，让成长清晰可见。
            </p>
            <button
              className="cta-button"
              onClick={() => {
                if (onNavigate) onNavigate('plans');
              }}
            >
              开始行动
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="global-footer" role="contentinfo">
        <div className="footer-accent-line"></div>
        <div className="footer-inner">
          <div className="footer-brand">
            <p className="footer-brand-name">2026 IN MOTION</p>
            <p className="footer-brand-desc">
              2026我在行动 — 个人年度指挥中心。<br />规划目标、记录成长、追踪进度、管理生活。
            </p>
          </div>

          <div className="footer-links">
            {NAV_ITEMS.map((item, idx) => (
              <span key={item.id} style={{ display: 'contents' }}>
                <button className="footer-link" onClick={() => handleNavClick(item.id)}>
                  {item.label}
                </button>
                {idx < NAV_ITEMS.length - 1 && (
                  <span className="footer-separator">|</span>
                )}
              </span>
            ))}
          </div>

          <div className="footer-copyright">
            &copy; 2026 MY VOCATION. ALL SYSTEMS OPERATIONAL.
          </div>
        </div>
      </footer>
    </>
  );
}
