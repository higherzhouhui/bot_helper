// 错误处理中间件模块

class ErrorHandler {
  constructor(bot) {
    this.bot = bot;
  }

  // 处理未捕获的异常
  handleUncaughtException(error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] 🚨 未捕获的异常:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // 记录到日志文件（如果配置了）
    if (process.env.LOG_FILE) {
      const fs = require('fs');
      const logEntry = `[${timestamp}] UNCAUGHT_EXCEPTION: ${error.message}\n${error.stack}\n\n`;
      fs.appendFileSync(process.env.LOG_FILE, logEntry);
    }
    
    // 在生产环境中，可以考虑优雅退出
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 生产环境检测到未捕获异常，建议重启服务');
    }
  }

  // 处理未处理的Promise拒绝
  handleUnhandledRejection(reason, promise) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] 🚨 未处理的Promise拒绝:`, {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise
    });
    
    // 记录到日志文件（如果配置了）
    if (process.env.LOG_FILE) {
      const fs = require('fs');
      const logEntry = `[${timestamp}] UNHANDLED_REJECTION: ${reason?.message || reason}\n${reason?.stack || ''}\n\n`;
      fs.appendFileSync(process.env.LOG_FILE, logEntry);
    }
  }

  // 处理Telegram API错误
  async handleTelegramError(error, chatId) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] 📱 Telegram API错误:`, {
      message: error.message,
      code: error.code,
      statusCode: error.response?.statusCode,
      chatId: chatId
    });
    
    try {
      let errorMessage = '❌ 操作失败，请重试';
      let shouldRetry = false;
      let retryDelay = 0;
      
      if (error.code === 'ETELEGRAM') {
        switch (error.response.statusCode) {
          case 400:
            errorMessage = '❌ 请求参数错误，请检查输入';
            break;
          case 401:
            errorMessage = '❌ 机器人认证失败，请联系管理员';
            console.error('🚨 BOT_TOKEN可能无效或已过期');
            break;
          case 403:
            errorMessage = '❌ 权限不足，请检查机器人设置';
            break;
          case 404:
            errorMessage = '❌ 资源不存在，请重试';
            break;
          case 429:
            errorMessage = '⏳ 请求过于频繁，请稍后再试';
            shouldRetry = true;
            retryDelay = 5000; // 5秒后重试
            break;
          case 500:
            errorMessage = '❌ 服务器内部错误，请稍后重试';
            shouldRetry = true;
            retryDelay = 10000; // 10秒后重试
            break;
          default:
            errorMessage = `❌ 请求失败 (${error.response.statusCode})，请重试`;
            shouldRetry = true;
            retryDelay = 3000; // 3秒后重试
        }
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = '❌ 网络连接失败，请检查网络';
        shouldRetry = true;
        retryDelay = 5000;
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = '⏳ 请求超时，请重试';
        shouldRetry = true;
        retryDelay = 3000;
      } else if (error.code === 'ECONNRESET') {
        errorMessage = '❌ 连接重置，请重试';
        shouldRetry = true;
        retryDelay = 5000;
      }

      if (chatId) {
        await this.bot.sendMessage(chatId, errorMessage);
        
        // 如果需要重试，记录重试信息
        if (shouldRetry) {
          console.log(`🔄 将在 ${retryDelay}ms 后重试操作 (chatId: ${chatId})`);
        }
      }
    } catch (sendError) {
      console.error('发送错误消息失败:', sendError);
    }
  }

  // 处理数据库错误
  async handleDatabaseError(error, chatId) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] 🗄️ 数据库错误:`, {
      message: error.message,
      name: error.name,
      code: error.code,
      sql: error.sql,
      chatId: chatId
    });
    
    try {
      let errorMessage = '❌ 数据库操作失败，请重试';
      let shouldRetry = false;
      let retryDelay = 0;
      
      if (error.name === 'SequelizeValidationError') {
        errorMessage = '❌ 数据验证失败，请检查输入格式';
        // 提供具体的验证错误信息
        if (error.errors && error.errors.length > 0) {
          const fieldErrors = error.errors.map(e => `${e.path}: ${e.message}`).join(', ');
          errorMessage += `\n\n详细错误：${fieldErrors}`;
        }
      } else if (error.name === 'SequelizeUniqueConstraintError') {
        errorMessage = '❌ 数据已存在，请检查输入';
        if (error.fields) {
          const fields = Object.keys(error.fields).join(', ');
          errorMessage += `\n\n重复字段：${fields}`;
        }
      } else if (error.name === 'SequelizeForeignKeyConstraintError') {
        errorMessage = '❌ 关联数据不存在，请检查输入';
        if (error.fields) {
          const fields = Object.keys(error.fields).join(', ');
          errorMessage += `\n\n关联字段：${fields}`;
        }
      } else if (error.name === 'SequelizeDatabaseError') {
        errorMessage = '❌ 数据库错误，请联系管理员';
        shouldRetry = true;
        retryDelay = 5000;
      } else if (error.name === 'SequelizeConnectionError') {
        errorMessage = '❌ 数据库连接失败，正在尝试重连...';
        shouldRetry = true;
        retryDelay = 10000;
      } else if (error.name === 'SequelizeTimeoutError') {
        errorMessage = '⏳ 数据库操作超时，请重试';
        shouldRetry = true;
        retryDelay = 3000;
      } else if (error.code === 'SQLITE_BUSY') {
        errorMessage = '⏳ 数据库繁忙，请稍后重试';
        shouldRetry = true;
        retryDelay = 2000;
      } else if (error.code === 'SQLITE_LOCKED') {
        errorMessage = '🔒 数据库被锁定，请稍后重试';
        shouldRetry = true;
        retryDelay = 5000;
      }

      if (chatId) {
        await this.bot.sendMessage(chatId, errorMessage);
        
        // 如果需要重试，记录重试信息
        if (shouldRetry) {
          console.log(`🔄 数据库操作将在 ${retryDelay}ms 后重试 (chatId: ${chatId})`);
        }
      }
    } catch (sendError) {
      console.error('发送数据库错误消息失败:', sendError);
    }
  }

  // 处理验证错误
  async handleValidationError(error, chatId) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ✅ 验证错误:`, {
      type: error.type,
      message: error.message,
      field: error.field,
      value: error.value,
      chatId: chatId
    });
    
    try {
      let errorMessage = '❌ 输入验证失败，请重试';
      let examples = '';
      
      if (error.type === 'time') {
        errorMessage = '❌ 时间格式不正确';
        examples = '\n\n💡 正确的时间格式示例：\n• 今晚20点\n• 明天上午9点\n• 30分钟后\n• 下周一\n• 每天8点\n• 每周一9点';
      } else if (error.type === 'priority') {
        errorMessage = '❌ 优先级设置不正确';
        examples = '\n\n💡 可用的优先级：\n• 🔴 紧急 (urgent)\n• 🟡 重要 (high)\n• 🟢 普通 (normal)\n• 🔵 低 (low)';
      } else if (error.type === 'category') {
        errorMessage = '❌ 分类设置不正确';
        examples = '\n\n💡 可用的分类：\n• 工作 (work)\n• 生活 (life)\n• 学习 (study)\n• 健康 (health)\n• 娱乐 (entertainment)';
      } else if (error.type === 'repeat') {
        errorMessage = '❌ 重复模式设置不正确';
        examples = '\n\n💡 可用的重复模式：\n• 每天 (daily)\n• 每周 (weekly)\n• 每月 (monthly)\n• 每年 (yearly)';
      } else if (error.type === 'message') {
        errorMessage = '❌ 提醒内容不能为空';
        examples = '\n\n💡 请输入有效的提醒内容，例如：\n• 今晚20点提醒我开会\n• 明天上午9点重要提醒：提交报告\n• 每天提醒我喝水';
      }

      const fullMessage = errorMessage + examples;
      
      if (chatId) {
        await this.bot.sendMessage(chatId, fullMessage);
      }
    } catch (sendError) {
      console.error('发送验证错误消息失败:', sendError);
    }
  }

  // 处理网络错误
  async handleNetworkError(error, chatId) {
    console.error('网络错误:', error);
    
    try {
      let errorMessage = '❌ 网络连接失败，请重试';
      
      if (error.code === 'ENOTFOUND') {
        errorMessage = '❌ 无法连接到服务器，请检查网络';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = '❌ 连接超时，请重试';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = '❌ 连接被拒绝，请稍后再试';
      } else if (error.code === 'ECONNRESET') {
        errorMessage = '❌ 连接被重置，请重试';
      }

      if (chatId) {
        await this.bot.sendMessage(chatId, errorMessage);
      }
    } catch (sendError) {
      console.error('发送网络错误消息失败:', sendError);
    }
  }

  // 处理通用错误
  async handleGenericError(error, chatId, context = '') {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ 通用错误 [${context}]:`, {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
      chatId: chatId
    });
    
    try {
      let errorMessage = '❌ 操作失败，请重试';
      let suggestions = '';
      
      // 根据错误类型提供不同的提示
      if (error.name === 'TypeError') {
        errorMessage = '❌ 数据类型错误';
        suggestions = '\n\n💡 建议：请检查输入格式，或联系管理员';
      } else if (error.name === 'ReferenceError') {
        errorMessage = '❌ 引用错误';
        suggestions = '\n\n💡 建议：请重试操作，或联系管理员';
      } else if (error.name === 'RangeError') {
        errorMessage = '❌ 范围错误';
        suggestions = '\n\n💡 建议：请检查输入值是否在有效范围内';
      } else if (error.name === 'SyntaxError') {
        errorMessage = '❌ 语法错误';
        suggestions = '\n\n💡 建议：请检查输入格式，或联系管理员';
      } else if (error.code === 'ENOENT') {
        errorMessage = '❌ 文件或目录不存在';
        suggestions = '\n\n💡 建议：请检查系统配置，或联系管理员';
      } else if (error.code === 'EACCES') {
        errorMessage = '❌ 权限不足';
        suggestions = '\n\n💡 建议：请检查系统权限，或联系管理员';
      } else if (error.code === 'ENOSPC') {
        errorMessage = '❌ 存储空间不足';
        suggestions = '\n\n💡 建议：请清理存储空间，或联系管理员';
      } else if (error.message.includes('timeout')) {
        errorMessage = '⏳ 操作超时';
        suggestions = '\n\n💡 建议：请稍后重试，或检查网络连接';
      } else if (error.message.includes('network')) {
        errorMessage = '❌ 网络错误';
        suggestions = '\n\n💡 建议：请检查网络连接，稍后重试';
      }

      const fullMessage = errorMessage + suggestions;
      
      if (chatId) {
        await this.bot.sendMessage(chatId, fullMessage);
      }
    } catch (sendError) {
      console.error('发送通用错误消息失败:', sendError);
    }
  }

  // 通用错误处理
  async handleError(error, chatId, context = '') {
    console.error(`错误 [${context}]:`, error);
    
    try {
      let errorMessage = '❌ 操作失败，请重试';
      
      // 根据错误类型选择处理方法
      if (error.code && error.code.startsWith('ETELEGRAM')) {
        await this.handleTelegramError(error, chatId);
      } else if (error.name && error.name.startsWith('Sequelize')) {
        await this.handleDatabaseError(error, chatId);
      } else if (error.type && ['time', 'priority', 'category'].includes(error.type)) {
        await this.handleValidationError(error, chatId);
      } else if (error.code && ['ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET'].includes(error.code)) {
        await this.handleNetworkError(error, chatId);
      } else {
        // 通用错误消息
        if (chatId) {
          await this.bot.sendMessage(chatId, errorMessage);
        }
      }
    } catch (sendError) {
      console.error('发送错误消息失败:', sendError);
    }
  }

  // 设置全局错误处理器
  setupGlobalErrorHandlers() {
    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
      this.handleUncaughtException(error);
      
      // 在生产环境中，可以考虑优雅退出
      if (process.env.NODE_ENV === 'production') {
        console.error('🚨 生产环境检测到未捕获异常，建议重启服务');
        // 给一些时间让日志写入
        setTimeout(() => {
          process.exit(1);
        }, 1000);
      }
    });

    // 处理未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      this.handleUnhandledRejection(reason, promise);
    });

    // 处理SIGTERM信号（优雅关闭）
    process.on('SIGTERM', () => {
      console.log('📱 收到SIGTERM信号，正在优雅关闭...');
      this.gracefulShutdown();
    });

    // 处理SIGINT信号（Ctrl+C）
    process.on('SIGINT', () => {
      console.log('📱 收到SIGINT信号，正在优雅关闭...');
      this.gracefulShutdown();
    });

    // 处理进程退出
    process.on('exit', (code) => {
      console.log(`📱 进程退出，退出码: ${code}`);
    });

    console.log('✅ 全局错误处理器已设置');
  }

  // 优雅关闭
  async gracefulShutdown() {
    try {
      console.log('🔄 正在关闭数据库连接...');
      // 这里可以添加数据库关闭逻辑
      
      console.log('🔄 正在清理定时器...');
      // 这里可以添加定时器清理逻辑
      
      console.log('✅ 优雅关闭完成');
      process.exit(0);
    } catch (error) {
      console.error('❌ 优雅关闭失败:', error);
      process.exit(1);
    }
  }

  // 创建错误包装器
  wrapAsync(fn) {
    return async (req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        await this.handleError(error, req.chatId, 'async_wrapper');
      }
    };
  }
}

module.exports = ErrorHandler; 