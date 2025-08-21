const path = require('path');
const fs = require('fs');

// 根据 NODE_ENV 确定使用哪个环境变量文件
function loadEnvFile() {
  const env = process.env.NODE_ENV || 'development';
  const envFile = env === 'production' ? '.env' : '.env.dev';
  
  // 尝试加载环境变量文件
  const envPath = path.resolve(process.cwd(), envFile);
  
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`✅ 已加载环境配置文件: ${envFile}`);
  } else {
    console.log(`⚠️  环境配置文件不存在: ${envFile}，使用默认配置`);
  }
}

// 加载环境变量
loadEnvFile();

// 配置对象
const config = {
  // 基础配置
  NODE_ENV: process.env.NODE_ENV || 'development',
  BOT_TOKEN: process.env.BOT_TOKEN,
  TIMEZONE: process.env.TIMEZONE || 'Asia/Shanghai',
  
  // 数据库配置
  DB_PATH: process.env.DB_PATH || './data/database.sqlite',
  DB_DIALECT: process.env.DB_DIALECT || 'sqlite',
  DB_STORAGE: process.env.DB_STORAGE || './data/database.sqlite',
  DB_LOGGING: process.env.DB_LOGGING === 'true',
  
  // 日志配置
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // 新闻爬取配置
  NEWS_CRAWL_INTERVAL: parseInt(process.env.NEWS_CRAWL_INTERVAL) || 300000,
  NEWS_MAX_AGE: parseInt(process.env.NEWS_MAX_AGE) || 86400000,
  
  // 提醒配置
  REMINDER_CHECK_INTERVAL: parseInt(process.env.REMINDER_CHECK_INTERVAL) || 10000,
  REMINDER_REPEAT_INTERVAL: parseInt(process.env.REMINDER_REPEAT_INTERVAL) || 300000,
  
  // 环境特定配置
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// 验证必需配置
function validateConfig() {
  const required = ['BOT_TOKEN'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
  }
}

// 输出配置信息（开发环境）
if (config.isDevelopment) {
  console.log('🔧 当前配置:', {
    NODE_ENV: config.NODE_ENV,
    DB_PATH: config.DB_PATH,
    LOG_LEVEL: config.LOG_LEVEL,
    NEWS_CRAWL_INTERVAL: config.NEWS_CRAWL_INTERVAL,
    REMINDER_CHECK_INTERVAL: config.REMINDER_CHECK_INTERVAL
  });
}

module.exports = {
  config,
  validateConfig
}; 