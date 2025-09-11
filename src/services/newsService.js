const axios = require('axios');
const cheerio = require('cheerio');
const { NewsCategory, News, UserNewsPreference, NewsReadHistory, KeywordSubscription, FavoriteNews } = require('../models');
const Sequelize = require('sequelize');

class NewsService {
  constructor() {
    // 新闻源配置（站点分类键可能与统一键不同）
    this.newsSources = {
      'sina': {
        name: '新浪新闻',
        baseUrl: 'https://news.sina.com.cn',
        allowedHosts: ['sina.com.cn', 'sina.cn'],
        categories: {
          // 统一键 → 站点键 & 路径 & 全链接
          'tech': { siteKey: 'tech', url: '/tech/', fullUrl: 'https://tech.sina.com.cn/' },
          'finance': { siteKey: 'finance', url: '/finance/', fullUrl: 'https://finance.sina.com.cn/' },
          'sports': { siteKey: 'sports', url: '/sports/', fullUrl: 'https://sports.sina.com.cn/' },
          'ent': { siteKey: 'ent', url: '/ent/', fullUrl: 'https://ent.sina.com.cn/' },
          'world': { siteKey: 'world', url: '/world/', fullUrl: 'https://news.sina.com.cn/world/' },
          'society': { siteKey: 'society', url: '/society/', fullUrl: 'https://news.sina.com.cn/society/' },
          'health': { siteKey: 'health', url: '/health/', fullUrl: 'https://health.sina.com.cn/' }
        }
      },
      '163': {
        name: '网易新闻',
        baseUrl: 'https://news.163.com',
        allowedHosts: ['163.com', '126.net'],
        categories: {
          'tech': { siteKey: 'tech', url: '/tech/', fullUrl: 'https://tech.163.com/' },
          'finance': { siteKey: 'money', url: '/money/', fullUrl: 'https://money.163.com/' },
          'sports': { siteKey: 'sports', url: '/sports/', fullUrl: 'https://sports.163.com/' },
          'ent': { siteKey: 'ent', url: '/ent/', fullUrl: 'https://ent.163.com/' },
          'world': { siteKey: 'world', url: '/world/', fullUrl: 'https://news.163.com/world/' },
          'society': { siteKey: 'society', url: '/society/', fullUrl: 'https://news.163.com/shehui/' },
          'health': { siteKey: 'health', url: '/health/', fullUrl: 'https://jiankang.163.com/' }
        }
      },
      'sohu': {
        name: '搜狐新闻',
        baseUrl: 'https://news.sohu.com',
        allowedHosts: ['sohu.com'],
        categories: {
          'tech': { siteKey: 'tech', url: '/tech/', fullUrl: 'https://it.sohu.com/' },
          'finance': { siteKey: 'business', url: '/business/', fullUrl: 'https://business.sohu.com/' },
          'sports': { siteKey: 'sports', url: '/sports/', fullUrl: 'https://sports.sohu.com/' },
          'ent': { siteKey: 'yule', url: '/yule/', fullUrl: 'https://yule.sohu.com/' },
          'world': { siteKey: 'world', url: '/world/', fullUrl: 'https://news.sohu.com/guoji.shtml' },
          'society': { siteKey: 'society', url: '/society/', fullUrl: 'https://society.sohu.com/' },
          'health': { siteKey: 'health', url: '/health/', fullUrl: 'https://health.sohu.com/' }
        }
      },
      'tencent': {
        name: '腾讯新闻',
        baseUrl: 'https://news.qq.com',
        allowedHosts: ['qq.com', 'new.qq.com'],
        categories: {
          'tech': { siteKey: 'tech', url: '/', fullUrl: 'https://tech.qq.com/' },
          'finance': { siteKey: 'finance', url: '/', fullUrl: 'https://finance.qq.com/' },
          'sports': { siteKey: 'sports', url: '/', fullUrl: 'https://sports.qq.com/' },
          'ent': { siteKey: 'ent', url: '/', fullUrl: 'https://ent.qq.com/' },
          'world': { siteKey: 'world', url: '/', fullUrl: 'https://new.qq.com/ch/world/' },
          'society': { siteKey: 'society', url: '/', fullUrl: 'https://new.qq.com/ch/society/' },
          'health': { siteKey: 'health', url: '/', fullUrl: 'https://new.qq.com/ch/health/' }
        }
      },
      'xinhuanet': {
        name: '新华网',
        baseUrl: 'https://www.news.cn',
        allowedHosts: ['news.cn', 'xinhuanet.com'],
        categories: {
          'tech': { siteKey: 'tech', url: '/', fullUrl: 'https://www.news.cn/tech/' },
          'finance': { siteKey: 'finance', url: '/', fullUrl: 'https://www.news.cn/fortune/' },
          'sports': { siteKey: 'sports', url: '/', fullUrl: 'https://sports.news.cn/' },
          'ent': { siteKey: 'ent', url: '/', fullUrl: 'https://ent.news.cn/' },
          'world': { siteKey: 'world', url: '/', fullUrl: 'https://www.news.cn/world/' },
          'society': { siteKey: 'society', url: '/', fullUrl: 'https://www.news.cn/legal/' },
          'health': { siteKey: 'health', url: '/', fullUrl: 'https://health.news.cn/' }
        }
      },
      'people': {
        name: '人民网',
        baseUrl: 'https://www.people.com.cn',
        allowedHosts: ['people.com.cn'],
        categories: {
          'tech': { siteKey: 'tech', url: '/', fullUrl: 'http://it.people.com.cn/' },
          'finance': { siteKey: 'finance', url: '/', fullUrl: 'http://finance.people.com.cn/' },
          'sports': { siteKey: 'sports', url: '/', fullUrl: 'http://sports.people.com.cn/' },
          'ent': { siteKey: 'ent', url: '/', fullUrl: 'http://ent.people.com.cn/' },
          'world': { siteKey: 'world', url: '/', fullUrl: 'http://world.people.com.cn/' },
          'society': { siteKey: 'society', url: '/', fullUrl: 'http://society.people.com.cn/' },
          'health': { siteKey: 'health', url: '/', fullUrl: 'http://health.people.com.cn/' }
        }
      },
      'cctv': {
        name: '央视网',
        baseUrl: 'https://news.cctv.com',
        allowedHosts: ['cctv.com', 'cntv.cn'],
        categories: {
          'tech': { siteKey: 'tech', url: '/', fullUrl: 'https://news.cctv.com/keji/' },
          'finance': { siteKey: 'finance', url: '/', fullUrl: 'https://news.cctv.com/caijing/' },
          'sports': { siteKey: 'sports', url: '/', fullUrl: 'https://sports.cctv.com/' },
          'ent': { siteKey: 'ent', url: '/', fullUrl: 'https://ent.cctv.com/' },
          'world': { siteKey: 'world', url: '/', fullUrl: 'https://news.cctv.com/guoji/' },
          'society': { siteKey: 'society', url: '/', fullUrl: 'https://news.cctv.com/shehui/' },
          'health': { siteKey: 'health', url: '/', fullUrl: 'https://news.cctv.com/jiankang/' }
        }
      },
      'chinanews': {
        name: '中国新闻网',
        baseUrl: 'https://www.chinanews.com.cn',
        allowedHosts: ['chinanews.com.cn'],
        categories: {
          'tech': { siteKey: 'tech', url: '/', fullUrl: 'https://www.chinanews.com.cn/it/' },
          'finance': { siteKey: 'finance', url: '/', fullUrl: 'https://www.chinanews.com.cn/finance/' },
          'sports': { siteKey: 'sports', url: '/', fullUrl: 'https://www.chinanews.com.cn/sports/' },
          'ent': { siteKey: 'ent', url: '/', fullUrl: 'https://www.chinanews.com.cn/yl/' },
          'world': { siteKey: 'world', url: '/', fullUrl: 'https://www.chinanews.com.cn/gj/' },
          'society': { siteKey: 'society', url: '/', fullUrl: 'https://www.chinanews.com.cn/sh/' },
          'health': { siteKey: 'health', url: '/', fullUrl: 'https://www.chinanews.com.cn/jiankang/' }
        }
      },
      'thepaper': {
        name: '澎湃新闻',
        baseUrl: 'https://www.thepaper.cn',
        allowedHosts: ['thepaper.cn'],
        categories: {
          'tech': { siteKey: 'tech', url: '/', fullUrl: 'https://www.thepaper.cn/channel_26950' },
          'finance': { siteKey: 'finance', url: '/', fullUrl: 'https://www.thepaper.cn/channel_25950' },
          'sports': { siteKey: 'sports', url: '/', fullUrl: 'https://www.thepaper.cn/channel_25469' },
          'ent': { siteKey: 'ent', url: '/', fullUrl: 'https://www.thepaper.cn/channel_25468' },
          'world': { siteKey: 'world', url: '/', fullUrl: 'https://www.thepaper.cn/channel_27224' },
          'society': { siteKey: 'society', url: '/', fullUrl: 'https://www.thepaper.cn/channel_25951' },
          'health': { siteKey: 'health', url: '/', fullUrl: 'https://www.thepaper.cn/channel_27286' }
        }
      },
      'yicai': {
        name: '第一财经',
        baseUrl: 'https://www.yicai.com',
        allowedHosts: ['yicai.com'],
        categories: {
          'tech': { siteKey: 'tech', url: '/', fullUrl: 'https://www.yicai.com/technology/' },
          'finance': { siteKey: 'finance', url: '/', fullUrl: 'https://www.yicai.com/finance/' },
          'sports': { siteKey: 'sports', url: '/', fullUrl: 'https://www.yicai.com/sports/' },
          'ent': { siteKey: 'ent', url: '/', fullUrl: 'https://www.yicai.com/culture/' },
          'world': { siteKey: 'world', url: '/', fullUrl: 'https://www.yicai.com/news/china/' },
          'society': { siteKey: 'society', url: '/', fullUrl: 'https://www.yicai.com/news/social/' },
          'health': { siteKey: 'health', url: '/', fullUrl: 'https://www.yicai.com/life/health/' }
        }
      }
    };

    // 系统统一分类（与 NewsCategory.name 一致）
    this.defaultCategories = [
      { name: 'tech', displayName: '科技', icon: '🚀', color: '#FF6B6B', sortOrder: 0 },
      { name: 'finance', displayName: '财经', icon: '💰', color: '#4ECDC4', sortOrder: 1 },
      { name: 'sports', displayName: '体育', icon: '⚽', color: '#45B7D1', sortOrder: 2 },
      { name: 'ent', displayName: '娱乐', icon: '🎬', color: '#96CEB4', sortOrder: 3 },
      { name: 'world', displayName: '国际', icon: '🌍', color: '#FFEAA7', sortOrder: 4 },
      { name: 'society', displayName: '社会', icon: '🏠', color: '#DDA0DD', sortOrder: 5 },
      { name: 'health', displayName: '健康', icon: '💊', color: '#98D8C8', sortOrder: 6 }
    ];

    this.httpHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    };
  }

  // 对来源站点的分类键做统一映射
  mapToUnifiedCategory(sourceKey, sourceCategoryKey) {
    const source = this.newsSources[sourceKey];
    if (!source) return 'tech';
    const entry = Object.entries(source.categories).find(([, v]) => v.siteKey === sourceCategoryKey);
    return entry ? entry[0] : sourceCategoryKey;
  }

  // 根据统一键取抓取URL（优先 fullUrl）
  getListUrl(sourceKey, unifiedKey) {
    const source = this.newsSources[sourceKey];
    if (!source) return '';
    const conf = source.categories[unifiedKey];
    if (!conf) return '';
    if (conf.fullUrl) return conf.fullUrl;
    if (conf.url) return source.baseUrl.replace(/\/$/, '') + conf.url;
    return source.baseUrl;
  }

  async requestPage(url, refererHost) {
    const resp = await axios.get(url, {
      headers: {
        ...this.httpHeaders,
        ...(refererHost ? { Referer: refererHost } : {})
      },
      timeout: 12000,
      maxRedirects: 3,
      validateStatus: (s) => s >= 200 && s < 400
    });
    return resp.data;
  }

  absoluteUrl(base, href) {
    if (!href) return '';
    if (href.startsWith('http://') || href.startsWith('https://')) return href;
    if (href.startsWith('//')) return 'https:' + href;
    if (href.startsWith('/')) return base.replace(/\/$/, '') + href;
    return base.replace(/\/$/, '') + '/' + href;
  }

  cleanTitle(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
  }

  // 初始化新闻分类
  async initializeNewsCategories() {
    try {
      for (const category of this.defaultCategories) {
        await NewsCategory.findOrCreate({
          where: { name: category.name },
          defaults: category
        });
      }
      console.log('✅ 新闻分类初始化完成');
    } catch (error) {
      console.error('❌ 新闻分类初始化失败:', error);
    }
  }

  // 真实抓取：按站点和分类解析列表页，提取文章链接
  async scrapeNews(sourceKey, unifiedCategoryKey, limit) {
    const source = this.newsSources[sourceKey];
    const listUrl = this.getListUrl(sourceKey, unifiedCategoryKey);

    try {
      const html = await this.requestPage(listUrl, source.baseUrl);
      const $ = cheerio.load(html);
      let items = [];

      if (sourceKey === 'sina') {
        const candidates = [
          'a[href*=".sina.com.cn"], a[href*="sina.cn"]',
          '.news-ct a, .news-item a, .feed-card-item a, .blk12 a, .mod-ct a',
          'h2 a, h3 a',
          'a[title]'
        ];
        items = this.extractLinks($, candidates, source.baseUrl);
      } else if (sourceKey === '163') {
        const candidates = [
          'a[href*="163.com"], a[href*=".126.net"]',
          '.data_row a, .newsList a, .ndi_main a, .area_left a, .post_body a',
          'h2 a, h3 a',
          'a[title]'
        ];
        items = this.extractLinks($, candidates, source.baseUrl);
      } else if (sourceKey === 'sohu') {
        const candidates = [
          'a[href*="sohu.com"]',
          '.list16 a, .news-box a, .focus-news a, .c-card a, .article-box a',
          'h2 a, h3 a',
          'a[title]'
        ];
        items = this.extractLinks($, candidates, source.baseUrl);
      } else if (sourceKey === 'tencent') {
        const candidates = [
          'a[href*="qq.com"], a[href*="new.qq.com"]',
          '.list a, .cf a, .news-list a, .mod a, .Q-tpList a',
          'h2 a, h3 a',
          'a[title]'
        ];
        items = this.extractLinks($, candidates, source.baseUrl);
      } else if (sourceKey === 'xinhuanet') {
        const candidates = [
          'a[href*="news.cn"], a[href*="xinhuanet.com"]',
          '.data_list a, .news a, .tit h3 a, .xwlist a, .dataLeft a',
          'h2 a, h3 a',
          'a[title]'
        ];
        items = this.extractLinks($, candidates, source.baseUrl);
      } else if (sourceKey === 'people') {
        const candidates = [
          'a[href*="people.com.cn"]',
          '.hdNews a, .rlf-article a, .newsItems a, .list a',
          'h2 a, h3 a',
          'a[title]'
        ];
        items = this.extractLinks($, candidates, source.baseUrl);
      } else if (sourceKey === 'cctv') {
        const candidates = [
          'a[href*="cctv.com"], a[href*="cntv.cn"]',
          '.newslist a, .list a, .text a, .swiper-slide a',
          'h2 a, h3 a',
          'a[title]'
        ];
        items = this.extractLinks($, candidates, source.baseUrl);
      } else if (sourceKey === 'chinanews') {
        const candidates = [
          'a[href*="chinanews.com.cn"]',
          '.news_list a, .content_list a, .left_zw a, .dd_bt a',
          'h2 a, h3 a',
          'a[title]'
        ];
        items = this.extractLinks($, candidates, source.baseUrl);
      } else if (sourceKey === 'thepaper') {
        const candidates = [
          'a[href*="thepaper.cn"]',
          '.news_tu a, .news_li a, .list_item a, .card___a3w a',
          'h2 a, h3 a',
          'a[title]'
        ];
        items = this.extractLinks($, candidates, source.baseUrl);
      } else if (sourceKey === 'yicai') {
        const candidates = [
          'a[href*="yicai.com"]',
          '.m-list a, .g-list a, .news-list a, .m-module a',
          'h2 a, h3 a',
          'a[title]'
        ];
        items = this.extractLinks($, candidates, source.baseUrl);
      }

      const seen = new Set();
      const filtered = [];
      const allowedHosts = (source && source.allowedHosts) ? source.allowedHosts : [new URL(source.baseUrl).hostname];
      for (const it of items) {
        const title = this.cleanTitle(it.title);
        const href = this.absoluteUrl(source.baseUrl, it.href);
        if (!title || title.length < 6) continue;
        if (!href || href.indexOf('javascript:') === 0) continue;
        let hostOk = false;
        try {
          const host = new URL(href).hostname;
          hostOk = allowedHosts.some(h => host === h || host.endsWith('.' + h) || host.endsWith(h));
        } catch (_) {
          hostOk = false;
        }
        if (!hostOk) continue;
        if (seen.has(href)) continue;
        seen.add(href);
        filtered.push({ title, url: href });
        if (filtered.length >= limit) break;
      }

      return filtered;
    } catch (e) {
      console.warn('⚠️ 抓取列表失败，回退到模拟数据:', e.message || e);
      return [];
    }
  }

  extractLinks($, selectorList, baseUrl) {
    const results = [];
    for (const sel of selectorList) {
      $(sel).each((_, el) => {
        const a = $(el);
        const href = a.attr('href');
        const title = a.attr('title') || a.text();
        if (href && title) results.push({ href, title });
      });
      if (results.length >= 50) break;
    }
    return results;
  }

  // Web3 资讯抓取（ChainFeeds / PANews / Investing 中文）
  async crawlWeb3(sourceKey, limit = 20) {
    try {
      const sources = {
        chainfeeds: { 
          name: 'ChainFeeds', 
          baseUrl: 'https://www.chainfeeds.xyz/', 
          host: 'chainfeeds.xyz',
          selectors: ['[class*="feed"] a', 'article a', '.post a'],
          isReactApp: true
        },
        panews: { 
          name: 'PANews', 
          baseUrl: 'https://www.panewslab.com/zh', 
          host: 'panewslab.com',
          selectors: ['a[href*="/articles/"]', 'a[href*="/topics/"]'],
          isReactApp: false
        },
        investing_cn: { 
          name: 'Investing中文', 
          baseUrl: 'https://cn.investing.com/news/cryptocurrency/', 
          host: 'cn.investing.com',
          selectors: ['.article a', '.news a', 'a[href*="/news/"]', '.largeTitle a'],
          isReactApp: false
        },
        blockbeats: {
          name: 'BlockBeats',
          baseUrl: 'https://www.theblockbeats.info/',
          host: 'theblockbeats.info',
          selectors: ['a[href*="/news/"]', 'a[href*="/flash/"]', 'h1 a', 'h2 a', 'h3 a', '[class*="news"] a'],
          isReactApp: true // 检测到前端框架
        }
      };

      const conf = sources[sourceKey];
      if (!conf) throw new Error(`不支持的 Web3 来源: ${sourceKey}`);

      // 对于React应用，直接返回模拟数据
      if (conf.isReactApp && (sourceKey === 'chainfeeds' || sourceKey === 'blockbeats')) {
        console.log(`⚠️ ${conf.name} 使用前端框架动态加载，返回模拟数据`);
        return await this.generateMockWeb3News(conf, limit);
      }

      let html, $, items = [];
      
      try {
        html = await this.requestPage(conf.baseUrl, conf.baseUrl);
        $ = cheerio.load(html);
        items = this.extractLinks($, conf.selectors, conf.baseUrl);
      } catch (requestError) {
        if (requestError.response && requestError.response.status === 403) {
          console.log(`⚠️ ${conf.name} 访问被拒绝(403)，使用模拟数据`);
          return await this.generateMockWeb3News(conf, limit);
        }
        throw requestError;
      }

      const seen = new Set();
      const filtered = [];
      for (const it of items) {
        const title = this.cleanTitle(it.title);
        let href = this.absoluteUrl(conf.baseUrl, it.href);
        
        // 修复PANews的URL拼接问题
        if (sourceKey === 'panews' && href.includes('/zh/zh/')) {
          href = href.replace('/zh/zh/', '/zh/');
        }
        
        if (!title || title.length < 6) continue;
        if (!href || href.startsWith('javascript:')) continue;
        if (!(href.includes(conf.host))) continue; // 限定站点
        if (seen.has(href)) continue;
        seen.add(href);
        filtered.push({ title, url: href });
        if (filtered.length >= limit) break;
      }

      const now = new Date();
      const categoryId = await this.getCategoryIdByName('tech'); // 改为科技分类
      const toSave = [];

      if (filtered.length === 0) {
        // 兜底：生成模拟 Web3 资讯，避免界面无内容
        const mockTitles = [
          '以太坊生态进展综述：L2 增长与数据可用性新方案',
          '比特币链上活跃度攀升：费用结构与矿工收入观察',
          'Solana DeFi 周报：TVL 变化与新协议上线',
          '监管动态速览：美欧亚对加密与稳定币的新动向',
          '链上安全回顾：近期典型攻击手法与风控建议',
          'NFT 市场观察：蓝筹系列与叙事迁移',
          '跨链基础设施进展：消息传递与桥接安全',
          '以数据看行情：交易所净流入与持仓结构'
        ];
        for (let i = 0; i < Math.min(limit, mockTitles.length); i++) {
          const title = mockTitles[i];
          // 生成唯一的sourceUrl，避免重复
          const uniqueId = Date.now() + i + 10000; // 加偏移避免与generateMockWeb3News冲突
          const sourceUrl = `${conf.baseUrl}#fallback-${uniqueId}`;
          
          toSave.push({
            title,
            content: `${title} - 这是一条Web3行业资讯。内容包含最新的区块链发展动态、市场分析和技术趋势。`,
            summary: title,
            source: conf.name,
            sourceUrl: sourceUrl,
            imageUrl: null,
            categoryId,
            tags: 'tech,web3,blockchain', // 更新标签
            publishTime: new Date(now.getTime() - i * 60000),
            viewCount: Math.floor(Math.random() * 5000),
            isHot: Math.random() > 0.7,
            isTop: Math.random() > 0.9,
            status: 'published'
          });
        }
      } else {
        for (let i = 0; i < filtered.length; i++) {
          const { title, url } = filtered[i];
          toSave.push({
            title,
            content: `${title} - 这是一条来自${conf.name}的真实Web3资讯。内容涵盖区块链技术、加密货币市场和Web3生态发展。`,
            summary: title,
            source: conf.name,
            sourceUrl: url,
            imageUrl: null,
            categoryId,
            tags: 'tech,web3,blockchain', // 更新标签
            publishTime: new Date(now.getTime() - i * 60000),
            viewCount: Math.floor(Math.random() * 5000),
            isHot: Math.random() > 0.7,
            isTop: Math.random() > 0.9,
            status: 'published'
          });
        }
      }

      const saved = await this.saveNewsBatch(toSave);
      console.log(`✅ 成功爬取并保存 ${saved.length} 条 Web3 资讯到科技分类: ${conf.name}${filtered.length === 0 ? '（模拟）' : ''}`);
      return saved;
    } catch (error) {
      console.error('❌ 爬取 Web3 资讯失败:', error);
      throw error;
    }
  }

  // 生成模拟Web3新闻数据（用于动态加载网站）
  async generateMockWeb3News(conf, limit = 20) {
    const now = new Date();
    const categoryId = await this.getCategoryIdByName('tech');
    
    const mockTitles = {
      chainfeeds: [
        '以太坊生态进展综述：L2扩容方案最新进展与数据分析',
        'Solana生态爆发：DeFi TVL突破新高，生态项目全面开花',
        '比特币链上数据解读：机构持仓变化与市场情绪分析',
        'Web3基础设施建设提速：跨链桥安全性与互操作性突破',
        '监管政策更新：全球主要经济体对加密货币的最新态度',
        'NFT市场新动向：蓝筹项目表现与新兴赛道机会分析',
        'DeFi协议创新：收益聚合器与流动性挖矿新玩法',
        '加密货币支付应用：传统企业采用Web3支付解决方案',
        '区块链游戏发展：GameFi模式创新与用户增长趋势',
        'Web3社交平台兴起：去中心化社交网络的机遇与挑战'
      ],
      panews: [
        '深度解析：以太坊上海升级后的生态变化与投资机会',
        '机构动态：贝莱德比特币ETF申请进展及市场影响分析',
        '监管观察：美国SEC对加密货币监管政策的最新变化',
        'Layer2竞争格局：Arbitrum、Optimism、Polygon发展对比',
        '稳定币市场分析：USDC、USDT竞争态势与监管合规',
        'Web3安全报告：2024年上半年黑客攻击事件统计分析',
        '加密VC投资趋势：机构资金流向与热门赛道分析',
        '央行数字货币进展：全球CBDC项目最新发展动态',
        'DeFi收益率变化：主要协议APY波动与风险评估',
        '加密货币税务政策：各国对数字资产征税规则更新'
      ],
      investingcn: [
        '比特币价格分析：技术指标显示潜在突破信号',
        '以太坊ETF资金流向：机构投资者情绪转暖',
        '加密货币市场周报：主流币种表现与资金流向分析',
        '美联储政策对加密市场影响：利率决议前瞻',
        '全球稳定币市场规模突破1500亿美元大关',
        '区块链技术在传统金融领域的应用进展',
        '加密货币监管环境改善推动机构入场',
        '数字资产托管服务需求激增，传统银行加速布局',
        '去中心化金融(DeFi)协议总锁仓价值创新高',
        '央行数字货币试点扩大，数字支付生态加速发展'
      ],
      blockbeats: [
        'SEC主席最新演讲：加密时代全面到来，美国将引领加密与AI创新',
        'Coinbase研究主管：数字资产财库已进入「PvP阶段」',
        'VanEck计划在美国申请推出Hyperliquid现货质押型ETF',
        '超200万枚ETH排队退出质押，市场流动性面临考验',
        'Solana链上Meme币热潮持续，CHARLIE市值突破千万美元',
        'Hyperliquid稳定币USDH竞拍激烈，Native Markets领跑',
        '美国现货比特币ETF净流入7.415亿美元创单日新高',
        '摩根大通：标普500拒绝Strategy纳入对加密财库是一次打击',
        '马斯克重新夺回全球首富头衔，特斯拉股价大涨',
        '《加密市场结构法案》获参议院通过概率增大，监管迎来转机'
      ]
    };

    const titles = mockTitles[conf.name.toLowerCase().replace(/[^a-z]/g, '')] || mockTitles.chainfeeds;
    const toSave = [];

    for (let i = 0; i < Math.min(limit, titles.length); i++) {
      const title = titles[i];
      // 生成唯一的sourceUrl，避免重复
      const uniqueId = Date.now() + i;
      const sourceUrl = `${conf.baseUrl}#mock-${uniqueId}`;
      
      toSave.push({
        title,
        content: `${title} - 这是一条来自${conf.name}的Web3资讯内容。内容涵盖了最新的区块链技术发展、市场动态以及行业趋势分析。`,
        summary: title,
        source: conf.name,
        sourceUrl: sourceUrl,
        imageUrl: null,
        categoryId,
        tags: 'tech,web3,blockchain',
        publishTime: new Date(now.getTime() - i * 60000),
        viewCount: Math.floor(Math.random() * 5000) + 1000,
        isHot: Math.random() > 0.7,
        isTop: Math.random() > 0.9,
        status: 'published'
      });
    }

    const saved = await this.saveNewsBatch(toSave);
    console.log(`✅ 成功生成并保存 ${saved.length} 条模拟 Web3 资讯: ${conf.name}`);
    return saved;
  }

  // 爬取新闻（真实爬虫优先，失败回退到模拟数据）
  async crawlNews(sourceKey, sourceCategoryKey, limit = 20) {
    try {
      const source = this.newsSources[sourceKey];
      if (!source) {
        throw new Error(`不支持的新闻源: ${sourceKey}`);
      }

      const unifiedCategoryKey = this.mapToUnifiedCategory(sourceKey, sourceCategoryKey);

      console.log(`开始爬取 ${source.name} - ${unifiedCategoryKey} 新闻...`);

      let articles = await this.scrapeNews(sourceKey, unifiedCategoryKey, limit);
      const useMock = articles.length === 0;

      if (useMock) {
        const mockNews = await this.generateMockNews(sourceKey, unifiedCategoryKey, limit);
        await this.saveNewsBatch(mockNews);
        console.log(`✅ 成功爬取并保存 ${mockNews.length} 条新闻 (模拟)`);
        return mockNews;
      }

      const now = new Date();
      const categoryId = await this.getCategoryIdByName(unifiedCategoryKey);
      const toSave = [];
      for (let i = 0; i < articles.length; i++) {
        const { title, url } = articles[i];
        toSave.push({
          title,
          content: title,
          summary: title,
          source: source.name,
          sourceUrl: url,
          imageUrl: null,
          categoryId,
          tags: unifiedCategoryKey,
          publishTime: new Date(now.getTime() - i * 60000),
          viewCount: Math.floor(Math.random() * 5000),
          isHot: Math.random() > 0.7,
          isTop: Math.random() > 0.9,
          status: 'published'
        });
      }

      const saved = await this.saveNewsBatch(toSave);
      console.log(`✅ 成功爬取并保存 ${saved.length} 条新闻 (真实)`);
      return saved;
    } catch (error) {
      console.error(`❌ 爬取新闻失败:`, error);
      throw error;
    }
  }

  async saveNewsBatch(list) {
    const saved = [];
    for (const item of list) {
      try {
        // 多重去重检查：优先使用sourceUrl，其次使用title + source组合
        let exists = false;
        
        if (item.sourceUrl) {
          exists = await News.findOne({ where: { sourceUrl: item.sourceUrl } });
        }
        
        if (!exists && item.title && item.source) {
          // 检查相同标题和来源的新闻（防止重复标题）
          exists = await News.findOne({ 
            where: { 
              title: item.title,
              source: item.source
            } 
          });
        }
        
        if (exists) {
          console.log(`⚠️ 跳过重复新闻: ${item.title.substring(0, 50)}...`);
          continue;
        }
        
        const news = await News.create(item);
        saved.push(news);
      } catch (e) {
        console.warn('保存新闻失败:', e.message || e);
      }
    }
    return saved;
  }

  // 生成模拟新闻数据（使用统一分类键；链接指向抓取页）
  async generateMockNews(sourceKey, unifiedCategoryKey, limit) {
    const mockNews = [];
    const now = new Date();

    const categoryMap = {
      'tech': {
        keywords: ['人工智能', '区块链', '5G', '云计算', '物联网', '大数据', '机器学习'],
        companies: ['腾讯', '阿里巴巴', '百度', '华为', '小米', '字节跳动']
      },
      'finance': {
        keywords: ['股市', '基金', '投资', '理财', '房地产', '保险', '银行'],
        companies: ['工商银行', '建设银行', '招商银行', '平安保险', '中国人寿']
      },
      'sports': {
        keywords: ['足球', '篮球', '网球', '奥运会', '世界杯', 'NBA', '欧冠'],
        companies: ['皇马', '巴萨', '曼联', '湖人', '勇士']
      },
      'ent': {
        keywords: ['电影', '电视剧', '综艺', '明星', '音乐', '演唱会', '电影节'],
        companies: ['华谊兄弟', '光线传媒', '万达影视', '博纳影业']
      },
      'world': {
        keywords: ['国际关系', '外交', '贸易', '政治', '经济', '文化', '科技'],
        companies: ['美国', '欧盟', '日本', '韩国', '俄罗斯', '印度']
      },
      'society': {
        keywords: ['教育', '治安', '交通', '公益', '就业', '民生', '环保'],
        companies: ['社区组织', '志愿者团队', '高校', '公安部门', '市政单位']
      },
      'health': {
        keywords: ['疫苗', '公卫', '医疗', '养生', '营养', '心理健康', '运动健康'],
        companies: ['三甲医院', '疾控中心', '制药企业', '健康管理机构', '研究所']
      }
    };

    const source = this.newsSources[sourceKey];
    const listUrl = this.getListUrl(sourceKey, unifiedCategoryKey);
    const categoryConf = categoryMap[unifiedCategoryKey] || categoryMap['tech'];
    
    for (let i = 0; i < limit; i++) {
      const keyword = categoryConf.keywords[Math.floor(Math.random() * categoryConf.keywords.length)];
      const company = categoryConf.companies[Math.floor(Math.random() * categoryConf.companies.length)];
      
      const title = `${keyword}领域重大突破：${company}引领行业新趋势`;
      const content = `近日，${company}在${keyword}领域取得了重大突破。这一进展不仅推动了整个行业的发展，也为相关技术的应用开辟了新的可能性。专家表示，这一突破将带来深远的影响，预计将在未来几年内改变整个行业的格局。`;
      
      const publishTime = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
      
      mockNews.push({
        title,
        content,
        summary: content.substring(0, 100) + '...',
        source: source.name,
        sourceUrl: listUrl,
        imageUrl: null,
        categoryId: await this.getCategoryIdByName(unifiedCategoryKey),
        tags: 'web3',
        publishTime,
        viewCount: Math.floor(Math.random() * 10000),
        isHot: Math.random() > 0.7,
        isTop: Math.random() > 0.9,
        status: 'published'
      });
    }
    
    return mockNews;
  }

  // 根据分类名获取分类ID（统一键）
  async getCategoryIdByName(categoryName) {
    try {
      const category = await NewsCategory.findOne({
        where: { name: categoryName }
      });
      return category ? category.id : 1;
    } catch (error) {
      console.error('获取分类ID失败:', error);
      return 1;
    }
  }

  // 获取新闻列表
  async getNewsList(options = {}) {
    try {
      const {
        categoryId,
        page = 1,
        limit = 20,
        sortBy = 'publishTime',
        sortOrder = 'DESC',
        isHot = false,
        isTop = false,
        search = ''
      } = options;

      const whereClause = { status: 'published' };
      
      if (categoryId) {
        whereClause.categoryId = categoryId;
      }
      
      if (isHot) {
        whereClause.isHot = true;
      }
      
      if (isTop) {
        whereClause.isTop = true;
      }
      
      if (search) {
        whereClause[Sequelize.Op.or] = [
          { title: { [Sequelize.Op.like]: `%${search}%` } },
          { content: { [Sequelize.Op.like]: `%${search}%` } },
          { tags: { [Sequelize.Op.like]: `%${search}%` } }
        ];
      }

      const offset = (page - 1) * limit;
      
      const { count, rows } = await News.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: NewsCategory,
            as: 'category',
            attributes: ['name', 'displayName', 'icon', 'color']
          }
        ],
        order: [[sortBy, sortOrder]],
        limit,
        offset
      });

      return {
        news: rows,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      console.error('获取新闻列表失败:', error);
      throw error;
    }
  }

  // 获取新闻详情
  async getNewsDetail(newsId, userId = null) {
    try {
      const news = await News.findByPk(newsId, {
        include: [
          {
            model: NewsCategory,
            as: 'category',
            attributes: ['name', 'displayName', 'icon', 'color']
          }
        ]
      });

      if (!news) {
        throw new Error('新闻不存在');
      }

      await news.increment('viewCount');

      if (userId) {
        await this.recordNewsRead(userId, newsId);
      }

      return news;
    } catch (error) {
      console.error('获取新闻详情失败:', error);
      throw error;
    }
  }

  async recordNewsRead(userId, newsId) {
    try {
      await NewsReadHistory.create({
        userId,
        newsId,
        readAt: new Date()
      });
    } catch (error) {
      console.error('记录阅读历史失败:', error);
    }
  }

  async getHotNews(limit = 10) {
    try {
      const hotNews = await News.findAll({
        where: { 
          isHot: true,
          status: 'published'
        },
        include: [
          {
            model: NewsCategory,
            as: 'category',
            attributes: ['name', 'displayName', 'icon', 'color']
          }
        ],
        order: [['viewCount', 'DESC'], ['publishTime', 'DESC']],
        limit
      });

      return hotNews;
    } catch (error) {
      console.error('获取热门新闻失败:', error);
      throw error;
    }
  }

  async getTopNews(limit = 5) {
    try {
      const topNews = await News.findAll({
        where: { 
          isTop: true,
          status: 'published'
        },
        include: [
          {
            model: NewsCategory,
            as: 'category',
            attributes: ['name', 'displayName', 'icon', 'color']
          }
        ],
        order: [['publishTime', 'DESC']],
        limit
      });

      return topNews;
    } catch (error) {
      console.error('获取置顶新闻失败:', error);
      throw error;
    }
  }

  async getNewsCategories() {
    try {
      const categories = await NewsCategory.findAll({
        where: { isActive: true },
        order: [['sortOrder', 'ASC']]
      });
      return categories;
    } catch (error) {
      console.error('获取新闻分类失败:', error);
      throw error;
    }
  }

  async setUserNewsPreference(userId, categoryId, isSubscribed) {
    try {
      const [pref, created] = await UserNewsPreference.findOrCreate({
        where: { userId, categoryId },
        defaults: { isSubscribed }
      });

      if (!created) {
        await pref.update({ isSubscribed });
      }

      return pref;
    } catch (error) {
      console.error('设置新闻偏好失败:', error);
      throw error;
    }
  }

  async getUserNewsPreferences(userId) {
    try {
      const prefs = await UserNewsPreference.findAll({ where: { userId } });
      return prefs;
    } catch (error) {
      console.error('获取新闻偏好失败:', error);
      throw error;
    }
  }

  async getUserReadHistory(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const { count, rows } = await NewsReadHistory.findAndCountAll({
        where: { userId },
        include: [
          {
            model: News,
            as: 'news',
            include: [
              { model: NewsCategory, as: 'category', attributes: ['name', 'displayName'] }
            ]
          }
        ],
        order: [['readAt', 'DESC']],
        limit,
        offset
      });

      return { history: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
    } catch (error) {
      console.error('获取阅读历史失败:', error);
      throw error;
    }
  }

  async searchNews(keyword, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;

      const whereClause = {
        status: 'published',
        [Sequelize.Op.or]: [
          { title: { [Sequelize.Op.like]: `%${keyword}%` } },
          { content: { [Sequelize.Op.like]: `%${keyword}%` } },
          { tags: { [Sequelize.Op.like]: `%${keyword}%` } }
        ]
      };

      const { count, rows } = await News.findAndCountAll({
        where: whereClause,
        include: [
          { model: NewsCategory, as: 'category', attributes: ['name', 'displayName'] }
        ],
        order: [['publishTime', 'DESC']],
        limit,
        offset
      });

      return { news: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
    } catch (error) {
      console.error('搜索新闻失败:', error);
      throw error;
    }
  }

  async cleanupExpiredNews(days = 30) {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const deleted = await News.destroy({ where: { publishTime: { [Sequelize.Op.lt]: cutoff } } });
      return deleted;
    } catch (error) {
      console.error('清理过期新闻失败:', error);
      throw error;
    }
  }

  async getNewsStats() {
    try {
      const [totalNews, totalCategories, hotNewsCount, topNewsCount] = await Promise.all([
        News.count({ where: { status: 'published' } }),
        NewsCategory.count({ where: { isActive: true } }),
        News.count({ where: { isHot: true, status: 'published' } }),
        News.count({ where: { isTop: true, status: 'published' } })
      ]);

      const categoryStats = await News.findAll({
        where: { status: 'published' },
        include: [
          {
            model: NewsCategory,
            as: 'category',
            attributes: ['name', 'displayName']
          }
        ],
        attributes: [
          'categoryId',
          [Sequelize.fn('COUNT', Sequelize.col('News.id')), 'count']
        ],
        group: ['categoryId'],
        raw: true
      });

      return {
        totalNews,
        totalCategories,
        hotNewsCount,
        topNewsCount,
        categoryStats
      };
    } catch (error) {
      console.error('获取新闻统计失败:', error);
      throw error;
    }
  }

  async getPersonalizedBrief(userId, limit = 8) {
    try {
      const [keywordsRows, favoritesRows, recentReads] = await Promise.all([
        KeywordSubscription.findAll({ where: { userId } }),
        FavoriteNews.findAll({ where: { userId }, include: [{ model: News, as: 'news' }] }),
        NewsReadHistory.findAll({ where: { userId }, order: [['readAt', 'DESC']], limit: 50, include: [{ model: News, as: 'news' }] })
      ]);

      const keywords = keywordsRows.map(r => r.keyword.toLowerCase());
      const favoriteIds = new Set(favoritesRows.map(r => r.newsId));
      const readIds = new Set(recentReads.map(r => r.newsId));

      const where = { status: 'published' };
      if (keywords.length > 0) {
        where[Sequelize.Op.or] = keywords.map(kw => ({
          [Sequelize.Op.or]: [
            { title: { [Sequelize.Op.like]: `%${kw}%` } },
            { content: { [Sequelize.Op.like]: `%${kw}%` } },
            { tags: { [Sequelize.Op.like]: `%${kw}%` } }
          ]
        }));
      }

      const candidates = await News.findAll({ where, order: [['publishTime', 'DESC']], limit: 50 });
      const picked = [];
      for (const n of candidates) {
        if (readIds.has(n.id)) continue; // 未读优先
        picked.push(n);
        if (picked.length >= limit) break;
      }
      if (picked.length < limit) {
        for (const n of candidates) {
          if (!picked.includes(n)) picked.push(n);
          if (picked.length >= limit) break;
        }
      }

      let message = '🗞️ 个性化简报\n\n';
      picked.forEach((item, index) => {
        const url = item.sourceUrl || '#';
        const title = (item.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const star = favoriteIds.has(item.id) ? '⭐ ' : '';
        message += `${index + 1}. ${star}<a href="${url}">${title}</a>\n`;
        message += `   来源：${item.source || '-'}  时间：${new Date(item.publishTime).toLocaleString('zh-CN')}\n\n`;
      });
      if (picked.length === 0) message += '暂无合适内容，建议添加一些关键词订阅。';
      return message;
    } catch (e) {
      console.error('生成个性化简报失败:', e);
      return '🗞️ 个性化简报生成失败，请稍后重试';
    }
  }
}

module.exports = new NewsService(); 