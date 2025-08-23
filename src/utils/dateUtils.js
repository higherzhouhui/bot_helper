// 日期处理工具函数模块

// 解析自然语言时间
function parseNaturalTime(timeStr) {
  const now = new Date();
  const timeStrLower = timeStr.toLowerCase();
  
  // 今晚、明天、后天等
  if (timeStrLower.includes('今晚')) {
    const hour = extractHour(timeStrLower);
    if (hour !== null) {
      const targetTime = new Date(now);
      targetTime.setHours(hour, 0, 0, 0);
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      return targetTime;
    }
  }
  
  if (timeStrLower.includes('明天')) {
    const targetTime = new Date(now);
    targetTime.setDate(targetTime.getDate() + 1);
    
    if (timeStrLower.includes('上午')) {
      const hour = extractHour(timeStrLower);
      if (hour !== null) {
        targetTime.setHours(hour, 0, 0, 0);
        return targetTime;
      }
    } else if (timeStrLower.includes('下午')) {
      const hour = extractHour(timeStrLower);
      if (hour !== null) {
        targetTime.setHours(hour + 12, 0, 0, 0);
        return targetTime;
      }
    } else if (timeStrLower.includes('晚上')) {
      const hour = extractHour(timeStrLower);
      if (hour !== null) {
        targetTime.setHours(hour, 0, 0, 0);
        return targetTime;
      }
    }
    
    // 默认明天上午9点
    targetTime.setHours(9, 0, 0, 0);
    return targetTime;
  }
  
  if (timeStrLower.includes('后天')) {
    const targetTime = new Date(now);
    targetTime.setDate(targetTime.getDate() + 2);
    targetTime.setHours(9, 0, 0, 0);
    return targetTime;
  }
  
  // X分钟后、X小时后
  if (timeStrLower.includes('分钟后')) {
    const minutes = extractNumber(timeStrLower);
    if (minutes !== null) {
      const targetTime = new Date(now);
      targetTime.setMinutes(targetTime.getMinutes() + minutes);
      return targetTime;
    }
  }
  
  if (timeStrLower.includes('小时后')) {
    const hours = extractNumber(timeStrLower);
    if (hours !== null) {
      const targetTime = new Date(now);
      targetTime.setHours(targetTime.getHours() + hours);
      return targetTime;
    }
  }
  
  // 具体时间 HH:MM
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1]);
    const minute = parseInt(timeMatch[2]);
    const targetTime = new Date(now);
    targetTime.setHours(hour, minute, 0, 0);
    
    // 如果时间已过，设置为明天
    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    return targetTime;
  }
  
  // 下周一、下周二等
  const weekDayMatch = timeStrLower.match(/下周([一二三四五六日])/);
  if (weekDayMatch) {
    const weekDayMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0 };
    const targetWeekDay = weekDayMap[weekDayMatch[1]];
    if (targetWeekDay !== undefined) {
      const targetTime = new Date(now);
      const currentWeekDay = targetTime.getDay();
      const daysToAdd = (targetWeekDay - currentWeekDay + 7) % 7;
      targetTime.setDate(targetTime.getDate() + daysToAdd);
      targetTime.setHours(9, 0, 0, 0);
      return targetTime;
    }
  }
  
  // 每月X号
  const monthDayMatch = timeStrLower.match(/每月(\d{1,2})号/);
  if (monthDayMatch) {
    const day = parseInt(monthDayMatch[1]);
    const targetTime = new Date(now);
    targetTime.setDate(day);
    targetTime.setHours(9, 0, 0, 0);
    
    // 如果本月该日期已过，设置为下个月
    if (targetTime <= now) {
      targetTime.setMonth(targetTime.getMonth() + 1);
    }
    
    return targetTime;
  }
  
  return null;
}

// 提取小时数
function extractHour(timeStr) {
  const hourMatch = timeStr.match(/(\d{1,2})点/);
  return hourMatch ? parseInt(hourMatch[1]) : null;
}

// 提取数字
function extractNumber(timeStr) {
  const numberMatch = timeStr.match(/(\d+)/);
  return numberMatch ? parseInt(numberMatch[1]) : null;
}

// 格式化时间显示
function formatTimeDisplay(date, timezone = 'Asia/Shanghai') {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const diffMinutes = Math.floor(diff / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 0) {
    return '已过期';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟后`;
  } else if (diffHours < 24) {
    return `${diffHours}小时后`;
  } else if (diffDays < 7) {
    return `${diffDays}天后`;
  } else {
    return date.toLocaleDateString('zh-CN', { timeZone: timezone });
  }
}

// 格式化日期时间
function formatDateTime(date, format = 'full') {
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Shanghai'
  };
  
  switch (format) {
    case 'date':
      delete options.hour;
      delete options.minute;
      delete options.second;
      break;
    case 'time':
      delete options.year;
      delete options.month;
      delete options.day;
      break;
    case 'short':
      delete options.second;
      break;
    case 'full':
    default:
      break;
  }
  
  return date.toLocaleString('zh-CN', options);
}

// 检查是否是工作日
function isWorkday(date) {
  const day = date.getDay();
  return day >= 1 && day <= 5; // 周一到周五
}

// 检查是否是周末
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // 周日或周六
}

// 获取下一个工作日
function getNextWorkday(date) {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  while (!isWorkday(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

// 获取下一个周末
function getNextWeekend(date) {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  while (!isWeekend(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

// 计算两个日期之间的天数
function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / oneDay);
}

// 检查日期是否过期
function isExpired(date) {
  return new Date() > date;
}

// 检查日期是否在今天
function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

// 检查日期是否在明天
function isTomorrow(date) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.getDate() === tomorrow.getDate() &&
         date.getMonth() === tomorrow.getMonth() &&
         date.getFullYear() === tomorrow.getFullYear();
}

// 获取相对时间描述
function getRelativeTimeDescription(date) {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const diffMinutes = Math.floor(diff / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 0) {
    return '已过期';
  } else if (diffMinutes < 1) {
    return '即将到期';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟后`;
  } else if (diffHours < 24) {
    return `${diffHours}小时后`;
  } else if (diffDays < 7) {
    return `${diffDays}天后`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}周后`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months}个月后`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years}年后`;
  }
}

// 验证时间格式
function validateTimeInput(timeInput) {
  const timePatterns = [
    /^(\d{1,2}):(\d{2})$/, // 20:30
    /^今晚(\d{1,2})点/, // 今晚20点
    /^明天上午(\d{1,2})点/, // 明天上午9点
    /^(\d{1,2})分钟后/, // 30分钟后
    /^(\d{1,2})小时后/, // 2小时后
    /^下周一/, // 下周一
    /^每月(\d{1,2})号/ // 每月1号
  ];

  return timePatterns.some(pattern => pattern.test(timeInput));
}

// 计算下一次重复提醒的时间
function calculateNextReminderTime(currentTime, repeatPattern) {
  if (!repeatPattern || repeatPattern === 'none') {
    return null;
  }

  const nextTime = new Date(currentTime);
  
  switch (repeatPattern) {
    case 'daily':
      // 每天：加1天，保持相同的时分秒
      nextTime.setDate(nextTime.getDate() + 1);
      break;
    
    case 'weekly':
      // 每周：加7天，保持相同的时分秒
      nextTime.setDate(nextTime.getDate() + 7);
      break;
    
    case 'monthly':
      // 每月：加1个月，保持相同的日期和时分秒
      nextTime.setMonth(nextTime.getMonth() + 1);
      break;
    
    case 'yearly':
      // 每年：加1年，保持相同的月日和时分秒
      nextTime.setFullYear(nextTime.getFullYear() + 1);
      break;
    
    case 'workdays':
      // 工作日：跳到下一个工作日，保持相同的时分秒
      nextTime.setDate(nextTime.getDate() + 1);
      while (!isWorkday(nextTime)) {
        nextTime.setDate(nextTime.getDate() + 1);
      }
      break;
    
    case 'weekends':
      // 周末：跳到下一个周末，保持相同的时分秒
      nextTime.setDate(nextTime.getDate() + 1);
      while (!isWeekend(nextTime)) {
        nextTime.setDate(nextTime.getDate() + 1);
      }
      break;
    
    default:
      return null;
  }
  
  return nextTime;
}

module.exports = {
  parseNaturalTime,
  formatTimeDisplay,
  formatDateTime,
  isWorkday,
  isWeekend,
  getNextWorkday,
  getNextWeekend,
  daysBetween,
  isExpired,
  isToday,
  isTomorrow,
  getRelativeTimeDescription,
  validateTimeInput,
  calculateNextReminderTime
}; 