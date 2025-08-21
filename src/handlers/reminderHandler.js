const reminderService = require('../services/reminderService');
const { formatReminderMessage, createActionButtons } = require('../utils/reminderUtils');

class ReminderHandler {
  constructor(bot, config) {
    this.bot = bot;
    this.config = config;
    this.userEditStates = new Map();
  }

  // 处理修改提醒
  async handleEditReminder(callbackQuery, reminderId) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    
    try {
      const reminder = await reminderService.getReminderById(reminderId, userId);
      if (!reminder) {
        await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 提醒不存在');
        return;
      }

      const editKeyboard = this.createEditKeyboard(reminderId);
      const editMessage = this.createEditMessage(reminder);

      await this.bot.sendMessage(chatId, editMessage, {
        reply_markup: editKeyboard
      });

      await this.bot.answerCallbackQuery(callbackQuery.id, '✏️ 请选择要修改的内容');
    } catch (error) {
      console.error('处理修改提醒失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 新增：直接显示编辑菜单（无 callbackQuery）
  async showEditMenu(chatId, userId, reminderId) {
    const reminder = await reminderService.getReminderById(reminderId, userId);
    if (!reminder) {
      await this.bot.sendMessage(chatId, '❌ 提醒不存在');
      return;
    }

    const editKeyboard = this.createEditKeyboard(reminderId);
    const editMessage = this.createEditMessage(reminder);

    await this.bot.sendMessage(chatId, editMessage, { reply_markup: editKeyboard });
  }

  // 处理编辑选项
  async handleEditOptions(callbackQuery, data) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    
    try {
      if (data.startsWith('edit_content_')) {
        const reminderId = parseInt(data.split('_')[2]);
        await this.handleEditContent(callbackQuery, reminderId);
      } else if (data.startsWith('edit_time_')) {
        const reminderId = parseInt(data.split('_')[2]);
        await this.handleEditTime(callbackQuery, reminderId);
      } else if (data.startsWith('edit_category_')) {
        const reminderId = parseInt(data.split('_')[2]);
        await this.handleEditCategory(callbackQuery, reminderId);
      } else if (data.startsWith('edit_priority_')) {
        const reminderId = parseInt(data.split('_')[2]);
        await this.handleEditPriority(callbackQuery, reminderId);
      } else if (data.startsWith('set_category_')) {
        const reminderId = parseInt(data.split('_')[2]);
        const categoryId = parseInt(data.split('_')[3]);
        await this.handleSetCategory(callbackQuery, reminderId, categoryId);
      } else if (data.startsWith('set_priority_')) {
        const reminderId = parseInt(data.split('_')[2]);
        const priority = data.split('_')[3];
        await this.handleSetPriority(callbackQuery, reminderId, priority);
      } else if (data.startsWith('back_to_reminder_')) {
        const reminderId = parseInt(data.split('_')[3]);
        await this.handleBackToReminder(callbackQuery, reminderId);
      } else if (data.startsWith('back_to_edit_')) {
        const reminderId = parseInt(data.split('_')[3]);
        await this.handleBackToEditMenu(callbackQuery, reminderId);
      }
    } catch (error) {
      console.error('处理编辑选项失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 创建编辑键盘
  createEditKeyboard(reminderId) {
    return {
      inline_keyboard: [
        [
          { text: '✏️ 修改内容', callback_data: `edit_content_${reminderId}` },
          { text: '⏰ 修改时间', callback_data: `edit_time_${reminderId}` }
        ],
        [
          { text: '🏷️ 修改分类', callback_data: `edit_category_${reminderId}` },
          { text: '⭐ 修改优先级', callback_data: `edit_priority_${reminderId}` }
        ],
        [
          { text: '🔙 返回', callback_data: `back_to_reminder_${reminderId}` }
        ]
      ]
    };
  }

  // 创建编辑消息
  createEditMessage(reminder) {
    const priorityText = this.getPriorityText(reminder.priority);
    return `✏️ 修改提醒\n\n💬 当前内容：${reminder.message}\n📅 当前时间：${reminder.reminderTime.toLocaleString('zh-CN', { timeZone: this.config.TIMEZONE })}\n🏷️ 当前分类：${reminder.category ? reminder.category.name : '无'}\n⭐ 当前优先级：${priorityText}\n\n请选择要修改的内容：`;
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

  // 处理修改内容
  async handleEditContent(callbackQuery, reminderId) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    
    try {
      const reminder = await reminderService.getReminderById(reminderId, userId);
      if (!reminder) {
        await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 提醒不存在');
        return;
      }

      this.userEditStates.set(userId, {
        type: 'edit_content',
        reminderId,
        step: 'waiting_content'
      });

      const keyboard = {
        inline_keyboard: [
          [{ text: '🔙 取消', callback_data: `back_to_edit_${reminderId}` }]
        ]
      };

      await this.bot.sendMessage(chatId, `✏️ 修改提醒内容\n\n💬 当前内容：${reminder.message}\n\n请发送新的提醒内容：`, {
        reply_markup: keyboard
      });

      await this.bot.answerCallbackQuery(callbackQuery.id, '✏️ 请发送新的提醒内容');
    } catch (error) {
      console.error('处理修改内容失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 处理修改时间
  async handleEditTime(callbackQuery, reminderId) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    
    try {
      const reminder = await reminderService.getReminderById(reminderId, userId);
      if (!reminder) {
        await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 提醒不存在');
        return;
      }

      this.userEditStates.set(userId, {
        type: 'edit_time',
        reminderId,
        step: 'waiting_time'
      });

      const keyboard = {
        inline_keyboard: [
          [{ text: '🔙 取消', callback_data: `back_to_edit_${reminderId}` }]
        ]
      };

      await this.bot.sendMessage(chatId, `⏰ 修改提醒时间\n\n📅 当前时间：${reminder.reminderTime.toLocaleString('zh-CN', { timeZone: this.config.TIMEZONE })}\n\n请发送新的时间，例如：\n• 今晚20点\n• 明天上午9点\n• 20:30`, {
        reply_markup: keyboard
      });

      await this.bot.answerCallbackQuery(callbackQuery.id, '⏰ 请发送新的时间');
    } catch (error) {
      console.error('处理修改时间失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 处理修改分类
  async handleEditCategory(callbackQuery, reminderId) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    
    try {
      const reminder = await reminderService.getReminderById(reminderId, userId);
      if (!reminder) {
        await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 提醒不存在');
        return;
      }

      const categories = await reminderService.getUserCategories(userId);
      const keyboard = {
        inline_keyboard: [
          ...categories.map(cat => [{
            text: `${cat.icon} ${cat.name}`,
            callback_data: `set_category_${reminderId}_${cat.id}`
          }]),
          [{ text: '🔙 返回', callback_data: `back_to_edit_${reminderId}` }]
        ]
      };

      await this.bot.sendMessage(chatId, `🏷️ 选择新分类\n\n💬 提醒内容：${reminder.message}\n🏷️ 当前分类：${reminder.category ? reminder.category.name : '无'}\n\n请选择新的分类：`, {
        reply_markup: keyboard
      });

      await this.bot.answerCallbackQuery(callbackQuery.id, '🏷️ 请选择新分类');
    } catch (error) {
      console.error('处理修改分类失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 处理修改优先级
  async handleEditPriority(callbackQuery, reminderId) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    
    try {
      const reminder = await reminderService.getReminderById(reminderId, userId);
      if (!reminder) {
        await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 提醒不存在');
        return;
      }

      const priorities = [
        { text: '🔴 紧急', value: 'urgent' },
        { text: '🟡 重要', value: 'high' },
        { text: '🟢 普通', value: 'normal' },
        { text: '🔵 低', value: 'low' }
      ];

      const keyboard = {
        inline_keyboard: [
          ...priorities.map(p => [{
            text: p.text,
            callback_data: `set_priority_${reminderId}_${p.value}`
          }]),
          [{ text: '🔙 返回', callback_data: `back_to_edit_${reminderId}` }]
        ]
      };

      const currentPriorityText = this.getPriorityText(reminder.priority);

      await this.bot.sendMessage(chatId, `⭐ 选择新优先级\n\n💬 提醒内容：${reminder.message}\n⭐ 当前优先级：${currentPriorityText}\n\n请选择新的优先级：`, {
        reply_markup: keyboard
      });

      await this.bot.answerCallbackQuery(callbackQuery.id, '⭐ 请选择新优先级');
    } catch (error) {
      console.error('处理修改优先级失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 处理返回提醒详情
  async handleBackToReminder(callbackQuery, reminderId) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    
    try {
      const reminder = await reminderService.getReminderById(reminderId, userId);
      if (!reminder) {
        await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 提醒不存在');
        return;
      }

      this.userEditStates.delete(userId);

      const reminderMessage = formatReminderMessage(reminder);
      await this.bot.sendMessage(chatId, reminderMessage, {
        reply_markup: createActionButtons(reminderId)
      });

      await this.bot.answerCallbackQuery(callbackQuery.id, '🔙 已返回提醒详情');
    } catch (error) {
      console.error('处理返回提醒失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 处理返回编辑菜单
  async handleBackToEditMenu(callbackQuery, reminderId) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    
    try {
      const reminder = await reminderService.getReminderById(reminderId, userId);
      if (!reminder) {
        await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 提醒不存在');
        return;
      }

      const editKeyboard = this.createEditKeyboard(reminderId);
      const editMessage = this.createEditMessage(reminder);

      await this.bot.sendMessage(chatId, editMessage, {
        reply_markup: editKeyboard
      });

      await this.bot.answerCallbackQuery(callbackQuery.id, '🔙 已返回编辑菜单');
    } catch (error) {
      console.error('处理返回编辑菜单失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 处理设置分类
  async handleSetCategory(callbackQuery, reminderId, categoryId) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    
    try {
      const reminder = await reminderService.updateReminder(reminderId, userId, { categoryId });
      if (!reminder) {
        await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 设置分类失败');
        return;
      }

      const category = await reminderService.getCategoryById(categoryId);
      await this.bot.answerCallbackQuery(callbackQuery.id, `✅ 分类已设置为：${category.name}`);
      
      await this.handleBackToEditMenu(callbackQuery, reminderId);
    } catch (error) {
      console.error('设置分类失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 设置分类失败');
    }
  }

  // 处理设置优先级
  async handleSetPriority(callbackQuery, reminderId, priority) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    
    try {
      const reminder = await reminderService.updateReminder(reminderId, userId, { priority });
      if (!reminder) {
        await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 设置优先级失败');
        return;
      }

      const priorityText = this.getPriorityText(priority);
      await this.bot.answerCallbackQuery(callbackQuery.id, `✅ 优先级已设置为：${priorityText}`);
      
      await this.handleBackToEditMenu(callbackQuery, reminderId);
    } catch (error) {
      console.error('设置优先级失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 设置优先级失败');
    }
  }

  // 获取用户编辑状态
  getUserEditState(userId) {
    return this.userEditStates.get(userId);
  }

  // 设置用户编辑状态
  setUserEditState(userId, state) {
    this.userEditStates.set(userId, state);
  }

  // 删除用户编辑状态
  deleteUserEditState(userId) {
    this.userEditStates.delete(userId);
  }
}

module.exports = ReminderHandler; 