const { sequelize, User, Category, Reminder, ReminderHistory, ReminderTemplate, NewsCategory, News, UserNewsPreference, NewsReadHistory, WorkPost, testConnection } = require('./models');
const newsService = require('./services/newsService');

console.log('正在初始化数据库...');

async function initializeDatabase() {
  try {
    // 测试数据库连接
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      process.exit(1);
    }

    // 同步所有模型（创建表）
    console.log('正在创建数据库表...');
    await sequelize.sync({ force: false });
    console.log('✅ 数据库表创建成功');

    // 创建索引
    console.log('正在创建数据库索引...');
    try {
      // 提醒相关索引
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_reminders_reminder_time ON reminders(reminder_time)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_reminders_category_id ON reminders(category_id)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_reminders_priority ON reminders(priority)');
      
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_reminder_history_user_id ON reminder_history(user_id)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_reminder_history_completed_at ON reminder_history(completed_at)');
      
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_templates_user_id ON reminder_templates(user_id)');
      
      // 新闻相关索引
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_news_category_id ON news(category_id)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_news_publish_time ON news(publish_time)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_news_status ON news(status)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_news_is_hot ON news(is_hot)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_news_is_top ON news(is_top)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_news_view_count ON news(view_count)');
      
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_news_categories_name ON news_categories(name)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_news_categories_sort_order ON news_categories(sort_order)');
      
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_user_news_preferences_user_id ON user_news_preferences(user_id)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_user_news_preferences_category_id ON user_news_preferences(category_id)');
      
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_news_read_history_user_id ON news_read_history(user_id)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_news_read_history_news_id ON news_read_history(news_id)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_news_read_history_read_at ON news_read_history(read_at)');

      // 工作板块索引
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_work_posts_source ON work_posts(source)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_work_posts_created_at ON work_posts(created_at)');
      
      console.log('✅ 数据库索引创建成功');
    } catch (indexError) {
      console.warn('⚠️ 部分索引可能已存在:', indexError.message);
    }

    // 初始化新闻分类
    console.log('正在初始化新闻分类...');
    await newsService.initializeNewsCategories();

    // 初始化一些示例新闻数据
    console.log('正在初始化示例新闻数据...');
    try {
      await newsService.crawlNews('sina', 'tech', 5);
      await newsService.crawlNews('sina', 'finance', 5);
      await newsService.crawlNews('sina', 'sports', 5);
      console.log('✅ 示例新闻数据初始化完成');
    } catch (error) {
      console.warn('⚠️ 示例新闻数据初始化失败:', error.message);
    }

    console.log('🎉 数据库初始化完成！');
    console.log('📊 已创建的表:');
    console.log('   - users (用户表)');
    console.log('   - categories (提醒分类表)');
    console.log('   - reminders (提醒表)');
    console.log('   - reminder_history (提醒历史表)');
    console.log('   - reminder_templates (提醒模板表)');
    console.log('   - news_categories (新闻分类表)');
    console.log('   - news (新闻表)');
    console.log('   - user_news_preferences (用户新闻偏好表)');
    console.log('   - news_read_history (新闻阅读历史表)');
    console.log('   - work_posts (工作帖子表)');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔒 数据库连接已关闭');
  }
}

// 运行初始化
initializeDatabase(); 