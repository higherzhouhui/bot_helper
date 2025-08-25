// 命令处理器模块
const reminderService = require('../services/reminderService');
const SmartParser = require('../utils/smartParser');
const { createCategoryKeyboard, createPriorityKeyboard, createActionButtons, formatReminderMessage } = require('../utils/reminderUtils');
const newsService = require('../services/newsService');
const userService = require('../services/userService');

class CommandHandler {
  constructor(bot, config) {
    this.bot = bot;
    this.config = config;
    this.smartParser = new SmartParser();
    this.userStates = new Map();
  }

  // 处理开始命令
  async handleStartCommand(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    try {
      // 创建或获取用户
      await reminderService.createOrUpdateUser(msg.from);
      
      const welcomeMessage = `🎉 欢迎使用智能提醒助手！\n\n📋 主要功能：\n• ⏰ 智能提醒：支持自然语言输入\n• 🏷️ 分类管理：工作、生活、学习等\n• ⭐ 优先级：紧急、重要、普通、低\n• 🔄 重复提醒：每天、每周、每月等\n• 📰 新闻资讯：最新热点新闻\n• 🕸️ Web3 资讯：ChainFeeds/PANews/Investing\n\n💡 使用示例：\n• "今晚20点提醒我开会"\n• "明天上午9点重要提醒：提交报告"\n• "每天提醒我喝水"\n\n🔧 常用命令：\n/start - 开始使用\n/help - 查看帮助\n/reminders - 查看提醒\n/news - 最新新闻\n/web3 - Web3 区块链资讯\n/brief - 生成个性化简报\n/subscribe 关键词 - 订阅关键词\n/favorites - 查看收藏\n/quiet HH:MM HH:MM - 设置安静时段\n/stats - 统计信息\n/setup_categories - 设置默认分类`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '⏰ 创建提醒', callback_data: 'create_reminder' },
            { text: '📋 我的提醒', callback_data: 'my_reminders' }
          ],
          [
            { text: '📰 最新新闻', callback_data: 'news_latest' },
            { text: '💼 Web3', callback_data: 'web3_latest' }
          ],
          [
            { text: '❓ 帮助', callback_data: 'help' },
            { text: '📊 统计', callback_data: 'stats' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('处理开始命令失败:', error);
      await this.bot.sendMessage(chatId, '❌ 启动失败，请重试');
    }
  }

  // 处理帮助命令
  async handleHelpCommand(msg) {
    const chatId = msg.chat.id;
    
    const helpMessage = `❓ 使用帮助\n\n📝 创建提醒：\n• 直接发送：今晚20点提醒我开会\n• 带分类：明天上午9点工作提醒：提交报告\n• 带优先级：今晚22点紧急提醒：检查服务器\n• 带标签：每天提醒我喝水 #健康 #生活\n• 带备注：明天提醒我买礼物 备注：老婆生日\n\n🏷️ 分类说明：\n• 工作：工作相关提醒\n• 生活：日常生活提醒\n• 学习：学习相关提醒\n• 健康：健康相关提醒\n• 财务：财务相关提醒\n\n⭐ 优先级说明：\n• 🔴 紧急：需要立即处理\n• 🟡 重要：需要优先处理\n• 🟢 普通：正常处理\n• 🔵 低：可以延后处理\n\n🔄 重复模式：\n• 每天：每天重复\n• 每周：每周重复\n• 每月：每月重复\n• 工作日：周一到周五\n• 周末：周六和周日\n\n📱 操作按钮：\n• ✅ 完成：标记提醒为已完成\n• ⏰ 延后：延后10分钟提醒\n• 🔔 小睡：5分钟后再次提醒\n• ✏️ 修改：修改提醒内容\n• 🗑️ 删除：删除提醒\n\n🔧 常用命令：\n/start - 开始使用\n/help - 查看帮助\n/reminders - 查看提醒\n/news - 最新新闻\n/web3 - Web3 区块链资讯\n/brief - 生成个性化简报\n/subscribe 关键词 - 订阅关键词\n/favorites - 查看收藏\n/quiet HH:MM HH:MM - 设置安静时段\n/stats - 统计信息`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '⏰ 创建提醒', callback_data: 'create_reminder' },
          { text: '📋 我的提醒', callback_data: 'my_reminders' }
        ],
        [
          { text: '🔙 返回主菜单', callback_data: 'back_to_main' }
        ]
      ]
    };

    await this.bot.sendMessage(chatId, helpMessage, {
      reply_markup: keyboard
    });
  }

  // 处理提醒列表命令
  async handleRemindersCommand(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    try {
      const reminders = await reminderService.getUserReminders(userId);
      if (reminders.length === 0) {
        await this.bot.sendMessage(chatId, '📋 您还没有创建任何提醒\n\n💡 试试发送：今晚20点提醒我开会');
        return;
      }

      // 先发列表头
      await this.bot.sendMessage(chatId, `📋 您的提醒列表（共 ${reminders.length} 条，展示前 5 条）`);

      // 逐条发送前5条，附带操作按钮（编辑/删除/延后/小睡）
      for (const reminder of reminders.slice(0, 5)) {
        const text = formatReminderMessage(reminder);
        const keyboard = createActionButtons(reminder.id);
        await this.bot.sendMessage(chatId, text, { reply_markup: keyboard });
      }

      // 底部功能区
      const footerKeyboard = {
        inline_keyboard: [
          [
            { text: '⏰ 创建提醒', callback_data: 'create_reminder' },
            { text: '📊 统计信息', callback_data: 'reminder_stats' }
          ],
          [
            { text: '🔍 搜索提醒', callback_data: 'search_reminders' },
            { text: '🗑️ 清理已完成', callback_data: 'cleanup_completed' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, '👇 你可以继续创建、查看统计或搜索/清理提醒：', { reply_markup: footerKeyboard });
    } catch (error) {
      console.error('获取提醒列表失败:', error);
      await this.bot.sendMessage(chatId, '❌ 获取提醒列表失败，请重试');
    }
  }

  // 处理设置默认分类命令
  async handleSetupCategoriesCommand(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    try {
      // 强制创建默认分类
      await reminderService.createDefaultCategories(userId);
      
      // 获取用户分类
      const categories = await reminderService.getUserCategories(userId);
      
      const message = `✅ 默认分类设置完成！\n\n🏷️ 您的分类列表：\n${categories.map(cat => `• ${cat.icon} ${cat.name}`).join('\n')}\n\n💡 现在您可以：\n• 创建提醒时选择分类\n• 按分类查看提醒\n• 自定义分类图标和颜色`;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '⏰ 创建提醒', callback_data: 'create_reminder' },
            { text: '📋 我的提醒', callback_data: 'my_reminders' }
          ],
          [
            { text: '🔙 返回主菜单', callback_data: 'back_to_main' }
          ]
        ]
      };
      
      await this.bot.sendMessage(chatId, message, { reply_markup: keyboard });
    } catch (error) {
      console.error('设置默认分类失败:', error);
      await this.bot.sendMessage(chatId, '❌ 设置默认分类失败，请重试');
    }
  }

  // 处理统计命令
  async handleStatsCommand(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    try {
      const stats = await reminderService.getStats(userId);
      const message = `📊 提醒统计\n\n📝 总数：${stats.total}\n✅ 已完成：${stats.completed}\n⏳ 待处理：${stats.pending}\n🔴 紧急：${stats.urgent}\n🟡 重要：${stats.high}\n🟢 普通：${stats.normal}\n🔵 低：${stats.low}`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '📋 查看提醒', callback_data: 'my_reminders' },
            { text: '⏰ 创建提醒', callback_data: 'create_reminder' }
          ],
          [
            { text: '🔙 返回主菜单', callback_data: 'back_to_main' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, message, {
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('获取统计信息失败:', error);
      await this.bot.sendMessage(chatId, '❌ 获取统计信息失败，请重试');
    }
  }

  // 处理自然语言提醒创建
  async handleNaturalLanguageReminder(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    try {
      // 检查是否是新闻查询
      if (this.isNewsQuery(text)) {
        return false; // 不是提醒，让新闻处理器处理
      }

      // 解析提醒内容
      const parsed = this.smartParser.parse(text);
      if (!parsed.time) {
        return false; // 没有时间信息，不是提醒
      }

      // 创建提醒
      const reminderData = {
        userId,
        chatId,
        message: parsed.message,
        reminderTime: parsed.time,
        categoryId: parsed.categoryId,
        priority: parsed.priority,
        tags: parsed.tags,
        notes: parsed.notes,
        repeatPattern: parsed.repeatPattern
      };

      const reminder = await reminderService.createReminder(reminderData);
      if (!reminder) {
        await this.bot.sendMessage(chatId, '❌ 创建提醒失败，请重试');
        return true;
      }

      // 发送确认消息
      const confirmMessage = `✅ 提醒创建成功！\n\n💬 内容：${reminder.message}\n📅 时间：${reminder.reminderTime.toLocaleString('zh-CN')}\n🏷️ 分类：${reminder.category ? reminder.category.name : '无'}\n⭐ 优先级：${this.getPriorityText(reminder.priority)}`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '✏️ 修改', callback_data: `edit_${reminder.id}` }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, confirmMessage, {
        reply_markup: keyboard
      });

      return true; // 成功处理了提醒
    } catch (error) {
      console.error('处理自然语言提醒失败:', error);
      await this.bot.sendMessage(chatId, '❌ 创建提醒失败，请重试');
      return true;
    }
  }

  // 检查是否是新闻查询
  isNewsQuery(text) {
    const newsKeywords = ['新闻', '热点', '资讯', '最新', '热门', '头条', '报道'];
    return newsKeywords.some(keyword => text.includes(keyword));
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

  // 获取优先级文本
  getPriorityText(priority) {
    const priorityMap = {
      'urgent': '🔴 紧急',
      'high': '🟡 重要',
      'normal': '🟢 普通',
      'low': '🔵 低'
    };
    return priorityMap[priority] || '🟢 普通';
  }

  async handleBriefCommand(msg) {
    const chatId = msg.chat.id;
    try {
      const brief = await newsService.getPersonalizedBrief(chatId, 8);
      await this.bot.sendMessage(chatId, brief, { parse_mode: 'HTML', disable_web_page_preview: true });
    } catch (e) {
      await this.bot.sendMessage(chatId, '❌ 生成简报失败');
    }
  }

  async handleSubscribeCommand(msg) {
    const chatId = msg.chat.id;
    const parts = (msg.text || '').split(' ').filter(Boolean);
    const keyword = parts.slice(1).join(' ');
    if (!keyword) {
      await this.bot.sendMessage(chatId, '🔖 请输入要订阅的关键词，如：/subscribe 以太坊');
      return;
    }
    await userService.addKeyword(chatId, keyword);
    await this.bot.sendMessage(chatId, `✅ 已订阅关键词：${keyword}`);
  }

  async handleFavoritesCommand(msg) {
    const chatId = msg.chat.id;
    const list = await userService.listFavorites(chatId, 10, 0);
    if (!list || list.length === 0) {
      await this.bot.sendMessage(chatId, '⭐ 你还没有收藏的新闻');
      return;
    }
    let message = '⭐ 我的收藏\n\n';
    list.forEach((f, i) => {
      const n = f.news;
      const url = n?.sourceUrl || '#';
      const title = (n?.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      message += `${i + 1}. <a href="${url}">${title}</a>\n`;
      message += `   来源：${n?.source || '-'}\n\n`;
    });
    await this.bot.sendMessage(chatId, message, { parse_mode: 'HTML', disable_web_page_preview: true });
  }

  async handleQuietCommand(msg) {
    const chatId = msg.chat.id;
    const parts = (msg.text || '').split(' ').filter(Boolean);
    
    if (parts.length === 3) {
      const [start, end] = parts.slice(1);
      await userService.setQuietHours(chatId, start, end);
      await this.bot.sendMessage(chatId, `✅ 已设置安静时段：${start} - ${end}`);
    } else if (parts.length === 2 && parts[1] === 'clear') {
      await userService.clearQuietHours(chatId);
      await this.bot.sendMessage(chatId, '✅ 已清除安静时段设置');
    } else {
      await this.bot.sendMessage(chatId, '🔇 设置安静时段：/quiet HH:MM HH:MM\n清除设置：/quiet clear');
    }
  }

  // 管理员命令：查询用户统计信息
  async handleAdminStatsCommand(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // 检查是否是管理员
    if (!this.config.ADMIN_USER_IDS.includes(userId)) {
      await this.bot.sendMessage(chatId, '❌ 权限不足，此命令仅限管理员使用');
      return;
    }
    
    try {
      const stats = await this.getAdminStats();
      const keyboard = {
        inline_keyboard: [
          [
            { text: '👥 查看用户列表', callback_data: 'admin_users_page_1' },
            { text: '📊 详细统计', callback_data: 'admin_detailed_stats' }
          ],
          [
            { text: '⏰ 提醒统计', callback_data: 'admin_reminder_stats' },
            { text: '📰 新闻统计', callback_data: 'admin_news_stats' }
          ]
        ]
      };
      
      await this.bot.sendMessage(chatId, stats, { 
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('获取管理员统计失败:', error);
      await this.bot.sendMessage(chatId, '❌ 获取统计信息失败');
    }
  }

  // 管理员命令：查询用户详细信息
  async handleAdminUsersCommand(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // 检查是否是管理员
    if (!this.config.ADMIN_USER_IDS.includes(userId)) {
      await this.bot.sendMessage(chatId, '❌ 权限不足，此命令仅限管理员使用');
      return;
    }
    
    try {
      const userDetails = await this.getAdminUserDetails(1, 5); // 第一页，每页5个用户
      const keyboard = {
        inline_keyboard: [
          [
            { text: '👥 查看用户列表', callback_data: 'admin_users_page_1' },
            { text: '📊 系统统计', callback_data: 'admin_stats' }
          ]
        ]
      };
      
      await this.bot.sendMessage(chatId, userDetails, { 
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('获取用户详情失败:', error);
      await this.bot.sendMessage(chatId, '❌ 获取用户详情失败');
    }
  }

  // 获取管理员统计信息
  async getAdminStats() {
    try {
      const [totalUsers, totalReminders, totalNews, totalCategories, activeUsers, todayReminders] = await Promise.all([
        require('../services/reminderService').getUserCount(),
        require('../services/reminderService').getTotalReminderCount(),
        require('../services/newsService').getNewsStats(),
        require('../services/reminderService').getTotalCategoryCount(),
        require('../services/reminderService').getActiveUserCount(),
        require('../services/reminderService').getTodayReminderCount()
      ]);

      let message = '📊 <b>系统统计信息</b>\n\n';
      message += `👥 <b>用户统计</b>\n`;
      message += `   • 总用户数：${totalUsers}\n`;
      message += `   • 活跃用户：${activeUsers}\n\n`;
      message += `⏰ <b>提醒统计</b>\n`;
      message += `   • 总提醒数：${totalReminders}\n`;
      message += `   • 今日提醒：${todayReminders}\n\n`;
      message += `📰 <b>内容统计</b>\n`;
      message += `   • 总新闻数：${totalNews.totalNews}\n`;
      message += `   • 总分类数：${totalCategories}\n`;
      message += `   • 热门新闻：${totalNews.hotNewsCount}\n`;
      message += `   • 置顶新闻：${totalNews.topNewsCount}\n\n`;
      message += `📅 <b>统计时间</b>：${new Date().toLocaleString('zh-CN')}`;
      
      return message;
    } catch (error) {
      console.error('获取管理员统计失败:', error);
      throw error;
    }
  }

  // 获取用户详细信息（支持分页）
  async getAdminUserDetails(page = 1, limit = 5) {
    try {
      const users = await require('../services/reminderService').getAllUsersWithStats(page, limit);
      const totalUsers = await require('../services/reminderService').getUserCount();
      const totalPages = Math.ceil(totalUsers / limit);
      
      let message = `👥 <b>用户详细信息</b> (第 ${page}/${totalPages} 页)\n\n`;
      
      if (users.length === 0) {
        message += '暂无用户数据';
        return message;
      }
      
      for (const user of users) {
        message += `🆔 <b>用户ID：</b>${user.id}\n`;
        message += `👤 <b>用户名：</b>${user.username || '未设置'}\n`;
        message += `📝 <b>姓名：</b>${user.firstName || ''} ${user.lastName || ''}\n`;
        message += `⏰ <b>提醒数量：</b>${user.reminderCount || 0}\n`;
        message += `📅 <b>注册时间：</b>${new Date(user.createdAt).toLocaleString('zh-CN')}\n`;
        
        if (user.recentReminders && user.recentReminders.length > 0) {
          message += `📋 <b>最近提醒：</b>\n`;
          user.recentReminders.slice(0, 3).forEach((reminder, index) => {
            const status = reminder.status === 'pending' ? '⏳' : 
                          reminder.status === 'completed' ? '✅' : 
                          reminder.status === 'delayed' ? '⏰' : '🔔';
            message += `   ${index + 1}. ${status} ${reminder.message}\n`;
          });
        }
        
        message += '\n' + '─'.repeat(30) + '\n\n';
      }
      
      message += `📄 <b>分页信息</b>：共 ${totalUsers} 个用户，每页 ${limit} 个`;
      
      return message;
    } catch (error) {
      console.error('获取用户详情失败:', error);
      throw error;
    }
  }

  // 处理命令回调
  async handleCommandCallback(callbackQuery) {
    const data = callbackQuery.data;
    
    try {
      if (data === 'create_reminder') {
        await this.handleCreateReminder(callbackQuery);
      } else if (data === 'my_reminders') {
        await this.handleMyReminders(callbackQuery);
      } else if (data === 'help') {
        await this.handleHelp(callbackQuery);
      } else if (data === 'stats') {
        await this.handleStats(callbackQuery);
      } else if (data === 'back_to_main') {
        await this.handleBackToMain(callbackQuery);
      } else if (data === 'reminder_stats') {
        await this.handleReminderStats(callbackQuery);
      } else if (data === 'search_reminders') {
        await this.handleSearchReminders(callbackQuery);
      } else if (data === 'cleanup_completed') {
        await this.handleCleanupCompleted(callbackQuery);
      }
    } catch (error) {
      console.error('处理命令回调失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 处理创建提醒
  async handleCreateReminder(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    
    try {
      await this.bot.sendMessage(chatId, '⏰ 创建提醒\n\n💡 请用自然语言描述您的提醒，例如：\n• 今晚20点提醒我开会\n• 明天上午9点重要提醒：提交报告\n• 每天提醒我喝水');
      await this.bot.answerCallbackQuery(callbackQuery.id, '⏰ 请描述您的提醒');
    } catch (error) {
      console.error('处理创建提醒失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 处理我的提醒
  async handleMyReminders(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    
    try {
      await this.handleRemindersCommand({ chat: { id: chatId }, from: { id: userId } });
      await this.bot.answerCallbackQuery(callbackQuery.id, '📋 提醒列表已显示');
    } catch (error) {
      console.error('处理我的提醒失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 处理帮助
  async handleHelp(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    
    try {
      await this.handleHelpCommand({ chat: { id: chatId } });
      await this.bot.answerCallbackQuery(callbackQuery.id, '❓ 帮助信息已显示');
    } catch (error) {
      console.error('处理帮助失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 处理统计
  async handleStats(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    
    try {
      await this.handleStatsCommand({ chat: { id: chatId }, from: { id: userId } });
      await this.bot.answerCallbackQuery(callbackQuery.id, '📊 统计信息已显示');
    } catch (error) {
      console.error('处理统计失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 处理返回主菜单
  async handleBackToMain(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    
    try {
      await this.handleStartCommand({ chat: { id: chatId }, from: { id: userId } });
      await this.bot.answerCallbackQuery(callbackQuery.id, '🔙 已返回主菜单');
    } catch (error) {
      console.error('返回主菜单失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 返回失败');
    }
  }

  // 处理提醒统计
  async handleReminderStats(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    
    try {
      await this.handleStatsCommand({ chat: { id: chatId }, from: { id: userId } });
      await this.bot.answerCallbackQuery(callbackQuery.id, '📊 统计信息已显示');
    } catch (error) {
      console.error('处理提醒统计失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 处理搜索提醒
  async handleSearchReminders(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    
    try {
      await this.bot.sendMessage(chatId, '🔍 搜索提醒\n\n请输入搜索关键词：');
      await this.bot.answerCallbackQuery(callbackQuery.id, '🔍 请输入搜索关键词');
    } catch (error) {
      console.error('处理搜索提醒失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 处理清理已完成提醒
  async handleCleanupCompleted(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    
    try {
      const result = await reminderService.cleanupCompletedReminders(userId);
      await this.bot.sendMessage(chatId, `🧹 清理完成！已删除 ${result.deletedCount} 个已完成的提醒`);
      await this.bot.answerCallbackQuery(callbackQuery.id, '🧹 清理完成');
    } catch (error) {
      console.error('清理已完成提醒失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 清理失败');
    }
  }

  // 处理管理员返回
  async handleAdminBack(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    
    try {
      await this.handleAdminCommand({ chat: { id: chatId }, from: { id: userId } });
      await this.bot.answerCallbackQuery(callbackQuery.id, '🔙 已返回管理员菜单');
    } catch (error) {
      console.error('返回管理员菜单失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 返回失败');
    }
  }

  // 处理管理员回调查询
  async handleAdminCallback(callbackQuery) {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    
    // 检查是否是管理员
    if (!this.config.ADMIN_USER_IDS.includes(userId)) {
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 权限不足');
      return;
    }
    
    try {
      if (data.startsWith('admin_users_page_')) {
        const page = parseInt(data.split('_')[3]);
        const userDetails = await this.getAdminUserDetails(page, 5);
        
        const totalUsers = await require('../services/reminderService').getUserCount();
        const totalPages = Math.ceil(totalUsers / 5);
        
        const keyboard = {
          inline_keyboard: [
            [
              { text: '◀️ 上一页', callback_data: `admin_users_page_${Math.max(1, page - 1)}` },
              { text: `${page}/${totalPages}`, callback_data: 'admin_page_info' },
              { text: '下一页 ▶️', callback_data: `admin_users_page_${Math.min(totalPages, page + 1)}` }
            ],
            [
              { text: '📊 系统统计', callback_data: 'admin_stats' },
              { text: '🔙 返回', callback_data: 'admin_back' }
            ]
          ]
        };
        
        // 禁用无效的翻页按钮
        if (page <= 1) {
          keyboard.inline_keyboard[0][0].text = '◀️ 上一页';
          keyboard.inline_keyboard[0][0].callback_data = 'admin_users_page_1';
        }
        if (page >= totalPages) {
          keyboard.inline_keyboard[0][2].text = '下一页 ▶️';
          keyboard.inline_keyboard[0][2].callback_data = `admin_users_page_${totalPages}`;
        }
        
        await this.bot.editMessageText(userDetails, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'HTML',
          reply_markup: keyboard
        });
        
      } else if (data === 'admin_detailed_stats') {
        const detailedStats = await this.getDetailedAdminStats();
        const keyboard = {
          inline_keyboard: [
            [
              { text: '👥 查看用户列表', callback_data: 'admin_users_page_1' },
              { text: '📊 基础统计', callback_data: 'admin_stats' }
            ]
          ]
        };
        
        await this.bot.editMessageText(detailedStats, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'HTML',
          reply_markup: keyboard
        });
        
      } else if (data === 'admin_reminder_stats') {
        const reminderStats = await this.getReminderAdminStats();
        const keyboard = {
          inline_keyboard: [
            [
              { text: '👥 查看用户列表', callback_data: 'admin_users_page_1' },
              { text: '📊 系统统计', callback_data: 'admin_stats' }
            ]
          ]
        };
        
        await this.bot.editMessageText(reminderStats, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'HTML',
          reply_markup: keyboard
        });
        
      } else if (data === 'admin_news_stats') {
        const newsStats = await this.getNewsAdminStats();
        const keyboard = {
          inline_keyboard: [
            [
              { text: '👥 查看用户列表', callback_data: 'admin_users_page_1' },
              { text: '📊 系统统计', callback_data: 'admin_stats' }
            ]
          ]
        };
        
        await this.bot.editMessageText(newsStats, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'HTML',
          reply_markup: keyboard
        });
        
      } else if (data === 'admin_stats') {
        const stats = await this.getAdminStats();
        const keyboard = {
          inline_keyboard: [
            [
              { text: '👥 查看用户列表', callback_data: 'admin_users_page_1' },
              { text: '📊 详细统计', callback_data: 'admin_detailed_stats' }
            ],
            [
              { text: '⏰ 提醒统计', callback_data: 'admin_reminder_stats' },
              { text: '📰 新闻统计', callback_data: 'admin_news_stats' }
            ]
          ]
        };
        
        await this.bot.editMessageText(stats, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'HTML',
          reply_markup: keyboard
        });
      }
      
      await this.bot.answerCallbackQuery(callbackQuery.id, '✅ 操作成功');
      
    } catch (error) {
      console.error('处理管理员回调失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 获取详细统计信息
  async getDetailedAdminStats() {
    try {
      const [totalUsers, totalReminders, totalNews, totalCategories, activeUsers, todayReminders, 
            reminderStats, categoryStats, priorityStats] = await Promise.all([
        require('../services/reminderService').getUserCount(),
        require('../services/reminderService').getTotalReminderCount(),
        require('../services/newsService').getNewsStats(),
        require('../services/reminderService').getTotalCategoryCount(),
        require('../services/reminderService').getActiveUserCount(),
        require('../services/reminderService').getTodayReminderCount(),
        require('../services/reminderService').getReminderStatusStats(),
        require('../services/reminderService').getCategoryDistributionStats(),
        require('../services/reminderService').getPriorityDistributionStats()
      ]);

      let message = '📊 <b>详细统计信息</b>\n\n';
      
      message += `👥 <b>用户分析</b>\n`;
      message += `   • 总用户数：${totalUsers}\n`;
      message += `   • 活跃用户：${activeUsers}\n`;
      message += `   • 用户活跃率：${((activeUsers / totalUsers) * 100).toFixed(1)}%\n\n`;
      
      message += `⏰ <b>提醒分析</b>\n`;
      message += `   • 总提醒数：${totalReminders}\n`;
      message += `   • 今日提醒：${todayReminders}\n`;
      message += `   • 平均每用户：${(totalReminders / totalUsers).toFixed(1)} 个\n\n`;
      
      message += `📰 <b>内容分析</b>\n`;
      message += `   • 总新闻数：${totalNews.totalNews}\n`;
      message += `   • 总分类数：${totalCategories}\n`;
      message += `   • 热门新闻：${totalNews.hotNewsCount}\n`;
      message += `   • 置顶新闻：${totalNews.topNewsCount}\n\n`;
      
      message += `📅 <b>统计时间</b>：${new Date().toLocaleString('zh-CN')}`;
      
      return message;
    } catch (error) {
      console.error('获取详细统计失败:', error);
      throw error;
    }
  }

  // 获取提醒统计信息
  async getReminderAdminStats() {
    try {
      const [totalReminders, statusStats, categoryStats, priorityStats, todayReminders] = await Promise.all([
        require('../services/reminderService').getTotalReminderCount(),
        require('../services/reminderService').getReminderStatusStats(),
        require('../services/reminderService').getCategoryDistributionStats(),
        require('../services/reminderService').getPriorityDistributionStats(),
        require('../services/reminderService').getTodayReminderCount()
      ]);

      let message = '⏰ <b>提醒统计信息</b>\n\n';
      
      message += `📊 <b>总体统计</b>\n`;
      message += `   • 总提醒数：${totalReminders}\n`;
      message += `   • 今日提醒：${todayReminders}\n\n`;
      
      if (statusStats && statusStats.length > 0) {
        message += `📈 <b>状态分布</b>\n`;
        statusStats.forEach(stat => {
          const emoji = stat.status === 'pending' ? '⏳' : 
                       stat.status === 'completed' ? '✅' : 
                       stat.status === 'delayed' ? '⏰' : '🔔';
          message += `   ${emoji} ${stat.status}：${stat.count} 个\n`;
        });
        message += '\n';
      }
      
      if (categoryStats && categoryStats.length > 0) {
        message += `🏷️ <b>分类分布</b>\n`;
        categoryStats.slice(0, 5).forEach(stat => {
          message += `   • ${stat.categoryName || '未分类'}：${stat.count} 个\n`;
        });
        message += '\n';
      }
      
      if (priorityStats && priorityStats.length > 0) {
        message += `⭐ <b>优先级分布</b>\n`;
        priorityStats.forEach(stat => {
          const emoji = stat.priority === 'urgent' ? '🔴' : 
                       stat.priority === 'high' ? '🟡' : 
                       stat.priority === 'normal' ? '🟢' : '🔵';
          message += `   ${emoji} ${stat.priority}：${stat.count} 个\n`;
        });
        message += '\n';
      }
      
      message += `📅 <b>统计时间</b>：${new Date().toLocaleString('zh-CN')}`;
      
      return message;
    } catch (error) {
      console.error('获取提醒统计失败:', error);
      throw error;
    }
  }

  // 获取新闻统计信息
  async getNewsAdminStats() {
    try {
      const newsStats = await require('../services/newsService').getNewsStats();
      const [totalNews, totalCategories, hotNewsCount, topNewsCount, categoryStats] = [
        newsStats.totalNews,
        newsStats.totalCategories,
        newsStats.hotNewsCount,
        newsStats.topNewsCount,
        newsStats.categoryStats
      ];

      let message = '📰 <b>新闻统计信息</b>\n\n';
      
      message += `📊 <b>总体统计</b>\n`;
      message += `   • 总新闻数：${totalNews}\n`;
      message += `   • 总分类数：${totalCategories}\n`;
      message += `   • 热门新闻：${hotNewsCount}\n`;
      message += `   • 置顶新闻：${topNewsCount}\n\n`;
      
      if (categoryStats && categoryStats.length > 0) {
        message += `🏷️ <b>分类分布</b>\n`;
        categoryStats.slice(0, 8).forEach(stat => {
          message += `   • ${stat.category?.displayName || stat.category?.name || '未知'}：${stat.count} 条\n`;
        });
        message += '\n';
      }
      
      message += `📅 <b>统计时间</b>：${new Date().toLocaleString('zh-CN')}`;
      
      return message;
    } catch (error) {
      console.error('获取新闻统计失败:', error);
      throw error;
    }
  }

  // 处理返回主菜单
  async handleMainMenu(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    
    try {
      await this.handleStartCommand(msg);
    } catch (error) {
      console.error('返回主菜单失败:', error);
      await this.bot.sendMessage(chatId, '❌ 返回主菜单失败，请重试');
    }
  }
}

module.exports = CommandHandler; 