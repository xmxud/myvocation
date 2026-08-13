import { useState, useEffect, useCallback } from 'react';
import { themesApi, phasesApi, executionsApi, nodesApi } from '../src/utils/api.js';
import DatePicker from '../src/components/DatePicker.jsx';
import Modal from '../src/components/Modal.jsx';

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
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [page, setPage] = useState(1);

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
    setPage(1);
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

  // 从 Excel 模版导入学习计划（页签名按阶段编号匹配阶段，可跨阶段导入）
  const handleImportExcel = async () => {
    if (!importFile || importing) return;
    setImporting(true); setImportResult(null); setError('');
    try {
      const payload = await executionsApi.importPlanExcel(Number(selectedThemeId), importFile);
      const d = payload.data || {};
      const lines = (d.sheets || []).map(s => `✓ ${s.sheet} → ${s.phase}（${s.count} 项）`);
      if ((d.skipped || []).length) lines.push(`跳过页签：${d.skipped.join('、')}`);
      alert(`导入完成！${payload.message}${lines.length ? '\n' + lines.join('\n') : ''}`);
      setImportOpen(false); setImportFile(null);
      await loadTasks();
    } catch(e) { setImportResult({ error: e.message || '导入失败' }); }
    finally { setImporting(false); }
  };

  const getFocusName = (nid) => { const f = focusItems.find(x=>x.id===nid); return f?f.title:null; };
  const selectedPhase = phases.find(p=>String(p.id)===String(selectedPhaseId));

  // 列表分页（前端分页，数据一次加载）
  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const pagedTasks = tasks.slice((curPage-1)*PAGE_SIZE, curPage*PAGE_SIZE);

  const thStyle = {display:'flex',gap:'0.5rem',flexWrap:'wrap'};
  // 工具栏按钮统一采用与「AI生成计划」一致的描边样式
  const btnStyle = {borderColor:'var(--color-border-primary)',color:'var(--color-text-accent)'};
  const fieldLabel = {display:'flex',flexDirection:'column',gap:'4px',color:'var(--color-text-secondary)',fontSize:'0.8125rem'};

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
          {selectedThemeId && <div style={thStyle}>
            {selectedPhaseId && <button className="action-btn" style={btnStyle} onClick={openAdd}>+ 新增任务</button>}
            <button className="action-btn" style={btnStyle} onClick={()=>{setImportOpen(true);setImportFile(null);setImportResult(null);}}>📤 导入计划</button>
            {selectedPhaseId && <a className="action-btn" style={{...btnStyle,textDecoration:'none'}} href={executionsApi.exportPlanUrl(Number(selectedPhaseId))} download>📥 导出计划</a>}
            <a className="action-btn" style={{...btnStyle,textDecoration:'none'}}
              href={executionsApi.exportDailyUrl(Number(selectedThemeId), selectedDate || new Date().toISOString().slice(0,10))}
              download title={selectedDate ? `导出 ${selectedDate} 的当日计划表` : '导出今天的当日计划表（可用日期过滤切换）'}>🖨 导出当日计划</a>
            {selectedPhaseId && <button className="action-btn" style={btnStyle} onClick={handleAiGenerate} disabled={generating}>{generating?'⏳ 生成中...':'🤖 AI生成计划'}</button>}
            {selectedPhaseId && <button className="action-btn" style={btnStyle} onClick={handleClearPhase} disabled={clearing}>{clearing?'清空中...':'🗑 清空计划'}</button>}
          </div>}
        </div>

        {selectedPhase && <div style={{padding:'0.75rem 1rem',marginBottom:'1.25rem',background:'var(--color-bg-sunken)',border:'1px solid var(--color-border-subtle)',display:'flex',gap:'2rem',flexWrap:'wrap',fontFamily:'var(--font-mono)',fontSize:'0.75rem',color:'var(--color-text-tertiary)'}}>
          <span>{selectedPhase.phase_number}. {selectedPhase.title}</span><span>{selectedPhase.start_date} → {selectedPhase.end_date}</span>
          <span style={{color:selectedPhase.status==='active'?'var(--color-text-accent)':'inherit'}}>
            {selectedPhase.status==='active'?'进行中':selectedPhase.status==='completed'?'已完成':'即将开始'}</span></div>}

        {(selectedPhaseId || selectedDate) ? <>
          <div style={{background:'var(--color-bg-elevated)',border:'1px solid var(--color-border-default)',overflow:'hidden'}}>
          <table className="data-table"><thead><tr>
            <th>✓</th><th>任务描述</th><th>重点项</th><th>计划时间</th><th>时长</th><th>日期</th><th>备注</th><th>操作</th>
          </tr></thead><tbody>
          {loading ? <tr><td colSpan={8} className="text-center">加载中...</td></tr>
          : pagedTasks.length===0 ? <tr><td colSpan={8} className="text-center">暂无计划任务</td></tr>
          : pagedTasks.map(task => (
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
          </tbody></table>
          </div>
          {totalPages>1 && <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'0.75rem',fontSize:'0.8125rem',color:'var(--color-text-tertiary)'}}>
            <span style={{fontFamily:'var(--font-mono)'}}>共 {tasks.length} 条 · 第 {curPage} / {totalPages} 页</span>
            <div style={{display:'flex',gap:'0.5rem'}}>
              <button className="action-btn" disabled={curPage<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>← 上一页</button>
              <button className="action-btn" disabled={curPage>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>下一页 →</button>
            </div>
          </div>}
        </> : <div className="drawer-empty" style={{border:'1px solid var(--color-border-default)',background:'var(--color-bg-elevated)'}}>请选择主题和阶段（或选择日期）查看计划</div>}
      </div>
      <Modal title="导入计划" open={importOpen} onClose={()=>setImportOpen(false)} panelStyle={{maxWidth:'34rem'}}
        footer={<>
          <button className="action-btn" onClick={()=>setImportOpen(false)}>关闭</button>
          <button className="cta-button" style={{padding:'8px 20px',fontSize:'0.8125rem'}} onClick={handleImportExcel} disabled={!importFile||importing}>{importing?'导入中...':'开始导入'}</button>
        </>}>
        <div style={{display:'flex',flexDirection:'column',gap:'1rem',fontSize:'0.8125rem',color:'var(--color-text-secondary)'}}>
          <p style={{margin:0,lineHeight:1.7}}>
            请按模版填写每周计划：每个周计划页签的名称需以阶段编号开头（如「1.2. 暑假第二周（8.8-8.15）」），系统据此关联到对应阶段；
            页签内每行首列为时间段、每列首行为日期，每个非空格子将导入为一条任务。重复导入会覆盖该阶段此前导入的任务。
          </p>
          <a className="action-btn" style={{alignSelf:'flex-start',textDecoration:'none'}} href={executionsApi.planTemplateUrl} download="学习计划模版.xlsx">⬇ 下载模版</a>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem',flexWrap:'wrap'}}>
            <label className="action-btn" style={{cursor:'pointer'}}>选择文件
              <input type="file" accept=".xlsx" style={{display:'none'}} onChange={e=>{setImportFile(e.target.files?.[0]||null);setImportResult(null);}}/>
            </label>
            <span style={{fontFamily:'var(--font-mono)',fontSize:'0.75rem',color:'var(--color-text-tertiary)'}}>{importFile?importFile.name:'未选择文件（.xlsx）'}</span>
          </div>
          {importResult?.error && <div style={{padding:'0.75rem 1rem',border:'1px solid var(--color-border-subtle)',background:'var(--color-bg-sunken)',lineHeight:1.7}}>
            <span style={{color:'var(--state-error)'}}>导入失败：{importResult.error}</span>
          </div>}
        </div>
      </Modal>
      <Modal title={editForm._new?'新增任务':'编辑任务'} open={editingId!==null} onClose={cancelEdit} panelStyle={{maxWidth:'36rem'}}
        footer={<>
          <button className="action-btn" onClick={cancelEdit}>取消</button>
          <button className="cta-button" style={{padding:'8px 20px',fontSize:'0.8125rem'}} onClick={saveTask} disabled={saving||!editForm.title?.trim()}>{saving?'保存中...':'保存'}</button>
        </>}>
        <div style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>
          <label style={fieldLabel}>任务描述
            <textarea className="form-input" rows={4} style={{width:'100%',resize:'vertical',lineHeight:1.6}} value={editForm.title||''} onChange={e=>setEditForm({...editForm,title:e.target.value})} placeholder="任务描述" autoFocus/>
          </label>
          <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
            <label style={{...fieldLabel,flex:1,minWidth:140}}>重点项
              <select className="filter-select" value={editForm.node_id||''} onChange={e=>setEditForm({...editForm,node_id:e.target.value})}>
                <option value="">—</option>{focusItems.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}</select>
            </label>
            <label style={fieldLabel}>计划时间
              <input className="form-input" type="time" value={editForm.planned_start_time||''} onChange={e=>setEditForm({...editForm,planned_start_time:e.target.value})}/>
            </label>
            <label style={fieldLabel}>时长（分钟）
              <input className="form-input" type="number" style={{width:100}} value={editForm.planned_duration||''} onChange={e=>setEditForm({...editForm,planned_duration:e.target.value})} placeholder="min"/>
            </label>
            <label style={fieldLabel}>日期
              <input className="form-input" type="date" value={editForm.execution_date||''} onChange={e=>setEditForm({...editForm,execution_date:e.target.value})}/>
            </label>
          </div>
          <label style={fieldLabel}>备注
            <textarea className="form-input" rows={2} style={{width:'100%',resize:'vertical',lineHeight:1.6}} value={editForm.notes||''} onChange={e=>setEditForm({...editForm,notes:e.target.value})} placeholder="备注"/>
          </label>
          <label style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'0.8125rem',color:'var(--color-text-secondary)',cursor:'pointer'}}>
            <input type="checkbox" checked={editForm.is_done||false} onChange={e=>setEditForm({...editForm,is_done:e.target.checked})}/> 已完成
          </label>
        </div>
      </Modal>
      {!embedded && <footer className="global-footer" role="contentinfo" style={{marginTop:'4rem'}}><div className="footer-accent-line"></div><div className="footer-inner"><div className="footer-copyright">&copy; 2026 MY VOCATION. ALL SYSTEMS OPERATIONAL.</div></div></footer>}
    </div>
  );
}
