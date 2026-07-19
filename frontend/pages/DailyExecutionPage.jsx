import { useEffect, useState } from 'react';
import { executionsApi, themesApi } from '../src/utils/api.js';

export default function DailyExecutionPage({ onBack }) {
  const [themes, setThemes] = useState([]);
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [themeDetail, setThemeDetail] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    execution_date: new Date().toISOString().split('T')[0],
    completion_percent: 80,
    notes: '',
    is_done: 1,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadThemes() {
      try {
        setLoading(true);
        setError('');
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

    async function loadThemeDetail() {
      try {
        const detail = await themesApi.getTheme(selectedThemeId);
        setThemeDetail(detail);
        const focusItems = detail.focusItems || [];
        if (focusItems.length > 0) {
          setSelectedNodeId(String(focusItems[0].id));
        } else {
          setSelectedNodeId('');
          setExecutions([]);
        }
      } catch (err) {
        setError(err.message || '加载主题明细失败');
      }
    }

    loadThemeDetail();
  }, [selectedThemeId]);

  useEffect(() => {
    if (!selectedNodeId) {
      setExecutions([]);
      return;
    }

    async function loadExecutions() {
      try {
        const list = await executionsApi.getExecutions(selectedNodeId);
        setExecutions(list || []);
      } catch (err) {
        setError(err.message || '加载执行记录失败');
      }
    }

    loadExecutions();
  }, [selectedNodeId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedNodeId) {
      setError('请先选择一个重点项');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await executionsApi.createExecution({
        node_id: Number(selectedNodeId),
        execution_date: form.execution_date,
        is_done: Number(form.is_done),
        completion_percent: Number(form.completion_percent),
        notes: form.notes,
      });
      const list = await executionsApi.getExecutions(selectedNodeId);
      setExecutions(list || []);
      setForm((current) => ({ ...current, notes: '', completion_percent: 80 }));
    } catch (err) {
      setError(err.message || '创建执行记录失败');
    } finally {
      setSaving(false);
    }
  };

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
            <span className="breadcrumb-item breadcrumb-current">DAILY EXECUTION</span>
          </div>
        </div>
      </nav>

      <section className="plan-hero" style={{ minHeight: '260px' }}>
        <div className="plan-hero-content">
          <div className="plan-hero-corner-box">
            <p className="text-caption plan-hero-caption">EXECUTION TRACKER // DAILY LOG</p>
            <h1 className="text-display plan-hero-title">每日执行记录</h1>
            <h2 className="text-heading plan-hero-subtitle">跟踪今日完成情况并记录进度变化</h2>
          </div>
        </div>
      </section>

      <section className="plan-section plan-section-alt">
        <div className="plan-section-header">
          <p className="text-label section-label">ENTRY FORM</p>
          <h2 className="text-display section-title">记录今天的执行成果</h2>
        </div>

        {loading && <p className="theme-loading">正在加载主题和执行数据...</p>}
        {error && <p className="theme-loading" style={{ color: '#ff7a59' }}>{error}</p>}

        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <label style={{ display: 'grid', gap: '6px' }}>
            <span>选择主题</span>
            <select value={selectedThemeId} onChange={(event) => setSelectedThemeId(event.target.value)} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }}>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>{theme.title}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: '6px' }}>
            <span>选择重点项</span>
            <select value={selectedNodeId} onChange={(event) => setSelectedNodeId(event.target.value)} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }}>
              {(themeDetail?.focusItems || []).map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </label>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '20px', display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <label style={{ display: 'grid', gap: '6px' }}>
              <span>日期</span>
              <input type="date" value={form.execution_date} onChange={(event) => setForm((current) => ({ ...current, execution_date: event.target.value }))} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }} />
            </label>
            <label style={{ display: 'grid', gap: '6px' }}>
              <span>完成度</span>
              <input type="number" min="0" max="100" value={form.completion_percent} onChange={(event) => setForm((current) => ({ ...current, completion_percent: event.target.value }))} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }} />
            </label>
            <label style={{ display: 'grid', gap: '6px' }}>
              <span>状态</span>
              <select value={form.is_done} onChange={(event) => setForm((current) => ({ ...current, is_done: Number(event.target.value) }))} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }}>
                <option value={1}>已完成</option>
                <option value={0}>进行中</option>
              </select>
            </label>
          </div>

          <label style={{ display: 'grid', gap: '6px' }}>
            <span>记录说明</span>
            <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows="4" placeholder="记录今天完成了什么、遇到了什么问题" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff', resize: 'vertical' }} />
          </label>

          <button type="submit" disabled={saving} className="cta-button" style={{ justifySelf: 'start' }}>
            {saving ? '保存中...' : '保存执行记录'}
          </button>
        </form>
      </section>

      <section className="plan-section">
        <div className="plan-section-header">
          <p className="text-label section-label">RECENT RECORDS</p>
          <h2 className="text-display section-title">最近执行记录</h2>
        </div>

        {executions.length === 0 ? (
          <p className="theme-loading">暂时没有执行记录，先补一条吧。</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {executions.map((item) => (
              <div key={item.id} style={{ border: '1px solid rgba(255,255,255,0.14)', borderRadius: '14px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                  <strong>{item.execution_date}</strong>
                  <span>{item.completion_percent}% · {item.is_done ? '已完成' : '进行中'}</span>
                </div>
                <div style={{ color: '#9CA3AF', lineHeight: 1.6 }}>{item.notes || '暂无说明'}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
