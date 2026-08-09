/* ========================================
   阶段（phases_v2）工具函数
   ======================================== */

/* 阶段状态的中文文案 */
export const PHASE_STATUS_LABELS = {
  upcoming: '即将开始',
  active: '进行中',
  completed: '已完成',
};

/**
 * 按 parent_id 把扁平阶段数组组装成树
 * 返回顶层阶段数组，每个节点带 children 数组
 * 排序：sort_order 优先，其次 phase_number（兼容 "1.1" 字符串）
 */
export function buildPhaseTree(phases) {
  const ids = new Set(phases.map((p) => p.id));
  const childrenMap = new Map();
  const roots = [];
  for (const p of phases) {
    const pid = p.parent_id && ids.has(p.parent_id) ? p.parent_id : null;
    if (pid) {
      if (!childrenMap.has(pid)) childrenMap.set(pid, []);
      childrenMap.get(pid).push(p);
    } else {
      roots.push(p);
    }
  }
  const sorter = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a.phase_number).localeCompare(String(b.phase_number), undefined, { numeric: true });
  const attach = (list) => list.sort(sorter).map((p) => ({ ...p, children: attach(childrenMap.get(p.id) || []) }));
  return attach(roots);
}
