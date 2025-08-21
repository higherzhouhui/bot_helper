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
    allowNull: false
  },
  reminderTime: {
    type: Sequelize.DATE,
    allowNull: false,
    field: 'reminder_time'
  },
  completedAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
    field: 'completed_at'
  },
  repeatCount: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    field: 'repeat_count'
  },
  actionType: {
    type: Sequelize.STRING,
    defaultValue: 'completed',
    validate: {
      isIn: [['completed', 'deleted', 'expired', 'snoozed']]
    }
  },
  categoryId: {
    type: Sequelize.INTEGER,
    allowNull: true,
    field: 'category_id'
  },
  priority: {
    type: Sequelize.STRING,
    defaultValue: 'normal',
    allowNull: true
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

// 定义提醒模板模型
const ReminderTemplate = sequelize.define('ReminderTemplate', {
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
  message: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  categoryId: {
    type: Sequelize.INTEGER,
    allowNull: true,
    field: 'category_id'
  },
  priority: {
    type: Sequelize.STRING,
    defaultValue: 'normal',
    allowNull: true
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
  isPublic: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    field: 'is_public'
  }
}, {
  tableName: 'reminder_templates',
  timestamps: true
});

// 定义新闻分类模型
const NewsCategory = sequelize.define('NewsCategory', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  displayName: {
    type: Sequelize.STRING,
    allowNull: false,
    field: 'display_name'
  },
  icon: {
    type: Sequelize.STRING,
    defaultValue: '📰',
    allowNull: true
  },
  color: {
    type: Sequelize.STRING,
    defaultValue: '#007AFF',
    allowNull: true
  },
  sortOrder: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    field: 'sort_order'
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'news_categories',
  timestamps: true
});

// 定义新闻模型
const News = sequelize.define('News', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  summary: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  source: {
    type: Sequelize.STRING,
    allowNull: false
  },
  sourceUrl: {
    type: Sequelize.STRING,
    allowNull: true,
    field: 'source_url'
  },
  imageUrl: {
    type: Sequelize.STRING,
    allowNull: true,
    field: 'image_url'
  },
  categoryId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    field: 'category_id'
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
  publishTime: {
    type: Sequelize.DATE,
    allowNull: false,
    field: 'publish_time'
  },
  viewCount: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    field: 'view_count'
  },
  isHot: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    field: 'is_hot'
  },
  isTop: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    field: 'is_top'
  },
  status: {
    type: Sequelize.STRING,
    defaultValue: 'published',
    validate: {
      isIn: [['draft', 'published', 'archived']]
    }
  }
}, {
  tableName: 'news',
  timestamps: true
});

// 定义用户新闻偏好模型
const UserNewsPreference = sequelize.define('UserNewsPreference', {
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
  categoryId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    field: 'category_id'
  },
  isSubscribed: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    field: 'is_subscribed'
  },
  notificationEnabled: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    field: 'notification_enabled'
  }
}, {
  tableName: 'user_news_preferences',
  timestamps: true
});

// 定义新闻阅读历史模型
const NewsReadHistory = sequelize.define('NewsReadHistory', {
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
  newsId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    field: 'news_id'
  },
  readAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
    field: 'read_at'
  },
  readDuration: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    field: 'read_duration'
  }
}, {
  tableName: 'news_read_history',
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
  testConnection
}; 