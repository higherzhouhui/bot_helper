#!/usr/bin/env node

/**
 * 小智助手数据清理脚本
 * 用于清理过期数据、日志文件等
 */

const path = require('path');
const fs = require('fs');

// 根据 NODE_ENV 确定使用哪个环境变量文件
function loadEnvFile() {
  const env = process.env.NODE_ENV || 'development';
  let envFile;
  
  if (env === 'production') {
    envFile = '.env';
  } else if (env === 'development') {
    envFile = '.env.dev';
  } else {
    envFile = '.env.dev';
  }
  
  const envPath = path.resolve(process.cwd(), envFile);
  
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`✅ 已加载环境配置文件: ${envFile}`);
  } else {
    const defaultEnvPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(defaultEnvPath)) {
      require('dotenv').config({ path: defaultEnvPath });
      console.log(`✅ 已加载默认环境配置文件: .env`);
    } else {
      console.log(`⚠️  环境配置文件不存在，使用系统环境变量`);
    }
  }
}

// 加载环境变量
loadEnvFile();

const { sequelize, News, Reminder, ReminderHistory } = require('../models');

console.log('🧹 开始数据清理...');
console.log(`🌍 当前环境: ${process.env.NODE_ENV || 'development'}`);

async function cleanupDatabase() {
  try {
    console.log('🗄️  正在清理数据库...');
    
    // 清理过期的新闻数据（超过7天）
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const deletedNews = await News.destroy({
      where: {
        publishTime: {
          [sequelize.Op.lt]: sevenDaysAgo
        }
      }
    });
    console.log(`✅ 已清理 ${deletedNews} 条过期新闻`);
    
    // 清理已完成的提醒历史（超过30天）
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deletedHistory = await ReminderHistory.destroy({
      where: {
        completedAt: {
          [sequelize.Op.lt]: thirtyDaysAgo
        }
      }
    });
    console.log(`✅ 已清理 ${deletedHistory} 条过期提醒历史`);
    
    // 清理已取消的提醒（超过7天）
    const deletedCancelled = await Reminder.destroy({
      where: {
        status: 'cancelled',
        updatedAt: {
          [sequelize.Op.lt]: sevenDaysAgo
        }
      }
    });
    console.log(`✅ 已清理 ${deletedCancelled} 条已取消提醒`);
    
    console.log('✅ 数据库清理完成');
    
  } catch (error) {
    console.error('❌ 数据库清理失败:', error);
    throw error;
  }
}

async function cleanupLogs() {
  try {
    console.log('📝 正在清理日志文件...');
    
    const logsDir = path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      console.log('ℹ️  日志目录不存在，跳过日志清理');
      return;
    }
    
    const logFiles = fs.readdirSync(logsDir).filter(file => file.endsWith('.log'));
    let deletedCount = 0;
    
    for (const file of logFiles) {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = Date.now() - stats.mtime.getTime();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30天
      
      if (fileAge > maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`🗑️  已删除过期日志: ${file}`);
      }
    }
    
    if (deletedCount > 0) {
      console.log(`✅ 已清理 ${deletedCount} 个过期日志文件`);
    } else {
      console.log('ℹ️  没有需要清理的日志文件');
    }
    
  } catch (error) {
    console.error('❌ 日志清理失败:', error);
    // 日志清理失败不影响主流程
  }
}

async function cleanupTempFiles() {
  try {
    console.log('📁 正在清理临时文件...');
    
    const tempDirs = ['temp', 'tmp', 'cache'];
    let deletedCount = 0;
    
    for (const dirName of tempDirs) {
      const tempDir = path.resolve(process.cwd(), dirName);
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          const filePath = path.join(tempDir, file);
          try {
            if (fs.statSync(filePath).isFile()) {
              fs.unlinkSync(filePath);
              deletedCount++;
            }
          } catch (error) {
            // 忽略无法删除的文件
          }
        }
        console.log(`🗑️  已清理临时目录: ${dirName}`);
      }
    }
    
    if (deletedCount > 0) {
      console.log(`✅ 已清理 ${deletedCount} 个临时文件`);
    } else {
      console.log('ℹ️  没有需要清理的临时文件');
    }
    
  } catch (error) {
    console.error('❌ 临时文件清理失败:', error);
    // 临时文件清理失败不影响主流程
  }
}

async function vacuumDatabase() {
  try {
    console.log('🗄️  正在优化数据库...');
    
    // SQLite VACUUM 操作
    await sequelize.query('VACUUM');
    console.log('✅ 数据库优化完成');
    
  } catch (error) {
    console.error('❌ 数据库优化失败:', error);
    // 数据库优化失败不影响主流程
  }
}

async function main() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接正常');
    
    // 执行清理操作
    await cleanupDatabase();
    await cleanupLogs();
    await cleanupTempFiles();
    await vacuumDatabase();
    
    console.log('\n🎉 数据清理完成！');
    console.log('💡 建议定期运行此脚本以保持系统性能');
    
  } catch (error) {
    console.error('❌ 数据清理失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 运行清理脚本
if (require.main === module) {
  main().then(() => {
    console.log('✅ 清理脚本执行完成');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ 清理脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { main }; 