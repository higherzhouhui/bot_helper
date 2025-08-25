const { User } = require('../models');

class RateLimiter {
  constructor() {
    // 存储用户请求记录：{ userId: { count: 0, resetTime: timestamp } }
    this.userRequests = new Map();
    
    // 清理过期记录的定时器
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredRecords();
    }, 60000); // 每分钟清理一次
  }

  // 检查用户请求频率
  async checkRateLimit(userId) {
    const now = Date.now();
    const userRecord = this.userRequests.get(userId) || { count: 0, resetTime: now + 60000 };
    
    // 如果时间窗口已重置
    if (now >= userRecord.resetTime) {
      userRecord.count = 1;
      userRecord.resetTime = now + 60000;
      this.userRequests.set(userId, userRecord);
      return { allowed: true, remaining: 29, resetTime: userRecord.resetTime };
    }
    
    // 检查是否超过限制
    if (userRecord.count >= 30) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: userRecord.resetTime,
        message: '请求过于频繁，请稍后再试'
      };
    }
    
    // 增加计数
    userRecord.count++;
    this.userRequests.set(userId, userRecord);
    
    return { 
      allowed: true, 
      remaining: 30 - userRecord.count, 
      resetTime: userRecord.resetTime 
    };
  }

  // 清理过期的记录
  cleanupExpiredRecords() {
    const now = Date.now();
    for (const [userId, record] of this.userRequests.entries()) {
      if (now >= record.resetTime) {
        this.userRequests.delete(userId);
      }
    }
  }

  // 获取用户当前状态
  getUserStatus(userId) {
    const record = this.userRequests.get(userId);
    if (!record) {
      return { count: 0, remaining: 30, resetTime: Date.now() + 60000 };
    }
    
    const now = Date.now();
    if (now >= record.resetTime) {
      return { count: 0, remaining: 30, resetTime: now + 60000 };
    }
    
    return {
      count: record.count,
      remaining: 30 - record.count,
      resetTime: record.resetTime
    };
  }

  // 重置用户限制
  resetUserLimit(userId) {
    this.userRequests.delete(userId);
  }

  // 获取所有用户状态（用于监控）
  getAllUsersStatus() {
    const status = {};
    for (const [userId, record] of this.userRequests.entries()) {
      status[userId] = this.getUserStatus(userId);
    }
    return status;
  }

  // 清理资源
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.userRequests.clear();
  }
}

// 创建限流中间件函数
function createRateLimitMiddleware() {
  const rateLimiter = new RateLimiter();
  
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.body?.userId || req.query?.userId;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: '缺少用户ID' 
        });
      }
      
      const rateLimitResult = await rateLimiter.checkRateLimit(userId);
      
      if (!rateLimitResult.allowed) {
        return res.status(429).json({
          success: false,
          message: rateLimitResult.message,
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime
          }
        });
      }
      
      // 添加限流信息到响应头
      res.set({
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
      });
      
      next();
    } catch (error) {
      console.error('限流中间件错误:', error);
      next();
    }
  };
}

module.exports = {
  RateLimiter,
  createRateLimitMiddleware
}; 