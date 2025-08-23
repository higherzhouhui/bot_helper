// 优化后的主入口文件
const TelegramBot = require('node-telegram-bot-api');
const { config, validateConfig } = require('./config');
const ReminderHandler = require('./handlers/reminderHandler');
const NewsHandler = require('./handlers/newsHandler');
const CommandHandler = require('./handlers/commandHandler');
const ErrorHandler = require('./middlewares/errorHandler');
const reminderService = require('./services/reminderService');
const newsService = require('./services/newsService');
const SmartParser = require('./utils/smartParser');
const userService = require('./services/userService');

class TelegramReminderBot {
  constructor() {
    this.bot = new TelegramBot(config.BOT_TOKEN, { polling: true });
    this.config = config;
    
    // 初始化处理器
    this.reminderHandler = new ReminderHandler(this.bot, config);
    this.newsHandler = new NewsHandler(this.bot);
    this.commandHandler = new CommandHandler(this.bot, config);
    this.errorHandler = new ErrorHandler(this.bot);
    
    // 初始化智能解析器
    this.smartParser = new SmartParser();
    
    // 用户状态管理
    this.userEditStates = new Map();
    this.userSearchStates = new Map();
    
    // 设置全局错误处理器
    this.errorHandler.setupGlobalErrorHandlers();
    
    // 校验关键配置
    try { validateConfig(); } catch (e) { console.error(e.message); throw e; }

    // 预初始化新闻分类（忽略错误）
    newsService.initializeNewsCategories?.().catch(() => {});

    // 初始化提醒定时器
    this.initReminderTimer();
    
    // 设置事件处理器
    this.setupEventHandlers();
    
    console.log('🤖 智能提醒机器人已启动');
  }

  // 设置事件处理器
  setupEventHandlers() {
    // 处理 /start 命令
    this.bot.onText(/\/start/, async (msg) => {
      try {
        await this.commandHandler.handleStartCommand(msg);
      } catch (error) {
        await this.errorHandler.handleError(error, msg.chat.id, 'start_command');
      }
    });

    // 处理 /help 命令
    this.bot.onText(/\/help/, async (msg) => {
      try {
        await this.commandHandler.handleHelpCommand(msg);
      } catch (error) {
        await this.errorHandler.handleError(error, msg.chat.id, 'help_command');
      }
    });

    // 处理 /reminders 命令
    this.bot.onText(/\/reminders/, async (msg) => {
      try {
        await this.commandHandler.handleRemindersCommand(msg);
      } catch (error) {
        await this.errorHandler.handleError(error, msg.chat.id, 'reminders_command');
      }
    });

    // 处理 /news 命令
    this.bot.onText(/\/news/, async (msg) => {
      try {
        await this.newsHandler.handleNewsCommand(msg);
      } catch (error) {
        await this.errorHandler.handleError(error, msg.chat.id, 'news_command');
      }
    });

    // 处理 /web3 命令
    this.bot.onText(/\/web3/, async (msg) => {
      try {
        await this.newsHandler.handleWeb3Command(msg);
      } catch (error) {
        await this.errorHandler.handleError(error, msg.chat.id, 'web3_command');
      }
    });

    // 新增：/brief 个性化简报
    this.bot.onText(/\/brief/, async (msg) => {
      try {
        await this.commandHandler.handleBriefCommand(msg);
      } catch (error) {
        await this.errorHandler.handleError(error, msg.chat.id, 'brief_command');
      }
    });

    // 新增：/subscribe 关键词订阅
    this.bot.onText(/^\/subscribe( .+)?$/, async (msg) => {
      try {
        await this.commandHandler.handleSubscribeCommand(msg);
      } catch (error) {
        await this.errorHandler.handleError(error, msg.chat.id, 'subscribe_command');
      }
    });

    // 新增：/favorites 收藏夹
    this.bot.onText(/\/favorites/, async (msg) => {
      try {
        await this.commandHandler.handleFavoritesCommand(msg);
      } catch (error) {
        await this.errorHandler.handleError(error, msg.chat.id, 'favorites_command');
      }
    });

    // 新增：/quiet 安静时段
    this.bot.onText(/^\/quiet( .+)?$/, async (msg) => {
      try {
        await this.commandHandler.handleQuietCommand(msg);
      } catch (error) {
        await this.errorHandler.handleError(error, msg.chat.id, 'quiet_command');
      }
    });

    // 管理员命令：/admin_stats - 系统统计
    this.bot.onText(/\/admin_stats/, async (msg) => {
      try {
        await this.commandHandler.handleAdminStatsCommand(msg);
      } catch (error) {
        await this.errorHandler.handleError(error, msg.chat.id, 'admin_stats_command');
      }
    });

    // 管理员命令：/admin_users - 用户详情
    this.bot.onText(/\/admin_users/, async (msg) => {
      try {
        await this.commandHandler.handleAdminUsersCommand(msg);
      } catch (error) {
        await this.errorHandler.handleError(error, msg.chat.id, 'admin_users_command');
      }
    });

    // 处理 /stats 命令
    this.bot.onText(/\/stats/, async (msg) => {
      try {
        await this.commandHandler.handleStatsCommand(msg);
      } catch (error) {
        await this.errorHandler.handleError(error, msg.chat.id, 'stats_command');
      }
    });

    // 处理普通消息
    this.bot.on('message', async (msg) => {
      try {
        if (msg.text && !msg.text.startsWith('/')) {
          await this.handleTextMessage(msg);
        }
      } catch (error) {
        await this.errorHandler.handleError(error, msg.chat.id, 'text_message');
      }
    });

    // 处理按钮回调
    this.bot.on('callback_query', async (callbackQuery) => {
      try {
        await this.handleCallbackQuery(callbackQuery);
      } catch (error) {
        await this.errorHandler.handleError(error, callbackQuery.message.chat.id, 'callback_query');
      }
    });
  }

  // 处理文本消息
  async handleTextMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    // 检查用户编辑状态
    const editState = this.userEditStates.get(userId);
    if (editState) {
      await this.handleEditStateInput(msg, editState);
      return;
    }

    // 检查用户搜索状态
    const searchState = this.userSearchStates.get(userId);
    if (searchState) {
      await this.handleSearchStateInput(msg, searchState);
      return;
    }

    // 尝试解析为提醒
    const isReminder = await this.commandHandler.handleNaturalLanguageReminder(msg);
    if (isReminder) {
      return;
    }

    // 尝试解析为新闻搜索
    if (this.isNewsQuery(text)) {
      await this.newsHandler.executeNewsSearch(chatId, text);
      return;
    }

    // 默认回复
    await this.bot.sendMessage(chatId, '💡 请使用以下方式：\n\n⏰ 创建提醒：今晚20点提醒我开会\n📰 查看新闻：/news\n🕸️ Web3：/web3\n❓ 查看帮助：/help');
  }

  // 处理编辑状态输入
  async handleEditStateInput(msg, editState) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    try {
      if (editState.type === 'edit_content') {
        await this.handleEditContentInput(msg, editState, text);
      } else if (editState.type === 'edit_time') {
        await this.handleEditTimeInput(msg, editState, text);
      }
    } catch (error) {
      console.error('处理编辑状态输入失败:', error);
      await this.bot.sendMessage(chatId, '❌ 处理输入失败，请重试');
    }
  }

  // 处理编辑内容输入
  async handleEditContentInput(msg, editState, text) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const reminderId = editState.reminderId;

    try {
      const reminder = await reminderService.updateReminder(reminderId, userId, { message: text });
      if (reminder) {
        await this.bot.sendMessage(chatId, '✅ 提醒内容已更新！');
        await this.reminderHandler.showEditMenu(chatId, userId, reminderId);
      } else {
        await this.bot.sendMessage(chatId, '❌ 更新失败，请重试');
      }
    } catch (error) {
      console.error('更新提醒内容失败:', error);
      await this.bot.sendMessage(chatId, '❌ 更新失败，请重试');
    } finally {
      this.userEditStates.delete(userId);
    }
  }

  // 处理编辑时间输入
  async handleEditTimeInput(msg, editState, text) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const reminderId = editState.reminderId;

    try {
      const parsedTime = this.smartParser.parseTime(text);
      if (!parsedTime) {
        await this.bot.sendMessage(chatId, '❌ 时间格式不正确，请重试');
        return;
      }

      const reminder = await reminderService.updateReminder(reminderId, userId, { reminderTime: parsedTime });
      if (reminder) {
        await this.bot.sendMessage(chatId, '✅ 提醒时间已更新！');
        await this.reminderHandler.showEditMenu(chatId, userId, reminderId);
      } else {
        await this.bot.sendMessage(chatId, '❌ 更新失败，请重试');
      }
    } catch (error) {
      console.error('更新提醒时间失败:', error);
      await this.bot.sendMessage(chatId, '❌ 更新失败，请重试');
    } finally {
      this.userEditStates.delete(userId);
    }
  }

  // 处理搜索状态输入
  async handleSearchStateInput(msg, searchState) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    try {
      if (searchState.type === 'news') {
        await this.newsHandler.executeNewsSearch(chatId, text);
      } else if (searchState.type === 'web3') {
        await this.newsHandler.executeWeb3Search(chatId, text);
      } else if (searchState.type === 'reminder') {
        await this.executeReminderSearch(chatId, userId, text);
      }
    } catch (error) {
      console.error('处理搜索状态输入失败:', error);
      await this.bot.sendMessage(chatId, '❌ 搜索失败，请重试');
    } finally {
      this.userSearchStates.delete(userId);
    }
  }

  // 处理按钮回调
  async handleCallbackQuery(callbackQuery) {
    const data = callbackQuery.data;
    
    try {
      // 优先处理特定的编辑操作
      if (data.startsWith('edit_content_') || data.startsWith('edit_time_') || 
          data.startsWith('edit_category_') || data.startsWith('edit_priority_') ||
          data.startsWith('back_to_reminder_') || data.startsWith('set_category_') ||
          data.startsWith('set_priority_') || data.startsWith('back_to_edit_')) {
        await this.reminderHandler.handleEditOptions(callbackQuery, data);
      } else if (data.startsWith('complete_')) {
        await this.handleCompleteReminder(callbackQuery);
      } else if (data.startsWith('delay_')) {
        await this.handleDelayReminder(callbackQuery);
      } else if (data.startsWith('snooze_')) {
        await this.handleSnoozeReminder(callbackQuery);
      } else if (data.startsWith('edit_')) {
        const reminderId = parseInt(data.split('_')[1]);
        await this.reminderHandler.handleEditReminder(callbackQuery, reminderId);
      } else if (data.startsWith('delete_')) {
        await this.handleDeleteReminder(callbackQuery);
      } else if (data.startsWith('news_')) {
        await this.newsHandler.handleNewsCallback(callbackQuery);
      } else if (data.startsWith('web3_')) {
        await this.newsHandler.handleWeb3Callback(callbackQuery);
      } else if (data.startsWith('create_') || data.startsWith('my_') || 
                 data === 'help' || data === 'stats' || data.startsWith('back_to_') ||
                 data === 'reminder_stats' || data === 'search_reminders' || data === 'cleanup_completed') {
        await this.commandHandler.handleCommandCallback(callbackQuery);
      } else if (data.startsWith('admin_')) {
        await this.commandHandler.handleAdminCallback(callbackQuery);
      } else {
        await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 未知操作');
      }
    } catch (error) {
      console.error('处理按钮回调失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 处理完成提醒
  async handleCompleteReminder(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const reminderId = parseInt(callbackQuery.data.split('_')[1]);

    try {
      const result = await reminderService.completeReminder(reminderId, userId);
      if (result && result.success) {
        // 构建完成消息
        let completedMessage = '✅ 提醒已完成！';
        if (result.hasNext && result.nextTime) {
          const { getRepeatText } = require('./utils/reminderUtils');
          const repeatText = getRepeatText(result.repeatPattern);
          completedMessage += `\n\n🔄 下一次${repeatText}提醒：${result.nextTime.toLocaleString('zh-CN')}`;
        }

        // 编辑原消息，显示完成状态
        try {
          await this.bot.editMessageText(completedMessage, {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: { inline_keyboard: [] } // 清空按钮
          });
        } catch (editError) {
          console.warn('无法编辑消息:', editError.message);
          // 如果无法编辑，发送新消息
          await this.bot.sendMessage(chatId, completedMessage);
        }
        
        const callbackMessage = result.hasNext ? '✅ 提醒已完成，已创建下一次提醒' : '✅ 提醒已完成';
        await this.bot.answerCallbackQuery(callbackQuery.id, callbackMessage);
      } else {
        await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
      }
    } catch (error) {
      console.error('完成提醒失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 处理延后提醒
  async handleDelayReminder(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const reminderId = parseInt(callbackQuery.data.split('_')[1]);

    try {
      const reminder = await reminderService.delayReminder(reminderId, new Date(Date.now() + 10 * 60 * 1000));
      if (reminder) {
        // 编辑原消息，显示延后状态
        try {
          await this.bot.editMessageText('⏰ 提醒已延后10分钟！', {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: { inline_keyboard: [] } // 清空按钮
          });
        } catch (editError) {
          console.warn('无法编辑消息:', editError.message);
          // 如果无法编辑，发送新消息
          await this.bot.sendMessage(chatId, '⏰ 提醒已延后10分钟！');
        }
        await this.bot.answerCallbackQuery(callbackQuery.id, '⏰ 提醒已延后');
      } else {
        await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
      }
    } catch (error) {
      console.error('延后提醒失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 处理小睡提醒
  async handleSnoozeReminder(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const reminderId = parseInt(callbackQuery.data.split('_')[1]);

    try {
      const reminder = await reminderService.snoozeReminder(reminderId, new Date(Date.now() + 5 * 60 * 1000));
      if (reminder) {
        // 编辑原消息，显示小睡状态
        try {
          await this.bot.editMessageText('🔔 提醒已小睡5分钟！', {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: { inline_keyboard: [] } // 清空按钮
          });
        } catch (editError) {
          console.warn('无法编辑消息:', editError.message);
          // 如果无法编辑，发送新消息
          await this.bot.sendMessage(chatId, '🔔 提醒已小睡5分钟！');
        }
        await this.bot.answerCallbackQuery(callbackQuery.id, '🔔 提醒已小睡');
      } else {
        await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
      }
    } catch (error) {
      console.error('小睡提醒失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 处理删除提醒
  async handleDeleteReminder(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const reminderId = parseInt(callbackQuery.data.split('_')[1]);

    try {
      const result = await reminderService.deleteReminder(reminderId, userId);
      if (result) {
        // 删除原来的消息
        try {
          await this.bot.deleteMessage(callbackQuery.id, callbackQuery.message.message_id);
        } catch (deleteError) {
          console.warn('无法删除消息:', deleteError.message);
          // 如果无法删除消息，则编辑消息内容
          try {
            await this.bot.editMessageText('🗑️ 提醒已删除！', {
              chat_id: chatId,
              message_id: callbackQuery.message.message_id,
              reply_markup: { inline_keyboard: [] } // 清空按钮
            });
          } catch (editError) {
            console.warn('无法编辑消息:', editError.message);
          }
        }
        await this.bot.answerCallbackQuery(callbackQuery.id, '🗑️ 提醒已删除');
      } else {
        await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
      }
    } catch (error) {
      console.error('删除提醒失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 检查是否是新闻查询
  isNewsQuery(text) {
    const newsKeywords = ['新闻', '热点', '资讯', '最新', '热门', '头条', '报道'];
    return newsKeywords.some(keyword => text.includes(keyword));
  }

  // 执行提醒搜索
  async executeReminderSearch(chatId, userId, keyword) {
    try {
      const results = await reminderService.searchReminders(userId, keyword, 10);
      if (results.length === 0) {
        await this.bot.sendMessage(chatId, `🔍 搜索 "${keyword}" 没有找到相关提醒`);
        return;
      }

      let message = `🔍 搜索 "${keyword}" 结果：\n\n`;
      results.forEach((reminder, index) => {
        const status = reminder.isCompleted ? '✅' : '⏳';
        const priority = this.getPriorityEmoji(reminder.priority);
        message += `${index + 1}. ${status} ${priority} ${reminder.message}\n`;
        message += `   📅 ${reminder.reminderTime.toLocaleString('zh-CN')}\n\n`;
      });

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🔍 继续搜索', callback_data: 'search_reminders' },
            { text: '📋 返回提醒', callback_data: 'my_reminders' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, message, {
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('执行提醒搜索失败:', error);
      await this.bot.sendMessage(chatId, '❌ 搜索失败，请重试');
    }
  }

  // 获取优先级表情
  getPriorityEmoji(priority) {
    const priorityMap = {
      'urgent': '🔴',
      'high': '🟡',
      'normal': '🟢',
      'low': '🔵'
    };
    return priorityMap[priority] || '🟢';
  }

  // 初始化提醒定时器
  async initReminderTimer() {
    try {
      // 每10秒检查一次提醒
      setInterval(async () => {
        try {
          const dueReminders = await reminderService.getDueReminders();
          for (const reminder of dueReminders) {
            await this.sendReminder(reminder);
          }
          
          // 清理达到最大发送次数的提醒
          await reminderService.cleanupMaxSentReminders();
        } catch (error) {
          console.error('检查提醒失败:', error);
        }
      }, 10 * 1000); // 固定为10秒

      console.log('⏰ 提醒定时器已启动（每10秒检查一次）');
    } catch (error) {
      console.error('启动提醒定时器失败:', error);
    }
  }

  // 发送提醒
  async sendReminder(reminder) {
    try {
      const chatId = reminder.chatId;
      
      // 构建提醒消息
      let message = `⏰ 提醒时间到！\n\n💬 ${reminder.message}\n📅 ${reminder.reminderTime.toLocaleString('zh-CN')}`;
      
      // 如果是重复提醒，显示次数信息
      if (reminder.sentCount && reminder.sentCount > 0) {
        const remainingCount = (reminder.maxSentCount || 5) - reminder.sentCount;
        if (remainingCount > 0) {
          message += `\n🔄 第${reminder.sentCount + 1}次提醒 (还剩${remainingCount}次)`;
        } else {
          message += `\n⚠️ 最后一次提醒`;
        }
      }

      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ 完成', callback_data: `complete_${reminder.id}` },
            { text: '⏰ 延后10分钟', callback_data: `delay_${reminder.id}` }
          ],
          [
            { text: '🔔 小睡5分钟', callback_data: `snooze_${reminder.id}` },
            { text: '✏️ 修改', callback_data: `edit_${reminder.id}` }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, message, {
        reply_markup: keyboard
      });

      // 记录提醒发送历史
      await reminderService.recordReminderSent(reminder.id);
    } catch (error) {
      console.error('发送提醒失败:', error);
    }
  }

  // 启动机器人
  start() {
    console.log('🚀 机器人正在启动...');
    
    // 启动定时任务
    this.startScheduledTasks();
    
    console.log('✅ 机器人启动完成！');
  }

  // 启动定时任务
  startScheduledTasks() {
    // 新闻爬取轮询
    const newsTasks = [
      { source: 'sina', cat: 'tech' },
      { source: '163', cat: 'tech' },
      { source: 'sohu', cat: 'tech' },
      { source: 'sina', cat: 'finance' }
    ];
    let newsIdx = 0;

    // 立即执行一次
    (async () => {
      try {
        for (const t of newsTasks.slice(0, 2)) {
          await newsService.crawlNews(t.source, t.cat, 10);
        }
      } catch (e) {
        console.warn('首次新闻抓取失败:', e.message || e);
      }
    })();

    setInterval(async () => {
      try {
        const t = newsTasks[newsIdx % newsTasks.length];
        newsIdx++;
        await newsService.crawlNews(t.source, t.cat, 15);
      } catch (error) {
        console.error('新闻爬取任务失败:', error.message || error);
      }
    }, config.NEWS_CRAWL_INTERVAL);

    // Web3 轮询
    const web3Tasks = ['chainfeeds', 'panews', 'investing_cn'];
    let widx = 0;

    // 立即执行一次
    (async () => {
      try {
        for (const src of web3Tasks) {
          await newsService.crawlWeb3(src, 8);
        }
      } catch (e) {
        console.warn('首次 Web3 抓取失败:', e.message || e);
      }
    })();

    setInterval(async () => {
      try {
        const src = web3Tasks[widx % web3Tasks.length];
        widx++;
        await newsService.crawlWeb3(src, 12);
      } catch (error) {
        console.error('Web3 爬取任务失败:', error.message || error);
      }
    }, Math.max(60000, Math.floor(config.NEWS_CRAWL_INTERVAL / 2)));

    // 个性化简报：每分钟检查一次，匹配 HH:mm（维持 60s 间隔）
    setInterval(async () => {
      try {
        const now = new Date();
        const pad = (n) => (n < 10 ? '0' + n : '' + n);
        const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const userIds = await userService.getUsersToBriefAt(hhmm);
        for (const uid of userIds) {
          const inQuiet = await userService.isInQuietHours(uid, now);
          if (inQuiet) continue;
          const brief = await newsService.getPersonalizedBrief(uid, 8);
          await this.bot.sendMessage(uid, brief, { parse_mode: 'HTML', disable_web_page_preview: true });
        }
      } catch (e) {
        console.error('发送个性化简报失败:', e.message || e);
      }
    }, 60 * 1000);

    console.log('🔄 定时任务已启动');
  }

  // 停止机器人
  stop() {
    console.log('🛑 正在停止机器人...');
    this.bot.stopPolling();
    console.log('✅ 机器人已停止');
  }
}

// 创建并启动机器人实例
const bot = new TelegramReminderBot();
bot.start();

// 优雅关闭
process.on('SIGINT', () => {
  console.log('🛑 收到关闭信号，正在优雅关闭...');
  bot.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 收到终止信号，正在优雅关闭...');
  bot.stop();
  process.exit(0);
});

module.exports = TelegramReminderBot; 