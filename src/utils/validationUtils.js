// 验证工具函数模块

// 验证用户ID
function validateUserId(userId) {
  if (!userId || typeof userId !== 'number' || userId <= 0) {
    return { isValid: false, error: '用户ID无效' };
  }
  return { isValid: true };
}

// 验证聊天ID
function validateChatId(chatId) {
  if (!chatId || typeof chatId !== 'number') {
    return { isValid: false, error: '聊天ID无效' };
  }
  return { isValid: true };
}

// 验证提醒内容
function validateReminderMessage(message) {
  if (!message || typeof message !== 'string') {
    return { isValid: false, error: '提醒内容不能为空' };
  }
  
  const trimmedMessage = message.trim();
  if (trimmedMessage.length === 0) {
    return { isValid: false, error: '提醒内容不能为空' };
  }
  
  if (trimmedMessage.length > 500) {
    return { isValid: false, error: '提醒内容不能超过500个字符' };
  }
  
  return { isValid: true, cleanedMessage: trimmedMessage };
}

// 验证提醒时间
function validateReminderTime(time) {
  if (!time) {
    return { isValid: false, error: '提醒时间不能为空' };
  }
  
  if (!(time instanceof Date) || isNaN(time.getTime())) {
    return { isValid: false, error: '提醒时间格式无效' };
  }
  
  const now = new Date();
  if (time <= now) {
    return { isValid: false, error: '提醒时间必须是未来时间' };
  }
  
  // 检查时间是否太远（比如超过1年）
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  if (time > oneYearFromNow) {
    return { isValid: false, error: '提醒时间不能超过1年' };
  }
  
  return { isValid: true };
}

// 验证优先级
function validatePriority(priority) {
  const validPriorities = ['urgent', 'high', 'normal', 'low'];
  
  if (!priority || typeof priority !== 'string') {
    return { isValid: false, error: '优先级不能为空' };
  }
  
  if (!validPriorities.includes(priority)) {
    return { isValid: false, error: '优先级必须是：urgent、high、normal、low' };
  }
  
  return { isValid: true };
}

// 验证分类ID
function validateCategoryId(categoryId) {
  if (categoryId === null || categoryId === undefined) {
    return { isValid: true }; // 分类是可选的
  }
  
  if (typeof categoryId !== 'number' || categoryId <= 0) {
    return { isValid: false, error: '分类ID无效' };
  }
  
  return { isValid: true };
}

// 验证标签
function validateTags(tags) {
  if (!tags) {
    return { isValid: true, cleanedTags: [] }; // 标签是可选的
  }
  
  if (!Array.isArray(tags)) {
    return { isValid: false, error: '标签必须是数组格式' };
  }
  
  const cleanedTags = [];
  for (const tag of tags) {
    if (typeof tag === 'string' && tag.trim().length > 0) {
      const cleanedTag = tag.trim();
      if (cleanedTag.length <= 20) {
        cleanedTags.push(cleanedTag);
      }
    }
  }
  
  if (cleanedTags.length > 10) {
    return { isValid: false, error: '标签数量不能超过10个' };
  }
  
  return { isValid: true, cleanedTags };
}

// 验证备注
function validateNotes(notes) {
  if (!notes) {
    return { isValid: true, cleanedNotes: '' }; // 备注是可选的
  }
  
  if (typeof notes !== 'string') {
    return { isValid: false, error: '备注必须是字符串格式' };
  }
  
  const cleanedNotes = notes.trim();
  if (cleanedNotes.length > 200) {
    return { isValid: false, error: '备注不能超过200个字符' };
  }
  
  return { isValid: true, cleanedNotes };
}

// 验证重复模式
function validateRepeatPattern(repeatPattern) {
  if (!repeatPattern) {
    return { isValid: true }; // 重复模式是可选的
  }
  
  const validPatterns = ['daily', 'weekly', 'monthly', 'yearly', 'workdays', 'weekends'];
  
  if (!validPatterns.includes(repeatPattern)) {
    return { isValid: false, error: '重复模式无效' };
  }
  
  return { isValid: true };
}

// 验证搜索关键词
function validateSearchKeyword(keyword) {
  if (!keyword || typeof keyword !== 'string') {
    return { isValid: false, error: '搜索关键词不能为空' };
  }
  
  const trimmedKeyword = keyword.trim();
  if (trimmedKeyword.length === 0) {
    return { isValid: false, error: '搜索关键词不能为空' };
  }
  
  if (trimmedKeyword.length > 100) {
    return { isValid: false, error: '搜索关键词不能超过100个字符' };
  }
  
  return { isValid: true, cleanedKeyword: trimmedKeyword };
}

// 验证分页参数
function validatePaginationParams(page, limit) {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  
  if (pageNum < 1) {
    return { isValid: false, error: '页码必须大于0' };
  }
  
  if (limitNum < 1 || limitNum > 100) {
    return { isValid: false, error: '每页数量必须在1-100之间' };
  }
  
  return { 
    isValid: true, 
    page: pageNum, 
    limit: limitNum,
    offset: (pageNum - 1) * limitNum
  };
}

// 验证时间范围
function validateTimeRange(startTime, endTime) {
  if (!startTime || !endTime) {
    return { isValid: false, error: '开始时间和结束时间不能为空' };
  }
  
  if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
    return { isValid: false, error: '开始时间格式无效' };
  }
  
  if (!(endTime instanceof Date) || isNaN(endTime.getTime())) {
    return { isValid: false, error: '结束时间格式无效' };
  }
  
  if (startTime >= endTime) {
    return { isValid: false, error: '开始时间必须早于结束时间' };
  }
  
  // 检查时间范围是否合理（比如不超过1年）
  const timeDiff = endTime.getTime() - startTime.getTime();
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  
  if (timeDiff > oneYear) {
    return { isValid: false, error: '时间范围不能超过1年' };
  }
  
  return { isValid: true };
}

// 验证URL
function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL不能为空' };
  }
  
  try {
    new URL(url);
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'URL格式无效' };
  }
}

// 验证邮箱
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: '邮箱不能为空' };
  }
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return { isValid: false, error: '邮箱格式无效' };
  }
  
  return { isValid: true };
}

// 验证手机号
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: '手机号不能为空' };
  }
  
  const phonePattern = /^1[3-9]\d{9}$/;
  if (!phonePattern.test(phone)) {
    return { isValid: false, error: '手机号格式无效' };
  }
  
  return { isValid: true };
}

// 验证用户名
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: '用户名不能为空' };
  }
  
  const trimmedUsername = username.trim();
  if (trimmedUsername.length === 0) {
    return { isValid: false, error: '用户名不能为空' };
  }
  
  if (trimmedUsername.length < 2 || trimmedUsername.length > 20) {
    return { isValid: false, error: '用户名长度必须在2-20个字符之间' };
  }
  
  // 只允许字母、数字、下划线
  const usernamePattern = /^[a-zA-Z0-9_]+$/;
  if (!usernamePattern.test(trimmedUsername)) {
    return { isValid: false, error: '用户名只能包含字母、数字和下划线' };
  }
  
  return { isValid: true, cleanedUsername: trimmedUsername };
}

// 验证密码强度
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: '密码不能为空' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: '密码长度不能少于6个字符' };
  }
  
  if (password.length > 50) {
    return { isValid: false, error: '密码长度不能超过50个字符' };
  }
  
  // 检查密码强度
  let strength = 0;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  if (strength < 2) {
    return { isValid: false, error: '密码强度不够，建议包含大小写字母、数字和特殊字符' };
  }
  
  return { isValid: true, strength };
}

// 综合验证提醒数据
function validateReminderData(data) {
  const errors = [];
  const cleanedData = {};
  
  // 验证必要字段
  const messageValidation = validateReminderMessage(data.message);
  if (!messageValidation.isValid) {
    errors.push(messageValidation.error);
  } else {
    cleanedData.message = messageValidation.cleanedMessage;
  }
  
  const timeValidation = validateReminderTime(data.reminderTime);
  if (!timeValidation.isValid) {
    errors.push(timeValidation.error);
  } else {
    cleanedData.reminderTime = timeValidation.cleanedTime || data.reminderTime;
  }
  
  // 验证可选字段
  if (data.priority) {
    const priorityValidation = validatePriority(data.priority);
    if (!priorityValidation.isValid) {
      errors.push(priorityValidation.error);
    } else {
      cleanedData.priority = data.priority;
    }
  }
  
  if (data.categoryId) {
    const categoryValidation = validateCategoryId(data.categoryId);
    if (!categoryValidation.isValid) {
      errors.push(categoryValidation.error);
    } else {
      cleanedData.categoryId = data.categoryId;
    }
  }
  
  if (data.tags) {
    const tagsValidation = validateTags(data.tags);
    if (!tagsValidation.isValid) {
      errors.push(tagsValidation.error);
    } else {
      cleanedData.tags = tagsValidation.cleanedTags;
    }
  }
  
  if (data.notes) {
    const notesValidation = validateNotes(data.notes);
    if (!notesValidation.isValid) {
      errors.push(notesValidation.error);
    } else {
      cleanedData.notes = notesValidation.cleanedNotes;
    }
  }
  
  if (data.repeatPattern) {
    const repeatValidation = validateRepeatPattern(data.repeatPattern);
    if (!repeatValidation.isValid) {
      errors.push(repeatValidation.error);
    } else {
      cleanedData.repeatPattern = data.repeatPattern;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    cleanedData
  };
}

module.exports = {
  validateUserId,
  validateChatId,
  validateReminderMessage,
  validateReminderTime,
  validatePriority,
  validateCategoryId,
  validateTags,
  validateNotes,
  validateRepeatPattern,
  validateSearchKeyword,
  validatePaginationParams,
  validateTimeRange,
  validateUrl,
  validateEmail,
  validatePhone,
  validateUsername,
  validatePassword,
  validateReminderData
}; 