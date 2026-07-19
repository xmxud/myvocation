/**
 * 数据库初始化脚本
 * 运行方式: node db/initDb.js
 */

const { initializeDatabase } = require('./db');

async function main() {
  try {
    console.log('开始初始化数据库...\n');
    await initializeDatabase();
    console.log('\n✓ 数据库初始化完成！');
    console.log('\n下一步：启动后端服务');
    console.log('  cd backend');
    console.log('  npm run dev\n');
    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

main();
