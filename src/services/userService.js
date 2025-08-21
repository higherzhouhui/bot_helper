const { UserSetting, KeywordSubscription, FavoriteNews, News } = require('../models');
const Sequelize = require('sequelize');

class UserService {
  async getOrCreateSetting(userId) {
    const [setting] = await UserSetting.findOrCreate({ where: { userId }, defaults: { userId } });
    return setting;
  }

  async updateSetting(userId, fields) {
    const setting = await this.getOrCreateSetting(userId);
    await setting.update(fields);
    return setting;
  }

  async setBriefTimes(userId, morningTime = '08:30', eveningTime = '20:30') {
    return this.updateSetting(userId, { briefMorningTime: morningTime, briefEveningTime: eveningTime });
  }

  async setQuietHours(userId, quietStart = '22:00', quietEnd = '08:00') {
    return this.updateSetting(userId, { quietStart, quietEnd });
  }

  async clearQuietHours(userId) {
    return this.updateSetting(userId, { quietStart: null, quietEnd: null });
  }

  async toggleReplyKeyboard(userId, enabled) {
    return this.updateSetting(userId, { replyKeyboardEnabled: !!enabled });
  }

  async getUsersToBriefAt(timeHHmm) {
    const users = await UserSetting.findAll({
      where: {
        [Sequelize.Op.or]: [
          { briefMorningTime: timeHHmm },
          { briefEveningTime: timeHHmm }
        ]
      }
    });
    return users.map(u => u.userId);
  }

  // 关键词订阅
  async addKeyword(userId, keyword) {
    keyword = (keyword || '').trim();
    if (!keyword) return null;
    const [row] = await KeywordSubscription.findOrCreate({ where: { userId, keyword }, defaults: { userId, keyword } });
    return row;
  }

  async removeKeyword(userId, keyword) {
    return KeywordSubscription.destroy({ where: { userId, keyword } });
  }

  async listKeywords(userId) {
    const rows = await KeywordSubscription.findAll({ where: { userId }, order: [['created_at', 'DESC']] });
    return rows.map(r => r.keyword);
  }

  // 收藏夹
  async addFavorite(userId, newsId) {
    const [fav] = await FavoriteNews.findOrCreate({ where: { userId, newsId }, defaults: { userId, newsId } });
    return fav;
  }

  async removeFavorite(userId, newsId) {
    return FavoriteNews.destroy({ where: { userId, newsId } });
  }

  async listFavorites(userId, limit = 10, offset = 0) {
    const rows = await FavoriteNews.findAll({
      where: { userId },
      include: [{ model: News, as: 'news' }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    return rows;
  }

  async isInQuietHours(userId, now = new Date()) {
    const setting = await UserSetting.findOne({ where: { userId } });
    if (!setting || !setting.quietStart || !setting.quietEnd) return false;
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    const hh = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const cur = `${hh}:${mm}`;
    const start = setting.quietStart;
    const end = setting.quietEnd;
    if (start === end) return true;
    if (start < end) {
      return cur >= start && cur < end;
    } else {
      // 跨夜
      return cur >= start || cur < end;
    }
  }
}

module.exports = new UserService(); 