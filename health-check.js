#!/usr/bin/env node

/**
 * 小智助手健康检查脚本
 * 用于检查系统各项功能是否正常
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${colors.bright}${colors.blue}=== ${title} ===${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// 检查环境
function checkEnvironment() {
  logSection('环境检查');
  
  // 检查Node.js版本
  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion >= 16) {
      logSuccess(`Node.js版本: ${nodeVersion}`);
    } else {
      logError(`Node.js版本过低: ${nodeVersion}，需要16.0.0或更高版本`);
    }
  } catch (error) {
    logError('无法获取Node.js版本');
  }
  
  // 检查npm版本
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    logSuccess(`npm版本: ${npmVersion}`);
  } catch (error) {
    logError('无法获取npm版本');
  }
  
  // 检查环境变量
  const requiredEnvVars = ['BOT_TOKEN'];
  const missingEnvVars = [];
  
  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      logSuccess(`环境变量 ${varName}: 已设置`);
    } else {
      missingEnvVars.push(varName);
      logError(`环境变量 ${varName}: 未设置`);
    }
  });
  
  if (missingEnvVars.length > 0) {
    logWarning('请检查.env配置文件');
  }
  
  // 检查时区
  if (process.env.TIMEZONE) {
    logSuccess(`时区设置: ${process.env.TIMEZONE}`);
  } else {
    logInfo('时区设置: 使用系统默认时区');
  }
}

// 检查文件系统
function checkFileSystem() {
  logSection('文件系统检查');
  
  const requiredFiles = [
    'package.json',
    'src/bot.js',
    'src/config/index.js',
    'src/models/index.js'
  ];
  
  const requiredDirs = [
    'src',
    'src/handlers',
    'src/services',
    'src/utils'
  ];
  
  // 检查必需文件
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logSuccess(`文件存在: ${file}`);
    } else {
      logError(`文件缺失: ${file}`);
    }
  });
  
  // 检查必需目录
  requiredDirs.forEach(dir => {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      logSuccess(`目录存在: ${dir}`);
    } else {
      logError(`目录缺失: ${dir}`);
    }
  });
  
  // 检查数据目录
  const dataDir = 'data';
  if (fs.existsSync(dataDir)) {
    logSuccess(`数据目录存在: ${dataDir}`);
    
    // 检查数据库文件
    const dbFile = path.join(dataDir, 'database.sqlite');
    if (fs.existsSync(dbFile)) {
      const stats = fs.statSync(dbFile);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      logSuccess(`数据库文件存在: ${dbFile} (${sizeInMB} MB)`);
    } else {
      logWarning(`数据库文件不存在: ${dbFile}`);
    }
  } else {
    logWarning(`数据目录不存在: ${dataDir}`);
  }
}

// 检查依赖
function checkDependencies() {
  logSection('依赖检查');
  
  // 检查node_modules
  if (fs.existsSync('node_modules')) {
    logSuccess('node_modules目录存在');
    
    // 检查关键依赖
    const criticalDeps = [
      'node_modules/node-telegram-bot-api',
      'node_modules/sequelize',
      'node_modules/sqlite3',
      'node_modules/axios',
      'node_modules/cheerio'
    ];
    
    criticalDeps.forEach(dep => {
      if (fs.existsSync(dep)) {
        logSuccess(`依赖已安装: ${dep.split('/').pop()}`);
      } else {
        logError(`依赖缺失: ${dep.split('/').pop()}`);
      }
    });
  } else {
    logError('node_modules目录不存在，请运行 npm install');
  }
  
  // 检查package.json
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    logSuccess(`项目名称: ${packageJson.name}`);
    logSuccess(`项目版本: ${packageJson.version}`);
    
    // 检查脚本
    const requiredScripts = ['start', 'dev', 'init'];
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        logSuccess(`脚本可用: ${script}`);
      } else {
        logWarning(`脚本缺失: ${script}`);
      }
    });
  } catch (error) {
    logError('无法读取package.json文件');
  }
}

// 检查网络连接
function checkNetwork() {
  logSection('网络连接检查');
  
  const testUrls = [
    'https://api.telegram.org',
    'https://news.qq.com',
    'https://www.toutiao.com'
  ];
  
  testUrls.forEach(url => {
    try {
      // 简单的网络连接测试
      const https = require('https');
      const req = https.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          logSuccess(`网络连接正常: ${url}`);
        } else {
          logWarning(`网络连接异常: ${url} (状态码: ${res.statusCode})`);
        }
      });
      
      req.on('error', () => {
        logError(`网络连接失败: ${url}`);
      });
      
      req.on('timeout', () => {
        logError(`网络连接超时: ${url}`);
      });
      
      req.end();
    } catch (error) {
      logError(`网络检查失败: ${url}`);
    }
  });
}

// 检查数据库连接
async function checkDatabase() {
  logSection('数据库检查');
  
  try {
    // 尝试加载数据库模块
    const { sequelize, testConnection } = require('./src/models');
    
    if (sequelize) {
      logSuccess('数据库模块加载成功');
      
      // 测试数据库连接
      const isConnected = await testConnection();
      if (isConnected) {
        logSuccess('数据库连接正常');
        
        // 检查数据库表
        try {
          const tables = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
          if (tables[0] && tables[0].length > 0) {
            logSuccess(`数据库表数量: ${tables[0].length}`);
            tables[0].forEach(table => {
              logInfo(`  - ${table.name}`);
            });
          } else {
            logWarning('数据库中没有表');
          }
        } catch (error) {
          logWarning('无法获取数据库表信息');
        }
      } else {
        logError('数据库连接失败');
      }
      
      await sequelize.close();
    } else {
      logError('数据库模块加载失败');
    }
  } catch (error) {
    logError(`数据库检查失败: ${error.message}`);
  }
}

// 主函数
async function main() {
  log(`${colors.bright}${colors.magenta}🚀 小智助手健康检查${colors.reset}`);
  log(`${colors.blue}开始时间: ${new Date().toLocaleString('zh-CN')}${colors.reset}`);
  
  try {
    checkEnvironment();
    checkFileSystem();
    checkDependencies();
    checkNetwork();
    await checkDatabase();
    
    logSection('检查完成');
    logSuccess('健康检查完成！');
    logInfo('如果发现问题，请根据上述提示进行修复');
    
  } catch (error) {
    logError(`健康检查过程中发生错误: ${error.message}`);
    process.exit(1);
  }
}

// 运行健康检查
if (require.main === module) {
  main().catch(error => {
    logError(`健康检查失败: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main }; 