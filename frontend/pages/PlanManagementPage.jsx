import { useState, useEffect, useCallback } from 'react';
import { themesApi, phasesApi, executionsApi, nodesApi } from '../src/utils/api.js';
import DatePicker from '../src/components/DatePicker.jsx';

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M11 2l3 3-9 9H2v-3l9-9z" /><line x1="9" y1="5" x2="11" y2="7" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M2 4h12" /><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
      <path d="M13 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V4" />
      <line x1="6" y1="7" x2="6" y2="11" /><line x1="10" y1="7" x2="10" y2="11" />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <polyline points="10,3 5,8 10,13" /><line x1="5" y1="8" x2="14" y2="8" />
    </svg>
  );
}

export default function PlanManagementPage({ onNavigate, embedded }) {
  const [themes, setThemes] = useState([]);
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [phases, setPhases] = useState([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [tasks, setTasks] = useState([]);
  const [focusItems, setFocusItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => { themesApi.getThemes(1,50).then(d=>setThemes(d.themes||[])).catch(()=>{}); },[]);

  useEffect(() => {
    if (selectedThemeId) {
      phasesApi.getPhasesByNode(selectedThemeId).then(d=>setPhases(d||[])).catch(()=>setPhases([]));
      nodesApi.getChildren(selectedThemeId).then(d=>setFocusItems(d||[])).catch(()=>setFocusItems([]));
    } else { setPhases([]); setFocusItems([]); }
    setSelectedPhaseId(''); setTasks([]);
  }, [selectedThemeId]);

  const loadTasks = useCallback(async () => {
    if (!selectedThemeId) { setTasks([]); return; }
    setLoading(true);
    try {
      const all = await executionsApi.getExecutions(selectedThemeId);
      let filtered = selectedPhaseId ? (all||[]).filter(t=>String(t.phase_id)===String(selectedPhaseId)) : (all||[]);
      if (selectedDate) filtered = filtered.filter(t=>t.execution_date===selectedDate);
      setTasks(filtered.sort((a,b)=>(b.execution_date||'').localeCompare(a.execution_date||'')||(a.planned_start_time||'').localeCompare(b.planned_start_time||'')));
    } catch(e) { setError(e.message); setTasks([]); }
    finally { setLoading(false); }
  }, [selectedThemeId, selectedPhaseId, selectedDate]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const openAdd = () => {
    setEditingId('new');
    setEditForm({_new:true,title:'',planned_start_time:'',planned_duration:'',node_id:'',is_done:false,completion_percent:0,notes:'',execution_date:selectedDate||new Date().toISOString().slice(0,10)});
  };
  const startEdit = (t) => { setEditingId(t.id); setEditForm({...t,node_id:t.node_id?String(t.node_id):''}); };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveTask = async () => {
    if (!editForm.title?.trim()) return;
    setSaving(true);
    try {
      const p = {node_id:editForm.node_id?Number(editForm.node_id):Number(selectedThemeId),phase_id:selectedPhaseId?Number(selectedPhaseId):null,title:editForm.title.trim(),planned_start_time:editForm.planned_start_time||null,planned_duration:editForm.planned_duration?Number(editForm.planned_duration):null,is_done:editForm.is_done||false,completion_percent:editForm.completion_percent||0,notes:editForm.notes||null,execution_date:editForm.execution_date||new Date().toISOString().slice(0,10),source:'manual'};
      console.log('saveTask payload:', p);
      if (editForm._new) { await executionsApi.createExecution(p); }
      else { await executionsApi.updateExecution(editForm.id, p); }
      console.log('saveTask success');
      cancelEdit(); await loadTasks();
    } catch(e) { console.error('saveTask error:', e); alert('保存失败: '+(e.message||e)); setError(e.message||'保存失败'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除？')) return;
    try { await executionsApi.deleteExecution(id); await loadTasks(); } catch(e) { setError(e.message); }
  };

  // 根据阶段行动指南（含父阶段）调用 AI 生成整阶段每日任务
  const handleAiGenerate = async () => {
    if (!selectedPhaseId || generating) return;
    if (!confirm('将根据该阶段及父阶段的行动指南，由 AI 生成阶段内每一天的执行任务。\n该阶段下已自动生成的旧任务会被替换，确定继续？')) return;
    setGenerating(true); setError('');
    try {
      const d = await executionsApi.aiGenerateFromGuide(Number(selectedPhaseId));
      alert(d?.message || '生成完成');
      await loadTasks();
    } catch(e) { setError(e.message || '生成失败'); alert('生成失败: '+(e.message||e)); }
    finally { setGenerating(false); }
  };

  // 清空当前阶段下的全部执行任务
  const handleClearPhase = async () => {
    if (!selectedPhaseId || clearing) return;
    if (!confirm(`确定清空阶段「${selectedPhase?selectedPhase.phase_number+'. '+selectedPhase.title:''}」下的全部 ${tasks.length} 项任务？此操作不可恢复。`)) return;
    setClearing(true); setError('');
    try {
      const d = await executionsApi.clearPhaseExecutions(Number(selectedPhaseId));
      alert(d?.message || '已清空');
      await loadTasks();
    } catch(e) { setError(e.message || '清空失败'); alert('清空失败: '+(e.message||e)); }
    finally { setClearing(false); }
  };

  const getFocusName = (nid) => { const f = focusItems.find(x=>x.id===nid); return f?f.title:null; };
  const selectedPhase = phases.find(p=>String(p.id)===String(selectedPhaseId));

  const thStyle = {display:'flex',gap:'0.5rem',flexWrap:'wrap'};
  const inputStyle = (w) => ({width:w,padding:'8px 10px'});

  return (
    <div className={embedded?'':'plans-page'}>
      {!embedded && <nav className="plan-nav-header"><div className="nav-scanlines"></div><div className="plan-nav-inner"><button className="back-button" onClick={()=>onNavigate&&onNavigate('home')}><BackArrowIcon/><span>返回首页</span></button><span className="breadcrumb-current" style={{fontFamily:'var(--font-display)',fontSize:'0.75rem',letterSpacing:'0.1em'}}>计划管理</span></div></nav>}
      <div style={embedded?{padding:'0 1.5rem'}:{padding:'80px 1.5rem 0',maxWidth:'72rem',margin:'0 auto'}}>
        <div style={{marginBottom:'1.5rem'}}><p className="text-label section-label">PLAN MANAGEMENT</p><h1 className="text-display" style={{marginBottom:0}}>计划管理</h1></div>

        <div className="toolbar" style={{marginBottom:'1.25rem',flexWrap:'wrap'}}>
          <div className="toolbar-left">
            <select className="filter-select" style={{minWidth:180}} value={selectedThemeId} onChange={e=>setSelectedThemeId(e.target.value)}>
              <option value="">-- 选择主题 --</option>{themes.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            {selectedThemeId && <select className="filter-select" style={{minWidth:200}} value={selectedPhaseId} onChange={e=>setSelectedPhaseId(e.target.value)}>
              <option value="">-- 选择阶段 --</option>{phases.map(p=><option key={p.id} value={p.id}>{p.phase_number}. {p.title}</option>)}
            </select>}
            {selectedThemeId && <DatePicker value={selectedDate} onChange={setSelectedDate} placeholder="按日期过滤" width={140}/>}
            {error && <span style={{color:'var(--state-error)',fontSize:'0.8125rem'}}>{error}</span>}
          </div>
          {selectedPhaseId && <div style={thStyle}>
            <button className="action-btn" style={{borderColor:'var(--color-border-primary)',color:'var(--color-text-accent)'}} onClick={handleAiGenerate} disabled={generating}>{generating?'⏳ 生成中...':'🤖 AI生成计划'}</button>
            <label className="action-btn" style={{cursor:'pointer'}}>📤 导入计划<input type="file" accept=".xlsx" style={{display:'none'}} disabled/></label>
            <button className="cta-button" onClick={openAdd} style={{padding:'8px 20px',fontSize:'0.8125rem'}}>+ 新增任务</button>
            <button className="action-btn action-btn--danger" onClick={handleClearPhase} disabled={clearing} style={{padding:'8px 16px',fontSize:'0.8125rem'}}>{clearing?'清空中...':'🗑 清空阶段计划'}</button>
          </div>}
        </div>

        {selectedPhase && <div style={{padding:'0.75rem 1rem',marginBottom:'1.25rem',background:'var(--color-bg-sunken)',border:'1px solid var(--color-border-subtle)',display:'flex',gap:'2rem',flexWrap:'wrap',fontFamily:'var(--font-mono)',fontSize:'0.75rem',color:'var(--color-text-tertiary)'}}>
          <span>{selectedPhase.phase_number}. {selectedPhase.title}</span><span>{selectedPhase.start_date} → {selectedPhase.end_date}</span>
          <span style={{color:selectedPhase.status==='active'?'var(--color-text-accent)':'inherit'}}>
            {selectedPhase.status==='active'?'进行中':selectedPhase.status==='completed'?'已完成':'即将开始'}</span></div>}

        {(selectedPhaseId || selectedDate) ? <div style={{background:'var(--color-bg-elevated)',border:'1px solid var(--color-border-default)',overflow:'hidden'}}>
          <table className="data-table"><thead><tr>
            <th>✓</th><th>任务描述</th><th>重点项</th><th>计划时间</th><th>时长</th><th>日期</th><th>备注</th><th>操作</th>
          </tr></thead><tbody>
          {loading ? <tr><td colSpan={8} className="text-center">加载中...</td></tr>
          : tasks.length===0 && editingId!=='new' ? <tr><td colSpan={8} className="text-center">暂无计划任务</td></tr>
          : <>
            {tasks.map(task => editingId===task.id ? (
              <tr key={task.id} style={{background:'var(--color-primary-light)'}}>
                <td><input type="checkbox" checked={editForm.is_done||false} onChange={e=>setEditForm({...editForm,is_done:e.target.checked})}/></td>
                <td><input className="form-input" value={editForm.title||''} onChange={e=>setEditForm({...editForm,title:e.target.value})}/></td>
                <td><select className="filter-select" style={inputStyle(130)} value={editForm.node_id||''} onChange={e=>setEditForm({...editForm,node_id:e.target.value})}>
                  <option value="">—</option>{focusItems.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}</select></td>
                <td><input className="form-input" type="time" value={editForm.planned_start_time||''} onChange={e=>setEditForm({...editForm,planned_start_time:e.target.value})} style={inputStyle(100)}/></td>
                <td><input className="form-input" type="number" value={editForm.planned_duration||''} onChange={e=>setEditForm({...editForm,planned_duration:e.target.value})} style={inputStyle(60)}/></td>
                <td><input className="form-input" type="date" value={editForm.execution_date||''} onChange={e=>setEditForm({...editForm,execution_date:e.target.value})} style={inputStyle(120)}/></td>
                <td><input className="form-input" value={editForm.notes||''} onChange={e=>setEditForm({...editForm,notes:e.target.value})} style={inputStyle(100)}/></td>
                <td><div className="action-buttons"><button className="action-btn" onClick={saveTask} disabled={saving}>保存</button><button className="action-btn" onClick={cancelEdit}>取消</button></div></td>
              </tr>
            ) : (
              <tr key={task.id}>
                <td><span className={`status-badge ${task.is_done?'status-badge--active':'status-badge--done'}`}>{task.is_done?'✓':'○'}</span></td>
                <td style={{fontWeight:500}}>{task.title}</td>
                <td style={{fontSize:'0.75rem',color:'var(--color-text-accent)'}}>{getFocusName(task.node_id)||'—'}</td>
                <td style={{fontFamily:'var(--font-mono)',fontSize:'0.75rem'}}>{task.planned_start_time||'—'}</td>
                <td style={{fontFamily:'var(--font-mono)',fontSize:'0.75rem'}}>{task.planned_duration?`${task.planned_duration}min`:'—'}</td>
                <td style={{fontFamily:'var(--font-mono)',fontSize:'0.75rem'}}>{task.execution_date||'—'}</td>
                <td style={{fontSize:'0.75rem',color:'var(--color-text-tertiary)',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.notes||'—'}</td>
                <td><div className="action-buttons"><button className="action-btn" onClick={()=>startEdit(task)}><EditIcon/></button><button className="action-btn action-btn--danger" onClick={()=>handleDelete(task.id)}><DeleteIcon/></button></div></td>
              </tr>
            ))}
            {editingId==='new' && <tr style={{background:'var(--color-primary-light)'}}>
              <td><input type="checkbox" checked={editForm.is_done||false} onChange={e=>setEditForm({...editForm,is_done:e.target.checked})}/></td>
              <td><input className="form-input" value={editForm.title||''} onChange={e=>setEditForm({...editForm,title:e.target.value})} placeholder="任务描述" autoFocus/></td>
              <td><select className="filter-select" style={inputStyle(130)} value={editForm.node_id||''} onChange={e=>setEditForm({...editForm,node_id:e.target.value})}><option value="">—</option>{focusItems.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}</select></td>
              <td><input className="form-input" type="time" value={editForm.planned_start_time||''} onChange={e=>setEditForm({...editForm,planned_start_time:e.target.value})} style={inputStyle(100)}/></td>
              <td><input className="form-input" type="number" value={editForm.planned_duration||''} onChange={e=>setEditForm({...editForm,planned_duration:e.target.value})} style={inputStyle(60)} placeholder="min"/></td>
              <td><input className="form-input" type="date" value={editForm.execution_date||''} onChange={e=>setEditForm({...editForm,execution_date:e.target.value})} style={inputStyle(120)}/></td>
              <td><input className="form-input" value={editForm.notes||''} onChange={e=>setEditForm({...editForm,notes:e.target.value})} style={inputStyle(100)} placeholder="备注"/></td>
              <td><div className="action-buttons"><button className="action-btn" onClick={saveTask} disabled={saving}>保存</button><button className="action-btn" onClick={cancelEdit}>取消</button></div></td>
            </tr>}
          </>}
          </tbody></table>
        </div> : <div className="drawer-empty" style={{border:'1px solid var(--color-border-default)',background:'var(--color-bg-elevated)'}}>请选择主题和阶段（或选择日期）查看计划</div>}
      </div>
      {!embedded && <footer className="global-footer" role="contentinfo" style={{marginTop:'4rem'}}><div className="footer-accent-line"></div><div className="footer-inner"><div className="footer-copyright">&copy; 2026 MY VOCATION. ALL SYSTEMS OPERATIONAL.</div></div></footer>}
    </div>
  );
}
