#!/usr/bin/env node

/**
 * 小智助手备份脚本
 * 用于备份数据库和配置文件
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

const { sequelize } = require('../models');

console.log('💾 开始数据备份...');
console.log(`🌍 当前环境: ${process.env.NODE_ENV || 'development'}`);

async function createBackupDirectory() {
  const backupDir = path.resolve(process.cwd(), 'backup');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`✅ 已创建备份目录: ${backupDir}`);
  }
  
  return backupDir;
}

async function backupDatabase(backupDir) {
  try {
    console.log('🗄️  正在备份数据库...');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接正常');
    
    // 创建数据库备份文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dbBackupPath = path.join(backupDir, `database_${timestamp}.sqlite`);
    
    // 复制数据库文件
    const dbPath = process.env.DB_STORAGE || './data/database.sqlite';
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, dbBackupPath);
      
      // 获取文件大小
      const stats = fs.statSync(dbBackupPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`✅ 数据库备份完成: ${dbBackupPath} (${sizeInMB} MB)`);
      return dbBackupPath;
    } else {
      throw new Error(`数据库文件不存在: ${dbPath}`);
    }
    
  } catch (error) {
    console.error('❌ 数据库备份失败:', error);
    throw error;
  }
}

async function backupConfiguration(backupDir) {
  try {
    console.log('⚙️  正在备份配置文件...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const configBackupPath = path.join(backupDir, `config_${timestamp}.tar`);
    
    // 备份配置文件
    const configFiles = ['.env', '.env.dev', 'ecosystem.config.js'];
    const backupConfigDir = path.join(backupDir, `config_${timestamp}`);
    
    if (!fs.existsSync(backupConfigDir)) {
      fs.mkdirSync(backupConfigDir, { recursive: true });
    }
    
    let copiedCount = 0;
    for (const file of configFiles) {
      if (fs.existsSync(file)) {
        const destPath = path.join(backupConfigDir, path.basename(file));
        fs.copyFileSync(file, destPath);
        copiedCount++;
        console.log(`📋 已备份配置文件: ${file}`);
      }
    }
    
    if (copiedCount > 0) {
      console.log(`✅ 配置文件备份完成: ${copiedCount} 个文件`);
      return backupConfigDir;
    } else {
      console.log('ℹ️  没有找到需要备份的配置文件');
      return null;
    }
    
  } catch (error) {
    console.error('❌ 配置文件备份失败:', error);
    // 配置文件备份失败不影响主流程
    return null;
  }
}

async function backupLogs(backupDir) {
  try {
    console.log('📝 正在备份日志文件...');
    
    const logsDir = path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      console.log('ℹ️  日志目录不存在，跳过日志备份');
      return null;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logsBackupPath = path.join(backupDir, `logs_${timestamp}`);
    
    if (!fs.existsSync(logsBackupPath)) {
      fs.mkdirSync(logsBackupPath, { recursive: true });
    }
    
    const logFiles = fs.readdirSync(logsDir).filter(file => file.endsWith('.log'));
    let copiedCount = 0;
    
    for (const file of logFiles) {
      const srcPath = path.join(logsDir, file);
      const destPath = path.join(logsBackupPath, file);
      fs.copyFileSync(srcPath, destPath);
      copiedCount++;
    }
    
    if (copiedCount > 0) {
      console.log(`✅ 日志文件备份完成: ${copiedCount} 个文件`);
      return logsBackupPath;
    } else {
      console.log('ℹ️  没有找到需要备份的日志文件');
      return null;
    }
    
  } catch (error) {
    console.error('❌ 日志文件备份失败:', error);
    // 日志文件备份失败不影响主流程
    return null;
  }
}

async function createBackupManifest(backupDir, dbBackupPath, configBackupPath, logsBackupPath) {
  try {
    console.log('📋 正在创建备份清单...');
    
    const timestamp = new Date().toISOString();
    const manifestPath = path.join(backupDir, `backup_manifest_${timestamp.replace(/[:.]/g, '-')}.json`);
    
    const manifest = {
      backupTime: timestamp,
      environment: process.env.NODE_ENV || 'development',
      version: require('../../package.json').version,
      items: {
        database: dbBackupPath ? path.relative(backupDir, dbBackupPath) : null,
        configuration: configBackupPath ? path.relative(backupDir, configBackupPath) : null,
        logs: logsBackupPath ? path.relative(backupDir, logsBackupPath) : null
      },
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsage: process.memoryUsage()
      }
    };
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`✅ 备份清单已创建: ${manifestPath}`);
    
    return manifestPath;
    
  } catch (error) {
    console.error('❌ 创建备份清单失败:', error);
    return null;
  }
}

async function cleanupOldBackups(backupDir) {
  try {
    console.log('🧹 正在清理旧备份...');
    
    const maxBackups = parseInt(process.env.MAX_BACKUPS) || 10; // 保留最近10个备份
    const maxAge = parseInt(process.env.BACKUP_MAX_AGE) || 30 * 24 * 60 * 60 * 1000; // 30天
    
    const items = fs.readdirSync(backupDir);
    const backupItems = items.filter(item => {
      const itemPath = path.join(backupDir, item);
      const stats = fs.statSync(itemPath);
      return stats.isDirectory() || item.endsWith('.sqlite') || item.endsWith('.tar');
    });
    
    // 按修改时间排序
    backupItems.sort((a, b) => {
      const statsA = fs.statSync(path.join(backupDir, a));
      const statsB = fs.statSync(path.join(backupDir, b));
      return statsB.mtime.getTime() - statsA.mtime.getTime();
    });
    
    let deletedCount = 0;
    
    // 删除超过数量限制的备份
    if (backupItems.length > maxBackups) {
      const toDelete = backupItems.slice(maxBackups);
      for (const item of toDelete) {
        const itemPath = path.join(backupDir, item);
        try {
          if (fs.statSync(itemPath).isDirectory()) {
            fs.rmSync(itemPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(itemPath);
          }
          deletedCount++;
          console.log(`🗑️  已删除旧备份: ${item}`);
        } catch (error) {
          // 忽略无法删除的文件
        }
      }
    }
    
    // 删除超过时间限制的备份
    const now = Date.now();
    for (const item of backupItems) {
      const itemPath = path.join(backupDir, item);
      const stats = fs.statSync(itemPath);
      const age = now - stats.mtime.getTime();
      
      if (age > maxAge) {
        try {
          if (stats.isDirectory()) {
            fs.rmSync(itemPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(itemPath);
          }
          deletedCount++;
          console.log(`🗑️  已删除过期备份: ${item}`);
        } catch (error) {
          // 忽略无法删除的文件
        }
      }
    }
    
    if (deletedCount > 0) {
      console.log(`✅ 已清理 ${deletedCount} 个旧备份`);
    } else {
      console.log('ℹ️  没有需要清理的旧备份');
    }
    
  } catch (error) {
    console.error('❌ 清理旧备份失败:', error);
    // 清理旧备份失败不影响主流程
  }
}

async function main() {
  try {
    // 创建备份目录
    const backupDir = await createBackupDirectory();
    
    // 执行备份操作
    const dbBackupPath = await backupDatabase(backupDir);
    const configBackupPath = await backupConfiguration(backupDir);
    const logsBackupPath = await backupLogs(backupDir);
    
    // 创建备份清单
    const manifestPath = await createBackupManifest(backupDir, dbBackupPath, configBackupPath, logsBackupPath);
    
    // 清理旧备份
    await cleanupOldBackups(backupDir);
    
    console.log('\n🎉 备份完成！');
    console.log(`💾 备份位置: ${backupDir}`);
    console.log('💡 建议定期运行此脚本以保护重要数据');
    
  } catch (error) {
    console.error('❌ 备份失败:', error);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// 运行备份脚本
if (require.main === module) {
  main().then(() => {
    console.log('✅ 备份脚本执行完成');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ 备份脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { main }; 