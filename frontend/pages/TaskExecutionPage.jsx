import { useState, useEffect, useCallback } from 'react';
import { themesApi, phasesApi, executionsApi, nodesApi, learningRecordsApi } from '../src/utils/api.js';
import DatePicker from '../src/components/DatePicker.jsx';

export default function TaskExecutionPage({ onNavigate, embedded, mode }) {
  const [themes, setThemes] = useState([]);
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [phases, setPhases] = useState([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [focusItems, setFocusItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [dateFilter, setDateFilter] = useState(mode === 'today' ? new Date().toISOString().slice(0,10) : '');
  const [focusFilter, setFocusFilter] = useState('');

  // Check-in panel
  const [checkinTask, setCheckinTask] = useState(null);
  const [checkinForm, setCheckinForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  // 本次打卡已关联的学习记录（返显用）与展开详情 id
  const [existingRecords, setExistingRecords] = useState([]);
  const [expandedRecordId, setExpandedRecordId] = useState(null);

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
      if (dateFilter) filtered = filtered.filter(t=>t.execution_date===dateFilter);
      if (focusFilter) filtered = filtered.filter(t=>String(t.node_id)===String(focusFilter));
      setTasks(filtered.sort((a,b)=>(b.execution_date||'').localeCompare(a.execution_date||'')||(a.planned_start_time||'').localeCompare(b.planned_start_time||'')));
    } catch(e) { setError(e.message); } finally { setLoading(false); }
  }, [selectedThemeId, selectedPhaseId, dateFilter, focusFilter]);

  useEffect(() => { if (selectedThemeId) loadTasks(); }, [loadTasks, selectedThemeId]);

  const openCheckin = (task) => {
    setCheckinTask(task);
    let attachments = [];
    try { attachments = JSON.parse(task.attachments || '[]'); } catch { attachments = []; }
    if (!Array.isArray(attachments)) attachments = [];
    setCheckinForm({
      is_done: task.is_done||false,
      actual_start_time: task.actual_start_time||task.planned_start_time||'',
      actual_end_time: task.actual_end_time||'',
      duration_minutes: task.duration_minutes||task.planned_duration||'',
      result_score: task.result_score||'',
      notes: task.notes||'',
      attachments,
      learningEntries: [],
    });
    setExistingRecords([]);
    setExpandedRecordId(null);
    // 返显本次打卡已关联的学习记录
    learningRecordsApi.list({ execution_id: task.id })
      .then(d => setExistingRecords(d || []))
      .catch(() => {});
  };
  const closeCheckin = () => { setCheckinTask(null); setCheckinForm({}); setExistingRecords([]); setExpandedRecordId(null); };

  // 学习记录区段类型 → 标签
  const LR_TYPES = { mistake: '错题', knowledge: '知识点总结', reflection: '反思' };

  // 新条目：三个可选区段（错题/知识点总结/反思），按需展开填写
  const newLearningEntry = () => ({
    showMistake: false, question_text: '', images: [],
    showKnowledge: false, knowledge_point: '', knowledge_note: '', knowledge_images: [],
    showReflection: false, reflection_text: '', reflection_images: [],
  });

  const addLearningEntry = () => {
    setCheckinForm(prev => ({
      ...prev,
      learningEntries: [...(prev.learningEntries||[]), newLearningEntry()],
    }));
  };
  const updateLearningEntry = (idx, patch) => {
    setCheckinForm(prev => {
      const list = [...(prev.learningEntries||[])];
      list[idx] = { ...list[idx], ...patch };
      return { ...prev, learningEntries: list };
    });
  };
  const removeLearningEntry = (idx) => {
    setCheckinForm(prev => ({
      ...prev,
      learningEntries: (prev.learningEntries||[]).filter((_, i) => i !== idx),
    }));
  };
  // 区段配图上传到 OSS（field: images / knowledge_images / reflection_images）
  const handleEntryImageUpload = async (idx, field, e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const entry = (checkinForm.learningEntries||[])[idx];
      const uploaded = [...(entry?.[field]||[])];
      for (const file of files) {
        const info = await executionsApi.uploadAttachment(file);
        uploaded.push({ key: info.key, url: info.url, name: info.name });
      }
      updateLearningEntry(idx, { [field]: uploaded });
    } catch (e) { setError(e.message || '上传失败'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  // 条目各归类的内容判断与 record_tags 计算
  const entryTags = (entry) => {
    const tags = [];
    if (entry.question_text.trim() || entry.images.length) tags.push('mistake');
    if (entry.knowledge_point.trim() || entry.knowledge_note.trim() || entry.knowledge_images.length) tags.push('knowledge');
    if (entry.reflection_text.trim() || entry.reflection_images.length) tags.push('reflection');
    return tags;
  };
  const entryHasContent = (entry) => entryTags(entry).length > 0;

  const saveCheckin = async () => {
    setSaving(true);
    try {
      await executionsApi.updateExecution(checkinTask.id, {
        is_done: checkinForm.is_done,
        actual_start_time: checkinForm.actual_start_time||null,
        actual_end_time: checkinForm.actual_end_time||null,
        duration_minutes: checkinForm.duration_minutes?Number(checkinForm.duration_minutes):null,
        result_score: checkinForm.result_score?Number(checkinForm.result_score):null,
        notes: checkinForm.notes||null,
        attachments: JSON.stringify(checkinForm.attachments||[]),
      });
      // 随打卡一并写入学习记录，通过 execution_id 关联本任务
      const entries = (checkinForm.learningEntries||[]).filter(entryHasContent);
      let failed = 0;
      for (const entry of entries) {
        const urls = (list) => list.length ? JSON.stringify(list.map(i => i.url)) : null;
        const body = {
          subject_id: checkinTask.node_id,
          phase_id: checkinTask.phase_id || null,
          record_date: checkinTask.execution_date,
          record_tags: entryTags(entry).join(','),
          execution_id: checkinTask.id,
          question_text: entry.question_text.trim() || null,
          question_images: urls(entry.images),
          knowledge_point: entry.knowledge_point.trim() || null,
          knowledge_note: entry.knowledge_note.trim() || null,
          knowledge_images: urls(entry.knowledge_images),
          reflection_text: entry.reflection_text.trim() || null,
          reflection_images: urls(entry.reflection_images),
        };
        try { await learningRecordsApi.create(body); } catch { failed += 1; }
      }
      if (failed > 0) setError(`${failed} 条学习记录保存失败，请重试`);
      closeCheckin(); await loadTasks();
    } catch(e) { setError(e.message||'保存失败'); } finally { setSaving(false); }
  };

  // 选择图片/文件后上传到阿里云 OSS（execution-docs/ 目录），支持多选
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !checkinTask) return;
    setUploading(true);
    try {
      for (const file of files) {
        const info = await executionsApi.uploadAttachment(file);
        setCheckinForm(prev => ({
          ...prev,
          attachments: [...(prev.attachments||[]), { key: info.key, url: info.url, name: info.name }],
        }));
      }
    } catch (e) { setError(e.message || '上传失败'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const removeAttachment = (key) => {
    setCheckinForm(prev => ({
      ...prev,
      attachments: (prev.attachments||[]).filter(a => a.key !== key),
    }));
  };

  const getFocusName = (nid) => { const f = focusItems.find(x=>x.id===nid); return f?f.title:null; };
  const selectedPhase = phases.find(p=>String(p.id)===String(selectedPhaseId));

  const completedCount = tasks.filter(t=>t.is_done).length;
  const totalPlannedMin = tasks.reduce((s,t)=>s+(t.planned_duration||0),0);
  const actualMin = tasks.filter(t=>t.is_done).reduce((s,t)=>s+(t.duration_minutes||0),0);

  return (
    <div className={embedded?'':'plans-page'}>
      {!embedded && <nav className="plan-nav-header"><div className="nav-scanlines"></div><div className="plan-nav-inner">
        <button className="back-button" onClick={()=>onNavigate&&onNavigate('home')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="10,3 5,8 10,13"/><line x1="5" y1="8" x2="14" y2="8"/></svg>
          <span>返回首页</span></button>
        <span className="breadcrumb-current" style={{fontFamily:'var(--font-display)',fontSize:'0.75rem',letterSpacing:'0.1em'}}>{mode==='today'?'任务执行':'执行记录'}</span>
      </div></nav>}

      <div style={embedded?{padding:'0 1.5rem'}:{padding:'80px 1.5rem 0',maxWidth:'72rem',margin:'0 auto'}}>
        <div style={{marginBottom:'1.5rem'}}>
          <p className="text-label section-label">{mode==='today'?'TASK EXECUTION':'EXECUTION RECORDS'}</p>
          <h1 className="text-display" style={{marginBottom:0}}>{mode==='today'?'任务执行':'执行记录'}</h1>
        </div>

        <div className="toolbar" style={{marginBottom:'1rem',flexWrap:'wrap'}}>
          <div className="toolbar-left">
            <select className="filter-select" style={{minWidth:160}} value={selectedThemeId} onChange={e=>setSelectedThemeId(e.target.value)}>
              <option value="">-- 主题 --</option>{themes.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            {selectedThemeId && <select className="filter-select" style={{minWidth:180}} value={selectedPhaseId} onChange={e=>setSelectedPhaseId(e.target.value)}>
              <option value="">-- 阶段 --</option>{phases.map(p=><option key={p.id} value={p.id}>{p.phase_number}. {p.title}</option>)}
            </select>}
            <DatePicker value={dateFilter} onChange={setDateFilter} placeholder="按日期过滤" width={150} />
            <select className="filter-select" style={{minWidth:120}} value={focusFilter} onChange={e=>setFocusFilter(e.target.value)}>
              <option value="">-- 重点 --</option>{focusItems.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
            {error && <span style={{color:'var(--state-error)',fontSize:'0.8125rem'}}>{error}</span>}
          </div>
        </div>

        {/* Stats bar */}
        {selectedPhase && tasks.length>0 && (
          <div style={{padding:'0.75rem 1rem',marginBottom:'1rem',background:'var(--color-bg-sunken)',border:'1px solid var(--color-border-subtle)',display:'flex',gap:'2rem',flexWrap:'wrap',fontFamily:'var(--font-mono)',fontSize:'0.75rem',color:'var(--color-text-tertiary)'}}>
            <span>{selectedPhase.phase_number}. {selectedPhase.title} | {selectedPhase.start_date}→{selectedPhase.end_date}</span>
            <span style={{color:'var(--color-text-accent)'}}>完成 {completedCount}/{tasks.length}</span>
            <span>计划 {totalPlannedMin}min</span>
            <span>实际 {actualMin}min</span>
          </div>
        )}

        {/* Task list */}
        <div style={{background:'var(--color-bg-elevated)',border:'1px solid var(--color-border-default)',overflow:'hidden'}}>
          {!selectedPhaseId ? (
            <div className="drawer-empty" style={{border:'none'}}>请选择主题和阶段</div>
          ) : loading ? (
            <div className="drawer-empty" style={{border:'none'}}>加载中...</div>
          ) : tasks.length===0 ? (
            <div className="drawer-empty" style={{border:'none'}}>暂无任务</div>
          ) : (
            tasks.map(task => (
              <div key={task.id}
                className="drawer-item-row"
                style={{
                  borderLeft: task.is_done?'4px solid var(--color-primary)':'4px solid var(--color-border-subtle)',
                  padding:'0.75rem 1rem',
                  flexWrap:'wrap',
                }}>
                <span style={{fontWeight:600,fontSize:'0.875rem',flex:'1 1 200px',minWidth:0}}>
                  <span className={`status-badge ${task.is_done?'status-badge--active':'status-badge--done'}`}
                    style={{marginRight:8}}>{task.is_done?'✓ 已完成':'○ 未完成'}</span>
                  {task.title}
                </span>
                <span style={{fontSize:'0.6875rem',color:'var(--color-text-accent)',width:70,flexShrink:0}}>
                  {getFocusName(task.node_id)||'—'}
                </span>
                <span style={{fontFamily:'var(--font-mono)',fontSize:'0.6875rem',color:'var(--color-text-tertiary)',width:50,flexShrink:0}}>
                  {task.planned_start_time||'—'}
                </span>
                <span style={{fontFamily:'var(--font-mono)',fontSize:'0.6875rem',color:'var(--color-text-tertiary)',width:50,flexShrink:0}}>
                  {task.planned_duration?`${task.planned_duration}min`:'—'}
                </span>
                <span style={{fontFamily:'var(--font-mono)',fontSize:'0.6875rem',color:'var(--color-text-tertiary)',width:85,flexShrink:0}}>
                  {task.execution_date||'—'}
                </span>
                {task.is_done && (
                  <span style={{fontSize:'0.6875rem',color:'var(--color-text-muted)',width:80,flexShrink:0}}>
                    实际 {task.duration_minutes||0}min {task.result_score?`· ${task.result_score}分`:''}
                  </span>
                )}
                <span style={{fontSize:'0.6875rem',color:'var(--color-text-tertiary)',flex:'0 1 150px',minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {task.notes||''}
                </span>
                <button className="action-btn" onClick={()=>openCheckin(task)}
                  style={{marginLeft:'auto',flexShrink:0}}>
                  {task.is_done?'更新':'打卡'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Check-in panel */}
      {checkinTask && (
        <div className="drawer-overlay" onClick={closeCheckin}>
          <div className="drawer-panel" onClick={e=>e.stopPropagation()} style={{maxWidth:480}}>
            <div className="drawer-header">
              <h2 className="drawer-title">执行记录</h2>
              <button className="drawer-close" onClick={closeCheckin}>&times;</button>
            </div>
            <div className="drawer-body">
              <p style={{fontWeight:600,marginBottom:'1rem'}}>{checkinTask.title}</p>

              <label style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'1rem'}}>
                <input type="checkbox" checked={checkinForm.is_done||false}
                  onChange={e=>setCheckinForm({...checkinForm,is_done:e.target.checked})}/>
                <span style={{fontSize:'0.875rem'}}>标记为已完成</span>
              </label>

              <div style={{display:'grid',gap:'0.75rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                  <label><span className="form-label">实际开始</span>
                    <input className="form-input" type="time" value={checkinForm.actual_start_time||''}
                      onChange={e=>setCheckinForm({...checkinForm,actual_start_time:e.target.value})}/></label>
                  <label><span className="form-label">实际结束</span>
                    <input className="form-input" type="time" value={checkinForm.actual_end_time||''}
                      onChange={e=>setCheckinForm({...checkinForm,actual_end_time:e.target.value})}/></label>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                  <label><span className="form-label">耗时(min)</span>
                    <input className="form-input" type="number" value={checkinForm.duration_minutes||''}
                      onChange={e=>setCheckinForm({...checkinForm,duration_minutes:e.target.value})}/></label>
                  <label><span className="form-label">评分(0-5)</span>
                    <input className="form-input" type="number" min="0" max="5" value={checkinForm.result_score||''}
                      onChange={e=>setCheckinForm({...checkinForm,result_score:e.target.value})}/></label>
                </div>
                <label><span className="form-label">备注</span>
                  <textarea className="form-textarea" rows={3} value={checkinForm.notes||''}
                    onChange={e=>setCheckinForm({...checkinForm,notes:e.target.value})} placeholder="执行情况、遇到的问题..."/></label>
                <label><span className="form-label">附件（图片/文件，上传到 OSS）{uploading?' ⏳上传中...':''}</span>
                  <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.zip,.mp3,.mp4,.wav"
                    onChange={handleFileUpload}
                    style={{fontSize:'0.8125rem'}} disabled={uploading}/>
                  {(checkinForm.attachments||[]).length > 0 && (
                    <div style={{marginTop:'0.5rem',display:'grid',gap:'0.375rem'}}>
                      {checkinForm.attachments.map(att => (
                        <div key={att.key} style={{display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.75rem',padding:'0.375rem 0.5rem',background:'var(--color-bg-sunken)',border:'1px solid var(--color-border-subtle)',borderRadius:'6px'}}>
                          <a href={att.url} target="_blank" rel="noreferrer"
                            style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--color-text-accent)',textDecoration:'none'}}
                            title={att.name}>📎 {att.name}</a>
                          <button type="button" onClick={()=>removeAttachment(att.key)}
                            style={{background:'none',border:'none',color:'var(--state-error)',cursor:'pointer',fontSize:'0.875rem',padding:'0 4px'}}
                            title="移除">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </label>

                {/* 学习记录：错题/知识总结/反思，随打卡一并存入 learning_records 并关联本任务 */}
                <div>
                  <span className="form-label">学习记录（随打卡保存，关联本任务）</span>

                  {/* 已关联的学习记录返显，点击展开详情 */}
                  {existingRecords.length > 0 && (
                    <div style={{margin:'0.375rem 0 0.5rem',display:'grid',gap:'0.25rem'}}>
                      {existingRecords.map(rec => {
                        const tags = (rec.record_tags||'').split(',').filter(Boolean);
                        const summary = rec.knowledge_point || rec.question_text || rec.reflection_text || '（图片记录）';
                        const open = expandedRecordId === rec.id;
                        return (
                          <div key={rec.id} style={{border:'1px solid var(--color-border-subtle)',borderRadius:'6px',background:'var(--color-bg-sunken)'}}>
                            <button type="button" onClick={()=>setExpandedRecordId(open?null:rec.id)}
                              style={{display:'flex',alignItems:'center',gap:'0.5rem',width:'100%',padding:'0.375rem 0.5rem',background:'none',border:'none',cursor:'pointer',color:'inherit',fontSize:'0.75rem',textAlign:'left'}}>
                              <span style={{color:'var(--color-text-accent)',fontWeight:600,flexShrink:0}}>
                                {tags.map(t=>LR_TYPES[t]||t).join('+')}</span>
                              <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--color-text-secondary)'}}>{summary}</span>
                              <span style={{color:'var(--color-text-tertiary)',flexShrink:0}}>{open?'▲':'▼'}</span>
                            </button>
                            {open && <LearningRecordDetail rec={rec} />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{margin:'0.375rem 0 0.5rem'}}>
                    <button type="button" className="action-btn" onClick={addLearningEntry}>+ 学习记录</button>
                  </div>

                  {(checkinForm.learningEntries||[]).map((entry, idx) => (
                    <div key={idx} style={{border:'1px solid var(--color-border-subtle)',borderRadius:'6px',padding:'0.5rem 0.625rem',marginBottom:'0.5rem',display:'grid',gap:'0.375rem',background:'var(--color-bg-sunken)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:'0.75rem',fontWeight:600,color:'var(--color-text-accent)'}}>学习记录 {idx+1}</span>
                        <button type="button" onClick={()=>removeLearningEntry(idx)}
                          style={{background:'none',border:'none',color:'var(--state-error)',cursor:'pointer',fontSize:'0.875rem',padding:'0 4px'}}
                          title="删除该条">×</button>
                      </div>
                      {/* 区段按需展开：错题 / 知识点总结 / 反思，可组合也可单独 */}
                      <div style={{display:'flex',gap:'0.375rem',flexWrap:'wrap'}}>
                        {!entry.showMistake && <button type="button" className="action-btn" style={{fontSize:'0.6875rem'}} onClick={()=>updateLearningEntry(idx,{showMistake:true})}>+ 错题</button>}
                        {!entry.showKnowledge && <button type="button" className="action-btn" style={{fontSize:'0.6875rem'}} onClick={()=>updateLearningEntry(idx,{showKnowledge:true})}>+ 知识点总结</button>}
                        {!entry.showReflection && <button type="button" className="action-btn" style={{fontSize:'0.6875rem'}} onClick={()=>updateLearningEntry(idx,{showReflection:true})}>+ 反思</button>}
                      </div>
                      {entry.showMistake && (
                        <EntrySection title="错题" onRemove={()=>updateLearningEntry(idx,{showMistake:false,question_text:'',images:[]})}>
                          <textarea className="form-textarea" rows={2} value={entry.question_text}
                            onChange={e=>updateLearningEntry(idx,{question_text:e.target.value})}
                            placeholder="错题内容/题干描述..."/>
                          <input type="file" multiple accept="image/*" disabled={uploading}
                            onChange={e=>handleEntryImageUpload(idx,'images',e)} style={{fontSize:'0.75rem'}}/>
                          <EntryImages images={entry.images}
                            onRemove={key=>updateLearningEntry(idx,{images:entry.images.filter(i=>i.key!==key)})}/>
                        </EntrySection>
                      )}
                      {entry.showKnowledge && (
                        <EntrySection title="知识点总结" onRemove={()=>updateLearningEntry(idx,{showKnowledge:false,knowledge_point:'',knowledge_note:'',knowledge_images:[]})}>
                          <input className="form-input" value={entry.knowledge_point}
                            onChange={e=>updateLearningEntry(idx,{knowledge_point:e.target.value})}
                            placeholder="知识点名称，如：二次函数顶点公式"/>
                          <textarea className="form-textarea" rows={2} value={entry.knowledge_note}
                            onChange={e=>updateLearningEntry(idx,{knowledge_note:e.target.value})}
                            placeholder="总结/笔记..."/>
                          <input type="file" multiple accept="image/*" disabled={uploading}
                            onChange={e=>handleEntryImageUpload(idx,'knowledge_images',e)} style={{fontSize:'0.75rem'}}/>
                          <EntryImages images={entry.knowledge_images}
                            onRemove={key=>updateLearningEntry(idx,{knowledge_images:entry.knowledge_images.filter(i=>i.key!==key)})}/>
                        </EntrySection>
                      )}
                      {entry.showReflection && (
                        <EntrySection title="反思" onRemove={()=>updateLearningEntry(idx,{showReflection:false,reflection_text:'',reflection_images:[]})}>
                          <textarea className="form-textarea" rows={2} value={entry.reflection_text}
                            onChange={e=>updateLearningEntry(idx,{reflection_text:e.target.value})}
                            placeholder="反思内容..."/>
                          <input type="file" multiple accept="image/*" disabled={uploading}
                            onChange={e=>handleEntryImageUpload(idx,'reflection_images',e)} style={{fontSize:'0.75rem'}}/>
                          <EntryImages images={entry.reflection_images}
                            onRemove={key=>updateLearningEntry(idx,{reflection_images:entry.reflection_images.filter(i=>i.key!==key)})}/>
                        </EntrySection>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end',marginTop:'1rem'}}>
                <button className="action-btn" onClick={closeCheckin}>取消</button>
                <button className="cta-button" onClick={saveCheckin} disabled={saving}
                  style={{padding:'8px 24px',fontSize:'0.8125rem'}}>
                  {saving?'保存中...':'保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!embedded && <footer className="global-footer" role="contentinfo" style={{marginTop:'4rem'}}><div className="footer-accent-line"></div><div className="footer-inner"><div className="footer-copyright">&copy; 2026 MY VOCATION. ALL SYSTEMS OPERATIONAL.</div></div></footer>}
    </div>
  );
}


// ── 打卡弹窗辅助组件（模块级，避免输入时重挂载失焦）──

// 学习记录条目的区段容器（错题/知识点总结/反思）
function EntrySection({ title, onRemove, children }) {
  return (
    <div style={{ border: '1px dashed var(--color-border-subtle)', borderRadius: '6px', padding: '0.375rem 0.5rem', display: 'grid', gap: '0.375rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>{title}</span>
        <button type="button" onClick={onRemove} title="移除该区段"
          style={{ background: 'none', border: 'none', color: 'var(--state-error)', cursor: 'pointer', fontSize: '0.75rem', padding: '0 4px' }}>×</button>
      </div>
      {children}
    </div>
  );
}

// 已上传图片列表（可移除）
function EntryImages({ images, onRemove }) {
  if (!images?.length) return null;
  return (
    <div style={{ display: 'grid', gap: '0.25rem' }}>
      {images.map(img => (
        <div key={img.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.6875rem' }}>
          <a href={img.url} target="_blank" rel="noreferrer"
            style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-accent)', textDecoration: 'none' }}>📷 {img.name}</a>
          {onRemove && (
            <button type="button" title="移除" onClick={() => onRemove(img.key)}
              style={{ background: 'none', border: 'none', color: 'var(--state-error)', cursor: 'pointer', padding: '0 4px' }}>×</button>
          )}
        </div>
      ))}
    </div>
  );
}

// 解析 JSON 数组字段（question_images / knowledge_images / reflection_images，存 url 字符串数组）
function parseJsonArr(text) {
  try { const v = JSON.parse(text || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}

// 已有学习记录的详情展示（文本 + 图片缩略图）
function LearningRecordDetail({ rec }) {
  const renderImages = (text) => {
    const urls = parseJsonArr(text);
    if (!urls.length) return null;
    return (
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
        {urls.map((u, i) => (
          <a key={u + i} href={u} target="_blank" rel="noreferrer">
            <img src={u} alt={`图片${i + 1}`} style={{ maxWidth: 96, maxHeight: 96, borderRadius: 4, border: '1px solid var(--color-border-subtle)', objectFit: 'cover' }} />
          </a>
        ))}
      </div>
    );
  };
  const row = (label, text, images) => {
    if (!text && !parseJsonArr(images).length) return null;
    return (
      <div style={{ display: 'grid', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>{label}</span>
        {text && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>{text}</div>}
        {renderImages(images)}
      </div>
    );
  };
  return (
    <div style={{ padding: '0.25rem 0.5rem 0.5rem', display: 'grid', gap: '0.5rem', borderTop: '1px solid var(--color-border-subtle)' }}>
      {row('错题', rec.question_text, rec.question_images)}
      {row('知识点总结', [rec.knowledge_point, rec.knowledge_note].filter(Boolean).join('\n'), rec.knowledge_images)}
      {row('反思', rec.reflection_text, rec.reflection_images)}
    </div>
  );
}
