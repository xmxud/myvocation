import { useEffect, useState } from 'react';
import { statisticsApi, themesApi } from '../src/utils/api.js';

export default function StatisticsPage({ onBack }) {
  const [themes, setThemes] = useState([]);
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [themeDetail, setThemeDetail] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadThemes() {
      try {
        setLoading(true);
        const data = await themesApi.getThemes(1, 10);
        const fetchedThemes = data.themes || [];
        setThemes(fetchedThemes);
        if (fetchedThemes.length > 0) {
          setSelectedThemeId(String(fetchedThemes[0].id));
        }
      } catch (err) {
        setError(err.message || '加载主题失败');
      } finally {
        setLoading(false);
      }
    }

    loadThemes();
  }, []);

  useEffect(() => {
    if (!selectedThemeId) return;

    async function loadStats() {
      try {
        setError('');
        const [detail, result] = await Promise.all([
          themesApi.getTheme(selectedThemeId),
          statisticsApi.getThemeStats(selectedThemeId),
        ]);
        setThemeDetail(detail);
        setStats(result);
      } catch (err) {
        setError(err.message || '加载统计数据失败');
      }
    }

    loadStats();
  }, [selectedThemeId]);

  const summaryCards = [
    { label: '完成度', value: stats?.completion_rate != null ? `${stats.completion_rate}%` : '--' },
    { label: '累计执行次数', value: stats?.total_executions ?? '--' },
    { label: '重点项数量', value: themeDetail?.focusItems?.length ?? '--' },
    { label: '平均完成率', value: stats?.average_completion_rate != null ? `${stats.average_completion_rate}%` : '--' },
  ];

  return (
    <div className="plans-page" style={{ paddingBottom: '48px' }}>
      <nav className="plan-nav-header" role="navigation" aria-label="页面导航">
        <div className="nav-scanlines"></div>
        <div className="plan-nav-inner">
          <button className="back-button" onClick={onBack}>
            <span>←</span>
            <span>返回指挥中心</span>
          </button>
          <div className="plan-breadcrumb">
            <span className="breadcrumb-item">HOME</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-item breadcrumb-current">STATISTICS</span>
          </div>
        </div>
      </nav>

      <section className="plan-hero" style={{ minHeight: '260px' }}>
        <div className="plan-hero-content">
          <div className="plan-hero-corner-box">
            <p className="text-caption plan-hero-caption">STATISTICS // ANALYTICS</p>
            <h1 className="text-display plan-hero-title">统计分析</h1>
            <h2 className="text-heading plan-hero-subtitle">把执行轨迹变成可视化的成长洞察</h2>
          </div>
        </div>
      </section>

      <section className="plan-section plan-section-alt">
        <div className="plan-section-header">
          <p className="text-label section-label">THEME INSIGHT</p>
          <h2 className="text-display section-title">选择主题查看趋势</h2>
        </div>

        {loading && <p className="theme-loading">正在加载主题统计...</p>}
        {error && <p className="theme-loading" style={{ color: '#ff7a59' }}>{error}</p>}

        <label style={{ display: 'grid', gap: '6px', maxWidth: '320px' }}>
          <span>选择主题</span>
          <select value={selectedThemeId} onChange={(event) => setSelectedThemeId(event.target.value)} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }}>
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>{theme.title}</option>
            ))}
          </select>
        </label>

        <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginTop: '18px' }}>
          {summaryCards.map((card) => (
            <div key={card.label} style={{ border: '1px solid rgba(255,255,255,0.14)', borderRadius: '14px', padding: '16px', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '8px' }}>{card.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{card.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '14px', padding: '16px', background: 'rgba(255,255,255,0.03)' }}>
          <h3 style={{ marginBottom: '8px' }}>当前主题概览</h3>
          <p style={{ color: '#9CA3AF', lineHeight: 1.6 }}>
            {themeDetail?.title || '请选择主题'}
            {themeDetail?.description ? ` · ${themeDetail.description}` : ''}
          </p>
        </div>
      </section>
    </div>
  );
}
