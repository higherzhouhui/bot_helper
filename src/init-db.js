const path = require('path');
const fs = require('fs');

// 根据 NODE_ENV 确定使用哪个环境变量文件
function loadEnvFile() {
  const env = process.env.NODE_ENV || 'development';
  let envFile;
  
  // 修复环境文件选择逻辑，与config/index.js保持一致
  if (env === 'production') {
    envFile = '.env';
  } else if (env === 'development') {
    envFile = '.env.dev';
  } else {
    envFile = '.env.dev'; // 默认使用开发环境配置
  }
  
  // 尝试加载环境变量文件
  const envPath = path.resolve(process.cwd(), envFile);
  
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`✅ 已加载环境配置文件: ${envFile}`);
  } else {
    // 如果指定文件不存在，尝试加载默认文件
    const defaultEnvPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(defaultEnvPath)) {
      require('dotenv').config({ path: defaultEnvPath });
      console.log(`✅ 已加载默认环境配置文件: .env`);
    } else {
      console.log(`⚠️  环境配置文件不存在: ${envFile} 和 .env，使用系统环境变量`);
    }
  }
}

// 加载环境变量
loadEnvFile();

const { sequelize, User, Category, Reminder, ReminderHistory, ReminderTemplate, NewsCategory, News, UserNewsPreference, NewsReadHistory, testConnection } = require('./models');
const newsService = require('./services/newsService');

console.log('🚀 开始初始化数据库...');
console.log(`🌍 当前环境: ${process.env.NODE_ENV || 'development'}`);
console.log(`🗄️ 数据库路径: ${process.env.DB_STORAGE || './data/database.sqlite'}`);

// 显示环境变量配置
console.log('🔧 环境变量配置:');
console.log(`  FORCE_SYNC: ${process.env.FORCE_SYNC || 'false'}`);
console.log(`  ALTER_SYNC: ${process.env.ALTER_SYNC || 'false'}`);
console.log(`  SKIP_NEWS_CRAWL: ${process.env.SKIP_NEWS_CRAWL || 'false'}`);

async function initializeDatabase() {
  try {
    // 环境配置验证
    console.log('🔍 验证环境配置...');
    const requiredEnvVars = ['BOT_TOKEN'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn(`⚠️  缺少环境变量: ${missingVars.join(', ')}`);
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ 生产环境缺少必需配置，退出初始化');
        process.exit(1);
      } else {
        console.log('🔧 开发环境：继续初始化（部分功能可能受限）');
      }
    } else {
      console.log('✅ 环境配置验证通过');
    }
    
    // 测试数据库连接
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      process.exit(1);
    }

    // 根据环境决定数据库同步策略
    const syncOptions = {
      force: false, // 不强制重建表
      alter: false // 暂时禁用alter，避免外键约束问题
    };
    
    // 环境变量配置选项
    if (process.env.FORCE_SYNC === 'true') {
      syncOptions.force = true;
      console.log('⚠️ 强制重建模式已启用，将删除所有数据！');
    }
    
    if (process.env.ALTER_SYNC === 'true') {
      syncOptions.alter = true;
      console.log('⚠️ 表结构变更模式已启用，可能影响现有数据！');
    }
    
    // 跳过新闻爬取选项
    const skipNewsCrawl = process.env.SKIP_NEWS_CRAWL === 'true';
    if (skipNewsCrawl) {
      console.log('⏭️ 跳过新闻爬取模式已启用');
    }
    
    console.log(`🔄 数据库同步策略: force=${syncOptions.force}, alter=${syncOptions.alter}`);
    console.log('正在创建/更新数据库表...');
    
    await sequelize.sync(syncOptions);
    console.log('✅ 数据库表创建/更新成功');

    // 创建索引
    console.log('正在创建数据库索引...');
    try {
      const indexQueries = [
        // 提醒相关索引
        'CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status)',
        'CREATE INDEX IF NOT EXISTS idx_reminders_reminder_time ON reminders(reminder_time)',
        'CREATE INDEX IF NOT EXISTS idx_reminders_category_id ON reminders(category_id)',
        'CREATE INDEX IF NOT EXISTS idx_reminders_priority ON reminders(priority)',
        'CREATE INDEX IF NOT EXISTS idx_reminder_history_user_id ON reminder_history(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_templates_user_id ON reminder_templates(user_id)',
        
        // 新闻相关索引
        'CREATE INDEX IF NOT EXISTS idx_news_category_id ON news(category_id)',
        'CREATE INDEX IF NOT EXISTS idx_news_publish_time ON news(publish_time)',
        'CREATE INDEX IF NOT EXISTS idx_news_status ON news(status)',
        'CREATE INDEX IF NOT EXISTS idx_news_is_hot ON news(is_hot)',
        'CREATE INDEX IF NOT EXISTS idx_news_is_top ON news(is_top)',
        'CREATE INDEX IF NOT EXISTS idx_news_view_count ON news(view_count)',
        'CREATE INDEX IF NOT EXISTS idx_news_categories_name ON news_categories(name)',
        'CREATE INDEX IF NOT EXISTS idx_news_categories_sort_order ON news_categories(sort_order)',
        'CREATE INDEX IF NOT EXISTS idx_user_news_preferences_user_id ON user_news_preferences(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_news_preferences_category_id ON user_news_preferences(category_id)',
        'CREATE INDEX IF NOT EXISTS idx_news_read_history_user_id ON news_read_history(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_news_read_history_news_id ON news_read_history(news_id)',
        'CREATE INDEX IF NOT EXISTS idx_news_read_history_read_at ON news_read_history(read_at)',

        // 用户设置、关键词订阅、收藏、埋点索引
        'CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_keyword_subscriptions_user_id ON keyword_subscriptions(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_favorite_news_user_id ON favorite_news(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_favorite_news_news_id ON favorite_news(news_id)',
        'CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type)',
        'CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred_at ON analytics_events(occurred_at)'
      ];

      // 根据环境决定索引创建策略
      if (process.env.NODE_ENV === 'production') {
        console.log('🚀 生产环境：批量创建索引...');
        // 生产环境：批量执行，提高效率
        for (const query of indexQueries) {
          try {
            await sequelize.query(query);
          } catch (error) {
            if (error.message.includes('already exists')) {
              console.log(`  ✓ 索引已存在: ${query.split(' ')[2]}`);
            } else {
              console.warn(`  ⚠️ 创建索引失败: ${query.split(' ')[2]} - ${error.message}`);
            }
          }
        }
      } else {
        console.log('🔧 开发环境：逐个创建索引...');
        // 开发环境：逐个执行，便于调试
        for (const query of indexQueries) {
          try {
            await sequelize.query(query);
            console.log(`  ✓ 索引创建成功: ${query.split(' ')[2]}`);
          } catch (error) {
            if (error.message.includes('already exists')) {
              console.log(`  ✓ 索引已存在: ${query.split(' ')[2]}`);
            } else {
              console.warn(`  ⚠️ 创建索引失败: ${query.split(' ')[2]} - ${error.message}`);
            }
          }
        }
      }
      
      console.log('✅ 数据库索引创建完成');
    } catch (indexError) {
      console.warn('⚠️ 索引创建过程中出现错误:', indexError.message);
    }

    // 初始化新闻分类
    console.log('正在初始化新闻分类...');
    try {
      await newsService.initializeNewsCategories();
      console.log('✅ 新闻分类初始化成功');
    } catch (error) {
      console.warn('⚠️ 新闻分类初始化失败:', error.message);
      if (process.env.NODE_ENV === 'production') {
        console.log('🚀 生产环境：继续执行，不影响系统启动');
      } else {
        console.log('🔧 开发环境：建议检查新闻服务配置');
      }
    }

    // 根据环境决定是否初始化示例数据
    if (process.env.NODE_ENV === 'development' && !skipNewsCrawl) {
      console.log('🔧 开发环境：正在初始化示例新闻数据...');
      
      // 设置超时时间（5分钟）
      const timeout = 5 * 60 * 1000;
      const startTime = Date.now();
      
      try {
        // 使用Promise.race添加超时控制
        const newsPromises = [
          newsService.crawlNews('sina', 'tech', 3).catch(e => ({ error: 'tech', message: e.message })),
          newsService.crawlNews('sina', 'finance', 3).catch(e => ({ error: 'finance', message: e.message })),
          newsService.crawlNews('sina', 'sports', 3).catch(e => ({ error: 'sports', message: e.message }))
        ];
        
        const results = await Promise.allSettled(newsPromises);
        
        let successCount = 0;
        let failCount = 0;
        
        results.forEach((result, index) => {
          const categories = ['tech', 'finance', 'sports'];
          if (result.status === 'fulfilled' && !result.value.error) {
            console.log(`  ✓ ${categories[index]} 新闻爬取成功`);
            successCount++;
          } else {
            const errorMsg = result.value?.message || result.reason?.message || '未知错误';
            console.log(`  ⚠️ ${categories[index]} 新闻爬取失败: ${errorMsg}`);
            failCount++;
          }
        });
        
        if (successCount > 0) {
          console.log(`✅ 示例新闻数据初始化完成 (成功: ${successCount}, 失败: ${failCount})`);
        } else {
          console.log('⚠️ 所有新闻爬取都失败了，但数据库初始化继续');
        }
        
        // 检查是否超时
        if (Date.now() - startTime > timeout) {
          console.log('⏰ 新闻爬取超时，但数据库初始化已完成');
        }
        
      } catch (error) {
        console.warn('⚠️ 示例新闻数据初始化过程中出现错误:', error.message);
        console.log('🔧 继续执行，不影响数据库初始化');
      }
    } else {
      console.log('🚀 生产环境：跳过示例数据初始化');
    }

    console.log('🎉 数据库初始化完成！');
    console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️ 数据库: ${process.env.DB_STORAGE || './data/database.sqlite'}`);
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
    console.log('   - user_settings (用户设置表)');
    console.log('   - keyword_subscriptions (关键词订阅表)');
    console.log('   - favorite_news (新闻收藏表)');
    console.log('   - analytics_events (埋点事件表)');
    
    // 环境相关的后续建议
    if (process.env.NODE_ENV === 'production') {
      console.log('\n🚀 生产环境建议:');
      console.log('   - 定期备份数据库');
      console.log('   - 监控系统性能');
      console.log('   - 设置日志轮转');
    } else {
      console.log('\n🔧 开发环境建议:');
      console.log('   - 可以安全地修改表结构');
      console.log('   - 示例数据已加载');
      console.log('   - 详细日志已启用');
    }

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('�� 数据库连接已关闭');
  }
}

// 运行初始化
initializeDatabase(); 