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
        categories: {
          'tech': { siteKey: 'tech', url: '/tech/', fullUrl: 'https://it.sohu.com/' },
          'finance': { siteKey: 'business', url: '/business/', fullUrl: 'https://business.sohu.com/' },
          'sports': { siteKey: 'sports', url: '/sports/', fullUrl: 'https://sports.sohu.com/' },
          'ent': { siteKey: 'yule', url: '/yule/', fullUrl: 'https://yule.sohu.com/' },
          'world': { siteKey: 'world', url: '/world/', fullUrl: 'https://news.sohu.com/guoji.shtml' },
          'society': { siteKey: 'society', url: '/society/', fullUrl: 'https://society.sohu.com/' },
          'health': { siteKey: 'health', url: '/health/', fullUrl: 'https://health.sohu.com/' }
        }
      }
    };

    // 系统统一分类（与 NewsCategory.name 一致）
    this.defaultCategories = [
      { name: 'web3', displayName: 'Web3', icon: '🕸️', color: '#8A2BE2', sortOrder: 0 },
      { name: 'tech', displayName: '科技', icon: '🚀', color: '#FF6B6B', sortOrder: 1 },
      { name: 'finance', displayName: '财经', icon: '💰', color: '#4ECDC4', sortOrder: 2 },
      { name: 'sports', displayName: '体育', icon: '⚽', color: '#45B7D1', sortOrder: 3 },
      { name: 'ent', displayName: '娱乐', icon: '🎬', color: '#96CEB4', sortOrder: 4 },
      { name: 'world', displayName: '国际', icon: '🌍', color: '#FFEAA7', sortOrder: 5 },
      { name: 'society', displayName: '社会', icon: '🏠', color: '#DDA0DD', sortOrder: 6 },
      { name: 'health', displayName: '健康', icon: '💊', color: '#98D8C8', sortOrder: 7 }
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
          '.news-ct a',
          '.news-item a',
          '.feed-card-item a',
          '.blk12 a',
          'a[title]'
        ];
        items = this.extractLinks($, candidates, source.baseUrl);
      } else if (sourceKey === '163') {
        const candidates = [
          'a[href*="163.com"], a[href*=".126.net"]',
          '.data_row a, .newsList a, .ndi_main a, .area_left a',
          'a[title]'
        ];
        items = this.extractLinks($, candidates, source.baseUrl);
      } else if (sourceKey === 'sohu') {
        const candidates = [
          'a[href*="sohu.com"]',
          '.list16 a, .news-box a, .focus-news a, .c-card a',
          'a[title]'
        ];
        items = this.extractLinks($, candidates, source.baseUrl);
      }

      const seen = new Set();
      const filtered = [];
      for (const it of items) {
        const title = this.cleanTitle(it.title);
        const href = this.absoluteUrl(source.baseUrl, it.href);
        if (!title || title.length < 6) continue;
        if (!href || href.indexOf('javascript:') === 0) continue;
        const hostOk = href.includes('sina') || href.includes('163.com') || href.includes('sohu.com');
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
        chainfeeds: { name: 'ChainFeeds', baseUrl: 'https://www.chainfeeds.xyz/', host: 'chainfeeds.xyz' },
        panews: { name: 'PANews', baseUrl: 'https://www.panewslab.com/zh', host: 'panewslab.com' },
        investing_cn: { name: 'Investing中文', baseUrl: 'https://cn.investing.com', host: 'cn.investing.com' }
      };

      const conf = sources[sourceKey];
      if (!conf) throw new Error(`不支持的 Web3 来源: ${sourceKey}`);

      const html = await this.requestPage(conf.baseUrl, conf.baseUrl);
      const $ = cheerio.load(html);

      const candidates = [
        'a[title]',
        'a[href^="http"]',
        'h1 a, h2 a, h3 a',
        '.article a, .news a, .item a, .card a'
      ];

      let items = this.extractLinks($, candidates, conf.baseUrl);

      const seen = new Set();
      const filtered = [];
      for (const it of items) {
        const title = this.cleanTitle(it.title);
        const href = this.absoluteUrl(conf.baseUrl, it.href);
        if (!title || title.length < 6) continue;
        if (!href || href.startsWith('javascript:')) continue;
        if (!(href.includes(conf.host))) continue; // 限定站点
        if (seen.has(href)) continue;
        seen.add(href);
        filtered.push({ title, url: href });
        if (filtered.length >= limit) break;
      }

      const now = new Date();
      const categoryId = await this.getCategoryIdByName('web3');
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
          toSave.push({
            title,
            content: title,
            summary: title,
            source: conf.name,
            sourceUrl: conf.baseUrl,
            imageUrl: null,
            categoryId,
            tags: 'web3',
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
            content: title,
            summary: title,
            source: conf.name,
            sourceUrl: url,
            imageUrl: null,
            categoryId,
            tags: 'web3',
            publishTime: new Date(now.getTime() - i * 60000),
            viewCount: Math.floor(Math.random() * 5000),
            isHot: Math.random() > 0.7,
            isTop: Math.random() > 0.9,
            status: 'published'
          });
        }
      }

      const saved = await this.saveNewsBatch(toSave);
      console.log(`✅ 成功爬取并保存 ${saved.length} 条 Web3 资讯: ${conf.name}${filtered.length === 0 ? '（模拟）' : ''}`);
      return saved;
    } catch (error) {
      console.error('❌ 爬取 Web3 资讯失败:', error);
      throw error;
    }
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
        if (item.sourceUrl) {
          const exists = await News.findOne({ where: { sourceUrl: item.sourceUrl } });
          if (exists) {
            continue;
          }
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