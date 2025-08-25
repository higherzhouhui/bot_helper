const { Reminder, User } = require('../models');
const { Op } = require('sequelize');

class QuotaService {
  constructor() {
    this.maxTotalReminders = 100;      // 单用户最大待提醒数量
    this.maxDailyReminders = 20;       // 单用户每天最大提醒数量
  }

  // 检查用户是否可以创建新提醒
  async checkUserQuota(userId) {
    try {
      // 检查总待提醒数量
      const totalReminders = await Reminder.count({
        where: {
          userId: userId,
          status: 'active'  // 只计算活跃的提醒
        }
      });

      if (totalReminders >= this.maxTotalReminders) {
        return {
          allowed: false,
          reason: 'total_limit_exceeded',
          message: `已达到最大提醒数量限制（${this.maxTotalReminders}个），请删除一些旧提醒后再创建新的`,
          current: totalReminders,
          limit: this.maxTotalReminders
        };
      }

      // 检查今天的提醒数量
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dailyReminders = await Reminder.count({
        where: {
          userId: userId,
          createdAt: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        }
      });

      if (dailyReminders >= this.maxDailyReminders) {
        return {
          allowed: false,
          reason: 'daily_limit_exceeded',
          message: `已达到今日提醒数量限制（${this.maxDailyReminders}个），请明天再创建新的提醒`,
          current: dailyReminders,
          limit: this.maxDailyReminders
        };
      }

      return {
        allowed: true,
        totalReminders: {
          current: totalReminders,
          limit: this.maxTotalReminders,
          remaining: this.maxTotalReminders - totalReminders
        },
        dailyReminders: {
          current: dailyReminders,
          limit: this.maxDailyReminders,
          remaining: this.maxDailyReminders - dailyReminders
        }
      };

    } catch (error) {
      console.error('检查用户配额时发生错误:', error);
      return {
        allowed: false,
        reason: 'error',
        message: '检查配额时发生错误，请稍后再试'
      };
    }
  }

  // 获取用户配额状态
  async getUserQuotaStatus(userId) {
    try {
      const totalReminders = await Reminder.count({
        where: {
          userId: userId,
          status: 'active'
        }
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dailyReminders = await Reminder.count({
        where: {
          userId: userId,
          createdAt: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        }
      });

      return {
        totalReminders: {
          current: totalReminders,
          limit: this.maxTotalReminders,
          remaining: this.maxTotalReminders - totalReminders,
          percentage: Math.round((totalReminders / this.maxTotalReminders) * 100)
        },
        dailyReminders: {
          current: dailyReminders,
          limit: this.maxDailyReminders,
          remaining: this.maxDailyReminders - dailyReminders,
          percentage: Math.round((dailyReminders / this.maxDailyReminders) * 100)
        },
        limits: {
          maxTotal: this.maxTotalReminders,
          maxDaily: this.maxDailyReminders
        }
      };

    } catch (error) {
      console.error('获取用户配额状态时发生错误:', error);
      throw error;
    }
  }

  // 强制清理用户超出限制的提醒（管理员功能）
  async enforceUserQuota(userId) {
    try {
      const quotaStatus = await this.getUserQuotaStatus(userId);
      
      if (quotaStatus.totalReminders.current <= this.maxTotalReminders) {
        return { cleaned: false, message: '用户未超出总提醒限制' };
      }

      // 获取用户所有活跃提醒，按创建时间排序
      const reminders = await Reminder.findAll({
        where: {
          userId: userId,
          status: 'active'
        },
        order: [['createdAt', 'ASC']] // 优先删除旧的提醒
      });

      // 计算需要删除的数量
      const toDelete = reminders.slice(0, quotaStatus.totalReminders.current - this.maxTotalReminders);
      
      // 批量删除
      const deleteIds = toDelete.map(r => r.id);
      await Reminder.update(
        { status: 'deleted', deletedAt: new Date() },
        { where: { id: deleteIds } }
      );

      return {
        cleaned: true,
        deletedCount: toDelete.length,
        message: `已清理${toDelete.length}个超出限制的提醒`
      };

    } catch (error) {
      console.error('强制清理用户配额时发生错误:', error);
      throw error;
    }
  }

  // 获取系统配额统计（管理员功能）
  async getSystemQuotaStats() {
    try {
      const stats = {
        totalUsers: 0,
        usersNearLimit: 0,
        usersAtLimit: 0,
        totalReminders: 0,
        activeReminders: 0,
        dailyCreated: 0
      };

      // 获取用户总数
      stats.totalUsers = await User.count();

      // 获取今天创建的提醒总数
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      stats.dailyCreated = await Reminder.count({
        where: {
          createdAt: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        }
      });

      // 获取活跃提醒总数
      stats.activeReminders = await Reminder.count({
        where: { status: 'active' }
      });

      // 获取总提醒数
      stats.totalReminders = await Reminder.count();

      // 获取接近限制和达到限制的用户数量
      const users = await User.findAll();
      for (const user of users) {
        const quotaStatus = await this.getUserQuotaStatus(user.id);
        
        if (quotaStatus.totalReminders.percentage >= 90) {
          stats.usersNearLimit++;
        }
        
        if (quotaStatus.totalReminders.percentage >= 100) {
          stats.usersAtLimit++;
        }
      }

      return stats;

    } catch (error) {
      console.error('获取系统配额统计时发生错误:', error);
      throw error;
    }
  }

  // 更新配额限制（管理员功能）
  updateQuotaLimits(maxTotal, maxDaily) {
    if (maxTotal && maxTotal > 0) {
      this.maxTotalReminders = maxTotal;
    }
    
    if (maxDaily && maxDaily > 0) {
      this.maxDailyReminders = maxDaily;
    }

    return {
      maxTotalReminders: this.maxTotalReminders,
      maxDailyReminders: this.maxDailyReminders
    };
  }

  // 获取当前配额配置
  getCurrentQuotaConfig() {
    return {
      maxTotalReminders: this.maxTotalReminders,
      maxDailyReminders: this.maxDailyReminders
    };
  }
}

module.exports = QuotaService; 