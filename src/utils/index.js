// 工具函数统一导出模块

// 导入所有工具模块
const dateUtils = require('./dateUtils');
const textUtils = require('./textUtils');
const validationUtils = require('./validationUtils');
const reminderUtils = require('./reminderUtils');

// 统一导出所有工具函数
module.exports = {
  // 日期处理工具
  ...dateUtils,
  
  // 文本处理工具
  ...textUtils,
  
  // 验证工具
  ...validationUtils,
  
  // 提醒工具
  ...reminderUtils
}; 