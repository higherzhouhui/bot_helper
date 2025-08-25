const userService = require('../services/userService');
const { SETTINGS_KEYBOARD } = require('../constants/keyboards');

class UserHandler {
  constructor(bot, config) {
    this.bot = bot;
    this.config = config;
  }

  async handleUserSettings(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    try {
      await this.bot.sendMessage(chatId, '⚙️ 个人设置', { reply_markup: SETTINGS_KEYBOARD });
      await this.bot.answerCallbackQuery(callbackQuery.id, '⚙️ 打开个人设置');
    } catch (error) {
      console.error('打开个人设置失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  async handleSettingsCallback(callbackQuery) {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    try {
      if (data === 'settings_notifications') {
        // 这里可以扩展通知设置
        await this.bot.answerCallbackQuery(callbackQuery.id, '🔔 通知设置');
      } else if (data === 'settings_language') {
        await userService.updateSetting(userId, { language: 'zh-CN' }).catch(()=>{});
        await this.bot.answerCallbackQuery(callbackQuery.id, '🌍 语言设置：中文');
      } else if (data === 'settings_reminders') {
        await this.bot.sendMessage(chatId, '⏰ 提醒设置：可通过自然语言快速配置，例如“每天9点提醒我喝水”。');
        await this.bot.answerCallbackQuery(callbackQuery.id, '⏰ 提醒设置');
      } else if (data === 'settings_news') {
        await this.bot.sendMessage(chatId, '📰 新闻设置：稍后提供更细的偏好设置。');
        await this.bot.answerCallbackQuery(callbackQuery.id, '📰 新闻设置');
      } else {
        await this.bot.answerCallbackQuery(callbackQuery.id, '未知设置项');
      }
    } catch (error) {
      console.error('处理设置失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  async handleUserCallback(callbackQuery) {
    // 预留扩展：user_ 前缀的更多操作
    await this.bot.answerCallbackQuery(callbackQuery.id, '用户操作');
  }
}

module.exports = UserHandler; 