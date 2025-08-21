const { AnalyticsEvent, Sequelize } = require('../models');

class AnalyticsService {
  async track(userId, eventType, payload = {}) {
    try {
      await AnalyticsEvent.create({ userId, eventType, payload, occurredAt: new Date() });
    } catch (e) {
      console.warn('埋点失败:', e.message || e);
    }
  }

  async count(eventType, sinceHours = 24) {
    const cutoff = new Date(Date.now() - sinceHours * 3600 * 1000);
    return AnalyticsEvent.count({ where: { eventType, occurredAt: { [Sequelize.Op.gte]: cutoff } } });
  }

  assignBucket(userId, experimentKey, buckets = ['A', 'B']) {
    const hash = this.simpleHash(`${experimentKey}:${userId}`);
    const idx = hash % buckets.length;
    return buckets[idx];
  }

  simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }
}

module.exports = new AnalyticsService(); 