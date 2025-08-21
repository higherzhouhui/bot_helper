// 文本处理工具函数模块

// 清理文本内容
function cleanText(text) {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ') // 多个空格替换为单个空格
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // 移除零宽字符
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s\-_.,!?;:()[\]{}"'`~@#$%^&*+=|\\/<>]/g, ''); // 保留常用字符
}

// 截断文本
function truncateText(text, maxLength = 100, suffix = '...') {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

// 提取标签
function extractTags(text) {
  if (!text) return [];
  
  const tagPattern = /#([^\s#]+)/g;
  const tags = [];
  let match;
  
  while ((match = tagPattern.exec(text)) !== null) {
    tags.push(match[1]);
  }
  
  return tags;
}

// 移除标签
function removeTags(text) {
  if (!text) return '';
  return text.replace(/#[^\s#]+/g, '').trim();
}

// 提取备注
function extractNotes(text) {
  if (!text) return '';
  
  const notePatterns = [
    /备注[：:]\s*(.+)/,
    /备注\s*(.+)/,
    /note[：:]\s*(.+)/i,
    /note\s*(.+)/i
  ];
  
  for (const pattern of notePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return '';
}

// 移除备注
function removeNotes(text) {
  if (!text) return '';
  
  const notePatterns = [
    /备注[：:]\s*[^\s]+/,
    /备注\s*[^\s]+/,
    /note[：:]\s*[^\s]+/i,
    /note\s*[^\s]+/i
  ];
  
  let cleanedText = text;
  for (const pattern of notePatterns) {
    cleanedText = cleanedText.replace(pattern, '');
  }
  
  return cleanedText.trim();
}

// 提取优先级关键词
function extractPriority(text) {
  if (!text) return 'normal';
  
  const textLower = text.toLowerCase();
  
  if (textLower.includes('紧急') || textLower.includes('urgent')) {
    return 'urgent';
  } else if (textLower.includes('重要') || textLower.includes('important') || textLower.includes('high')) {
    return 'high';
  } else if (textLower.includes('低') || textLower.includes('low')) {
    return 'low';
  } else {
    return 'normal';
  }
}

// 移除优先级关键词
function removePriority(text) {
  if (!text) return '';
  
  const priorityPatterns = [
    /紧急\s*/,
    /重要\s*/,
    /低\s*/,
    /urgent\s*/i,
    /important\s*/i,
    /high\s*/i,
    /low\s*/i
  ];
  
  let cleanedText = text;
  for (const pattern of priorityPatterns) {
    cleanedText = cleanedText.replace(pattern, '');
  }
  
  return cleanedText.trim();
}

// 提取分类关键词
function extractCategory(text) {
  if (!text) return null;
  
  const textLower = text.toLowerCase();
  const categoryMap = {
    '工作': ['工作', 'job', 'work', 'office', '公司', '项目', '会议', '报告'],
    '生活': ['生活', 'life', '日常', '家庭', '家务', '购物', '做饭', '打扫'],
    '学习': ['学习', 'study', 'learn', '课程', '考试', '作业', '阅读', '培训'],
    '健康': ['健康', 'health', '运动', '锻炼', '健身', '跑步', '游泳', '瑜伽'],
    '财务': ['财务', 'finance', '钱', '理财', '投资', '账单', '报销', '工资']
  };
  
  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => textLower.includes(keyword))) {
      return category;
    }
  }
  
  return null;
}

// 移除分类关键词
function removeCategory(text) {
  if (!text) return '';
  
  const categoryPatterns = [
    /工作提醒[：:]\s*/,
    /生活提醒[：:]\s*/,
    /学习提醒[：:]\s*/,
    /健康提醒[：:]\s*/,
    /财务提醒[：:]\s*/,
    /工作\s*/,
    /生活\s*/,
    /学习\s*/,
    /健康\s*/,
    /财务\s*/
  ];
  
  let cleanedText = text;
  for (const pattern of categoryPatterns) {
    cleanedText = cleanedText.replace(pattern, '');
  }
  
  return cleanedText.trim();
}

// 提取重复模式
function extractRepeatPattern(text) {
  if (!text) return null;
  
  const textLower = text.toLowerCase();
  
  if (textLower.includes('每天') || textLower.includes('daily')) {
    return 'daily';
  } else if (textLower.includes('每周') || textLower.includes('weekly')) {
    return 'weekly';
  } else if (textLower.includes('每月') || textLower.includes('monthly')) {
    return 'monthly';
  } else if (textLower.includes('每年') || textLower.includes('yearly')) {
    return 'yearly';
  } else if (textLower.includes('工作日') || textLower.includes('workdays')) {
    return 'workdays';
  } else if (textLower.includes('周末') || textLower.includes('weekends')) {
    return 'weekends';
  }
  
  return null;
}

// 移除重复模式关键词
function removeRepeatPattern(text) {
  if (!text) return '';
  
  const repeatPatterns = [
    /每天\s*/,
    /每周\s*/,
    /每月\s*/,
    /每年\s*/,
    /工作日\s*/,
    /周末\s*/,
    /daily\s*/i,
    /weekly\s*/i,
    /monthly\s*/i,
    /yearly\s*/i,
    /workdays\s*/i,
    /weekends\s*/i
  ];
  
  let cleanedText = text;
  for (const pattern of repeatPatterns) {
    cleanedText = cleanedText.replace(pattern, '');
  }
  
  return cleanedText.trim();
}

// 清理提醒内容
function cleanReminderContent(text) {
  if (!text) return '';
  
  let cleanedText = text;
  
  // 按顺序清理各种标记
  cleanedText = removeTags(cleanedText);
  cleanedText = removeNotes(cleanedText);
  cleanedText = removePriority(cleanedText);
  cleanedText = removeCategory(cleanedText);
  cleanedText = removeRepeatPattern(cleanedText);
  
  // 最终清理
  cleanedText = cleanText(cleanedText);
  
  return cleanedText;
}

// 格式化提醒内容
function formatReminderContent(content, category, priority, tags, notes, repeatPattern) {
  let formatted = content;
  
  if (category) {
    formatted = `${category}提醒：${formatted}`;
  }
  
  if (priority && priority !== 'normal') {
    const priorityText = {
      'urgent': '紧急',
      'high': '重要',
      'low': '低'
    }[priority] || '';
    
    if (priorityText) {
      formatted = `${priorityText}${formatted}`;
    }
  }
  
  if (tags && tags.length > 0) {
    formatted += ` ${tags.map(tag => `#${tag}`).join(' ')}`;
  }
  
  if (notes) {
    formatted += ` 备注：${notes}`;
  }
  
  if (repeatPattern) {
    const repeatText = {
      'daily': '每天',
      'weekly': '每周',
      'monthly': '每月',
      'yearly': '每年',
      'workdays': '工作日',
      'weekends': '周末'
    }[repeatPattern] || repeatPattern;
    
    formatted += ` (${repeatText})`;
  }
  
  return formatted;
}

// 检查文本是否包含特定关键词
function containsKeywords(text, keywords) {
  if (!text || !keywords || !Array.isArray(keywords)) return false;
  
  const textLower = text.toLowerCase();
  return keywords.some(keyword => textLower.includes(keyword.toLowerCase()));
}

// 计算文本相似度（简单的Jaccard相似度）
function calculateSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// 生成摘要
function generateSummary(text, maxLength = 50) {
  if (!text) return '';
  
  // 简单的摘要生成：取前几个句子
  const sentences = text.split(/[。！？.!?]/).filter(s => s.trim());
  
  if (sentences.length === 0) return truncateText(text, maxLength);
  
  let summary = '';
  for (const sentence of sentences) {
    if ((summary + sentence).length <= maxLength) {
      summary += sentence + '。';
    } else {
      break;
    }
  }
  
  if (!summary) {
    summary = truncateText(text, maxLength);
  }
  
  return summary;
}

// 移除HTML标签
function removeHtmlTags(text) {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '');
}

// 转义特殊字符
function escapeSpecialChars(text) {
  if (!text) return '';
  
  const charMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return text.replace(/[&<>"']/g, char => charMap[char]);
}

// 反转义特殊字符
function unescapeSpecialChars(text) {
  if (!text) return '';
  
  const charMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'"
  };
  
  return text.replace(/&(amp|lt|gt|quot|#39);/g, (match, entity) => charMap[match] || match);
}

module.exports = {
  cleanText,
  truncateText,
  extractTags,
  removeTags,
  extractNotes,
  removeNotes,
  extractPriority,
  removePriority,
  extractCategory,
  removeCategory,
  extractRepeatPattern,
  removeRepeatPattern,
  cleanReminderContent,
  formatReminderContent,
  containsKeywords,
  calculateSimilarity,
  generateSummary,
  removeHtmlTags,
  escapeSpecialChars,
  unescapeSpecialChars
}; 