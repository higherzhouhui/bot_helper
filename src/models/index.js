const { Sequelize } = require('sequelize');
const { config } = require('../config');

// 创建 Sequelize 实例
const sequelize = new Sequelize({
  dialect: config.DB_DIALECT,
  storage: config.DB_STORAGE,
  logging: config.DB_LOGGING,
  define: {
    timestamps: true,
    underscored: true
  }
});

// 定义用户模型
const User = sequelize.define('User', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    allowNull: false
  },
  username: {
    type: Sequelize.STRING,
    allowNull: true
  },
  firstName: {
    type: Sequelize.STRING,
    allowNull: true,
    field: 'first_name'
  },
  lastName: {
    type: Sequelize.STRING,
    allowNull: true,
    field: 'last_name'
  },
  timezone: {
    type: Sequelize.STRING,
    defaultValue: 'Asia/Shanghai',
    allowNull: true
  },
  language: {
    type: Sequelize.STRING,
    defaultValue: 'zh-CN',
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

// 定义提醒分类模型
const Category = sequelize.define('Category', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'user_id'
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  color: {
    type: Sequelize.STRING,
    defaultValue: '#007AFF',
    allowNull: true
  },
  icon: {
    type: Sequelize.STRING,
    defaultValue: '📝',
    allowNull: true
  }
}, {
  tableName: 'categories',
  timestamps: true
});

// 定义提醒模型
const Reminder = sequelize.define('Reminder', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'user_id'
  },
  chatId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'chat_id'
  },
  message: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  reminderTime: {
    type: Sequelize.DATE,
    allowNull: false,
    field: 'reminder_time'
  },
  status: {
    type: Sequelize.STRING,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'completed', 'delayed', 'snoozed']]
    }
  },
  repeatCount: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    field: 'repeat_count'
  },
  categoryId: {
    type: Sequelize.INTEGER,
    allowNull: true,
    field: 'category_id'
  },
  priority: {
    type: Sequelize.STRING,
    defaultValue: 'normal',
    validate: {
      isIn: [['low', 'normal', 'high', 'urgent']]
    }
  },
  tags: {
    type: Sequelize.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('tags');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('tags', JSON.stringify(value));
    }
  },
  notes: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  snoozeUntil: {
    type: Sequelize.DATE,
    allowNull: true,
    field: 'snooze_until'
  },
  repeatPattern: {
    type: Sequelize.STRING,
    allowNull: true,
    field: 'repeat_pattern',
    validate: {
      isIn: [['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom']]
    }
  },
  repeatEndDate: {
    type: Sequelize.DATE,
    allowNull: true,
    field: 'repeat_end_date'
  }
}, {
  tableName: 'reminders',
  timestamps: true
});

// 定义提醒历史模型
const ReminderHistory = sequelize.define('ReminderHistory', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reminderId: {
    type: Sequelize.INTEGER,
    allowNull: true,
    field: 'reminder_id'
  },
  userId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'user_id'
  },
  chatId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'chat_id'
  },
  message: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  reminderTime: {
    type: Sequelize.DATE,
    allowNull: true,
    field: 'reminder_time'
  },
  repeatCount: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    field: 'repeat_count'
  },
  actionType: {
    type: Sequelize.STRING,
    defaultValue: 'notified',
    field: 'action_type'
  },
  categoryId: {
    type: Sequelize.INTEGER,
    allowNull: true,
    field: 'category_id'
  },
  priority: {
    type: Sequelize.STRING,
    defaultValue: 'normal'
  },
  tags: {
    type: Sequelize.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('tags');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('tags', JSON.stringify(value));
    }
  }
}, {
  tableName: 'reminder_history',
  timestamps: true
});

// 模板
const ReminderTemplate = sequelize.define('ReminderTemplate', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: Sequelize.BIGINT, allowNull: true, field: 'user_id' },
  name: { type: Sequelize.STRING, allowNull: false },
  message: { type: Sequelize.TEXT, allowNull: false },
  defaultTime: { type: Sequelize.STRING, allowNull: true, field: 'default_time' },
  categoryId: { type: Sequelize.INTEGER, allowNull: true, field: 'category_id' }
}, {
  tableName: 'reminder_templates',
  timestamps: true
});

// 新闻分类
const NewsCategory = sequelize.define('NewsCategory', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: Sequelize.STRING, allowNull: false, unique: true },
  displayName: { type: Sequelize.STRING, allowNull: true },
  icon: { type: Sequelize.STRING, allowNull: true },
  color: { type: Sequelize.STRING, allowNull: true },
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
  sortOrder: { type: Sequelize.INTEGER, defaultValue: 0, field: 'sort_order' }
}, {
  tableName: 'news_categories',
  timestamps: true
});

// 新闻
const News = sequelize.define('News', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: Sequelize.STRING, allowNull: false },
  content: { type: Sequelize.TEXT, allowNull: true },
  summary: { type: Sequelize.TEXT, allowNull: true },
  source: { type: Sequelize.STRING, allowNull: true },
  sourceUrl: { type: Sequelize.STRING, allowNull: true, unique: true, field: 'source_url' },
  imageUrl: { type: Sequelize.STRING, allowNull: true, field: 'image_url' },
  categoryId: { type: Sequelize.INTEGER, allowNull: true, field: 'category_id' },
  tags: { type: Sequelize.STRING, allowNull: true },
  publishTime: { type: Sequelize.DATE, allowNull: true, field: 'publish_time' },
  viewCount: { type: Sequelize.INTEGER, defaultValue: 0, field: 'view_count' },
  isHot: { type: Sequelize.BOOLEAN, defaultValue: false, field: 'is_hot' },
  isTop: { type: Sequelize.BOOLEAN, defaultValue: false, field: 'is_top' },
  status: { type: Sequelize.STRING, defaultValue: 'published' }
}, {
  tableName: 'news',
  timestamps: true
});

// 用户新闻偏好
const UserNewsPreference = sequelize.define('UserNewsPreference', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: Sequelize.BIGINT, allowNull: false, field: 'user_id' },
  categoryId: { type: Sequelize.INTEGER, allowNull: false, field: 'category_id' },
  isSubscribed: { type: Sequelize.BOOLEAN, defaultValue: true, field: 'is_subscribed' }
}, {
  tableName: 'user_news_preferences',
  timestamps: true
});

// 新闻阅读历史
const NewsReadHistory = sequelize.define('NewsReadHistory', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: Sequelize.BIGINT, allowNull: false, field: 'user_id' },
  newsId: { type: Sequelize.INTEGER, allowNull: false, field: 'news_id' },
  readAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, field: 'read_at' },
  readDuration: { type: Sequelize.INTEGER, defaultValue: 0, field: 'read_duration' }
}, {
  tableName: 'news_read_history',
  timestamps: true
});

// 新增：用户设置（简报/安静时段/键盘偏好）
const UserSetting = sequelize.define('UserSetting', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: Sequelize.BIGINT, allowNull: false, unique: true, field: 'user_id' },
  briefMorningTime: { type: Sequelize.STRING, allowNull: true, field: 'brief_morning_time' }, // HH:mm
  briefEveningTime: { type: Sequelize.STRING, allowNull: true, field: 'brief_evening_time' }, // HH:mm
  quietStart: { type: Sequelize.STRING, allowNull: true, field: 'quiet_start' }, // HH:mm
  quietEnd: { type: Sequelize.STRING, allowNull: true, field: 'quiet_end' },   // HH:mm
  replyKeyboardEnabled: { type: Sequelize.BOOLEAN, defaultValue: false, field: 'reply_keyboard_enabled' }
}, {
  tableName: 'user_settings',
  timestamps: true
});

// 新增：关键词订阅
const KeywordSubscription = sequelize.define('KeywordSubscription', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: Sequelize.BIGINT, allowNull: false, field: 'user_id' },
  keyword: { type: Sequelize.STRING, allowNull: false }
}, {
  tableName: 'keyword_subscriptions',
  timestamps: true
});

// 新增：新闻收藏
const FavoriteNews = sequelize.define('FavoriteNews', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: Sequelize.BIGINT, allowNull: false, field: 'user_id' },
  newsId: { type: Sequelize.INTEGER, allowNull: false, field: 'news_id' }
}, {
  tableName: 'favorite_news',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['user_id', 'news_id'] }
  ]
});

// 新增：埋点事件（用于 A/B 与行为分析）
const AnalyticsEvent = sequelize.define('AnalyticsEvent', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: Sequelize.BIGINT, allowNull: true, field: 'user_id' },
  eventType: { type: Sequelize.STRING, allowNull: false, field: 'event_type' },
  payload: { type: Sequelize.TEXT, allowNull: true, get() { const v = this.getDataValue('payload'); return v ? JSON.parse(v) : null; }, set(value) { this.setDataValue('payload', JSON.stringify(value)); } },
  occurredAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, field: 'occurred_at' }
}, {
  tableName: 'analytics_events',
  timestamps: true
});

// 关联关系
User.hasMany(Category, { foreignKey: 'userId', as: 'categories' });
Category.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Reminder, { foreignKey: 'userId', as: 'reminders' });
Reminder.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(ReminderHistory, { foreignKey: 'userId', as: 'reminderHistory' });
ReminderHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(ReminderTemplate, { foreignKey: 'userId', as: 'templates' });
ReminderTemplate.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Category.hasMany(Reminder, { foreignKey: 'categoryId', as: 'reminders' });
Reminder.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Category.hasMany(ReminderTemplate, { foreignKey: 'categoryId', as: 'templates' });
ReminderTemplate.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// 新闻相关关联
NewsCategory.hasMany(News, { foreignKey: 'categoryId', as: 'news' });
News.belongsTo(NewsCategory, { foreignKey: 'categoryId', as: 'category' });

User.hasMany(UserNewsPreference, { foreignKey: 'userId', as: 'newsPreferences' });
UserNewsPreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });

NewsCategory.hasMany(UserNewsPreference, { foreignKey: 'categoryId', as: 'preferences' });
UserNewsPreference.belongsTo(NewsCategory, { foreignKey: 'categoryId', as: 'category' });

User.hasMany(NewsReadHistory, { foreignKey: 'userId', as: 'newsReadHistory' });
NewsReadHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

News.hasMany(NewsReadHistory, { foreignKey: 'newsId', as: 'readHistory' });
NewsReadHistory.belongsTo(News, { foreignKey: 'newsId', as: 'news' });

// 修复 ReminderHistory 与 Category 的关联
Category.hasMany(ReminderHistory, { foreignKey: 'categoryId', as: 'reminderHistory' });
ReminderHistory.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// 新增关联
User.hasOne(UserSetting, { foreignKey: 'userId', as: 'setting' });
UserSetting.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(KeywordSubscription, { foreignKey: 'userId', as: 'keywordSubscriptions' });
KeywordSubscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(FavoriteNews, { foreignKey: 'userId', as: 'favorites' });
FavoriteNews.belongsTo(User, { foreignKey: 'userId', as: 'user' });

News.hasMany(FavoriteNews, { foreignKey: 'newsId', as: 'favoritedBy' });
FavoriteNews.belongsTo(News, { foreignKey: 'newsId', as: 'news' });

User.hasMany(AnalyticsEvent, { foreignKey: 'userId', as: 'analyticsEvents' });
AnalyticsEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// 测试数据库连接
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
}

module.exports = {
  sequelize,
  User,
  Category,
  Reminder,
  ReminderHistory,
  ReminderTemplate,
  NewsCategory,
  News,
  UserNewsPreference,
  NewsReadHistory,
  UserSetting,
  KeywordSubscription,
  FavoriteNews,
  AnalyticsEvent,
  testConnection
}; 