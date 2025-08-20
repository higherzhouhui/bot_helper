const axios = require('axios');
const cheerio = require('cheerio');
const { WorkPost } = require('../models');

class WorkService {
  constructor() {
    this.sources = {
      juejin: {
        name: '掘金',
        baseUrl: 'https://juejin.cn',
        listUrl: 'https://juejin.cn/',
        selectors: [
          'a[href^="/post/"]',
          'a[href^="https://juejin.cn/post/"]',
          'a.title',
        ]
      },
      eleduck: {
        name: '电鸭',
        baseUrl: 'https://eleduck.com',
        listUrl: 'https://eleduck.com/',
        selectors: [
          'a[href^="/post/"]',
          'a[href*="/post/"]',
          'a[href^="https://eleduck.com/"]',
          '.post-title a',
          'a.title'
        ]
      }
    };

    this.httpHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Referer': 'https://www.google.com/'
    };
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

  async crawlOne(sourceKey, limit = 30) {
    const src = this.sources[sourceKey];
    if (!src) throw new Error('未知来源');

    const html = await axios.get(src.listUrl, { headers: this.httpHeaders, timeout: 12000 }).then(r => r.data);
    const $ = cheerio.load(html);

    const items = [];
    for (const sel of src.selectors) {
      $(sel).each((_, el) => {
        const a = $(el);
        const href = a.attr('href');
        const title = this.cleanTitle(a.attr('title') || a.text());
        if (!href || !title) return;
        const url = this.absoluteUrl(src.baseUrl, href);
        if (url.includes(src.baseUrl)) {
          items.push({ title, url });
        }
      });
      if (items.length >= limit) break;
    }

    // 去重
    const seen = new Set();
    const unique = [];
    for (const it of items) {
      if (seen.has(it.url)) continue;
      seen.add(it.url);
      unique.push(it);
      if (unique.length >= limit) break;
    }

    // 入库
    const saved = [];
    for (const it of unique) {
      try {
        const exist = await WorkPost.findOne({ where: { url: it.url } });
        if (exist) continue;
        const row = await WorkPost.create({
          title: it.title,
          url: it.url,
          source: sourceKey,
          summary: null,
          publishTime: null
        });
        saved.push(row);
      } catch (e) {
        // ignore single error
      }
    }

    return saved;
  }

  async crawlAll() {
    const results = {};
    for (const key of Object.keys(this.sources)) {
      try {
        results[key] = await this.crawlOne(key, 40);
      } catch (e) {
        results[key] = [];
      }
    }
    return results;
  }

  async getLatest(limit = 30) {
    const rows = await WorkPost.findAll({
      order: [['createdAt', 'DESC']],
      limit
    });
    return rows;
  }
}

module.exports = new WorkService(); 