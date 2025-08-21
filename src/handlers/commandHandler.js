// 命令处理器模块
const reminderService = require('../services/reminderService');
const SmartParser = require('../utils/smartParser');
const { createCategoryKeyboard, createPriorityKeyboard } = require('../utils/reminderUtils');

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
      
      const welcomeMessage = `🎉 欢迎使用智能提醒助手！\n\n📋 主要功能：\n• ⏰ 智能提醒：支持自然语言输入\n• 🏷️ 分类管理：工作、生活、学习等\n• ⭐ 优先级：紧急、重要、普通、低\n• 🔄 重复提醒：每天、每周、每月等\n• 📰 新闻资讯：最新热点新闻\n\n💡 使用示例：\n• "今晚20点提醒我开会"\n• "明天上午9点重要提醒：提交报告"\n• "每天提醒我喝水"\n\n🔧 常用命令：\n/start - 开始使用\n/help - 查看帮助\n/reminders - 查看提醒\n/news - 最新新闻\n/web3 - Web3区块链资讯\n/stats - 统计信息`;

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
    
    const helpMessage = `❓ 使用帮助\n\n📝 创建提醒：\n• 直接发送：今晚20点提醒我开会\n• 带分类：明天上午9点工作提醒：提交报告\n• 带优先级：今晚22点紧急提醒：检查服务器\n• 带标签：每天提醒我喝水 #健康 #生活\n• 带备注：明天提醒我买礼物 备注：老婆生日\n\n🏷️ 分类说明：\n• 工作：工作相关提醒\n• 生活：日常生活提醒\n• 学习：学习相关提醒\n• 健康：健康相关提醒\n• 财务：财务相关提醒\n\n⭐ 优先级说明：\n• 🔴 紧急：需要立即处理\n• 🟡 重要：需要优先处理\n• 🟢 普通：正常处理\n• 🔵 低：可以延后处理\n\n🔄 重复模式：\n• 每天：每天重复\n• 每周：每周重复\n• 每月：每月重复\n• 工作日：周一到周五\n• 周末：周六和周日\n\n📱 操作按钮：\n• ✅ 完成：标记提醒为已完成\n• ⏰ 延后：延后10分钟提醒\n• 🔔 小睡：5分钟后再次提醒\n• ✏️ 修改：修改提醒内容\n• 🗑️ 删除：删除提醒\n\n🔧 其他命令：\n/reminders - 查看所有提醒\n/news - 获取最新新闻\n/work - 查看工作信息\n/stats - 查看统计信息`;

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

      let message = '📋 您的提醒列表\n\n';
      reminders.slice(0, 10).forEach((reminder, index) => {
        const status = reminder.isCompleted ? '✅' : '⏳';
        const priority = this.getPriorityEmoji(reminder.priority);
        const category = reminder.category ? reminder.category.name : '无';
        
        message += `${index + 1}. ${status} ${priority} ${reminder.message}\n`;
        message += `   📅 ${reminder.reminderTime.toLocaleString('zh-CN')}\n`;
        message += `   🏷️ ${category}\n\n`;
      });

      if (reminders.length > 10) {
        message += `... 还有 ${reminders.length - 10} 个提醒\n`;
      }

      const keyboard = {
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

      await this.bot.sendMessage(chatId, message, {
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('获取提醒列表失败:', error);
      await this.bot.sendMessage(chatId, '❌ 获取提醒列表失败，请重试');
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
        message: parsed.content,
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
            { text: '✏️ 修改', callback_data: `edit_${reminder.id}` },
            { text: '❌ 取消', callback_data: `cancel_${reminder.id}` }
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
}

module.exports = CommandHandler; 