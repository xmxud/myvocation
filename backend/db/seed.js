/**
 * 种子数据脚本 — 将 PlansPage 静态数据迁移到数据库
 *   运行: node db/seed.js
 */

const { db, run } = require('./db');

const SUMMER_THEME_ID = 1;

async function seed() {
  console.log('🌱 开始写入种子数据...\n');

  // ========== 1. 清理旧数据 ==========
  console.log('[1/4] 清理旧数据...');
  await run('DELETE FROM phases');
  await run('DELETE FROM planning_nodes WHERE parent_id IS NOT NULL');
  await run('DELETE FROM node_descriptions');
  console.log('  ✓ 旧数据已清理\n');

  // ========== 2. 插入 FOCUS_ITEM 节点 ==========
  console.log('[2/4] 插入假期重点 (FOCUS_ITEM)...');

  const focusItems = [
    { title: '暑期旅游',   codename: 'TRAVEL',     priority: 'HIGH',   sort: 1,  tag: 'travel',     desc: '目的地探索、行程安排、预算规划',            activityName: '旅游规划',   activityCodename: 'TRAVEL PLAN' },
    { title: '制作机器人', codename: 'ROBOTICS',   priority: 'HIGH',   sort: 2,  tag: 'robot',      desc: '从零到一搭建可编程机器人项目',                activityName: '机器人制作', activityCodename: 'ROBOTICS PROJECT' },
    { title: '智力方课题', codename: 'ZHILIFANG',  priority: 'HIGH',   sort: 3,  tag: null,         desc: null,                                           activityName: null,         activityCodename: null },
    { title: '暑假作业',   codename: 'HOMEWORK',   priority: 'HIGH',   sort: 4,  tag: 'dailylearn', desc: '每日日常学习生活安排',                        activityName: '每日学习生活', activityCodename: 'DAILY STUDY' },
    { title: '数学学习',   codename: 'MATH',       priority: 'MEDIUM', sort: 5,  tag: 'dailylearn', desc: null,                                           activityName: null,         activityCodename: null },
    { title: '英语学习',   codename: 'ENGLISH',    priority: 'MEDIUM', sort: 6,  tag: 'dailylearn', desc: null,                                           activityName: null,         activityCodename: null },
    { title: 'AI编程',     codename: 'AI CODE',    priority: 'MEDIUM', sort: 7,  tag: 'dailylearn', desc: null,                                           activityName: null,         activityCodename: null },
    { title: '运动',       codename: 'SPORTS',     priority: 'MEDIUM', sort: 8,  tag: 'sports',      desc: '保持体能，规律锻炼，增强体质',                activityName: '运动计划',   activityCodename: 'FITNESS OPS' },
    { title: '阅读',       codename: 'READING',    priority: 'LOW',    sort: 9,  tag: 'reading',     desc: '暑期书单规划与阅读进度追踪',                  activityName: '阅读清单',   activityCodename: 'READING LIST' },
    { title: '游戏',       codename: 'GAMING',     priority: 'LOW',    sort: 10, tag: 'gaming',      desc: '适度游戏放松，平衡学习与娱乐',                activityName: '游戏娱乐',   activityCodename: 'RECREATION TIME' },
  ];

  const focusIds = {};
  for (const item of focusItems) {
    const extra = (item.activityName || item.activityCodename)
      ? JSON.stringify({ activityName: item.activityName, activityCodename: item.activityCodename })
      : null;

    const result = await run(
      `INSERT INTO planning_nodes
         (node_type, title, codename, parent_id, sort_order, priority, description, tag, extra_data)
       VALUES ('FOCUS_ITEM', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.title, item.codename, SUMMER_THEME_ID, item.sort, item.priority, item.desc, item.tag, extra]
    );
    // 首个 tag 作为主 key，避免 dailylearn 等重复 tag 被覆盖
    if (item.tag && !focusIds[item.tag]) focusIds[item.tag] = result.id;
    focusIds[item.codename] = result.id;
    if (item.codename === 'HOMEWORK') focusIds['dailylearn'] = result.id;
    console.log(`  ✓ [${result.id}] ${item.codename}`);
  }
  console.log(`  共 ${focusItems.length} 个 FOCUS_ITEM\n`);

  // ========== 3. 插入 node_descriptions（活动明细） ==========
  console.log('[3/4] 插入活动明细 (node_descriptions)...');

  const activityDetails = {
    travel: [
      { label: '目的地',   value: '西昌 / 昆明 / 西双版纳' },
      { label: '时间窗口', value: '7月26-8月4日，约8天' },
      { label: '准备事项', value: '攻略查阅、行李清单、车票/酒店预订' },
      { label: '记录方式', value: '拍照 + 旅行日志' },
      { label: '预算',     value: '交通、住宿、美食、购物' },
      { label: '具体安排', value: '交通、住宿、美食、购物' },
    ],
    robot: [
      { label: '阶段一', value: '硬件选型、材料采购与清单整理' },
      { label: '阶段二', value: '机械结构组装与基础调试' },
      { label: '阶段三', value: '编程控制、传感器集成与测试' },
      { label: '阶段四', value: '功能演示、文档记录与作品展示' },
    ],
    dailylearn: [
      { label: '早读',       value: '每天1小时，8：00-8：30，每日大声朗读语文，英语' },
      { label: '数学',       value: '每天1小时，8：30-9：30，每日计算 +课后作业 + 加油包 +温故知新' },
      { label: '英语',       value: '每天1小时， 10：00-11：00阅读RAZ 2本 + RE 听读 20分钟 + 背单词4000词打靶15分钟 +睡前故事' },
      { label: '作品制作',   value: '每天2小时，14：00-16：00 项目实战驱动' },
      { label: '看视频',     value: '每天1小时：16：00-17：00 科技博主+语文+历史人文' },
      { label: '玩+运动',   value: '每天3小时，上午11点-12点，下午17点-19点' },
      { label: '语文阅读+听英语', value: '每天2小时，早读半小时古文朗读，晚上20点-21:30' },
    ],
    sports: [
      { label: '晨跑', value: '每周3-4次，每次30分钟' },
      { label: '球类', value: '每周1-2次足球' },
      { label: '游泳', value: '每周1次，耐力训练' },
      { label: '拳击', value: '每周2次拳击训练' },
    ],
    reading: [
      { label: '科技类',   value: '《AI未来》《代码大全》选读' },
      { label: '文学类',   value: '2-3本经典小说/散文' },
      { label: '方法类',   value: '《学习之道》等自我提升书籍' },
      { label: '进度追踪', value: '每周至少读完1本，做读书笔记' },
    ],
    gaming: [
      { label: '时间控制', value: '工作日每天不超过30分钟' },
      { label: '周末放宽', value: '周末可适当延长娱乐时间' },
      { label: '游戏选择', value: '策略类 / 动作类 / 独立游戏' },
      { label: '原则',     value: '完成每日任务后再进行游戏' },
    ],
  };

  let descCount = 0;
  for (const [tag, details] of Object.entries(activityDetails)) {
    const nodeId = focusIds[tag];
    if (!nodeId) { console.log(`  ⚠ 跳过 ${tag}：未找到对应节点`); continue; }

    for (let i = 0; i < details.length; i++) {
      const d = details[i];
      await run(
        `INSERT INTO node_descriptions (node_id, content, order_index)
         VALUES (?, ?, ?)`,
        [nodeId, `${d.label}：${d.value}`, i]
      );
      descCount++;
    }
    console.log(`  ✓ ${tag} → ${details.length} 条描述`);
  }
  console.log(`  共 ${descCount} 条描述\n`);

  // ========== 4. 插入 phases + phase_points ==========
  console.log('[4/4] 插入假期阶段 (phases)...');

  const phases = [
    {
      phase_number: 1,
      title: '第一阶段 · 临界点·破局行动',
      start_date: '2026-07-04',
      end_date: '2026-07-25',
      status: 'active',
      points: ['猛攻数学，闭环学习', '英语多听多读', '每日暑假作业', 'AI编程实践', '运动习惯养成'],
    },
    {
      phase_number: 2,
      title: '第二阶段 · 破壁行动·新视界',
      start_date: '2026-07-26',
      end_date: '2026-08-03',
      status: 'upcoming',
      points: ['在西昌亲戚参加婚礼', '在昆明体验松弛与慢生活', '在西双版纳沉浸式感受热带雨林', '旅途中坚持阅读和英语学习'],
    },
    {
      phase_number: 3,
      title: '第三阶段 · 满血·重装上阵',
      start_date: '2026-08-05',
      end_date: '2026-08-20',
      status: 'upcoming',
      points: ['数学闭环学习，多学多练', '机器人项目收尾', '强化英语学习，准备KET', '持续运动打卡', '作品整理归档'],
    },
    {
      phase_number: 4,
      title: '第四阶段 · 战前整备',
      start_date: '2026-08-20',
      end_date: '2026-08-30',
      status: 'upcoming',
      points: ['作业收尾检查', '新学期内容预习', '完成智立方课题', '开学装备准备', '暑期总结复盘'],
    },
  ];

  let pointCount = 0;
  for (const p of phases) {
    const result = await run(
      `INSERT INTO phases (node_id, phase_number, title, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [SUMMER_THEME_ID, p.phase_number, p.title, p.start_date, p.end_date, p.status]
    );
    const phaseId = result.id;

    for (let i = 0; i < p.points.length; i++) {
      await run(
        `INSERT INTO phase_points (phase_id, content, order_index)
         VALUES (?, ?, ?)`,
        [phaseId, p.points[i], i]
      );
      pointCount++;
    }
    console.log(`  ✓ PHASE ${p.phase_number} [${phaseId}] → ${p.points.length} 个要点`);
  }
  console.log(`  共 ${phases.length} 个阶段, ${pointCount} 个要点\n`);

  console.log('✅ 种子数据写入完成！');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ 种子数据写入失败:', err);
    process.exit(1);
  });
