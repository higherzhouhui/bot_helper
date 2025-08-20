const workService = require('../services/workService');

async function main() {
  console.log('🧰 开始抓取工作板块帖子（掘金/电鸭）...');
  try {
    const res = await workService.crawlAll();
    console.log('✅ 抓取完成：');
    for (const k of Object.keys(res)) {
      console.log(`   • ${k}: 新增 ${res[k].length} 条`);
    }
  } catch (e) {
    console.error('❌ 抓取失败:', e);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main }; 