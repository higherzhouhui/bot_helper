require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const { testConnection } = require('./models');
const reminderService = require('./services/reminderService');
const newsService = require('./services/newsService');
const workService = require('./services/workService');
const SmartParser = require('./utils/smartParser');

// 配置
const BOT_TOKEN = process.env.BOT_TOKEN;
const TIMEZONE = process.env.TIMEZONE || 'Asia/Shanghai';
const REMINDER_CONFIG = {
  initialWait: 5 * 60 * 1000, // 首次等待5分钟
  repeatInterval: 10 * 60 * 1000, // 重复间隔10分钟
  maxRepeats: 5 // 最大重复次数
};

// 创建机器人实例
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// 存储提醒定时器
const reminderTimers = new Map();

// 智能解析器
const smartParser = new SmartParser();

// 启动机器人
async function startBot() {
  try {
    console.log('机器人启动成功！时区:', TIMEZONE);
    console.log('权限设置: 所有关注机器人的用户都可以使用');
    console.log('提醒配置: 首次等待5分钟, 重复间隔10分钟, 最大重复5次');
    
    // 初始化提醒定时器
    await initializeReminders();
    
    console.log('✅ 机器人已启动，等待用户消息...');
  } catch (error) {
    console.error('❌ 启动机器人失败:', error);
    process.exit(1);
  }
}

// 检查用户权限
function isUserAllowed(userId) {
  // 所有用户都可以使用
  return true;
}

// 创建提醒
async function createReminder(msg, text) {
  try {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    
    // 智能解析文本
    const parsedData = smartParser.parseReminderText(text);
    const reminderTime = smartParser.parseTimeExpression(text);
    
    if (!reminderTime) {
      return '❌ 无法识别时间，请使用以下格式：\n' +
             '• 今晚20点提醒我做什么\n' +
             '• 明天上午9点开会\n' +
             '• 今天下午3点吃药\n' +
             '• 20:30 提醒';
    }
    
    // 验证解析结果
    const validationErrors = smartParser.validateParsedData(parsedData);
    if (validationErrors.length > 0) {
      return `❌ 输入有误：\n${validationErrors.join('\n')}`;
    }
    
    // 获取或创建分类
    let categoryId = null;
    if (parsedData.category) {
      const categories = await reminderService.getUserCategories(userId);
      const category = categories.find(c => c.name === parsedData.category);
      if (category) {
        categoryId = category.id;
      }
    }
    
    // 创建提醒
    const reminder = await reminderService.createReminder({
      userId,
      chatId,
      message: parsedData.message,
      reminderTime,
      categoryId,
      priority: parsedData.priority,
      tags: parsedData.tags,
      notes: parsedData.notes,
      repeatPattern: parsedData.repeatPattern
    });
    
    // 设置定时器
    const delay = reminderTime.getTime() - Date.now();
    if (delay > 0) {
      const timer = setTimeout(() => {
        sendReminder(reminder);
      }, delay);
      reminderTimers.set(reminder.id, timer);
    }
    
    // 生成智能建议
    const suggestions = smartParser.generateSuggestions(parsedData);
    
    let response = `✅ 提醒已创建！\n\n` +
                   `📅 时间：${reminderTime.toLocaleString('zh-CN', { timeZone: TIMEZONE })}\n` +
                   `💬 内容：${parsedData.message}`;
    
    if (suggestions.length > 0) {
      response += `\n\n💡 智能建议：\n${suggestions.join('\n')}`;
    }
    
    return response;
  } catch (error) {
    console.error('创建提醒失败:', error);
    return '❌ 创建提醒失败，请重试';
  }
}

// 发送提醒
async function sendReminder(reminder) {
  try {
    const chatId = reminder.chatId;
    const message = `⏰ 提醒时间到！\n\n💬 ${reminder.message}`;
    
    // 添加分类和优先级信息
    let fullMessage = message;
    if (reminder.category) {
      fullMessage += `\n📂 分类：${reminder.category.displayName}`;
    }
    if (reminder.priority && reminder.priority !== 'normal') {
      const priorityText = {
        'low': '🟢 低优先级',
        'high': '🔴 高优先级',
        'urgent': '🚨 紧急'
      }[reminder.priority] || '';
      if (priorityText) {
        fullMessage += `\n${priorityText}`;
      }
    }
    
    // 发送提醒消息
    const sentMessage = await bot.sendMessage(chatId, fullMessage, {
      reply_markup: createActionButtons(reminder.id)
    });
    
    // 更新重复次数
    reminder.repeatCount = (reminder.repeatCount || 0) + 1;
    await reminderService.updateReminderStatus(reminder.id, 'pending', reminder.repeatCount);
    
    // 如果未达到最大重复次数，设置下次提醒
    if (reminder.repeatCount < REMINDER_CONFIG.maxRepeats) {
      const nextReminderTime = new Date(Date.now() + REMINDER_CONFIG.repeatInterval);
      await reminderService.updateReminderStatus(reminder.id, 'pending', reminder.repeatCount);
      
      const timer = setTimeout(() => {
        sendReminder(reminder);
      }, REMINDER_CONFIG.repeatInterval);
      
      reminderTimers.set(reminder.id, timer);
    }
    
    console.log(`提醒已发送: ID=${reminder.id}, 重复次数=${reminder.repeatCount}`);
  } catch (error) {
    console.error('发送提醒失败:', error);
  }
}

// 创建操作按钮
function createActionButtons(reminderId) {
  return {
    inline_keyboard: [
      [
        { text: '✅ 已完成', callback_data: `complete_${reminderId}` },
        { text: '⏰ 延后10分钟', callback_data: `delay_${reminderId}` }
      ],
      [
        { text: '😴 小睡30分钟', callback_data: `snooze_${reminderId}` },
        { text: '🗑️ 删除', callback_data: `delete_${reminderId}` }
      ]
    ]
  };
}

// 完成提醒
async function completeReminder(reminderId) {
  try {
    await reminderService.completeReminder(reminderId, 'completed');
    
    // 清除定时器
    const timer = reminderTimers.get(reminderId);
    if (timer) {
      clearTimeout(timer);
      reminderTimers.delete(reminderId);
    }
    
    console.log(`提醒已完成: ID=${reminderId}`);
    return true;
  } catch (error) {
    console.error('完成提醒失败:', error);
    return false;
  }
}

// 延后提醒
async function delayReminder(reminderId, minutes = 10) {
  try {
    const newTime = new Date(Date.now() + minutes * 60 * 1000);
    const delayedReminder = await reminderService.delayReminder(reminderId, newTime);
    
    // 清除旧定时器
    const oldTimer = reminderTimers.get(reminderId);
    if (oldTimer) {
      clearTimeout(oldTimer);
    }
    
    // 设置新定时器
    const delay = newTime.getTime() - Date.now();
    if (delay > 0) {
      const timer = setTimeout(() => {
        sendReminder(delayedReminder);
      }, delay);
      reminderTimers.set(reminderId, timer);
    }
    
    return delayedReminder;
  } catch (error) {
    console.error('延后提醒失败:', error);
    return null;
  }
}

// 小睡提醒
async function snoozeReminder(reminderId, minutes = 30) {
  try {
    const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
    const snoozedReminder = await reminderService.snoozeReminder(reminderId, snoozeUntil);
    
    // 清除旧定时器
    const oldTimer = reminderTimers.get(reminderId);
    if (oldTimer) {
      clearTimeout(oldTimer);
    }
    
    // 设置小睡定时器
    const delay = snoozeUntil.getTime() - Date.now();
    if (delay > 0) {
      const timer = setTimeout(() => {
        sendReminder(snoozedReminder);
      }, delay);
      reminderTimers.set(reminderId, timer);
    }
    
    return snoozedReminder;
  } catch (error) {
    console.error('小睡提醒失败:', error);
    return null;
  }
}

// 删除提醒
async function deleteReminder(userId, reminderId) {
  try {
    await reminderService.deleteReminder(reminderId, userId);
    
    // 清除定时器
    const timer = reminderTimers.get(reminderId);
    if (timer) {
      clearTimeout(timer);
      reminderTimers.delete(reminderId);
    }
    
    return true;
  } catch (error) {
    console.error('删除提醒失败:', error);
    return false;
  }
}

// 初始化提醒定时器（从数据库恢复）
async function initializeReminders() {
  try {
    const pendingReminders = await reminderService.getPendingReminders();
    const now = new Date();
    
    for (const reminder of pendingReminders) {
      const delay = reminder.reminderTime.getTime() - now.getTime();
      
      if (delay > 0) {
        // 设置定时器
        const timer = setTimeout(() => {
          sendReminder(reminder);
        }, delay);
        
        reminderTimers.set(reminder.id, timer);
        console.log(`恢复提醒定时器: ID=${reminder.id}, 时间=${reminder.reminderTime.toLocaleString()}`);
      } else {
        // 时间已过，标记为过期
        await reminderService.completeReminder(reminder.id, 'expired');
        console.log(`清理过期提醒: ID=${reminder.id}`);
      }
    }
    
    console.log(`✅ 已恢复 ${pendingReminders.length} 个提醒定时器`);
  } catch (error) {
    console.error('初始化提醒失败:', error);
  }
}

// 处理按钮回调
bot.on('callback_query', async (callbackQuery) => {
  const data = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  
  try {
    if (data.startsWith('complete_')) {
      const reminderId = parseInt(data.split('_')[1]);
      if (await completeReminder(reminderId)) {
        await bot.editMessageText(
          `✅ 提醒已完成！\n\n💬 ${callbackQuery.message.text.split('\n\n')[1]}`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id
          }
        );
        await bot.answerCallbackQuery(callbackQuery.id, '✅ 提醒已完成');
      } else {
        await bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
      }
    } else if (data.startsWith('delay_')) {
      const reminderId = parseInt(data.split('_')[1]);
      const delayedReminder = await delayReminder(reminderId, 10);
      if (delayedReminder) {
        const newTimeStr = delayedReminder.reminderTime.toLocaleString('zh-CN', { 
          timeZone: TIMEZONE,
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        await bot.editMessageText(
          `⏰ 提醒已延后10分钟！\n\n📅 新时间：${newTimeStr}\n💬 ${delayedReminder.message}`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: createActionButtons(reminderId)
          }
        );
        await bot.answerCallbackQuery(callbackQuery.id, '⏰ 提醒已延后10分钟');
      } else {
        await bot.answerCallbackQuery(callbackQuery.id, '❌ 延后失败');
      }
    } else if (data.startsWith('snooze_')) {
      const reminderId = parseInt(data.split('_')[1]);
      const snoozedReminder = await snoozeReminder(reminderId, 30);
      if (snoozedReminder) {
        const snoozeTimeStr = snoozedReminder.snoozeUntil.toLocaleString('zh-CN', { 
          timeZone: TIMEZONE,
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        await bot.editMessageText(
          `😴 提醒已小睡30分钟！\n\n📅 小睡到：${snoozeTimeStr}\n💬 ${snoozedReminder.message}`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: createActionButtons(reminderId)
          }
        );
        await bot.answerCallbackQuery(callbackQuery.id, '😴 提醒已小睡30分钟');
      } else {
        await bot.answerCallbackQuery(callbackQuery.id, '❌ 小睡失败');
      }
    } else if (data.startsWith('delete_')) {
      const reminderId = parseInt(data.split('_')[1]);
      if (await deleteReminder(userId, reminderId)) {
        await bot.editMessageText(
          `🗑️ 提醒已删除！\n\n💬 ${callbackQuery.message.text.split('\n\n')[1]}`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id
          }
        );
        await bot.answerCallbackQuery(callbackQuery.id, '🗑️ 提醒已删除');
      } else {
        await bot.answerCallbackQuery(callbackQuery.id, '❌ 删除失败');
      }
    } else if (data.startsWith('news_')) {
      // 处理新闻相关按钮
      await handleNewsCallback(callbackQuery, data);
    }
  } catch (error) {
    console.error('处理按钮回调失败:', error);
    await bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败，请重试');
  }
});

// 处理新闻回调
async function handleNewsCallback(callbackQuery, data) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  
  try {
    if (data.startsWith('news_detail_')) {
      const newsId = parseInt(data.split('_')[2]);
      const news = await newsService.getNewsDetail(newsId, userId);
      
      const newsMessage = formatNewsDetail(news);
      await bot.editMessageText(newsMessage, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: 'HTML',
        reply_markup: news.sourceUrl ? { inline_keyboard: [[{ text: '🔗 打开原文', url: news.sourceUrl }]] } : undefined
      });
      
      await bot.answerCallbackQuery(callbackQuery.id, '📰 新闻详情已加载');
    } else if (data.startsWith('news_category_')) {
      const categoryId = parseInt(data.split('_')[2]);
      const [newsList, keyboard] = await Promise.all([
        newsService.getNewsList({ categoryId, limit: 10 }),
        buildNewsCategoryKeyboard()
      ]);
      
      const categoryMessage = formatNewsList(newsList.news, `分类新闻`);
      await bot.editMessageText(categoryMessage, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      
      await bot.answerCallbackQuery(callbackQuery.id, '📰 分类新闻已加载');
    } else if (data === 'news_home') {
      const [list, keyboard] = await Promise.all([
        newsService.getNewsList({ limit: 10 }),
        buildNewsCategoryKeyboard()
      ]);
      const message = formatNewsList(list.news, '📰 最新新闻');
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      await bot.answerCallbackQuery(callbackQuery.id, '📰 最新新闻');
    } else if (data === 'news_hot') {
      const [hot, keyboard] = await Promise.all([
        newsService.getHotNews(10),
        buildNewsCategoryKeyboard()
      ]);
      const message = formatNewsList(hot, '🔥 热门新闻');
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      await bot.answerCallbackQuery(callbackQuery.id, '🔥 热门新闻');
    }
  } catch (error) {
    console.error('处理新闻回调失败:', error);
    await bot.answerCallbackQuery(callbackQuery.id, '❌ 加载失败');
  }
}

// 构建新闻分类底部按钮
async function buildNewsCategoryKeyboard() {
  const categories = await newsService.getNewsCategories();
  const buttons = [];
  let row = [];
  for (const cat of categories) {
    row.push({ text: `${cat.icon} ${cat.displayName}`, callback_data: `news_category_${cat.id}` });
    if (row.length >= 3) {
      buttons.push(row);
      row = [];
    }
  }
  if (row.length) buttons.push(row);
  // 顶部/底部导航
  buttons.unshift([
    { text: '📰 最新', callback_data: 'news_home' },
    { text: '🔥 热门', callback_data: 'news_hot' }
  ]);
  return { inline_keyboard: buttons };
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 格式化新闻列表
function formatNewsList(newsList, title = '最新新闻') {
  let message = `📰 <b>${escapeHtml(title)}</b>\n\n`;
  
  newsList.forEach((news, index) => {
    const categoryIcon = news.category ? news.category.icon : '📰';
    const priorityIcon = news.isTop ? '🔝' : news.isHot ? '🔥' : '';
    const timeStr = news.publishTime.toLocaleString('zh-CN', { 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const titleHtml = news.sourceUrl
      ? `<a href="${escapeHtml(news.sourceUrl)}">${escapeHtml(news.title)}</a>`
      : `<b>${escapeHtml(news.title)}</b>`;
    
    message += `${index + 1}. ${categoryIcon} ${titleHtml} ${priorityIcon}\n`;
    message += `   📅 ${timeStr} | 👁️ ${news.viewCount} | 📂 ${escapeHtml(news.category?.displayName || '未分类')}\n\n`;
  });
  
  return message;
}

// 格式化新闻详情
function formatNewsDetail(news) {
  const categoryIcon = news.category ? news.category.icon : '📰';
  const priorityIcon = news.isTop ? '🔝' : news.isHot ? '🔥' : '';
  const timeStr = news.publishTime.toLocaleString('zh-CN', { 
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  const titleHtml = news.sourceUrl
    ? `<a href="${escapeHtml(news.sourceUrl)}">${escapeHtml(news.title)}</a>`
    : `<b>${escapeHtml(news.title)}</b>`;
  
  let message = `${categoryIcon} ${titleHtml} ${priorityIcon}\n\n`;
  message += `📅 发布时间：${timeStr}\n`;
  message += `📂 分类：${escapeHtml(news.category?.displayName || '未分类')}\n`;
  message += `📰 来源：${escapeHtml(news.source)}\n`;
  message += `👁️ 浏览次数：${news.viewCount}\n`;
  
  if (news.tags && news.tags.length > 0) {
    message += `🏷️ 标签：${escapeHtml(news.tags.join(', '))}\n`;
  }
  
  message += `\n📝 摘要：\n${escapeHtml(news.summary || news.content.substring(0, 200))}...\n`;
  if (news.sourceUrl) {
    message += `\n🔗 原文链接：<a href="${escapeHtml(news.sourceUrl)}">点击打开</a>`;
  }
  
  return message;
}

// 判断是否为新闻相关查询
function isNewsLikeQuery(text) {
  if (!text) return false;
  const t = text.trim();
  const plainMatches = ['新闻', '最新新闻', '热门新闻', '热点', '热搜', '头条'];
  if (plainMatches.includes(t)) return true;
  // 分类名
  if (/^(科技|财经|体育|娱乐|国际|社会|健康)$/.test(t)) return true;
  // 含“新闻”的自然语言
  if (t.includes('新闻')) return true;
  // 以“热”类关键词开头
  if (/^热(门|点|搜)/.test(t)) return true;
  return false;
}

// 将新闻相关自然语言路由到对应功能
async function routeNewsQuery(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  // 精确命令意图
  if (text === '新闻' || text === '最新新闻') {
    const [list, keyboard] = await Promise.all([
      newsService.getNewsList({ limit: 10 }),
      buildNewsCategoryKeyboard()
    ]);
    const message = formatNewsList(list.news, '📰 最新新闻');
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML', reply_markup: keyboard });
    return true;
  }
  if (text === '热门新闻' || text === '热点' || text === '热搜' || text === '头条') {
    const [hot, keyboard] = await Promise.all([
      newsService.getHotNews(10),
      buildNewsCategoryKeyboard()
    ]);
    const message = formatNewsList(hot, '🔥 热门新闻');
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML', reply_markup: keyboard });
    return true;
  }
  // 分类名（与 onText 分类处理重复，但这里兜底一次）
  const categoryMap = {
    '科技': 'tech',
    '财经': 'finance',
    '体育': 'sports',
    '娱乐': 'ent',
    '国际': 'world',
    '社会': 'society',
    '健康': 'health'
  };
  if (categoryMap[text]) {
    const categories = await newsService.getNewsCategories();
    const cat = categories.find(c => c.name === categoryMap[text]);
    if (cat) {
      const [list, keyboard] = await Promise.all([
        newsService.getNewsList({ categoryId: cat.id, limit: 10 }),
        buildNewsCategoryKeyboard()
      ]);
      const message = formatNewsList(list.news, `${cat.icon} ${cat.displayName}新闻`);
      await bot.sendMessage(chatId, message, { parse_mode: 'HTML', reply_markup: keyboard });
      return true;
    }
  }
  // 自然语言里包含“新闻”的搜索
  const keyword = text.replace(/新闻/g, '').trim();
  if (keyword.length > 0) {
    const [res, keyboard] = await Promise.all([
      newsService.searchNews(keyword, { limit: 10 }),
      buildNewsCategoryKeyboard()
    ]);
    if (res.news.length > 0) {
      let message = formatNewsList(res.news, `🔍 搜索结果：${escapeHtml(keyword)}`);
      message += `\n\n📊 共找到 ${res.total} 条相关新闻`;
      await bot.sendMessage(chatId, message, { parse_mode: 'HTML', reply_markup: keyboard });
    } else {
      await bot.sendMessage(chatId, `🔍 未找到与“${escapeHtml(keyword)}”相关的新闻`);
    }
    return true;
  }
  return false;
}

// 处理 /start 命令
bot.onText(/\/start/, async (msg) => {
  if (!isUserAllowed(msg.from.id)) {
    return;
  }
  
  try {
    // 创建或更新用户
    await reminderService.createOrUpdateUser(msg.from);
    
    const welcomeMessage = `🎉 欢迎使用智能提醒助手！\n\n` +
                          `📋 <b>主要功能：</b>\n` +
                          `• ⏰ 智能提醒：支持自然语言时间表达\n` +
                          `• 🏷️ 分类管理：自动分类和标签管理\n` +
                          `• 📰 新闻资讯：热门新闻实时更新\n` +
                          `• 🔄 连续提醒：未处理自动重复提醒\n` +
                          `• 💾 数据持久：数据安全保存\n\n` +
                          `📝 <b>使用示例：</b>\n` +
                          `• "今晚20点提醒我做什么"\n` +
                          `• "明天上午9点开会 #工作 #重要"\n` +
                          `• "今天下午3点吃药 #健康"\n\n` +
                          `🔧 <b>常用命令：</b>\n` +
                          `• /news - 查看最新新闻\n` +
                          `• /hot - 热门新闻\n` +
                          `• /categories - 新闻分类\n` +
                          `• /history - 提醒历史\n` +
                          `• /stats - 统计信息\n` +
                          `• /help - 帮助信息`;
    
    await bot.sendMessage(msg.chat.id, welcomeMessage, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('处理 /start 命令失败:', error);
    await bot.sendMessage(msg.chat.id, '❌ 启动失败，请重试');
  }
});

// 处理 /news 命令
bot.onText(/\/news/, async (msg) => {
  if (!isUserAllowed(msg.from.id)) {
    return;
  }
  
  try {
    const [newsList, keyboard] = await Promise.all([
      newsService.getNewsList({ limit: 10 }),
      buildNewsCategoryKeyboard()
    ]);
    const message = formatNewsList(newsList.news, '📰 最新新闻');
    
    await bot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML', reply_markup: keyboard });
  } catch (error) {
    console.error('获取新闻失败:', error);
    await bot.sendMessage(msg.chat.id, '❌ 获取新闻失败，请重试');
  }
});

// 处理 /hot 命令
bot.onText(/\/hot/, async (msg) => {
  if (!isUserAllowed(msg.from.id)) {
    return;
  }
  
  try {
    const [hotNews, keyboard] = await Promise.all([
      newsService.getHotNews(10),
      buildNewsCategoryKeyboard()
    ]);
    const message = formatNewsList(hotNews, '🔥 热门新闻');
    
    await bot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML', reply_markup: keyboard });
  } catch (error) {
    console.error('获取热门新闻失败:', error);
    await bot.sendMessage(msg.chat.id, '❌ 获取热门新闻失败，请重试');
  }
});

// 处理 /categories 命令
bot.onText(/\/categories/, async (msg) => {
  if (!isUserAllowed(msg.from.id)) {
    return;
  }
  
  try {
    const categories = await newsService.getNewsCategories();
    let message = '📂 <b>新闻分类</b>\n\n';
    
    categories.forEach((category, index) => {
      message += `${index + 1}. ${category.icon} <b>${category.displayName}</b>\n`;
    });
    
    message += '\n💡 发送分类名称即可查看该分类的新闻';
    
    await bot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('获取新闻分类失败:', error);
    await bot.sendMessage(msg.chat.id, '❌ 获取新闻分类失败，请重试');
  }
});

// 处理 /history 命令
bot.onText(/\/history/, async (msg) => {
  if (!isUserAllowed(msg.from.id)) {
    return;
  }
  
  try {
    const history = await reminderService.getReminderHistory(msg.from.id, 10);
    
    if (history.length === 0) {
      await bot.sendMessage(msg.chat.id, '📝 暂无提醒历史');
      return;
    }
    
    let message = '📝 <b>提醒历史</b>\n\n';
    
    history.forEach((item, index) => {
      const actionIcon = {
        'completed': '✅',
        'deleted': '🗑️',
        'expired': '⏰',
        'snoozed': '😴'
      }[item.actionType] || '📝';
      
      const timeStr = item.completedAt.toLocaleString('zh-CN', { 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      message += `${index + 1}. ${actionIcon} <b>${item.message}</b>\n`;
      message += `   📅 ${timeStr} | 🔄 ${item.repeatCount}次\n\n`;
    });
    
    await bot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('获取提醒历史失败:', error);
    await bot.sendMessage(msg.chat.id, '❌ 获取提醒历史失败，请重试');
  }
});

// 处理 /stats 命令
bot.onText(/\/stats/, async (msg) => {
  if (!isUserAllowed(msg.from.id)) {
    return;
  }
  
  try {
    const [reminderStats, newsStats] = await Promise.all([
      reminderService.getStats(msg.from.id),
      newsService.getNewsStats()
    ]);
    
    let message = '📊 <b>统计信息</b>\n\n';
    
    message += '⏰ <b>提醒统计：</b>\n';
    message += `   • 总提醒：${reminderStats.total}\n`;
    message += `   • 已完成：${reminderStats.completed}\n`;
    message += `   • 待处理：${reminderStats.pending}\n`;
    message += `   • 分类数：${reminderStats.categories}\n\n`;
    
    message += '📰 <b>新闻统计：</b>\n';
    message += `   • 总新闻：${newsStats.totalNews}\n`;
    message += `   • 分类数：${newsStats.totalCategories}\n`;
    message += `   • 热门：${newsStats.hotNewsCount}\n`;
    message += `   • 置顶：${newsStats.topNewsCount}`;
    
    await bot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    await bot.sendMessage(msg.chat.id, '❌ 获取统计信息失败，请重试');
  }
});

// 处理 /help 命令
bot.onText(/\/help/, async (msg) => {
  if (!isUserAllowed(msg.from.id)) {
    return;
  }
  
  const helpMessage = `📚 <b>帮助信息</b>\n\n` +
                     `⏰ <b>提醒功能：</b>\n` +
                     `• 直接发送：今晚20点提醒我做什么\n` +
                     `• 支持时间：今晚、明天、今天、具体时间\n` +
                     `• 智能分类：自动识别工作、生活、学习等\n` +
                     `• 优先级：紧急、重要、普通、低\n` +
                     `• 标签：使用 #标签 格式\n\n` +
                     `📰 <b>新闻功能：</b>\n` +
                     `• /news - 最新新闻\n` +
                     `• /hot - 热门新闻\n` +
                     `• /categories - 新闻分类\n` +
                     `• 发送分类名称查看分类新闻\n\n` +
                     `🔧 <b>其他功能：</b>\n` +
                     `• /history - 提醒历史\n` +
                     `• /stats - 统计信息\n` +
                     `• /help - 帮助信息\n\n` +
                     `💡 <b>使用技巧：</b>\n` +
                     `• 使用自然语言描述时间\n` +
                     `• 添加标签便于分类管理\n` +
                     `• 设置优先级管理重要程度\n` +
                     `• 定期查看统计了解使用情况`;
  
  await bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: 'HTML' });
});

// 处理新闻分类查询
bot.onText(/^(科技|财经|体育|娱乐|国际|社会|健康)$/, async (msg) => {
  if (!isUserAllowed(msg.from.id)) {
    return;
  }
  
  try {
    const categoryName = msg.text;
    const categories = await newsService.getNewsCategories();
    const category = categories.find(c => c.displayName === categoryName);
    
    if (!category) {
      await bot.sendMessage(msg.chat.id, '❌ 未找到该分类');
      return;
    }
    
    const newsList = await newsService.getNewsList({ categoryId: category.id, limit: 10 });
    const message = formatNewsList(newsList.news, `${category.icon} ${category.displayName}新闻`);
    
    await bot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('获取分类新闻失败:', error);
    await bot.sendMessage(msg.chat.id, '❌ 获取分类新闻失败，请重试');
  }
});

// 处理新闻搜索
bot.onText(/^搜索新闻 (.+)$/, async (msg, match) => {
  if (!isUserAllowed(msg.from.id)) {
    return;
  }
  
  try {
    const query = match[1];
    const searchResult = await newsService.searchNews(query, { limit: 10 });
    
    if (searchResult.news.length === 0) {
      await bot.sendMessage(msg.chat.id, `🔍 未找到包含"${query}"的新闻`);
      return;
    }
    
    let message = formatNewsList(searchResult.news, `🔍 搜索结果：${query}`);
    message += `\n\n📊 共找到 ${searchResult.total} 条相关新闻`;
    
    await bot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('搜索新闻失败:', error);
    await bot.sendMessage(msg.chat.id, '❌ 搜索新闻失败，请重试');
  }
});

// 处理 /work 命令
bot.onText(/\/work/, async (msg) => {
  if (!isUserAllowed(msg.from.id)) return;
  try {
    const posts = await workService.getLatest(20);
    if (!posts || posts.length === 0) {
      await bot.sendMessage(msg.chat.id, '暂无数据，请先执行爬取或稍后再试。', { reply_markup: buildWorkKeyboard() });
      return;
    }
    const message = formatWorkList(posts);
    await bot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML', reply_markup: buildWorkKeyboard() });
  } catch (e) {
    console.error('获取工作板块失败:', e);
    await bot.sendMessage(msg.chat.id, '❌ 获取失败，请重试');
  }
});

// 回调：刷新工作板块
bot.on('callback_query', async (callbackQuery) => {
  const data = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;
  try {
    if (data === 'work_refresh') {
      await bot.answerCallbackQuery(callbackQuery.id, '正在刷新...');
      // 异步刷新抓取
      workService.crawlAll().catch(() => {});
      const posts = await workService.getLatest(20);
      const message = formatWorkList(posts);
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: 'HTML',
        reply_markup: buildWorkKeyboard()
      });
      await bot.answerCallbackQuery(callbackQuery.id, '✅ 已刷新');
    }
  } catch (e) {
    console.error('工作板块刷新失败:', e);
    await bot.answerCallbackQuery(callbackQuery.id, '❌ 刷新失败');
  }
});

// 处理普通消息（创建提醒）
bot.on('message', async (msg) => {
  if (!isUserAllowed(msg.from.id) || msg.text.startsWith('/')) {
    return;
  }
  
  try {
    // 新闻相关分流：命中则不进入创建提醒
    if (isNewsLikeQuery(msg.text)) {
      await routeNewsQuery(msg);
      return;
    }

    const response = await createReminder(msg, msg.text);
    await bot.sendMessage(msg.chat.id, response);
  } catch (error) {
    console.error('处理消息失败:', error);
    await bot.sendMessage(msg.chat.id, '❌ 处理失败，请重试');
  }
});

// 错误处理
bot.on('polling_error', (error) => {
  console.error('轮询错误:', error);
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n正在关闭机器人...');
  
  // 清除所有定时器
  for (const timer of reminderTimers.values()) {
    clearTimeout(timer);
  }
  reminderTimers.clear();
  
  // 停止机器人
  await bot.stopPolling();
  console.log('机器人已关闭');
  process.exit(0);
});

// 启动机器人
startBot(); 