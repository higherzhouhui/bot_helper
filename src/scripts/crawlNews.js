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
    
    // 爬取腾讯新闻
    console.log('\n📰 爬取腾讯新闻...');
    await newsService.crawlNews('tencent', 'tech', 10);
    await newsService.crawlNews('tencent', 'finance', 10);
    await newsService.crawlNews('tencent', 'sports', 10);
    await newsService.crawlNews('tencent', 'ent', 10);
    await newsService.crawlNews('tencent', 'world', 10);
    await newsService.crawlNews('tencent', 'society', 10);
    await newsService.crawlNews('tencent', 'health', 10);

    // 爬取新华网
    console.log('\n📰 爬取新华网...');
    await newsService.crawlNews('xinhuanet', 'tech', 10);
    await newsService.crawlNews('xinhuanet', 'finance', 10);
    await newsService.crawlNews('xinhuanet', 'sports', 10);
    await newsService.crawlNews('xinhuanet', 'ent', 10);
    await newsService.crawlNews('xinhuanet', 'world', 10);
    await newsService.crawlNews('xinhuanet', 'society', 10);
    await newsService.crawlNews('xinhuanet', 'health', 10);

    // 爬取人民网
    console.log('\n📰 爬取人民网...');
    await newsService.crawlNews('people', 'tech', 10);
    await newsService.crawlNews('people', 'finance', 10);
    await newsService.crawlNews('people', 'sports', 10);
    await newsService.crawlNews('people', 'ent', 10);
    await newsService.crawlNews('people', 'world', 10);
    await newsService.crawlNews('people', 'society', 10);
    await newsService.crawlNews('people', 'health', 10);

    // 爬取央视网
    console.log('\n📰 爬取央视网...');
    await newsService.crawlNews('cctv', 'tech', 10);
    await newsService.crawlNews('cctv', 'finance', 10);
    await newsService.crawlNews('cctv', 'sports', 10);
    await newsService.crawlNews('cctv', 'ent', 10);
    await newsService.crawlNews('cctv', 'world', 10);
    await newsService.crawlNews('cctv', 'society', 10);
    await newsService.crawlNews('cctv', 'health', 10);

    // 爬取中国新闻网
    console.log('\n📰 爬取中国新闻网...');
    await newsService.crawlNews('chinanews', 'tech', 10);
    await newsService.crawlNews('chinanews', 'finance', 10);
    await newsService.crawlNews('chinanews', 'sports', 10);
    await newsService.crawlNews('chinanews', 'ent', 10);
    await newsService.crawlNews('chinanews', 'world', 10);
    await newsService.crawlNews('chinanews', 'society', 10);
    await newsService.crawlNews('chinanews', 'health', 10);

    // 爬取澎湃新闻
    console.log('\n📰 爬取澎湃新闻...');
    await newsService.crawlNews('thepaper', 'tech', 10);
    await newsService.crawlNews('thepaper', 'finance', 10);
    await newsService.crawlNews('thepaper', 'sports', 10);
    await newsService.crawlNews('thepaper', 'ent', 10);
    await newsService.crawlNews('thepaper', 'world', 10);
    await newsService.crawlNews('thepaper', 'society', 10);
    await newsService.crawlNews('thepaper', 'health', 10);

    // 爬取第一财经
    console.log('\n📰 爬取第一财经...');
    await newsService.crawlNews('yicai', 'tech', 10);
    await newsService.crawlNews('yicai', 'finance', 10);
    await newsService.crawlNews('yicai', 'sports', 10);
    await newsService.crawlNews('yicai', 'world', 10);
    await newsService.crawlNews('yicai', 'society', 10);
    await newsService.crawlNews('yicai', 'health', 10);
    
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