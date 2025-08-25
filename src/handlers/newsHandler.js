// 新闻处理器模块
const newsService = require('../services/newsService');
const { NEWS_CATEGORIES_KEYBOARD, BACK_TO_CATEGORIES_BUTTON, WEB3_MAIN_KEYBOARD } = require('../constants/keyboards');

class NewsHandler {
  constructor(bot) {
    this.bot = bot;
    this.PAGE_SIZE = 6; // 每页显示6条新闻
  }

  // 处理新闻命令
  async handleNewsCommand(msg, page = 1) {
    const chatId = msg.chat.id;
    
    try {
      const { news, total, totalPages } = await newsService.getNewsList({ page, limit: this.PAGE_SIZE });
      if (!news || news.length === 0) {
        await this.bot.sendMessage(chatId, '📰 暂无新闻');
        return;
      }

      let message = `📰 最新新闻 (第${page}页，共${totalPages}页)\n\n`;
      news.forEach((item, index) => {
        const url = item.sourceUrl || '#';
        const title = item.title?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';
        const globalIndex = (page - 1) * this.PAGE_SIZE + index + 1;
        message += `${globalIndex}. <a href="${url}">${title}</a>\n`;
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

      // 添加分页按钮
      if (totalPages > 1) {
        const paginationRow = [];
        if (page > 1) {
          paginationRow.push({ text: '◀️ 上一页', callback_data: `news_page_${page - 1}` });
        }
        paginationRow.push({ text: `${page}/${totalPages}`, callback_data: 'page_info' });
        if (page < totalPages) {
          paginationRow.push({ text: '下一页 ▶️', callback_data: `news_page_${page + 1}` });
        }
        keyboard.inline_keyboard.push(paginationRow);
      }

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
  async handleHotNews(callbackQuery, page = 1) {
    const chatId = callbackQuery.message.chat.id;
    
    try {
      // 获取所有热门新闻，然后手动分页
      const allHotNews = await newsService.getHotNews(100); // 获取足够多的热门新闻
      if (!allHotNews || allHotNews.length === 0) {
        await this.bot.answerCallbackQuery(callbackQuery.id, '📰 暂无热门新闻');
        return;
      }

      const totalPages = Math.ceil(allHotNews.length / this.PAGE_SIZE);
      const startIndex = (page - 1) * this.PAGE_SIZE;
      const endIndex = startIndex + this.PAGE_SIZE;
      const pageNews = allHotNews.slice(startIndex, endIndex);

      let message = `🔥 热门新闻 (第${page}页，共${totalPages}页)\n\n`;
      pageNews.forEach((item, index) => {
        const url = item.sourceUrl || '#';
        const title = item.title?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';
        const globalIndex = startIndex + index + 1;
        message += `${globalIndex}. <a href="${url}">${title}</a>\n`;
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

      // 添加分页按钮
      if (totalPages > 1) {
        const paginationRow = [];
        if (page > 1) {
          paginationRow.push({ text: '◀️ 上一页', callback_data: `hot_page_${page - 1}` });
        }
        paginationRow.push({ text: `${page}/${totalPages}`, callback_data: 'page_info' });
        if (page < totalPages) {
          paginationRow.push({ text: '下一页 ▶️', callback_data: `hot_page_${page + 1}` });
        }
        keyboard.inline_keyboard.push(paginationRow);
      }

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
            callback_data: `category_${cat.id}`
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
  async handleCategoryNews(callbackQuery, categoryId, page = 1) {
    const chatId = callbackQuery.message.chat.id;
    
    try {
      const { news, total, totalPages } = await newsService.getNewsList({ categoryId, page, limit: this.PAGE_SIZE });
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

      let message = `📰 ${headerName} 分类新闻 (第${page}页，共${totalPages}页)\n\n`;
      
      news.forEach((item, index) => {
        const url = item.sourceUrl || '#';
        const title = item.title?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';
        const globalIndex = (page - 1) * this.PAGE_SIZE + index + 1;
        message += `${globalIndex}. <a href="${url}">${title}</a>\n`;
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

      // 添加分页按钮
      if (totalPages > 1) {
        const paginationRow = [];
        if (page > 1) {
          paginationRow.push({ text: '◀️ 上一页', callback_data: `category_page_${categoryId}_${page - 1}` });
        }
        paginationRow.push({ text: `${page}/${totalPages}`, callback_data: 'page_info' });
        if (page < totalPages) {
          paginationRow.push({ text: '下一页 ▶️', callback_data: `category_page_${categoryId}_${page + 1}` });
        }
        keyboard.inline_keyboard.push(paginationRow);
      }

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
  async executeNewsSearch(chatId, keyword, page = 1) {
    try {
      const result = await newsService.searchNews(keyword, { page, limit: this.PAGE_SIZE });
      const items = result.news || [];
      if (items.length === 0) {
        await this.bot.sendMessage(chatId, `🔍 搜索 "${keyword}" 没有找到相关新闻`);
        return;
      }

      let message = `🔍 搜索 "${keyword}" 结果 (第${page}页，共${result.totalPages}页)：\n\n`;
      items.forEach((item, index) => {
        const url = item.sourceUrl || '#';
        const title = item.title?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';
        const globalIndex = (page - 1) * this.PAGE_SIZE + index + 1;
        message += `${globalIndex}. <a href="${url}">${title}</a>\n`;
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

      // 添加分页按钮
      if (result.totalPages > 1) {
        const paginationRow = [];
        if (page > 1) {
          paginationRow.push({ text: '◀️ 上一页', callback_data: `search_page_${keyword}_${page - 1}` });
        }
        paginationRow.push({ text: `${page}/${result.totalPages}`, callback_data: 'page_info' });
        if (page < result.totalPages) {
          paginationRow.push({ text: '下一页 ▶️', callback_data: `search_page_${keyword}_${page + 1}` });
        }
        keyboard.inline_keyboard.push(paginationRow);
      }

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
    try {
      const { data } = callbackQuery;
      const chatId = callbackQuery.message.chat.id;

      if (data === 'news_latest') {
        await this.handleNewsCommand(callbackQuery.message);
      } else if (data === 'news_hot') {
        await this.handleHotNews(callbackQuery.message);
      } else if (data === 'news_categories') {
        await this.handleNewsCategories(callbackQuery.message);
      } else if (data === 'news_search') {
        await this.handleNewsSearch(callbackQuery.message);
      } else if (data.startsWith('category_')) {
        const categoryId = data.replace('category_', '');
        await this.handleCategoryNews(callbackQuery.message, categoryId);
      } else if (data.startsWith('news_page_')) {
        // 处理新闻分页
        const page = parseInt(data.replace('news_page_', ''));
        await this.handleNewsCommand(callbackQuery.message, page);
      } else if (data.startsWith('hot_page_')) {
        // 处理热门新闻分页
        const page = parseInt(data.replace('hot_page_', ''));
        await this.handleHotNews(callbackQuery.message, page);
      } else if (data.startsWith('category_page_')) {
        // 处理分类新闻分页
        const parts = data.replace('category_page_', '').split('_');
        const categoryId = parts[0];
        const page = parseInt(parts[1]);
        await this.handleCategoryNews(callbackQuery.message, categoryId, page);
      } else if (data.startsWith('search_page_')) {
        // 处理搜索分页
        const parts = data.replace('search_page_', '').split('_');
        const keyword = parts[0];
        const page = parseInt(parts[1]);
        await this.executeNewsSearch(callbackQuery.message.chat.id, keyword, page);
      } else if (data === 'page_info') {
        // 分页信息按钮
        await this.bot.answerCallbackQuery(callbackQuery.id, '当前页面信息');
      } else {
        await this.bot.answerCallbackQuery(callbackQuery.id, '未知操作');
      }
    } catch (error) {
      console.error('处理新闻回调失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '操作失败，请重试');
    }
  }

  // 处理返回新闻主菜单
  async handleNewsBack(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    
    try {
      await this.handleNewsCommand({ chat: { id: chatId } }, 1);
      await this.bot.answerCallbackQuery(callbackQuery.id, '🔙 已返回新闻主菜单');
    } catch (error) {
      console.error('返回新闻主菜单失败:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 返回失败');
    }
  }

  // 处理 /web3 命令
  async handleWeb3Command(msg, page = 1) {
    const chatId = msg.chat.id;
    try {
      const { news, total, totalPages } = await newsService.getNewsList({ page, limit: this.PAGE_SIZE, search: 'web3' });
      let message = '🕸️ Web3 资讯\n\n';
      if (!news || news.length === 0) {
        message += '暂无数据，点击下方来源抓取。';
      } else {
        message += `(第${page}页，共${totalPages}页)\n\n`;
        news.forEach((item, index) => {
          const url = item.sourceUrl || '#';
          const title = item.title?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';
          const globalIndex = (page - 1) * this.PAGE_SIZE + index + 1;
          message += `${globalIndex}. <a href="${url}">${title}</a>\n`;
          message += `   来源：${item.source}\n`;
          message += `   时间：${new Date(item.publishTime).toLocaleString('zh-CN')}\n\n`;
        });
      }

      // 深拷贝键盘对象，避免修改原始对象
      const keyboard = JSON.parse(JSON.stringify(WEB3_MAIN_KEYBOARD));

      // 添加分页按钮
      if (totalPages > 1) {
        const paginationRow = [];
        if (page > 1) {
          paginationRow.push({ text: '◀️ 上一页', callback_data: `web3_page_${page - 1}` });
        }
        paginationRow.push({ text: `${page}/${totalPages}`, callback_data: 'page_info' });
        if (page < totalPages) {
          paginationRow.push({ text: '下一页 ▶️', callback_data: `web3_page_${page + 1}` });
        }
        keyboard.inline_keyboard.push(paginationRow);
      }

      await this.bot.sendMessage(chatId, message, { 
        reply_markup: keyboard, 
        parse_mode: 'HTML', 
        disable_web_page_preview: true 
      });
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
      const { news, total, totalPages } = await newsService.getNewsList({ page: 1, limit: this.PAGE_SIZE, search: 'web3' });
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
  async executeWeb3Search(chatId, keyword, page = 1) {
    try {
      const { news, total, totalPages } = await newsService.searchNews(keyword, { page, limit: this.PAGE_SIZE });
      if (!news || news.length === 0) {
        await this.bot.sendMessage(chatId, `🔍 未找到与 "${keyword}" 相关的 Web3 资讯`);
        return;
      }
      let message = `🔍 Web3 搜索 "${keyword}" 结果 (第${page}页，共${totalPages}页)：\n\n`;
      news.forEach((item, index) => {
        const url = item.sourceUrl || '#';
        const title = item.title?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';
        const globalIndex = (page - 1) * this.PAGE_SIZE + index + 1;
        message += `${globalIndex}. <a href="${url}">${title}</a>\n`;
        message += `   来源：${item.source}\n`;
        message += `   时间：${new Date(item.publishTime).toLocaleString('zh-CN')}\n\n`;
      });

      // 深拷贝键盘对象，避免修改原始对象
      const keyboard = JSON.parse(JSON.stringify(WEB3_MAIN_KEYBOARD));

      // 添加分页按钮
      if (totalPages > 1) {
        const paginationRow = [];
        if (page > 1) {
          paginationRow.push({ text: '◀️ 上一页', callback_data: `web3_search_page_${keyword}_${page - 1}` });
        }
        paginationRow.push({ text: `${page}/${totalPages}`, callback_data: 'page_info' });
        if (page < totalPages) {
          paginationRow.push({ text: '下一页 ▶️', callback_data: `web3_search_page_${keyword}_${page + 1}` });
        }
        keyboard.inline_keyboard.push(paginationRow);
      }

      await this.bot.sendMessage(chatId, message, { 
        reply_markup: keyboard, 
        parse_mode: 'HTML', 
        disable_web_page_preview: true 
      });
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
        const { news, total, totalPages } = await newsService.getNewsList({ page: 1, limit: this.PAGE_SIZE, search: 'web3' });
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

        // 深拷贝键盘对象，避免修改原始对象
        const keyboard = JSON.parse(JSON.stringify(WEB3_MAIN_KEYBOARD));

        // 添加分页按钮
        if (totalPages > 1) {
          const paginationRow = [];
          paginationRow.push({ text: `1/${totalPages}`, callback_data: 'page_info' });
          if (totalPages > 1) {
            paginationRow.push({ text: '下一页 ▶️', callback_data: `web3_page_2` });
          }
          keyboard.inline_keyboard.push(paginationRow);
        }

        await this.bot.sendMessage(chatId, message, { 
          reply_markup: keyboard, 
          parse_mode: 'HTML', 
          disable_web_page_preview: true 
        });
        await this.bot.answerCallbackQuery(callbackQuery.id, '✅ 已更新');
      } else if (data.startsWith('web3_page_')) {
        // 处理 Web3 分页
        const page = parseInt(data.split('_')[2]);
        await this.handleWeb3Command(callbackQuery.message, page);
      } else if (data.startsWith('web3_search_page_')) {
        // 处理 Web3 搜索分页
        const parts = data.split('_');
        const keyword = parts[3];
        const page = parseInt(parts[4]);
        await this.executeWeb3Search(callbackQuery.message.chat.id, keyword, page);
      }
    } catch (e) {
      console.error('处理 Web3 回调失败:', e);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ 操作失败');
    }
  }
}

module.exports = NewsHandler; 