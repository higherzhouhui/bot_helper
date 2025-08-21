// 错误处理中间件模块

class ErrorHandler {
  constructor(bot) {
    this.bot = bot;
  }

  // 处理未捕获的异常
  handleUncaughtException(error) {
    console.error('未捕获的异常:', error);
    // 可以在这里添加日志记录、通知等逻辑
  }

  // 处理未处理的Promise拒绝
  handleUnhandledRejection(reason, promise) {
    console.error('未处理的Promise拒绝:', reason);
    console.error('Promise:', promise);
    // 可以在这里添加日志记录、通知等逻辑
  }

  // 处理Telegram API错误
  async handleTelegramError(error, chatId) {
    console.error('Telegram API错误:', error);
    
    try {
      let errorMessage = '❌ 操作失败，请重试';
      
      if (error.code === 'ETELEGRAM') {
        switch (error.response.statusCode) {
          case 400:
            errorMessage = '❌ 请求参数错误';
            break;
          case 401:
            errorMessage = '❌ 认证失败，请检查机器人Token';
            break;
          case 403:
            errorMessage = '❌ 权限不足';
            break;
          case 404:
            errorMessage = '❌ 资源不存在';
            break;
          case 429:
            errorMessage = '❌ 请求过于频繁，请稍后再试';
            break;
          case 500:
            errorMessage = '❌ 服务器内部错误';
            break;
          default:
            errorMessage = `❌ 请求失败 (${error.response.statusCode})`;
        }
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = '❌ 网络连接失败，请检查网络';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = '❌ 请求超时，请重试';
      }

      if (chatId) {
        await this.bot.sendMessage(chatId, errorMessage);
      }
    } catch (sendError) {
      console.error('发送错误消息失败:', sendError);
    }
  }

  // 处理数据库错误
  async handleDatabaseError(error, chatId) {
    console.error('数据库错误:', error);
    
    try {
      let errorMessage = '❌ 数据库操作失败，请重试';
      
      if (error.name === 'SequelizeValidationError') {
        errorMessage = '❌ 数据验证失败，请检查输入';
      } else if (error.name === 'SequelizeUniqueConstraintError') {
        errorMessage = '❌ 数据已存在，请检查输入';
      } else if (error.name === 'SequelizeForeignKeyConstraintError') {
        errorMessage = '❌ 关联数据不存在，请检查输入';
      } else if (error.name === 'SequelizeDatabaseError') {
        errorMessage = '❌ 数据库错误，请联系管理员';
      }

      if (chatId) {
        await this.bot.sendMessage(chatId, errorMessage);
      }
    } catch (sendError) {
      console.error('发送数据库错误消息失败:', sendError);
    }
  }

  // 处理验证错误
  async handleValidationError(error, chatId) {
    console.error('验证错误:', error);
    
    try {
      let errorMessage = '❌ 输入验证失败，请重试';
      
      if (error.type === 'time') {
        errorMessage = '❌ 时间格式不正确，请使用：今晚20点、明天上午9点、30分钟后等';
      } else if (error.type === 'priority') {
        errorMessage = '❌ 优先级不正确，请使用：紧急、重要、普通、低';
      } else if (error.type === 'category') {
        errorMessage = '❌ 分类不存在，请选择有效分类';
      }

      if (chatId) {
        await this.bot.sendMessage(chatId, errorMessage);
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
    process.on('uncaughtException', (error) => {
      this.handleUncaughtException(error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.handleUnhandledRejection(reason, promise);
    });
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