const { User, Category, Reminder, ReminderHistory, ReminderTemplate } = require('../models');
const Sequelize = require('sequelize');

class ReminderService {
  // 创建或更新用户
  async createOrUpdateUser(userData) {
    try {
      const [user, created] = await User.findOrCreate({
        where: { id: userData.id },
        defaults: {
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
          timezone: 'Asia/Shanghai',
          language: 'zh-CN'
        }
      });

      if (!created) {
        // 更新现有用户信息
        await user.update({
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name
        });
      }

      // 为新用户创建默认分类
      if (created) {
        await this.createDefaultCategories(user.id);
      }

      return user;
    } catch (error) {
      console.error('创建/更新用户失败:', error);
      throw error;
    }
  }

  // 创建默认分类
  async createDefaultCategories(userId) {
    const defaultCategories = [
      { name: '工作', icon: '💼', color: '#FF6B6B' },
      { name: '生活', icon: '🏠', color: '#4ECDC4' },
      { name: '学习', icon: '📚', color: '#45B7D1' },
      { name: '健康', icon: '💪', color: '#96CEB4' },
      { name: '娱乐', icon: '🎮', color: '#FFEAA7' }
    ];

    for (const category of defaultCategories) {
      await Category.create({
        userId,
        name: category.name,
        icon: category.icon,
        color: category.color
      });
    }
  }

  // 创建分类
  async createCategory(userId, categoryData) {
    try {
      const category = await Category.create({
        userId,
        name: categoryData.name,
        icon: categoryData.icon || '📝',
        color: categoryData.color || '#007AFF'
      });

      return category;
    } catch (error) {
      console.error('创建分类失败:', error);
      throw error;
    }
  }

  // 获取用户分类
  async getUserCategories(userId) {
    try {
      const categories = await Category.findAll({
        where: { userId },
        order: [['name', 'ASC']]
      });

      return categories;
    } catch (error) {
      console.error('获取用户分类失败:', error);
      throw error;
    }
  }

  // 根据ID获取分类
  async getCategoryById(categoryId) {
    try {
      const category = await Category.findByPk(categoryId);
      return category;
    } catch (error) {
      console.error('获取分类失败:', error);
      throw error;
    }
  }

  // 创建提醒
  async createReminder(reminderData) {
    try {
      const reminder = await Reminder.create({
        userId: reminderData.userId,
        chatId: reminderData.chatId,
        message: reminderData.message,
        reminderTime: reminderData.reminderTime,
        status: 'pending',
        repeatCount: 0,
        categoryId: reminderData.categoryId || null,
        priority: reminderData.priority || 'normal',
        tags: reminderData.tags || [],
        notes: reminderData.notes || null,
        repeatPattern: reminderData.repeatPattern || 'none',
        repeatEndDate: reminderData.repeatEndDate || null
      });

      console.log(`提醒已保存到数据库: ID=${reminder.id}`);
      return reminder;
    } catch (error) {
      console.error('创建提醒失败:', error);
      throw error;
    }
  }

  // 获取用户的所有提醒
  async getUserReminders(userId, options = {}) {
    try {
      const whereClause = { userId };
      
      if (options.categoryId) {
        whereClause.categoryId = options.categoryId;
      }
      
      if (options.status) {
        whereClause.status = options.status;
      }
      
      if (options.priority) {
        whereClause.priority = options.priority;
      }

      const reminders = await Reminder.findAll({
        where: whereClause,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['name', 'icon', 'color']
          }
        ],
        order: [['reminderTime', 'ASC']]
      });

      return reminders;
    } catch (error) {
      console.error('获取用户提醒失败:', error);
      throw error;
    }
  }

  // 获取所有待处理的提醒
  async getPendingReminders() {
    try {
      const reminders = await Reminder.findAll({
        where: { status: 'pending' },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['name', 'icon', 'color']
          }
        ],
        order: [['reminderTime', 'ASC']]
      });

      return reminders;
    } catch (error) {
      console.error('获取待处理提醒失败:', error);
      throw error;
    }
  }

  // 根据ID获取提醒
  async getReminderById(reminderId, userId) {
    try {
      const reminder = await Reminder.findOne({
        where: { id: reminderId, userId },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'icon', 'color']
          }
        ]
      });
      return reminder;
    } catch (error) {
      console.error('获取提醒失败:', error);
      throw error;
    }
  }

  // 更新提醒状态
  async updateReminderStatus(reminderId, status, repeatCount = 0) {
    try {
      const reminder = await Reminder.findByPk(reminderId);
      if (!reminder) {
        throw new Error('提醒不存在');
      }

      await reminder.update({
        status,
        repeatCount
      });

      return reminder;
    } catch (error) {
      console.error('更新提醒状态失败:', error);
      throw error;
    }
  }

  // 更新提醒内容
  async updateReminder(reminderId, userId, updates) {
    try {
      const reminder = await Reminder.findOne({
        where: { id: reminderId, userId }
      });
      
      if (!reminder) {
        throw new Error('提醒不存在或无权限修改');
      }

      // 只允许更新特定字段
      const allowedUpdates = {};
      if (updates.message !== undefined) allowedUpdates.message = updates.message;
      if (updates.reminderTime !== undefined) allowedUpdates.reminderTime = updates.reminderTime;
      if (updates.categoryId !== undefined) allowedUpdates.categoryId = updates.categoryId;
      if (updates.priority !== undefined) allowedUpdates.priority = updates.priority;
      if (updates.tags !== undefined) allowedUpdates.tags = updates.tags;
      if (updates.notes !== undefined) allowedUpdates.notes = updates.notes;
      if (updates.repeatPattern !== undefined) allowedUpdates.repeatPattern = updates.repeatPattern;

      if (Object.keys(allowedUpdates).length === 0) {
        throw new Error('没有可更新的字段');
      }

      await reminder.update(allowedUpdates);
      return reminder;
    } catch (error) {
      console.error('更新提醒失败:', error);
      throw error;
    }
  }

  // 延后提醒
  async delayReminder(reminderId, newTime) {
    try {
      const reminder = await Reminder.findByPk(reminderId);
      if (!reminder) {
        throw new Error('提醒不存在');
      }

      await reminder.update({
        reminderTime: newTime,
        status: 'delayed',
        repeatCount: 0
      });

      return reminder;
    } catch (error) {
      console.error('延后提醒失败:', error);
      throw error;
    }
  }

  // 小睡提醒
  async snoozeReminder(reminderId, snoozeUntil) {
    try {
      const reminder = await Reminder.findByPk(reminderId);
      if (!reminder) {
        throw new Error('提醒不存在');
      }

      await reminder.update({
        status: 'snoozed',
        snoozeUntil
      });

      return reminder;
    } catch (error) {
      console.error('小睡提醒失败:', error);
      throw error;
    }
  }

  // 完成提醒
  async completeReminder(reminderId, actionType = 'completed') {
    try {
      const reminder = await Reminder.findByPk(reminderId);
      if (!reminder) {
        throw new Error('提醒不存在');
      }

      // 保存到历史记录
      await ReminderHistory.create({
        reminderId: reminder.id,
        userId: reminder.userId,
        chatId: reminder.chatId,
        message: reminder.message,
        reminderTime: reminder.reminderTime,
        repeatCount: reminder.repeatCount,
        actionType,
        categoryId: reminder.categoryId,
        priority: reminder.priority,
        tags: reminder.tags
      });

      // 删除原提醒
      await reminder.destroy();

      return true;
    } catch (error) {
      console.error('完成提醒失败:', error);
      throw error;
    }
  }

  // 删除提醒
  async deleteReminder(reminderId, userId) {
    try {
      const reminder = await Reminder.findOne({
        where: { id: reminderId, userId }
      });

      if (!reminder) {
        throw new Error('提醒不存在或无权限删除');
      }

      // 保存到历史记录
      await ReminderHistory.create({
        reminderId: reminder.id,
        userId: reminder.userId,
        chatId: reminder.chatId,
        message: reminder.message,
        reminderTime: reminder.reminderTime,
        repeatCount: reminder.repeatCount,
        actionType: 'deleted',
        categoryId: reminder.categoryId,
        priority: reminder.priority,
        tags: reminder.tags
      });

      // 删除原提醒
      await reminder.destroy();

      return true;
    } catch (error) {
      console.error('删除提醒失败:', error);
      throw error;
    }
  }

  // 获取提醒历史
  async getReminderHistory(userId, limit = 20) {
    try {
      const history = await ReminderHistory.findAll({
        where: { userId },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['name', 'icon', 'color']
          }
        ],
        order: [['completedAt', 'DESC']],
        limit
      });

      return history;
    } catch (error) {
      console.error('获取提醒历史失败:', error);
      throw error;
    }
  }

  // 创建提醒模板
  async createTemplate(userId, templateData) {
    try {
      const template = await ReminderTemplate.create({
        userId,
        name: templateData.name,
        message: templateData.message,
        categoryId: templateData.categoryId || null,
        priority: templateData.priority || 'normal',
        tags: templateData.tags || [],
        isPublic: templateData.isPublic || false
      });

      return template;
    } catch (error) {
      console.error('创建模板失败:', error);
      throw error;
    }
  }

  // 获取用户模板
  async getUserTemplates(userId) {
    try {
      const templates = await ReminderTemplate.findAll({
        where: { userId },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['name', 'icon', 'color']
          }
        ],
        order: [['name', 'ASC']]
      });

      return templates;
    } catch (error) {
      console.error('获取用户模板失败:', error);
      throw error;
    }
  }

  // 获取公共模板
  async getPublicTemplates() {
    try {
      const templates = await ReminderTemplate.findAll({
        where: { isPublic: true },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['name', 'icon', 'color']
          }
        ],
        order: [['name', 'ASC']]
      });

      return templates;
    } catch (error) {
      console.error('获取公共模板失败:', error);
      throw error;
    }
  }

  // 清理过期的提醒
  async cleanupExpiredReminders() {
    try {
      const now = new Date();
      const expiredReminders = await Reminder.findAll({
        where: {
          reminderTime: {
            [Sequelize.Op.lt]: now
          },
          status: 'pending'
        }
      });

      for (const reminder of expiredReminders) {
        await this.completeReminder(reminder.id, 'expired');
      }

      console.log(`清理了 ${expiredReminders.length} 个过期提醒`);
      return expiredReminders.length;
    } catch (error) {
      console.error('清理过期提醒失败:', error);
      throw error;
    }
  }

  // 获取统计信息
  async getStats(userId) {
    try {
      const [totalReminders, completedReminders, pendingReminders, categories] = await Promise.all([
        Reminder.count({ where: { userId } }),
        ReminderHistory.count({ where: { userId, actionType: 'completed' } }),
        Reminder.count({ where: { userId, status: 'pending' } }),
        Category.count({ where: { userId } })
      ]);

      // 按分类统计
      const categoryStats = await Reminder.findAll({
        where: { userId, status: 'pending' },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['name', 'icon', 'color']
          }
        ],
        attributes: [
          'categoryId',
          [Sequelize.fn('COUNT', Sequelize.col('Reminder.id')), 'count']
        ],
        group: ['categoryId'],
        raw: true
      });

      // 按优先级统计
      const priorityStats = await Reminder.findAll({
        where: { userId, status: 'pending' },
        attributes: [
          'priority',
          [Sequelize.fn('COUNT', Sequelize.col('Reminder.id')), 'count']
        ],
        group: ['priority'],
        raw: true
      });

      return {
        total: totalReminders,
        completed: completedReminders,
        pending: pendingReminders,
        categories: categories,
        categoryStats,
        priorityStats
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      throw error;
    }
  }

  // 搜索提醒
  async searchReminders(userId, query) {
    try {
      const reminders = await Reminder.findAll({
        where: {
          userId,
          [Sequelize.Op.or]: [
            { message: { [Sequelize.Op.like]: `%${query}%` } },
            { notes: { [Sequelize.Op.like]: `%${query}%` } }
          ]
        },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['name', 'icon', 'color']
          }
        ],
        order: [['reminderTime', 'ASC']]
      });

      return reminders;
    } catch (error) {
      console.error('搜索提醒失败:', error);
      throw error;
    }
  }

  // 批量操作
  async batchUpdateReminders(userId, reminderIds, updates) {
    try {
      const result = await Reminder.update(updates, {
        where: {
          id: { [Sequelize.Op.in]: reminderIds },
          userId
        }
      });

      return result[0]; // 返回更新的行数
    } catch (error) {
      console.error('批量更新提醒失败:', error);
      throw error;
    }
  }
}

module.exports = new ReminderService(); 