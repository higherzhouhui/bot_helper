// 新闻处理器模块
const newsService = require('../services/newsService');
const { WEB3_MAIN_KEYBOARD } = require('../constants/keyboards');

class NewsHandler {
  constructor(bot) {
    this.bot = bot;
  }

  // 处理新闻命令
  async handleNewsCommand(msg) {
    const chatId = msg.chat.id;
    
    try {
      const { news } = await newsService.getNewsList({ page: 1, limit: 5 });
      if (!news || news.length === 0) {
        await this.bot.sendMessage(chatId, '📰 暂无新闻');
        return;
      }

      let message = '📰 最新新闻\n\n';
      news.forEach((item, index) => {
        const url = item.sourceUrl || '#';
        const title = item.title?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';
        message += `${index + 1}. <a href="${url}">${title}</a>\n`;
        message += `   来源：${item.source}\n`;
        message += `   时间：${new Date(item.publishTime).toLocaleString('zh-CN')}\n\n`;
      });

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🔥 热门新闻', callback_data: 'news_hot' },
            { text: '📊 新闻统计', callback_data: 'news_stats' }
          ],
          [
            { text: '🏷️ 新闻分类', callback_data: 'news_categories' },
            { text: '🔍 搜索新闻', callback_data: 'news_search' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, message, {
        reply_markup: keyboard,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });
    } catch (error) {
      console.error('获取新闻失败:', error);
      await this.bot.sendMessage(chatId, '❌ 获取新闻失败，请重试');
    }
  }

  // 处理热门新闻
  async handleHotNews(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    
    try {
      const hotNews = await newsService.getHotNews(5);
      if (!hotNews || hotNews.length === 0) {
        await this.bot.answerCallbackQuery(callbackQuery.id, '📰 暂无热门新闻');
        return;
      }

      let message = '🔥 热门新闻\n\n';
      hotNews.forEach((item, index) => {
        const url = item.sourceUrl || '#';
        const title = item.title?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';
        message += `${index + 1}. <a href="${url}">${title}</a>\n`;
        message += `   热度：${item.viewCount ?? 0} 次浏览\n`;
        message += `   来源：${item.source}\n`;
        message += `   时间：${new Date(item.publishTime).toLocaleString('zh-CN')}\n\n`;
      });

      const keyboard = {
        inline_keyboard: [
          [
            { text: '📰 最新新闻', callback_data: 'news_latest' },
            { text: '🔙 返回', callback_data: 'news_back' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, message, {
        reply_markup: keyboard,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });

      await this.bot.answerCallbackQuery(callbackQuery.id, '🔥 热门新闻已显示');
    } catch (error) {
      console.error('获取热门新闻失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 获取热门新闻失败');
    }
  }

  // 处理新闻分类
  async handleNewsCategories(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    
    try {
      const categories = await newsService.getNewsCategories();
      if (!categories || categories.length === 0) {
        await this.bot.answerCallbackQuery(callbackQuery.id, '🏷️ 暂无新闻分类');
        return;
      }

      const keyboard = {
        inline_keyboard: [
          ...categories.map(cat => [{
            text: `${cat.icon} ${cat.displayName || cat.name}`,
            callback_data: `news_category_${cat.id}`
          }]),
          [
            { text: '🔙 返回', callback_data: 'news_back' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, '🏷️ 选择新闻分类：', {
        reply_markup: keyboard
      });

      await this.bot.answerCallbackQuery(callbackQuery.id, '🏷️ 请选择分类');
    } catch (error) {
      console.error('获取新闻分类失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 获取分类失败');
    }
  }

  // 处理分类新闻
  async handleCategoryNews(callbackQuery, categoryId) {
    const chatId = callbackQuery.message.chat.id;
    
    try {
      const { news } = await newsService.getNewsList({ categoryId, page: 1, limit: 5 });
      if (!news || news.length === 0) {
        await this.bot.answerCallbackQuery(callbackQuery.id, '📰 该分类暂无新闻');
        return;
      }

      // 获取分类显示名称
      let headerName = '分类';
      try {
        const categories = await newsService.getNewsCategories();
        const cat = categories.find(c => c.id === categoryId);
        if (cat) headerName = cat.displayName || cat.name;
      } catch (_) {}

      let message = `📰 ${headerName} 分类新闻\n\n`;
      
      news.forEach((item, index) => {
        const url = item.sourceUrl || '#';
        const title = item.title?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';
        message += `${index + 1}. <a href="${url}">${title}</a>\n`;
        message += `   来源：${item.source}\n`;
        message += `   时间：${new Date(item.publishTime).toLocaleString('zh-CN')}\n\n`;
      });

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🔙 返回分类', callback_data: 'news_categories' },
            { text: '📰 最新新闻', callback_data: 'news_latest' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, message, {
        reply_markup: keyboard,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });

      await this.bot.answerCallbackQuery(callbackQuery.id, `📰 ${headerName} 新闻已显示`);
    } catch (error) {
      console.error('获取分类新闻失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 获取分类新闻失败');
    }
  }

  // 处理新闻搜索
  async handleNewsSearch(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    
    try {
      await this.bot.sendMessage(chatId, '🔍 新闻搜索\n\n请输入搜索关键词：');
      await this.bot.answerCallbackQuery(callbackQuery.id, '🔍 请输入搜索关键词');
    } catch (error) {
      console.error('处理新闻搜索失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 搜索功能异常');
    }
  }

  // 执行新闻搜索
  async executeNewsSearch(chatId, keyword) {
    try {
      const result = await newsService.searchNews(keyword, { page: 1, limit: 10 });
      const items = result.news || [];
      if (items.length === 0) {
        await this.bot.sendMessage(chatId, `🔍 搜索 "${keyword}" 没有找到相关新闻`);
        return;
      }

      let message = `🔍 搜索 "${keyword}" 结果：\n\n`;
      items.forEach((item, index) => {
        const url = item.sourceUrl || '#';
        const title = item.title?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';
        message += `${index + 1}. <a href="${url}">${title}</a>\n`;
        message += `   来源：${item.source}\n`;
        message += `   时间：${new Date(item.publishTime).toLocaleString('zh-CN')}\n\n`;
      });

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🔍 继续搜索', callback_data: 'news_search' },
            { text: '📰 返回新闻', callback_data: 'news_back' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, message, {
        reply_markup: keyboard,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });
    } catch (error) {
      console.error('执行新闻搜索失败:', error);
      await this.bot.sendMessage(chatId, '❌ 搜索失败，请重试');
    }
  }

  // 处理新闻统计
  async handleNewsStats(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    
    try {
      const stats = await newsService.getNewsStats();
      const message = `📊 新闻统计\n\n` +
                      `📰 总新闻数：${stats.totalNews}\n` +
                      `🗂️ 分类数量：${stats.totalCategories}\n` +
                      `🔥 热门新闻数：${stats.hotNewsCount}\n` +
                      `📌 置顶新闻数：${stats.topNewsCount}`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '📰 最新新闻', callback_data: 'news_latest' },
            { text: '🔙 返回', callback_data: 'news_back' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, message, {
        reply_markup: keyboard
      });

      await this.bot.answerCallbackQuery(callbackQuery.id, '📊 统计信息已显示');
    } catch (error) {
      console.error('获取新闻统计失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 获取统计失败');
    }
  }

  // 处理新闻回调
  async handleNewsCallback(callbackQuery) {
    const data = callbackQuery.data;
    
    try {
      if (data === 'news_hot') {
        await this.handleHotNews(callbackQuery);
      } else if (data === 'news_categories') {
        await this.handleNewsCategories(callbackQuery);
      } else if (data === 'news_search') {
        await this.handleNewsSearch(callbackQuery);
      } else if (data === 'news_stats') {
        await this.handleNewsStats(callbackQuery);
      } else if (data === 'news_back') {
        await this.handleNewsBack(callbackQuery);
      } else if (data.startsWith('news_category_')) {
        const categoryId = parseInt(data.split('_')[2]);
        await this.handleCategoryNews(callbackQuery, categoryId);
      } else if (data === 'news_latest') {
        await this.handleNewsCommand(callbackQuery.message);
      } else if (data === 'web3_latest') {
        await this.handleWeb3Command(callbackQuery.message);
      }
    } catch (error) {
      console.error('处理新闻回调失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 处理返回新闻主菜单
  async handleNewsBack(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    
    try {
      await this.handleNewsCommand({ chat: { id: chatId } });
      await this.bot.answerCallbackQuery(callbackQuery.id, '🔙 已返回新闻主菜单');
    } catch (error) {
      console.error('返回新闻主菜单失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 返回失败');
    }
  }

  // 处理 /web3 命令
  async handleWeb3Command(msg) {
    const chatId = msg.chat.id;
    try {
      const { news } = await newsService.getNewsList({ page: 1, limit: 5, search: 'web3' });
      let message = '🕸️ Web3 资讯\n\n';
      if (!news || news.length === 0) {
        message += '暂无数据，点击下方来源抓取。';
      } else {
        news.forEach((item, index) => {
          const url = item.sourceUrl || '#';
          const title = item.title?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';
          message += `${index + 1}. <a href="${url}">${title}</a>\n`;
          message += `   来源：${item.source}\n`;
          message += `   时间：${new Date(item.publishTime).toLocaleString('zh-CN')}\n\n`;
        });
      }
      await this.bot.sendMessage(chatId, message, { reply_markup: WEB3_MAIN_KEYBOARD, parse_mode: 'HTML', disable_web_page_preview: true });
    } catch (e) {
      console.error('获取 Web3 资讯失败:', e);
      await this.bot.sendMessage(chatId, '❌ 获取 Web3 资讯失败，请重试');
    }
  }

  // 抓取并展示某个 Web3 来源
  async handleWeb3Source(callbackQuery, sourceKey) {
    const chatId = callbackQuery.message.chat.id;
    try {
      await newsService.crawlWeb3(sourceKey, 15);
      const { news } = await newsService.getNewsList({ page: 1, limit: 10, search: 'web3' });
      if (!news || news.length === 0) {
        await this.bot.answerCallbackQuery(callbackQuery.id, '暂无数据');
        return;
      }

      let message = `🕸️ ${sourceKey} 最新 Web3 资讯\n\n`;
      news.forEach((item, index) => {
        const url = item.sourceUrl || '#';
        const title = item.title?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';
        message += `${index + 1}. <a href="${url}">${title}</a>\n`;
        message += `   来源：${item.source}\n`;
        message += `   时间：${new Date(item.publishTime).toLocaleString('zh-CN')}\n\n`;
      });

      await this.bot.sendMessage(chatId, message, { reply_markup: WEB3_MAIN_KEYBOARD, parse_mode: 'HTML', disable_web_page_preview: true });
      await this.bot.answerCallbackQuery(callbackQuery.id, '✅ 已更新 Web3 资讯');
    } catch (e) {
      console.error('抓取 Web3 来源失败:', e);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 抓取失败');
    }
  }

  // Web3 搜索输入提示
  async handleWeb3Search(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    try {
      await this.bot.sendMessage(chatId, '🔍 请输入 Web3 搜索关键词：');
      await this.bot.answerCallbackQuery(callbackQuery.id, '🔍 请输入关键词');
    } catch (e) {
      console.error('Web3 搜索提示失败:', e);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }

  // 执行 Web3 搜索
  async executeWeb3Search(chatId, keyword) {
    try {
      const { news } = await newsService.searchNews(keyword, { page: 1, limit: 10 });
      if (!news || news.length === 0) {
        await this.bot.sendMessage(chatId, `🔍 未找到与 "${keyword}" 相关的 Web3 资讯`);
        return;
      }
      let message = `🔍 Web3 搜索 "${keyword}" 结果：\n\n`;
      news.forEach((item, index) => {
        const url = item.sourceUrl || '#';
        const title = item.title?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';
        message += `${index + 1}. <a href="${url}">${title}</a>\n`;
        message += `   来源：${item.source}\n`;
        message += `   时间：${new Date(item.publishTime).toLocaleString('zh-CN')}\n\n`;
      });
      await this.bot.sendMessage(chatId, message, { reply_markup: WEB3_MAIN_KEYBOARD, parse_mode: 'HTML', disable_web_page_preview: true });
    } catch (e) {
      console.error('执行 Web3 搜索失败:', e);
      await this.bot.sendMessage(chatId, '❌ 搜索失败，请重试');
    }
  }

  // Web3 回调分发
  async handleWeb3Callback(callbackQuery) {
    const data = callbackQuery.data;
    try {
      if (data === 'web3_chainfeeds') {
        await this.handleWeb3Source(callbackQuery, 'chainfeeds');
      } else if (data === 'web3_panews') {
        await this.handleWeb3Source(callbackQuery, 'panews');
      } else if (data === 'web3_investing') {
        await this.handleWeb3Source(callbackQuery, 'investing_cn');
      } else if (data === 'web3_search') {
        await this.handleWeb3Search(callbackQuery);
      } else if (data === 'web3_hot' || data === 'web3_latest') {
        // 简单复用：最新即抓取三源
        await newsService.crawlWeb3('chainfeeds', 10).catch(()=>{});
        await newsService.crawlWeb3('panews', 10).catch(()=>{});
        await newsService.crawlWeb3('investing_cn', 10).catch(()=>{});
        const chatId = callbackQuery.message.chat.id;
        const { news } = await newsService.getNewsList({ page: 1, limit: 10, search: 'web3' });
        if (!news || news.length === 0) {
          await this.bot.answerCallbackQuery(callbackQuery.id, '暂无数据');
          return;
        }
        let message = '🕸️ 最新 Web3 资讯\n\n';
        news.forEach((item, index) => {
          const url = item.sourceUrl || '#';
          const title = item.title?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';
          message += `${index + 1}. <a href="${url}">${title}</a>\n`;
          message += `   来源：${item.source}\n`;
          message += `   时间：${new Date(item.publishTime).toLocaleString('zh-CN')}\n\n`;
        });
        await this.bot.sendMessage(chatId, message, { reply_markup: WEB3_MAIN_KEYBOARD, parse_mode: 'HTML', disable_web_page_preview: true });
        await this.bot.answerCallbackQuery(callbackQuery.id, '✅ 已更新');
      }
    } catch (e) {
      console.error('处理 Web3 回调失败:', e);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }
}

module.exports = NewsHandler; 