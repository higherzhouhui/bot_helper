module.exports = {
  apps: [
    {
      name: 'telegram-reminder-bot',
      script: 'dist/bot.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        TZ: 'Asia/Shanghai',
        DB_PATH: process.env.DB_PATH || './data/production_database.sqlite',
        BOT_TOKEN: process.env.BOT_TOKEN,
        TIMEZONE: process.env.TIMEZONE || 'Asia/Shanghai'
      },
      // 开发环境配置
      env_development: {
        NODE_ENV: 'development',
        TZ: 'Asia/Shanghai',
        DB_PATH: process.env.DB_PATH || './data/dev_database.sqlite',
        BOT_TOKEN: process.env.BOT_TOKEN,
        TIMEZONE: process.env.TIMEZONE || 'Asia/Shanghai'
      },
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      max_memory_restart: '300M',
      kill_timeout: 5000
    }
  ]
}; 