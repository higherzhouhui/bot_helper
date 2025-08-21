class SmartParser {
  constructor() {
    // 优先级关键词映射
    this.priorityKeywords = {
      urgent: ['紧急', 'urgent', '立即', '马上', '立刻', 'asap', 'as soon as possible'],
      high: ['重要', 'high', '重要', '关键', 'critical'],
      normal: ['普通', 'normal', '一般', '常规'],
      low: ['低', 'low', '不急', '慢慢', '不急']
    };

    // 分类关键词映射
    this.categoryKeywords = {
      '工作': ['工作', 'work', '上班', '会议', '项目', '任务', 'deadline', '报告'],
      '生活': ['生活', 'life', '吃饭', '睡觉', '购物', '家务', '打扫', '洗衣服'],
      '学习': ['学习', 'study', '读书', '上课', '作业', '考试', '复习', '练习'],
      '健康': ['健康', 'health', '运动', '健身', '跑步', '瑜伽', '吃药', '体检'],
      '娱乐': ['娱乐', 'entertainment', '游戏', '电影', '音乐', '聚会', '约会', '旅行']
    };

    // 重复模式关键词
    this.repeatPatterns = {
      daily: ['每天', 'daily', '天天', '每日'],
      weekly: ['每周', 'weekly', '星期', '周'],
      monthly: ['每月', 'monthly', '月'],
      yearly: ['每年', 'yearly', '年']
    };

    // 标签提取正则
    this.tagRegex = /#(\w+)/g;
  }

  // 新增：兼容方法名
  parseTime(text) {
    return this.parseTimeExpression(text);
  }

  // 新增：兼容方法名，作为 parseReminderText 的别名
  parse(text) {
    return this.parseReminderText(text);
  }

  // 智能解析提醒文本
  parseReminderText(text) {
    const result = {
      originalText: text,
      message: text,
      time: null,
      priority: 'normal',
      category: null,
      tags: [],
      notes: '',
      repeatPattern: 'none',
      repeatEndDate: null
    };

    // 提取优先级
    result.priority = this.extractPriority(text);
    
    // 提取分类
    result.category = this.extractCategory(text);
    
    // 提取标签
    result.tags = this.extractTags(text);
    
    // 提取重复模式
    result.repeatPattern = this.extractRepeatPattern(text);
    
    // 提取备注
    result.notes = this.extractNotes(text);
    
    // 提取时间
    result.time = this.parseTimeExpression(text);
    
    // 清理消息内容（移除时间表达等）
    result.message = this.cleanMessage(text);

    return result;
  }

  // 提取优先级
  extractPriority(text) {
    const lowerText = text.toLowerCase();
    
    for (const [priority, keywords] of Object.entries(this.priorityKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          return priority;
        }
      }
    }
    
    return 'normal';
  }

  // 提取分类
  extractCategory(text) {
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          return category;
        }
      }
    }
    
    return null;
  }

  // 提取标签
  extractTags(text) {
    const tags = [];
    const matches = text.match(this.tagRegex);
    
    if (matches) {
      for (const match of matches) {
        const tag = match.substring(1); // 去掉 #
        if (tag && !tags.includes(tag)) {
          tags.push(tag);
        }
      }
    }
    
    return tags;
  }

  // 提取重复模式
  extractRepeatPattern(text) {
    const lowerText = text.toLowerCase();
    
    for (const [pattern, keywords] of Object.entries(this.repeatPatterns)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          return pattern;
        }
      }
    }
    
    return 'none';
  }

  // 提取备注
  extractNotes(text) {
    // 查找备注分隔符
    const noteSeparators = ['备注:', 'note:', '说明:', 'description:', '详情:'];
    
    for (const separator of noteSeparators) {
      const index = text.indexOf(separator);
      if (index !== -1) {
        return text.substring(index + separator.length).trim();
      }
    }
    
    return '';
  }

  // 清理消息内容
  cleanMessage(text) {
    let cleaned = text;
    
    // 移除标签
    cleaned = cleaned.replace(this.tagRegex, '');
    
    // 移除备注部分
    const noteSeparators = ['备注:', 'note:', '说明:', 'description:', '详情:'];
    for (const separator of noteSeparators) {
      const index = cleaned.indexOf(separator);
      if (index !== -1) {
        cleaned = cleaned.substring(0, index).trim();
        break;
      }
    }

    // 先移除时间表达
    cleaned = this.stripTimeExpressions(cleaned);

    // 移除常见冗余提示词，但保留一些有用的动词
    const fillerWords = ['提醒我', '提醒', '记得', '帮我', '请', '一下', '麻烦'];
    for (const w of fillerWords) {
      const regex = new RegExp(w, 'g');
      cleaned = cleaned.replace(regex, '');
    }
    
    // 移除优先级关键词
    for (const keywords of Object.values(this.priorityKeywords)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
      }
    }
    
    // 移除分类关键词
    for (const keywords of Object.values(this.categoryKeywords)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
      }
    }
    
    // 移除重复模式关键词
    for (const keywords of Object.values(this.repeatPatterns)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
      }
    }
    
    // 清理多余空格与标点
    cleaned = cleaned.replace(/[，,。.!？?]+/g, ' ').replace(/\s+/g, ' ').trim();
    
    // 如果清理后内容太短，尝试保留更多原始信息
    if (cleaned.length < 3) {
      // 重新清理，但保留更多内容
      cleaned = text;
      // 只移除时间表达和标签
      cleaned = cleaned.replace(this.tagRegex, '');
      cleaned = this.stripTimeExpressions(cleaned);
      // 移除备注
      for (const separator of noteSeparators) {
        const index = cleaned.indexOf(separator);
        if (index !== -1) {
          cleaned = cleaned.substring(0, index).trim();
          break;
        }
      }
      cleaned = cleaned.replace(/[，,。.!？?]+/g, ' ').replace(/\s+/g, ' ').trim();
    }
    
    return cleaned;
  }

  // 移除时间表达（不改变 parseTimeExpression 的解析逻辑）
  stripTimeExpressions(text) {
    let s = text;
    const patterns = [
      /今晚\s*\d{1,2}点(?:\d{1,2}分)?/gi,
      /今天\s*(上午|下午|晚上|中午)?\s*\d{1,2}点(?:\d{1,2}分)?/gi,
      /明天\s*(上午|下午|晚上|中午)?\s*\d{1,2}点(?:\d{1,2}分)?/gi,
      /后天\s*(上午|下午|晚上|中午)?\s*\d{1,2}点(?:\d{1,2}分)?/gi,
      /\b\d{1,2}:\d{1,2}\b/g,
      /\b\d{1,2}点(?:\d{1,2}分)?/g,
      /在\s*\d{1,2}(?::\d{1,2})?点?(?:\d{1,2}分)?/g
    ];
    for (const p of patterns) s = s.replace(p, '');

    // 移除调度/频率词
    const scheduleWords = ['每天', '每日', '天天', '每周', '每月', '每年', '工作日', '周末'];
    for (const w of scheduleWords) {
      const re = new RegExp(w, 'g');
      s = s.replace(re, '');
    }

    // 单独移除时间段词
    const dayWords = ['今天', '明天', '后天', '今晚', '上午', '下午', '晚上', '中午', '早上', '清晨', '傍晚', '凌晨', '午后', '午前', '晚间'];
    for (const w of dayWords) {
      const re = new RegExp(w, 'g');
      s = s.replace(re, '');
    }

    return s;
  }

  // 解析时间表达式
  parseTimeExpression(text) {
    const timePatterns = [
      // 今晚20点
      { pattern: /今晚(\d{1,2})点/, type: 'tonight' },
      // 明天上午9点
      { pattern: /明天(上午|下午|晚上)?(\d{1,2})点/, type: 'tomorrow' },
      // 今天下午3点
      { pattern: /今天(上午|下午|晚上)?(\d{1,2})点/, type: 'today' },
      // 20:30
      { pattern: /(\d{1,2}):(\d{1,2})/, type: 'time' },
      // 20点30分
      { pattern: /(\d{1,2})点(\d{1,2})分/, type: 'time' },
      // 明天上午9点30分
      { pattern: /明天(上午|下午|晚上)?(\d{1,2})点(\d{1,2})分/, type: 'tomorrow' },
      // 今天下午3点15分
      { pattern: /今天(上午|下午|晚上)?(\d{1,2})点(\d{1,2})分/, type: 'today' }
    ];

    for (const timePattern of timePatterns) {
      const match = text.match(timePattern.pattern);
      if (match) {
        return this.parseTimeFromMatch(match, timePattern.type);
      }
    }
    
    return null;
  }

  // 从匹配结果解析时间
  parseTimeFromMatch(match, type) {
    const now = new Date();
    let targetTime = new Date();
    
    if (type === 'tonight') {
      const hour = parseInt(match[1]);
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, 0, 0, 0);
      
      // 如果时间已过，设置为明天
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
    } else if (type === 'tomorrow') {
      const timeOfDay = match[1]; // '上午', '下午', '晚上' 或 undefined
      const hour = parseInt(match[2]);
      let adjustedHour = hour;
      
      // 根据时间段调整小时
      if (timeOfDay === '下午' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '晚上' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '上午' && hour === 12) {
        adjustedHour = 0; // 上午12点是0点
      }
      
      targetTime.setDate(now.getDate() + 1);
      targetTime.setHours(adjustedHour, 0, 0, 0);
      
    } else if (type === 'today') {
      const timeOfDay = match[1]; // '上午', '下午', '晚上' 或 undefined
      const hour = parseInt(match[2]);
      let adjustedHour = hour;
      
      // 根据时间段调整小时
      if (timeOfDay === '下午' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '晚上' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '上午' && hour === 12) {
        adjustedHour = 0; // 上午12点是0点
      }
      
      targetTime.setDate(now.getDate());
      targetTime.setHours(adjustedHour, 0, 0, 0);
      
      // 如果时间已过，设置为明天
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'time') {
      const hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, minute, 0, 0);
      
      // 如果时间已过，设置为明天
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
    }
    
    return targetTime;
  }

  // 生成智能建议
  generateSuggestions(parsedData) {
    const suggestions = [];
    
    // 优先级建议
    if (parsedData.priority === 'urgent') {
      suggestions.push('⚠️ 这是紧急提醒，建议立即处理');
    } else if (parsedData.priority === 'high') {
      suggestions.push('🔴 这是重要提醒，请优先处理');
    }
    
    // 分类建议
    if (parsedData.category) {
      suggestions.push(`📂 已自动分类到: ${parsedData.category}`);
    }
    
    // 标签建议
    if (parsedData.tags.length > 0) {
      suggestions.push(`🏷️ 已添加标签: ${parsedData.tags.join(', ')}`);
    }
    
    // 重复模式建议
    if (parsedData.repeatPattern !== 'none') {
      suggestions.push(`🔄 已设置为${this.getRepeatPatternText(parsedData.repeatPattern)}重复`);
    }
    
    return suggestions;
  }

  // 获取重复模式文本
  getRepeatPatternText(pattern) {
    const patternTexts = {
      daily: '每天',
      weekly: '每周',
      monthly: '每月',
      yearly: '每年'
    };
    
    return patternTexts[pattern] || pattern;
  }

  // 验证解析结果
  validateParsedData(parsedData) {
    const errors = [];
    
    if (!parsedData.message || parsedData.message.trim().length === 0) {
      errors.push('提醒内容不能为空');
    }
    
    if (parsedData.tags.length > 10) {
      errors.push('标签数量不能超过10个');
    }
    
    if (parsedData.notes && parsedData.notes.length > 500) {
      errors.push('备注长度不能超过500字符');
    }
    
    return errors;
  }
}

module.exports = SmartParser; 