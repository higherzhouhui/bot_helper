const newsService = require('../services/newsService');

async function crawlAllNews() {
  console.log('🚀 开始爬取所有新闻源...');
  
  try {
    // 爬取新浪新闻
    console.log('\n📰 爬取新浪新闻...');
    await newsService.crawlNews('sina', 'tech', 10);
    await newsService.crawlNews('sina', 'finance', 10);
    await newsService.crawlNews('sina', 'sports', 10);
    await newsService.crawlNews('sina', 'ent', 10);
    await newsService.crawlNews('sina', 'world', 10);
    await newsService.crawlNews('sina', 'society', 10);
    await newsService.crawlNews('sina', 'health', 10);
    
    // 爬取网易新闻
    console.log('\n📰 爬取网易新闻...');
    await newsService.crawlNews('163', 'tech', 10);
    await newsService.crawlNews('163', 'money', 10);
    await newsService.crawlNews('163', 'sports', 10);
    await newsService.crawlNews('163', 'ent', 10);
    await newsService.crawlNews('163', 'world', 10);
    await newsService.crawlNews('163', 'society', 10);
    await newsService.crawlNews('163', 'health', 10);
    
    // 爬取搜狐新闻
    console.log('\n📰 爬取搜狐新闻...');
    await newsService.crawlNews('sohu', 'tech', 10);
    await newsService.crawlNews('sohu', 'business', 10);
    await newsService.crawlNews('sohu', 'sports', 10);
    await newsService.crawlNews('sohu', 'yule', 10);
    await newsService.crawlNews('sohu', 'world', 10);
    await newsService.crawlNews('sohu', 'society', 10);
    await newsService.crawlNews('sohu', 'health', 10);
    
    console.log('\n✅ 所有新闻爬取完成！');
    
    // 显示统计信息
    const stats = await newsService.getNewsStats();
    console.log('\n📊 新闻统计:');
    console.log(`   总新闻数: ${stats.totalNews}`);
    console.log(`   分类数: ${stats.totalCategories}`);
    console.log(`   热门新闻: ${stats.hotNewsCount}`);
    console.log(`   置顶新闻: ${stats.topNewsCount}`);
    
  } catch (error) {
    console.error('❌ 爬取新闻失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  crawlAllNews();
}

module.exports = { crawlAllNews }; 