const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./db/db');
const { errorResponse } = require('./utils/errorHandler');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 导入路由
const themesRouter = require('./routes/themes');
const nodesRouter = require('./routes/nodes');
const phasesRouter = require('./routes/phases');
const executionsRouter = require('./routes/executions');
const statisticsRouter = require('./routes/statistics');

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend is running successfully.' });
});

// API 路由
app.use('/api/themes', themesRouter);
app.use('/api/nodes', nodesRouter);
app.use('/api/phases', phasesRouter);
app.use('/api/daily-executions', executionsRouter);
app.use('/api/statistics', statisticsRouter);

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null,
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('未捕获的错误:', err);
  errorResponse(res, err, err.statusCode || 500, '服务器错误');
});

// 初始化数据库后启动服务
async function start() {
  try {
    console.log('正在初始化数据库...');
    await initializeDatabase();
    console.log('✓ 数据库初始化完成\n');

    app.listen(PORT, () => {
      console.log(`✓ 后端服务运行在 http://localhost:${PORT}`);
      console.log('\n可用的 API 端点：');
      console.log('\n主题管理 (themes):');
      console.log('  GET    /api/themes              - 获取所有主题（分页）');
      console.log('  POST   /api/themes              - 新增主题');
      console.log('  GET    /api/themes/:id          - 获取主题详情');
      console.log('  PUT    /api/themes/:id          - 更新主题');
      console.log('  DELETE /api/themes/:id          - 删除主题');
      console.log('  POST   /api/themes/reorder      - 重新排序主题');
      console.log('\n节点管理 (nodes):');
      console.log('  GET    /api/nodes/:id           - 获取节点');
      console.log('  POST   /api/nodes               - 新增节点');
      console.log('  PUT    /api/nodes/:id           - 更新节点');
      console.log('  DELETE /api/nodes/:id           - 删除节点');
      console.log('  GET    /api/nodes/:id/children  - 获取子节点');
      console.log('  GET    /api/nodes/:id/full-tree - 获取完整树结构');
      console.log('\n阶段管理 (phases):');
      console.log('  GET    /api/phases/by-node/:nodeId - 获取节点的所有阶段');
      console.log('  POST   /api/phases              - 新增阶段');
      console.log('  GET    /api/phases/:id          - 获取阶段详情');
      console.log('  PUT    /api/phases/:id          - 更新阶段');
      console.log('  DELETE /api/phases/:id          - 删除阶段');
      console.log('  POST   /api/phases/:id/points   - 添加阶段要点');
      console.log('\n执行记录 (daily-executions):');
      console.log('  GET    /api/daily-executions/:nodeId - 获取节点的所有执行记录');
      console.log('  POST   /api/daily-executions    - 新增执行记录');
      console.log('  PUT    /api/daily-executions/:id - 更新执行记录');
      console.log('  DELETE /api/daily-executions/:id - 删除执行记录');
      console.log('\n统计数据 (statistics):');
      console.log('  GET    /api/statistics/phase/:phaseId - 阶段统计');
      console.log('  GET    /api/statistics/node/:nodeId - 节点统计');
      console.log('  GET    /api/statistics/theme/:themeId - 主题统计');
      console.log('  GET    /api/statistics - 日期范围统计\n');
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

start();
