import { useEffect, useState } from 'react';
import { themesApi, nodesApi, phasesApi } from '../src/utils/api.js';

/* ========================================
   SVG ICONS (HUD Style: stroke=currentColor, fill=none, strokeWidth=2)
   ======================================== */

function TravelIcon() {
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

function RobotIcon() {
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

function BrainIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M24 6c-5 0-9 4-9 9-3 1-5 4-5 7s2 6 5 7c0 4 3 7 7 7 2 0 4-1 5-3 1 2 3 3 5 3 4 0 7-3 7-7 3-1 5-4 5-7s-2-6-5-7c0-5-4-9-9-9-1 0-2 0-3 1-1-1-2-1-3-1z" />
      <line x1="24" y1="12" x2="24" y2="38" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" />
      <circle cx="30" cy="20" r="1.5" fill="currentColor" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M6 8v32l18-6 18 6V8l-18 6L6 8z" />
      <path d="M24 14v26" />
      <line x1="12" y1="16" x2="20" y2="14" />
      <line x1="12" y1="22" x2="20" y2="20" />
    </svg>
  );
}

function MathIcon() {
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

function GlobeIcon() {
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

function CodeIcon() {
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

function DumbbellIcon() {
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

function BookOpenIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M4 10v28l20-6 20 6V10l-20 6L4 10z" />
      <path d="M24 16v22" />
      <path d="M4 10l20 6 20-6" />
    </svg>
  );
}

function GamepadIcon() {
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

function LockIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <rect x="10" y="22" width="28" height="20" rx="2" />
      <path d="M16 22v-6a8 8 0 0116 0v6" />
      <circle cx="24" cy="32" r="2" fill="currentColor" />
      <line x1="24" y1="34" x2="24" y2="38" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M11 2l3 3-9 9H2v-3l9-9z" />
      <line x1="9" y1="5" x2="11" y2="7" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M2 4h12" />
      <path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
      <path d="M13 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V4" />
      <line x1="6" y1="7" x2="6" y2="11" />
      <line x1="10" y1="7" x2="10" y2="11" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <polyline points="4,7 10,13 16,7" />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <polyline points="10,3 5,8 10,13" />
      <line x1="5" y1="8" x2="14" y2="8" />
    </svg>
  );
}

/* ========================================
   ICON MAPPINGS
   ======================================== */

const FOCUS_ICON_MAP = {
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

const ICON_OPTIONS = [
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

function getFocusIcon(item) {
  try {
    const extra = item.extra_data ? JSON.parse(item.extra_data) : null;
    if (extra && extra.icon) {
      const match = ICON_OPTIONS.find((o) => o.value === extra.icon);
      if (match) return match.component;
    }
  } catch (_) { /* ignore */ }
  return FOCUS_ICON_MAP[item.codename] || <BookIcon />;
}

const ACTIVITY_ICON_MAP = {
  dailylearn: <BookIcon />,
  travel: <TravelIcon />,
  robot: <RobotIcon />,
  sports: <DumbbellIcon />,
  reading: <BookOpenIcon />,
  gaming: <GamepadIcon />,
};

/* ========================================
   MAIN COMPONENT
   ======================================== */

export default function PlansPage({ onBack }) {
  const [themes, setThemes] = useState([]);
  const [activeTheme, setActiveTheme] = useState(null);
  const [expandedActivity, setExpandedActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState(null);
  const [themeForm, setThemeForm] = useState({ title: '', codename: '', description: '', tag: '' });
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [focusItems, setFocusItems] = useState([]);
  const [phases, setPhases] = useState([]);
  const [activities, setActivities] = useState([]);
  // 阶段弹窗
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState(null);
  const [phaseForm, setPhaseForm] = useState({ title: '', start_date: '', end_date: '', status: 'upcoming' });
  const [newPointText, setNewPointText] = useState({});  // { [phaseId]: string }
  // 活动弹窗
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [activityForm, setActivityForm] = useState({ title: '', codename: '', priority: 'MEDIUM', description: '', tag: '', linkedFocusId: '' });
  const [newDetailEntry, setNewDetailEntry] = useState({});  // { [activityId]: { label, value } }
  const [editingDetail, setEditingDetail] = useState(null);  // { activityTag, index, label, value } | null
  // 重点弹窗
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [editingFocusId, setEditingFocusId] = useState(null);
  const [focusForm, setFocusForm] = useState({ title: '', codename: '', priority: 'MEDIUM', description: '', icon: '' });

  const loadThemes = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await themesApi.getThemes(1, 10);
      const fetchedThemes = data.themes || [];
      setThemes(fetchedThemes);
      if (fetchedThemes.length > 0) {
        setActiveTheme((currentTheme) => currentTheme || String(fetchedThemes[0].id));
      }
    } catch (err) {
      setError(err.message || '主题加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadFocusItems = async (themeId) => {
    try {
      const items = await nodesApi.getChildren(themeId);
      setFocusItems(items || []);
    } catch (_) { /* 静默失败 */ }
  };

  const loadPhases = async (themeId) => {
    try {
      const data = await phasesApi.getPhasesByNode(themeId);
      setPhases(data || []);
    } catch (_) { /* 静默失败 */ }
  };

  const loadActivities = async (themeId) => {
    try {
      const items = await nodesApi.getChildren(themeId);
      const seen = new Set();
      const acts = [];
      for (const item of items || []) {
        if (!item.tag || seen.has(item.tag)) continue;
        let extra = null;
        try { extra = item.extra_data ? JSON.parse(item.extra_data) : null; } catch (_) { /* ignore */ }
        if (!extra || !extra.activityName) continue;
        seen.add(item.tag);
        let descs = [];
        let descIds = [];
        try {
          const nodeDescs = await nodesApi.getDescriptions(item.id);
          descs = (nodeDescs || []).map((d) => {
            descIds.push(d.id);
            const idx = d.content.indexOf('：');
            if (idx > 0) return { label: d.content.slice(0, idx), value: d.content.slice(idx + 1) };
            return { label: '', value: d.content };
          });
        } catch (_) { /* ignore */ }
        acts.push({
          id: item.tag,
          name: extra.activityName,
          codename: extra.activityCodename || item.codename,
          summary: item.description || '',
          details: descs,
          _descIds: descIds,
        });
      }
      setActivities(acts);
    } catch (_) { /* 静默失败 */ }
  };

  useEffect(() => {
    loadThemes();
  }, []);

  useEffect(() => {
    if (activeTheme) {
      loadFocusItems(activeTheme);
      loadPhases(activeTheme);
      loadActivities(activeTheme);
    }
  }, [activeTheme]);

  const toggleActivity = (id) => {
    setExpandedActivity(expandedActivity === id ? null : id);
  };

  const handleTaskClick = (activityId) => {
    if (!activityId) return;
    setExpandedActivity(activityId);
    setTimeout(() => {
      const el = document.getElementById(`activity-${activityId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleThemeClick = (theme) => {
    if (theme.status === 'locked') return;
    setActiveTheme(String(theme.id));
  };

  const openCreateThemeModal = () => {
    setEditingThemeId(null);
    setThemeForm({ title: '', codename: '', description: '', tag: '' });
    setIsThemeModalOpen(true);
    setActionMessage('');
  };

  const openEditThemeModal = (theme) => {
    setEditingThemeId(theme.id);
    setThemeForm({
      title: theme.title || theme.name || '',
      codename: theme.codename || '',
      description: theme.description || '',
      tag: theme.tag || '',
    });
    setIsThemeModalOpen(true);
    setActionMessage('');
  };

  const handleThemeFormChange = (event) => {
    const { name, value } = event.target;
    setThemeForm((current) => ({ ...current, [name]: value }));
  };

  const handleThemeSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsSavingTheme(true);
      const payload = {
        title: themeForm.title.trim(),
        codename: themeForm.codename.trim() || themeForm.title.trim().toUpperCase(),
        description: themeForm.description.trim(),
        tag: themeForm.tag.trim() || 'custom',
      };

      if (!payload.title) {
        setActionMessage('主题标题不能为空');
        return;
      }

      if (editingThemeId) {
        await themesApi.updateTheme(editingThemeId, payload);
      } else {
        await themesApi.createTheme(payload);
      }

      setIsThemeModalOpen(false);
      setActionMessage(editingThemeId ? '主题已更新' : '主题已新增');
      await loadThemes();
    } catch (err) {
      setActionMessage(err.message || '主题保存失败');
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleDeleteTheme = async (theme) => {
    if (!window.confirm(`确定删除主题 “${theme.title || theme.name}” 吗？`)) return;
    try {
      await themesApi.deleteTheme(theme.id);
      setActionMessage('主题已删除');
      await loadThemes();
      if (String(activeTheme) === String(theme.id)) {
        setActiveTheme(null);
      }
    } catch (err) {
      setActionMessage(err.message || '删除失败');
    }
  };

  // ---------- 阶段 CRUD ----------
  const openPhaseModal = (phase = null) => {
    if (phase) {
      setEditingPhaseId(phase.id);
      setPhaseForm({ title: phase.title, start_date: phase.start_date, end_date: phase.end_date, status: phase.status });
    } else {
      setEditingPhaseId(null);
      setPhaseForm({ title: '', start_date: '', end_date: '', status: 'upcoming' });
    }
    setIsPhaseModalOpen(true);
  };

  const handlePhaseSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      node_id: Number(activeTheme),
      phase_number: editingPhaseId ? undefined : phases.length + 1,
      title: phaseForm.title.trim(),
      start_date: phaseForm.start_date,
      end_date: phaseForm.end_date,
      status: phaseForm.status,
    };
    if (!payload.title || !payload.start_date || !payload.end_date) return;
    try {
      if (editingPhaseId) {
        await phasesApi.updatePhase(editingPhaseId, payload);
      } else {
        await phasesApi.createPhase(payload);
      }
      setIsPhaseModalOpen(false);
      await loadPhases(activeTheme);
    } catch (err) {
      setActionMessage(err.message || '阶段保存失败');
    }
  };

  const handleDeletePhase = async (phase) => {
    if (!window.confirm(`确定删除阶段 “${phase.title}” 吗？`)) return;
    try {
      await phasesApi.deletePhase(phase.id);
      await loadPhases(activeTheme);
    } catch (err) {
      setActionMessage(err.message || '删除失败');
    }
  };

  // ---------- 阶段要点 ----------
  const handleAddPoint = async (phaseId) => {
    const text = (newPointText[phaseId] || '').trim();
    if (!text) return;
    try {
      await phasesApi.addPoint(phaseId, { content: text });
      setNewPointText((prev) => ({ ...prev, [phaseId]: '' }));
      await loadPhases(activeTheme);
    } catch (err) {
      setActionMessage(err.message || '要点添加失败');
    }
  };

  const handleDeletePoint = async (phaseId, pointId) => {
    try {
      await phasesApi.deletePoint(phaseId, pointId);
      await loadPhases(activeTheme);
    } catch (err) {
      setActionMessage(err.message || '要点删除失败');
    }
  };

  // ---------- 活动 CRUD ----------
  const openActivityModal = async (act = null) => {
    if (act) {
      const node = focusItems.find((fi) => fi.tag === act.id);
      setEditingActivityId(node ? node.id : null);
      setActivityForm({
        title: node ? node.title : act.name,
        codename: act.codename || '',
        priority: node ? node.priority : 'MEDIUM',
        description: act.summary || '',
        tag: act.id,
        linkedFocusId: node ? String(node.id) : '',
      });
    } else {
      setEditingActivityId(null);
      const firstFi = focusItems.length > 0 ? focusItems[0] : null;
      setActivityForm({
        title: firstFi ? firstFi.title : '',
        codename: firstFi ? firstFi.codename : '',
        priority: firstFi ? firstFi.priority : 'MEDIUM',
        description: firstFi ? (firstFi.description || '') : '',
        tag: firstFi ? (firstFi.tag || firstFi.codename.toLowerCase().replace(/\s+/g, '')) : '',
        linkedFocusId: firstFi ? String(firstFi.id) : '',
      });
    }
    setIsActivityModalOpen(true);
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    const focusId = Number(activityForm.linkedFocusId);
    const selected = focusItems.find((fi) => fi.id === focusId);
    if (!selected) return;
    const tag = activityForm.tag.trim() || selected.tag || selected.codename.toLowerCase().replace(/\s+/g, '');
    let existingExtra = {};
    try { existingExtra = JSON.parse(selected.extra_data || '{}'); } catch (_) { /* */ }
    const extra = { ...existingExtra, activityName: activityForm.title.trim(), activityCodename: activityForm.codename.trim() || activityForm.title.trim().toUpperCase() };
    const extraData = JSON.stringify(extra);

    if (!activityForm.title.trim() || !tag) return;
    try {
      await nodesApi.updateNode(focusId, {
        description: activityForm.description.trim(),
        priority: activityForm.priority,
        tag,
        extra_data: extraData,
      });
      setIsActivityModalOpen(false);
      await loadFocusItems(activeTheme);
      await loadActivities(activeTheme);
    } catch (err) {
      setActionMessage(err.message || '活动保存失败');
    }
  };

  const handleDeleteActivity = async (activity) => {
    const node = focusItems.find((fi) => fi.tag === activity.id);
    if (!node) return;
    if (!window.confirm(`确定删除活动 “${activity.name}” 吗？`)) return;
    try {
      await nodesApi.deleteNode(node.id);
      await loadFocusItems(activeTheme);
      await loadActivities(activeTheme);
    } catch (err) {
      setActionMessage(err.message || '删除失败');
    }
  };

  // ---------- 活动明细 ----------
  const handleAddDetail = async (activityId) => {
    const entry = newDetailEntry[activityId];
    if (!entry || !entry.label.trim() || !entry.value.trim()) return;
    const node = focusItems.find((fi) => fi.tag === activityId);
    if (!node) return;
    try {
      await nodesApi.addDescription(node.id, { content: `${entry.label.trim()}：${entry.value.trim()}` });
      setNewDetailEntry((prev) => ({ ...prev, [activityId]: { label: '', value: '' } }));
      await loadActivities(activeTheme);
    } catch (err) {
      setActionMessage(err.message || '明细添加失败');
    }
  };

  const handleDeleteDetail = async (activityId, index) => {
    const act = activities.find((a) => a.id === activityId);
    if (!act) return;
    const descId = act._descIds ? act._descIds[index] : null;
    const node = focusItems.find((fi) => fi.tag === activityId);
    if (!node || descId == null) return;
    try {
      await nodesApi.deleteDescription(node.id, descId);
      await loadActivities(activeTheme);
    } catch (err) {
      setActionMessage(err.message || '明细删除失败');
    }
  };

  const handleStartEditDetail = (activityTag, index, label, value) => {
    setEditingDetail({ activityTag, index, label, value });
  };

  const handleSaveDetail = async () => {
    if (!editingDetail) return;
    const { activityTag, index, label, value } = editingDetail;
    if (!label.trim() || !value.trim()) return;
    const node = focusItems.find((fi) => fi.tag === activityTag);
    if (!node) return;
    const act = activities.find((a) => a.id === activityTag);
    const descId = act?._descIds?.[index];
    if (descId == null) return;
    try {
      await nodesApi.updateDescription(node.id, descId, { content: `${label.trim()}：${value.trim()}` });
      setEditingDetail(null);
      await loadActivities(activeTheme);
    } catch (err) {
      setActionMessage(err.message || '明细保存失败');
    }
  };

  // ---------- 重点 CRUD ----------
  const openFocusModal = (item = null) => {
    if (item) {
      let savedIcon = '';
      try { const ex = JSON.parse(item.extra_data || '{}'); savedIcon = ex.icon || ''; } catch (_) { /* */ }
      setEditingFocusId(item.id);
      setFocusForm({ title: item.title, codename: item.codename || '', priority: item.priority || 'MEDIUM', description: item.description || '', icon: savedIcon });
    } else {
      setEditingFocusId(null);
      setFocusForm({ title: '', codename: '', priority: 'MEDIUM', description: '', icon: '' });
    }
    setIsFocusModalOpen(true);
  };

  const handleFocusSubmit = async (e) => {
    e.preventDefault();
    // 合并已有 extra_data，只更新 icon
    let existingExtra = {};
    const original = editingFocusId ? focusItems.find((fi) => fi.id === editingFocusId) : null;
    if (original) { try { existingExtra = JSON.parse(original.extra_data || '{}'); } catch (_) { /* */ } }
    const extra = { ...existingExtra };
    if (focusForm.icon) extra.icon = focusForm.icon;
    // 编辑时保留原代号，防止自动生成中文代号导致图标匹配失败
    const codename = focusForm.codename.trim() || (original ? original.codename : focusForm.title.trim().toUpperCase());

    const payload = {
      node_type: 'FOCUS_ITEM',
      parent_id: Number(activeTheme),
      title: focusForm.title.trim(),
      codename,
      priority: focusForm.priority,
      description: focusForm.description.trim(),
      extra_data: Object.keys(extra).length > 0 ? JSON.stringify(extra) : null,
    };
    if (!payload.title) return;
    try {
      if (editingFocusId) {
        await nodesApi.updateNode(editingFocusId, payload);
      } else {
        await nodesApi.createNode(payload);
      }
      setIsFocusModalOpen(false);
      await loadFocusItems(activeTheme);
    } catch (err) {
      setActionMessage(err.message || '重点保存失败');
    }
  };

  const handleDeleteFocus = async (item) => {
    if (!window.confirm(`确定删除 “${item.title}” 吗？`)) return;
    try {
      await nodesApi.deleteNode(item.id);
      await loadFocusItems(activeTheme);
      await loadActivities(activeTheme);
    } catch (err) {
      setActionMessage(err.message || '删除失败');
    }
  };

  const displayThemes = themes.length > 0
    ? themes.map((theme) => ({
        ...theme,
        status: theme.is_completed ? 'locked' : 'active',
        name: theme.title,
        codename: theme.codename || 'PLANNING THEME',
      }))
    : [];

  const activeThemeData = displayThemes.find((theme) => String(theme.id) === String(activeTheme)) || displayThemes[0] || null;
  const progressPercent = activeThemeData?.progress_percent ?? 0;
  const currentThemeTitle = activeThemeData?.name || '我的规划';
  const currentThemeCodename = activeThemeData?.codename || 'STRATEGIC PLAN';

  const priorityClass = (p) => `task-priority ${p}`;

  return (
    <div className="plans-page">
      {/* Page Navigation Header */}
      <nav className="plan-nav-header" role="navigation" aria-label="页面导航">
        <div className="nav-scanlines"></div>
        <div className="plan-nav-inner">
          <button className="back-button" onClick={onBack}>
            <BackArrowIcon />
            <span>返回指挥中心</span>
          </button>
          <div className="plan-breadcrumb">
            <span className="breadcrumb-item">HOME</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-item">STRATEGIC PLAN</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-item breadcrumb-current">SUMMER OPS</span>
          </div>
        </div>
      </nav>

      {/* Plan Hero Section */}
      <section className="plan-hero">
        <div className="plan-hero-grid tactical-grid"></div>
        <div className="plan-hero-scanline scan-line"></div>
        <div className="plan-hero-content">
          <div className="plan-hero-corner-box">
            <p className="text-caption plan-hero-caption">
              STRATEGIC PLANNING MODULE // 2026 SYNC
            </p>
            <h1 className="text-display plan-hero-title">我的规划</h1>
            <h2 className="text-heading plan-hero-subtitle">
              {currentThemeTitle} · {currentThemeCodename}
            </h2>
            <div className="hero-status" style={{ marginTop: 'var(--space-6)' }}>
              <span className="status-dot"></span>
              <span>CURRENT THEME: {currentThemeTitle || '加载中...'} {activeThemeData?.status === 'locked' ? '[LOCKED]' : '[ACTIVE]'}</span>
            </div>

            <div className="plan-stats-bar">
              <div className="stat-item">
                <div className="stat-value">{displayThemes.length}</div>
                <div className="stat-label">个规划主题</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{phases.length}</div>
                <div className="stat-label">个执行阶段</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{focusItems.length}</div>
                <div className="stat-label">项重点任务</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{progressPercent}%</div>
                <div className="stat-label">完成进度</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Theme Selector */}
      <section className="plan-section plan-section-alt">
        <div className="plan-section-header">
          <p className="text-label section-label">PLANNING THEMES</p>
          <h2 className="text-display section-title">规划主题</h2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div>
            {loading && <p className="theme-loading">正在同步主题数据...</p>}
            {error && <p className="theme-loading" style={{ color: '#ff7a59' }}>{error}</p>}
            {actionMessage && <p className="theme-loading" style={{ color: '#7fe08a' }}>{actionMessage}</p>}
          </div>
          <button className="cta-button" onClick={openCreateThemeModal}>新增主题</button>
        </div>
        <div className="theme-selector">
          {displayThemes.map((theme) => (
            <div
              key={theme.id}
              className={`theme-card ${theme.status} ${String(activeTheme) === String(theme.id) ? 'selected' : ''}`}
              onClick={() => handleThemeClick(theme)}
              title={theme.status === 'locked' ? '敬请期待' : ''}
            >
              {theme.status === 'active' && (
                <div className="theme-status-badge">ACTIVE</div>
              )}
              {theme.status === 'locked' && (
                <>
                  <div className="theme-lock-icon">
                    <svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                      <rect x="10" y="22" width="28" height="20" rx="2" />
                      <path d="M16 22v-6a8 8 0 0116 0v6" />
                      <circle cx="24" cy="32" r="2" fill="currentColor" />
                    </svg>
                  </div>
                  <p className="theme-locked-text">敬请期待</p>
                </>
              )}
              <p className={`theme-codename ${theme.status === 'locked' ? 'locked' : ''}`}>{theme.codename}</p>
              <h3 className={`theme-name ${theme.status === 'locked' ? 'locked' : ''}`}>{theme.name}</h3>
              <div className="theme-action-row" onClick={(event) => event.stopPropagation()}>
                <button type="button" className="theme-action-button theme-action-button-edit" onClick={() => openEditThemeModal(theme)} title="编辑"><EditIcon /></button>
                <button type="button" className="theme-action-button theme-action-button-delete" onClick={() => handleDeleteTheme(theme)} title="删除"><DeleteIcon /></button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Vacation Focus */}
      <section className="plan-section" id="focus-section">
        <div className="plan-section-header">
          <p className="text-label section-label">MISSION PRIORITIES</p>
          <h2 className="text-display section-title">{currentThemeTitle}重点</h2>
        </div>
        <div className="tasks-grid">
          {focusItems.map((item) => (
            <div
              key={item.id}
              className="task-card"
              onClick={() => handleTaskClick(item.tag)}
              style={{ cursor: item.tag ? 'pointer' : 'default' }}
            >
              <div className={priorityClass(item.priority?.toLowerCase())}>
                {item.priority === 'HIGH' ? 'HIGH' : item.priority === 'MEDIUM' ? 'MED' : 'LOW'}
              </div>
              <div className="task-icon">{getFocusIcon(item)}</div>
              <h3 className="task-name">{item.title}</h3>
              <p className="task-codename">{item.codename}</p>
              {item.description && (
                <p
                  title={item.description}
                  style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255,255,255,0.4)',
                    margin: '4px 0 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >{item.description}</p>
              )}
              <div className="theme-action-row" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="theme-action-button" onClick={() => openFocusModal(item)} title="编辑"><EditIcon /></button>
                <button type="button" className="theme-action-button theme-action-button-delete" onClick={() => handleDeleteFocus(item)} title="删除"><DeleteIcon /></button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button className="cta-button" onClick={() => openFocusModal()}>新增重点</button>
        </div>
      </section>

      {/* Timeline - Phase Planning */}
      <section className="plan-section plan-section-alt">
        <div className="plan-section-header">
          <p className="text-label section-label">OPERATIONAL TIMELINE</p>
          <h2 className="text-display section-title">{currentThemeTitle}阶段</h2>
        </div>
        <div className="timeline-container">
          <div className="timeline-axis"></div>
          {phases.map((phase) => (
            <div key={phase.id} className={`phase-item ${phase.status === 'active' ? 'phase-active' : ''}`}>
              <div className={`phase-node ${phase.status === 'active' ? 'active' : ''}`}></div>
              <div className={`phase-card ${phase.status === 'active' ? 'active' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <p className="phase-codename text-caption">PHASE {String(phase.phase_number).padStart(2, '0')}</p>
                    <p className="phase-period">{phase.start_date} — {phase.end_date}</p>
                    <h3 className="phase-title">{phase.title}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button type="button" className="theme-action-button" onClick={() => openPhaseModal(phase)} title="编辑"><EditIcon /></button>
                    <button type="button" className="theme-action-button theme-action-button-delete" onClick={() => handleDeletePhase(phase)} title="删除"><DeleteIcon /></button>
                  </div>
                </div>
                <ul className="phase-tasks">
                  {(phase.points || []).map((p, i) => (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{p.content}</span>
                      <button type="button" onClick={() => handleDeletePoint(phase.id, p.id)}
                        style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '14px', padding: '0 4px', lineHeight: 1 }} title="删除">×</button>
                    </li>
                  ))}
                </ul>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <input
                    value={newPointText[phase.id] || ''}
                    onChange={(e) => setNewPointText((prev) => ({ ...prev, [phase.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPoint(phase.id)}
                    placeholder="添加要点..."
                    style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff', fontSize: '0.75rem' }}
                  />
                  <button type="button" onClick={() => handleAddPoint(phase.id)} style={{ padding: '6px 12px', border: '1px solid rgba(0,255,102,0.35)', background: 'rgba(0,255,102,0.08)', color: '#8dffb2', cursor: 'pointer', borderRadius: '4px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>＋</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button className="cta-button" onClick={() => openPhaseModal()}>新增阶段</button>
        </div>
      </section>

      {/* Activity Details - Accordion */}
      <section className="plan-section" id="activities-section">
        <div className="plan-section-header">
          <p className="text-label section-label">ACTIVITY DETAILS</p>
          <h2 className="text-display section-title">{currentThemeTitle}活动明细</h2>
        </div>
        <div className="activities-list">
          {activities.map((activity) => (
            <div
              key={activity.id}
              id={`activity-${activity.id}`}
              className={`activity-card ${expandedActivity === activity.id ? 'expanded' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  className="activity-header"
                  onClick={() => toggleActivity(activity.id)}
                  style={{ flex: 1 }}
                >
                  <div className="activity-icon">{ACTIVITY_ICON_MAP[activity.id] || <BookIcon />}</div>
                  <div className="activity-info">
                    <div className="activity-name-row">
                      <h3 className="activity-name">{activity.name}</h3>
                      <p className="activity-codename">{activity.codename}</p>
                    </div>
                    <p className="activity-summary">{activity.summary}</p>
                  </div>
                  <div className="activity-expand-icon">
                    <ChevronDownIcon />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', paddingRight: '12px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="theme-action-button" onClick={() => openActivityModal(activity)} title="编辑"><EditIcon /></button>
                  <button type="button" className="theme-action-button theme-action-button-delete" onClick={() => handleDeleteActivity(activity)} title="删除"><DeleteIcon /></button>
                </div>
              </div>
              <div className="activity-details">
                <div className="activity-details-inner">
                  <div className="details-grid">
                    {activity.details.map((d, i) => {
                      const isEditing = editingDetail && editingDetail.activityTag === activity.id && editingDetail.index === i;
                      return (
                        <div key={i} className="detail-item" style={{ position: 'relative' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '60px' }}>
                              <input value={editingDetail.label} onChange={(e) => setEditingDetail((prev) => ({ ...prev, label: e.target.value }))} placeholder="标签" style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff', fontSize: '0.75rem' }} />
                              <input value={editingDetail.value} onChange={(e) => setEditingDetail((prev) => ({ ...prev, value: e.target.value }))} placeholder="内容" style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff', fontSize: '0.75rem' }} />
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button type="button" onClick={handleSaveDetail} style={{ padding: '3px 8px', border: '1px solid rgba(0,255,102,0.35)', background: 'rgba(0,255,102,0.1)', color: '#8dffb2', cursor: 'pointer', borderRadius: '4px', fontSize: '0.7rem' }}>保存</button>
                                <button type="button" onClick={() => setEditingDetail(null)} style={{ padding: '3px 8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', borderRadius: '4px', fontSize: '0.7rem' }}>取消</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <span className="detail-label">{d.label}</span>
                              <span className="detail-value">{d.value}</span>
                            </>
                          )}
                          <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '4px' }}>
                            {!isEditing && (
                              <button type="button" onClick={() => handleStartEditDetail(activity.id, i, d.label, d.value)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '12px', lineHeight: 1 }} title="编辑">✎</button>
                            )}
                            <button type="button" onClick={() => handleDeleteDetail(activity.id, i)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }} title="删除">×</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                    <input
                      value={(newDetailEntry[activity.id] || {}).label || ''}
                      onChange={(e) => setNewDetailEntry((prev) => ({ ...prev, [activity.id]: { ...(prev[activity.id] || {}), label: e.target.value } }))}
                      placeholder="标签"
                      style={{ width: '80px', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff', fontSize: '0.75rem' }}
                    />
                    <input
                      value={(newDetailEntry[activity.id] || {}).value || ''}
                      onChange={(e) => setNewDetailEntry((prev) => ({ ...prev, [activity.id]: { ...(prev[activity.id] || {}), value: e.target.value } }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddDetail(activity.id)}
                      placeholder="内容"
                      style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff', fontSize: '0.75rem' }}
                    />
                    <button type="button" onClick={() => handleAddDetail(activity.id)} style={{ padding: '6px 12px', border: '1px solid rgba(0,255,102,0.35)', background: 'rgba(0,255,102,0.08)', color: '#8dffb2', cursor: 'pointer', borderRadius: '4px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>＋</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button className="cta-button" onClick={() => openActivityModal()}>新增活动</button>
        </div>
      </section>

      {isThemeModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: '#111827', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '16px', padding: '24px', boxShadow: '0 18px 50px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>{editingThemeId ? '编辑主题' : '新增主题'}</h3>
              <button type="button" onClick={() => setIsThemeModalOpen(false)} style={{ border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <form onSubmit={handleThemeSubmit} style={{ display: 'grid', gap: '12px' }}>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span>标题</span>
                <input name="title" value={themeForm.title} onChange={handleThemeFormChange} placeholder="输入主题标题" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }} />
              </label>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span>代号</span>
                <input name="codename" value={themeForm.codename} onChange={handleThemeFormChange} placeholder="例如 SUMMER OPS" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }} />
              </label>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span>标签</span>
                <input name="tag" value={themeForm.tag} onChange={handleThemeFormChange} placeholder="例如 summer" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }} />
              </label>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span>描述</span>
                <textarea name="description" value={themeForm.description} onChange={handleThemeFormChange} placeholder="简要说明" rows="3" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff', resize: 'vertical' }} />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsThemeModalOpen(false)} style={{ padding: '10px 14px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.16)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>取消</button>
                <button type="submit" disabled={isSavingTheme} style={{ padding: '10px 14px', borderRadius: '999px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #38bdf8)', color: '#fff', cursor: 'pointer' }}>
                  {isSavingTheme ? '保存中...' : editingThemeId ? '更新主题' : '新增主题'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Phase Modal */}
      {isPhaseModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '440px', background: '#111827', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '16px', padding: '24px', boxShadow: '0 18px 50px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>{editingPhaseId ? '编辑阶段' : '新增阶段'}</h3>
              <button type="button" onClick={() => setIsPhaseModalOpen(false)} style={{ border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <form onSubmit={handlePhaseSubmit} style={{ display: 'grid', gap: '12px' }}>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span>阶段标题</span>
                <input value={phaseForm.title} onChange={(e) => setPhaseForm((p) => ({ ...p, title: e.target.value }))} placeholder="例如 临界点·破局行动" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ display: 'grid', gap: '6px' }}>
                  <span>开始日期</span>
                  <input type="date" value={phaseForm.start_date} onChange={(e) => setPhaseForm((p) => ({ ...p, start_date: e.target.value }))} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }} />
                </label>
                <label style={{ display: 'grid', gap: '6px' }}>
                  <span>结束日期</span>
                  <input type="date" value={phaseForm.end_date} onChange={(e) => setPhaseForm((p) => ({ ...p, end_date: e.target.value }))} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }} />
                </label>
              </div>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span>状态</span>
                <select value={phaseForm.status} onChange={(e) => setPhaseForm((p) => ({ ...p, status: e.target.value }))} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }}>
                  <option value="upcoming">即将开始</option>
                  <option value="active">进行中</option>
                  <option value="completed">已完成</option>
                </select>
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsPhaseModalOpen(false)} style={{ padding: '10px 14px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.16)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>取消</button>
                <button type="submit" style={{ padding: '10px 14px', borderRadius: '999px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #38bdf8)', color: '#fff', cursor: 'pointer' }}>{editingPhaseId ? '更新阶段' : '新增阶段'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {isActivityModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '440px', background: '#111827', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '16px', padding: '24px', boxShadow: '0 18px 50px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>{editingActivityId ? '编辑活动' : '新增活动'}</h3>
              <button type="button" onClick={() => setIsActivityModalOpen(false)} style={{ border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <form onSubmit={handleActivitySubmit} style={{ display: 'grid', gap: '12px' }}>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span>活动名称</span>
                <input value={activityForm.title} onChange={(e) => setActivityForm((p) => ({ ...p, title: e.target.value }))} placeholder="例如 旅游规划" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ display: 'grid', gap: '6px' }}>
                  <span>代号</span>
                  <input value={activityForm.codename} onChange={(e) => setActivityForm((p) => ({ ...p, codename: e.target.value }))} placeholder="例如 TRAVEL" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }} />
                </label>
                <label style={{ display: 'grid', gap: '6px' }}>
                  <span>优先级</span>
                  <select value={activityForm.priority} onChange={(e) => setActivityForm((p) => ({ ...p, priority: e.target.value }))} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }}>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </label>
              </div>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span>摘要</span>
                <input value={activityForm.description} onChange={(e) => setActivityForm((p) => ({ ...p, description: e.target.value }))} placeholder="简要描述" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }} />
              </label>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span>关联活动</span>
                <select
                  value={activityForm.linkedFocusId}
                  onChange={(e) => {
                    const fid = e.target.value;
                    const fi = fid ? focusItems.find((f) => String(f.id) === fid) : null;
                    setActivityForm((p) => ({
                      ...p,
                      linkedFocusId: fid,
                      title: fi ? fi.title : p.title,
                      codename: fi ? fi.codename : p.codename,
                      description: fi ? (fi.description || '') : p.description,
                      priority: fi ? fi.priority : p.priority,
                      tag: fi ? (fi.tag || fi.codename.toLowerCase().replace(/\s+/g, '')) : p.tag,
                    }));
                  }}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }}
                >
                  {focusItems.map((fi) => (
                    <option key={fi.id} value={fi.id}>{fi.title} ({fi.codename})</option>
                  ))}
                </select>
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsActivityModalOpen(false)} style={{ padding: '10px 14px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.16)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>取消</button>
                <button type="submit" style={{ padding: '10px 14px', borderRadius: '999px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #38bdf8)', color: '#fff', cursor: 'pointer' }}>{editingActivityId ? '更新活动' : '新增活动'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Focus Modal */}
      {isFocusModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '440px', background: '#111827', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '16px', padding: '24px', boxShadow: '0 18px 50px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>{editingFocusId ? '编辑重点' : '新增重点'}</h3>
              <button type="button" onClick={() => setIsFocusModalOpen(false)} style={{ border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <form onSubmit={handleFocusSubmit} style={{ display: 'grid', gap: '12px' }}>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span>名称</span>
                <input value={focusForm.title} onChange={(e) => setFocusForm((p) => ({ ...p, title: e.target.value }))} placeholder="例如 暑期旅游" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ display: 'grid', gap: '6px' }}>
                  <span>代号</span>
                  <input value={focusForm.codename} onChange={(e) => setFocusForm((p) => ({ ...p, codename: e.target.value }))} placeholder="例如 TRAVEL" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }} />
                </label>
                <label style={{ display: 'grid', gap: '6px' }}>
                  <span>优先级</span>
                  <select value={focusForm.priority} onChange={(e) => setFocusForm((p) => ({ ...p, priority: e.target.value }))} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }}>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </label>
              </div>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span>描述</span>
                <input value={focusForm.description} onChange={(e) => setFocusForm((p) => ({ ...p, description: e.target.value }))} placeholder="简要描述" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }} />
              </label>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span>图标</span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select value={focusForm.icon} onChange={(e) => setFocusForm((p) => ({ ...p, icon: e.target.value }))} style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff' }}>
                    <option value="">自动（根据代号匹配）</option>
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div style={{ width: '32px', height: '32px', color: '#8dffb2', flexShrink: 0 }}>
                    {focusForm.icon
                      ? (ICON_OPTIONS.find((o) => o.value === focusForm.icon)?.component || <BookIcon />)
                      : (FOCUS_ICON_MAP[focusForm.codename.trim().toUpperCase() || ''] || <BookIcon />)}
                  </div>
                </div>
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsFocusModalOpen(false)} style={{ padding: '10px 14px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.16)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>取消</button>
                <button type="submit" style={{ padding: '10px 14px', borderRadius: '999px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #38bdf8)', color: '#fff', cursor: 'pointer' }}>{editingFocusId ? '更新重点' : '新增重点'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <section className="plan-footer-cta">
        <button className="cta-button" onClick={onBack}>
          返回指挥中心
        </button>
      </section>

      {/* Page Footer */}
      <footer className="global-footer" role="contentinfo">
        <div className="footer-accent-line"></div>
        <div className="footer-inner">
          <div className="footer-brand">
            <p className="footer-brand-name">2026 IN MOTION</p>
            <p className="footer-brand-desc">
              2026我在行动 — 个人年度指挥中心。<br />规划目标、记录成长、追踪进度、管理生活。
            </p>
          </div>
          <div className="footer-copyright">
            &copy; 2026 MY VOCATION. ALL SYSTEMS OPERATIONAL.
          </div>
        </div>
      </footer>
    </div>
  );
}
