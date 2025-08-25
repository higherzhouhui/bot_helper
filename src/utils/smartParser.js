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
      '工作': ['工作', 'work', '上班', '会议', '开会', '项目', '任务', 'deadline', '报告', '复盘', '汇报', '跟进', '对接', '客户', '同事', '邮件', 'OA', '打卡', '签到', '面试', '招聘', '绩效'],
      '生活': ['生活', 'life', '吃饭', '睡觉', '购物', '买菜', '家务', '打扫', '洗衣服', '取快递', '快递', '水电煤', '物业', '房租', '租金', '倒垃圾', '充电', '维修', '保洁'],
      '学习': ['学习', 'study', '读书', '上课', '作业', '考试', '复习', '练习', '自习', '课程', '讲座', '论文', '毕设', '背单词', '英语', '网课', 'MOOC', '刷题', '题目', '训练营'],
      '健康': ['健康', 'health', '运动', '健身', '跑步', '瑜伽', '吃药', '体检', '看病', '门诊', '挂号', '复诊', '打针', '维生素', '牙医', '牙科', '眼科', '冥想', '骑行', '健走'],
      '娱乐': ['娱乐', 'entertainment', '游戏', '打游戏', '电竞', '电影', '看电影', '音乐', '演唱会', '音乐会', '综艺', '聚会', '约会', '旅行', '旅游', '出游', 'KTV', '唱歌', '桌游', '漫展', '看剧', '追剧'] ,
      '财务': ['财务', '理财', '记账', '报销', '发票', '税', '税务', '纳税', '发薪', '工资', '还款', '贷款', '信用卡', '花呗', '白条', '账单', '预算', '对账'],
      '出行': ['出行', '交通', '机票', '航班', '候机', '登机', '火车', '高铁', '动车', '车票', '打车', '滴滴', '地铁', '公交', '自驾', '租车', '换乘'],
      '家庭': ['家庭', '孩子', '宝宝', '接送', '接娃', '接孩子', '夫妻', '父母', '爸爸', '妈妈', '老人', '亲戚', '宠物', '喂猫', '喂狗', '铲屎官', '家长会'],
      '社交': ['社交', '朋友', '同学', '同事', '聚会', '约饭', '约酒', '约咖', '咖啡', '啤酒', '生日', '送礼', '礼物', '拜访', '见面'],
      '购物': ['购物', '下单', '付款', '支付', '退款', '退货', '收货', '取件', '拼多多', '淘宝', '京东', '天猫', '抢购', '预售']
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

  // 预处理文本：去除多余空格
  preprocessText(text) {
    if (!text) return '';
    
    // 去除首尾空格
    let processed = text.trim();
    
    // 将多个连续空格替换为单个空格
    processed = processed.replace(/\s+/g, ' ');
    
    // 处理中文数字和标点符号周围的空格
    processed = processed.replace(/(\d+)\s*点\s*(\d+)\s*分/g, '$1点$2分');
    processed = processed.replace(/(\d+)\s*:\s*(\d+)/g, '$1:$2');
    processed = processed.replace(/(\d+)\s*点/g, '$1点');
    
    return processed;
  }

  // 智能解析提醒文本
  parseReminderText(text) {
    // 输入验证
    if (!text || typeof text !== 'string') {
      throw new Error('输入文本不能为空且必须是字符串');
    }

    // 预处理文本
    const processedText = this.preprocessText(text);
    
    const result = {
      originalText: text,
      processedText: processedText,
      message: processedText,
      time: null,
      priority: 'normal',
      category: null,
      tags: [],
      notes: '',
      repeatPattern: 'none',
      repeatEndDate: null,
      confidence: 0.8, // 添加置信度
      suggestions: [] // 添加建议
    };

    try {
      // 提取优先级
      result.priority = this.extractPriority(processedText);
      
      // 提取分类
      result.category = this.extractCategory(processedText);
      
      // 提取标签
      result.tags = this.extractTags(processedText);
      
      // 提取重复模式
      result.repeatPattern = this.extractRepeatPattern(processedText);
      
      // 提取备注
      result.notes = this.extractNotes(processedText);
      
      // 提取时间
      result.time = this.parseTimeExpression(processedText);
      
      // 清理消息内容
      result.message = this.stripTimeExpressions(processedText);
      result.message = this.stripPriorityExpressions(result.message);
      result.message = this.stripCategoryExpressions(result.message);
      result.message = this.stripRepeatExpressions(result.message);
      result.message = this.stripTagExpressions(result.message);
      result.message = this.stripNotesExpressions(result.message);
      
      // 生成建议
      result.suggestions = this.generateSuggestions(result);
      
      // 计算置信度
      result.confidence = this.calculateConfidence(result);
      
    } catch (error) {
      console.error('解析提醒文本时发生错误:', error);
      // 返回基本结果，不抛出错误
      result.message = processedText;
      result.confidence = 0.3;
      result.suggestions = ['请检查输入格式', '尝试使用更简单的表达'];
    }

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

  // 清理消息内容（移除时间表达等）
  cleanMessage(text) {
    // 保持向后兼容
    return this.stripTimeExpressions(text);
  }

  // 移除时间表达式
  stripTimeExpressions(text) {
    if (!text) return '';
    
    // 移除各种时间表达式
    let cleaned = text
      .replace(/(今天|明天|后天|昨天|前天|今晚|明晚|今晚|明早|今早|明早|今晚|明晚)/g, '')
      .replace(/(上午|下午|晚上|凌晨|中午|傍晚|深夜|早晨|中午|下午|晚上)/g, '')
      .replace(/(\d+)\s*点\s*(\d+)?\s*分?/g, '')
      .replace(/(\d+)\s*:\s*(\d+)/g, '')
      .replace(/(\d+)\s*小时后?/g, '')
      .replace(/(\d+)\s*分钟后?/g, '')
      .replace(/(\d+)\s*天后?/g, '')
      .replace(/(\d+)\s*周后?/g, '')
      .replace(/(\d+)\s*月后?/g, '')
      .replace(/(\d+)\s*年后?/g, '')
      .replace(/(下个?|上个?)\s*(周一|周二|周三|周四|周五|周六|周日|星期[一二三四五六日])/g, '')
      .replace(/(周一|周二|周三|周四|周五|周六|周日|星期[一二三四五六日])/g, '')
      .replace(/(每天|每周|每月|每年|天天|日日|周周|月月|年年)/g, '')
      .replace(/(\d+)\s*号/g, '')
      .replace(/(\d+)\s*日/g, '');
    
    // 清理多余空格
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  // 移除优先级表达式
  stripPriorityExpressions(text) {
    if (!text) return '';
    
    const priorityWords = [
      '紧急', 'urgent', '立即', '马上', '立刻', 'asap', 'as soon as possible',
      '重要', 'high', '关键', 'critical',
      '普通', 'normal', '一般', '常规',
      '低', 'low', '不急', '慢慢', '不急'
    ];
    
    let cleaned = text;
    priorityWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      cleaned = cleaned.replace(regex, '');
    });
    
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  // 移除分类表达式
  stripCategoryExpressions(text) {
    if (!text) return '';
    
    const categoryWords = [
      '工作', 'work', '上班', '会议', '开会', '项目', '任务', 'deadline',
      '生活', 'life', '吃饭', '睡觉', '购物', '买菜', '家务',
      '学习', 'study', '读书', '上课', '作业', '考试', '复习',
      '健康', 'health', '运动', '健身', '跑步', '瑜伽', '吃药',
      '娱乐', 'entertainment', '游戏', '打游戏', '电竞', '电影'
    ];
    
    let cleaned = text;
    categoryWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      cleaned = cleaned.replace(regex, '');
    });
    
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  // 移除重复模式表达式
  stripRepeatExpressions(text) {
    if (!text) return '';
    
    const repeatWords = [
      '每天', 'daily', '天天', '每日',
      '每周', 'weekly', '星期', '周',
      '每月', 'monthly', '月',
      '每年', 'yearly', '年'
    ];
    
    let cleaned = text;
    repeatWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      cleaned = cleaned.replace(regex, '');
    });
    
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  // 移除标签表达式
  stripTagExpressions(text) {
    if (!text) return '';
    
    // 移除 #标签 格式
    let cleaned = text.replace(/#\w+/g, '');
    
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  // 移除备注表达式
  stripNotesExpressions(text) {
    if (!text) return '';
    
    // 移除备注相关表达式
    let cleaned = text
      .replace(/备注[：:]\s*.*$/g, '')
      .replace(/说明[：:]\s*.*$/g, '')
      .replace(/注意[：:]\s*.*$/g, '');
    
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  // 解析时间表达式（增强版）
  parseTimeExpression(text) {
    const timePatterns = [
      // 每天重复时间（扩展）
      { pattern: /每天\s*(\d{1,2})点\s*(\d{1,2})/, type: 'dailyTime' },
      { pattern: /每天\s*(\d{1,2}):(\d{1,2})/, type: 'dailyTime' },
      { pattern: /每日\s*(\d{1,2})点\s*(\d{1,2})/, type: 'dailyTime' },
      { pattern: /每日\s*(\d{1,2}):(\d{1,2})/, type: 'dailyTime' },
      { pattern: /每天\s*(\d{1,2})点/, type: 'dailySimple' },
      { pattern: /每日\s*(\d{1,2})点/, type: 'dailySimple' },

      // 口语化：一会儿/等会儿/稍后/过会儿（默认+10分钟）
      { pattern: /(一会儿|等会儿|稍后|过会儿)/, type: 'soon' },

      // 口语化：早上/中午/下午/傍晚/晚上/凌晨 + 不带具体小时
      { pattern: /(早上|上午)/, type: 'morningDefault' },
      { pattern: /(中午)/, type: 'noonDefault' },
      { pattern: /(下午)/, type: 'afternoonDefault' },
      { pattern: /(傍晚)/, type: 'duskDefault' },
      { pattern: /(晚上|夜里|夜间)/, type: 'eveningDefault' },
      { pattern: /(凌晨)/, type: 'lateNightDefault' },

      // 口语化：饭点
      { pattern: /(饭点|吃饭时间|午饭|午餐)/, type: 'lunchDefault' },
      { pattern: /(晚饭|晚餐|晚饭点)/, type: 'dinnerDefault' },

      // 口语化：x点左右/x点多
      { pattern: /(\d{1,2})点左右/, type: 'aroundHour' },
      { pattern: /(\d{1,2})点多/, type: 'aroundHour' },

      // 口语化：x点前/x点后
      { pattern: /(\d{1,2})点前/, type: 'beforeHour' },
      { pattern: /(\d{1,2})点后/, type: 'afterHour' },

      // 本周/这周/下周 + 星期 + 可选时段/时间
      { pattern: /(本周|这周)\s*([一二三四五六日天])(?:\s*(上午|下午|晚上|中午))?(?:\s*(\d{1,2})点(?:\s*(\d{1,2})分)?)?/, type: 'thisWeekDayDetailed' },
      { pattern: /下\s*周\s*([一二三四五六日天])(?:\s*(上午|下午|晚上|中午))?(?:\s*(\d{1,2})点(?:\s*(\d{1,2})分)?)?/, type: 'nextWeekDayDetailed' },

      // 下周末（可带时间）
      { pattern: /(下个\s*周末|下周末)(?:\s*(\d{1,2})点(?:\s*(\d{1,2})分)?)?/, type: 'nextWeekendMaybeTime' },

      // 月度口语：月底/月初/月中
      { pattern: /(月底)/, type: 'endOfMonth' },
      { pattern: /(月初)/, type: 'beginOfMonth' },
      { pattern: /(月中)/, type: 'midOfMonth' },

      // 已有规则保持不变
      { pattern: /今晚\s*(\d{1,2})点/, type: 'tonight' },
      { pattern: /明天\s*(上午|下午|晚上|中午)?\s*(\d{1,2})点/, type: 'tomorrow' },
      { pattern: /今天\s*(上午|下午|晚上|中午)?\s*(\d{1,2})点/, type: 'today' },
      { pattern: /后天\s*(上午|下午|晚上|中午)?\s*(\d{1,2})点/, type: 'dayAfterTomorrow' },
      
      // 相对日期：一天后、两天后、三天后（带时间）
      { pattern: /(一|两|三|四|五|六|七|八|九|十|百|千|万)\s*天\s*后\s*(上午|下午|晚上|中午)?\s*(\d{1,2})点(?:\s*(\d{1,2})分)?/, type: 'daysLaterWithTime' },
      { pattern: /(\d+)\s*天\s*后\s*(上午|下午|晚上|中午)?\s*(\d{1,2})点(?:\s*(\d{1,2})分)?/, type: 'daysLaterWithTime' },
      
      // 相对日期：一天后、两天后、三天后（不带时间）
      { pattern: /(一|两|三|四|五|六|七|八|九|十|百|千|万)\s*天\s*后/, type: 'daysLater' },
      { pattern: /(\d+)\s*天\s*后/, type: 'daysLater' },
      
      // 标准时间格式 20:30
      { pattern: /(\d{1,2}):(\d{1,2})/, type: 'time' },
      
      // 明天上午9点30分
      { pattern: /明天\s*(上午|下午|晚上|中午)?\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'tomorrowWithMinutes' },
      // 今天下午3点15分
      { pattern: /今天\s*(上午|下午|晚上|中午)?\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'todayWithMinutes' },
      // 后天上午10点30分
      { pattern: /后天\s*(上午|下午|晚上|中午)?\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'dayAfterTomorrowWithMinutes' },
      
      // 今晚20点30分
      { pattern: /今晚\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'tonightWithMinutes' },
      
      // 英文简写时间单位
      { pattern: /(\d+)\s*[Ss]\s*后/, type: 'secondsLater' },
      { pattern: /(\d+)\s*[Mm]\s*后/, type: 'minutesLater' },
      { pattern: /(\d+)\s*[Hh]\s*后/, type: 'hoursLater' },
      { pattern: /(\d+)\s*[Dd]\s*后/, type: 'daysLater' },
      
      // 相对时间：1小时后、2小时后
      { pattern: /(\d+)\s*小时\s*后/, type: 'hoursLater' },
      { pattern: /(\d+)\s*小时后/, type: 'hoursLater' },
      { pattern: /(\d+)\s*分钟\s*后/, type: 'minutesLater' },
      { pattern: /(\d+)\s*分钟后/, type: 'minutesLater' },
      { pattern: /(\d+)\s*秒\s*后/, type: 'secondsLater' },
      { pattern: /(\d+)\s*秒后/, type: 'secondsLater' },
      
      // 中文数字相对时间
      { pattern: /(一|两|三|四|五|六|七|八|九|十)\s*小时\s*后/, type: 'hoursLaterChinese' },
      { pattern: /(一|两|三|四|五|六|七|八|九|十)\s*分钟后/, type: 'minutesLaterChinese' },
      { pattern: /(一|两|三|四|五|六|七|八|九|十)\s*秒后/, type: 'secondsLaterChinese' },
      
      // 具体日期：明天、后天、大后天
      { pattern: /明天/, type: 'tomorrowDate' },
      { pattern: /后天/, type: 'dayAfterTomorrowDate' },
      { pattern: /大后天/, type: 'dayAfterDayAfterTomorrowDate' },
      
      // 星期：下周一、下周二
      { pattern: /下\s*周\s*([一二三四五六日天])/, type: 'nextWeek' },
      { pattern: /下\s*个\s*([一二三四五六日天])/, type: 'nextWeek' },
      
      // 上午、下午、晚上 + 时间
      { pattern: /(上午|下午|晚上|中午)\s*(\d{1,2})点(?:\s*(\d{1,2})分)?/, type: 'timeOfDay' }
    ];

    for (const timePattern of timePatterns) {
      const match = text.match(timePattern.pattern);
      if (match) {
        return this.parseTimeFromMatch(match, timePattern.type);
      }
    }
    
    return null;
  }

  // 中文数字转阿拉伯数字
  chineseToNumber(chinese) {
    const chineseMap = {
      '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
      '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
      '百': 100, '千': 1000, '万': 10000
    };
    
         if (chinese in chineseMap) {
       return chineseMap[chinese];
     }
    
    // 处理复合中文数字
    if (chinese === '两') return 2;
    if (chinese === '十') return 10;
    if (chinese === '百') return 100;
    if (chinese === '千') return 1000;
    if (chinese === '万') return 10000;
    
    // 尝试解析复合数字
    let result = 0;
    let current = 0;
    
    for (let i = 0; i < chinese.length; i++) {
      const char = chinese[i];
      if (char in chineseMap) {
        const num = chineseMap[char];
        if (num >= 10) {
          if (current === 0) current = 1;
          result += current * num;
          current = 0;
        } else {
          current = current * 10 + num;
        }
      }
    }
    
    result += current;
    return result || 1; // 如果解析失败，默认返回1
  }

  // 从匹配结果解析时间（增强版）
  parseTimeFromMatch(match, type) {
    const now = new Date();
    let targetTime = new Date();
    
    if (type === 'dailyTime') {
      const hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, minute, 0, 0);
      
      // 如果时间已过，设置为明天
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'tomorrowTime') {
      const hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      targetTime.setDate(now.getDate() + 1);
      targetTime.setHours(hour, minute, 0, 0);
      
    } else if (type === 'todayTime') {
      const hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, minute, 0, 0);
      
      // 如果时间已过，设置为明天
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'dayAfterTomorrowTime') {
      const hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      targetTime.setDate(now.getDate() + 2);
      targetTime.setHours(hour, minute, 0, 0);
      
    } else if (type === 'tonightTime') {
      const hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, minute, 0, 0);
      
      // 如果时间已过，设置为明天
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'dailySimple') {
      const hour = parseInt(match[1]);
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, 0, 0, 0);
      
      // 如果时间已过，设置为明天
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'todayWithTimeOfDay') {
      const timeOfDay = match[1];
      const hour = parseInt(match[2]);
      const minute = parseInt(match[3]);
      let adjustedHour = hour;
      
      if (timeOfDay === '下午' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '晚上' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '上午' && hour === 12) {
        adjustedHour = 0;
      }
      
      targetTime.setDate(now.getDate());
      targetTime.setHours(adjustedHour, minute, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'tomorrowWithTimeOfDay') {
      const timeOfDay = match[1];
      const hour = parseInt(match[2]);
      const minute = parseInt(match[3]);
      let adjustedHour = hour;
      
      if (timeOfDay === '下午' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '晚上' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '上午' && hour === 12) {
        adjustedHour = 0;
      }
      
      targetTime.setDate(now.getDate() + 1);
      targetTime.setHours(adjustedHour, minute, 0, 0);
      
    } else if (type === 'dayAfterTomorrowWithTimeOfDay') {
      const timeOfDay = match[1];
      const hour = parseInt(match[2]);
      const minute = parseInt(match[3]);
      let adjustedHour = hour;
      
      if (timeOfDay === '下午' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '晚上' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '上午' && hour === 12) {
        adjustedHour = 0;
      }
      
      targetTime.setDate(now.getDate() + 2);
      targetTime.setHours(adjustedHour, minute, 0, 0);
      
    } else if (type === 'halfHour') {
      const hour = parseInt(match[1]);
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, 30, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'tomorrowHalfHour') {
      const hour = parseInt(match[1]);
      targetTime.setDate(now.getDate() + 1);
      targetTime.setHours(hour, 30, 0, 0);
      
    } else if (type === 'todayHalfHour') {
      const hour = parseInt(match[1]);
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, 30, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'dayAfterTomorrowHalfHour') {
      const hour = parseInt(match[1]);
      targetTime.setDate(now.getDate() + 2);
      targetTime.setHours(hour, 30, 0, 0);
      
    } else if (type === 'tonightHalfHour') {
      const hour = parseInt(match[1]);
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, 30, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'quarterHour') {
      const hour = parseInt(match[1]);
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, 15, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'threeQuarterHour') {
      const hour = parseInt(match[1]);
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, 45, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'tomorrowQuarterHour') {
      const hour = parseInt(match[1]);
      targetTime.setDate(now.getDate() + 1);
      targetTime.setHours(hour, 15, 0, 0);
      
    } else if (type === 'todayQuarterHour') {
      const hour = parseInt(match[1]);
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, 15, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'workTime') {
      // 默认上班时间：早上9点
      targetTime.setDate(now.getDate());
      targetTime.setHours(9, 0, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'offWorkTime') {
      // 默认下班时间：下午6点
      targetTime.setDate(now.getDate());
      targetTime.setHours(18, 0, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'lunchTime') {
      // 默认午休时间：中午12点
      targetTime.setDate(now.getDate());
      targetTime.setHours(12, 0, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'morningWakeUp') {
      // 默认起床时间：早上7点
      targetTime.setDate(now.getDate());
      targetTime.setHours(7, 0, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'nightSleep') {
      // 默认睡觉时间：晚上11点
      targetTime.setDate(now.getDate());
      targetTime.setHours(23, 0, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'thisWeekend') {
      const hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      
      // 计算这个周末（周六）
      const today = now.getDay(); // 0=周日, 1=周一, ..., 6=周六
      const daysUntilSaturday = (6 - today + 7) % 7;
      const saturday = new Date(now);
      saturday.setDate(now.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday));
      
      targetTime.setDate(saturday.getDate());
      targetTime.setHours(hour, minute, 0, 0);
      
    } else if (type === 'nextWeekend') {
      const hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      
      // 计算下个周末（下周六）
      const today = now.getDay();
      const daysUntilNextSaturday = (6 - today + 7) % 7 + 7;
      const nextSaturday = new Date(now);
      nextSaturday.setDate(now.getDate() + daysUntilNextSaturday);
      
      targetTime.setDate(nextSaturday.getDate());
      targetTime.setHours(hour, minute, 0, 0);
      
    } else if (type === 'weekday') {
      const hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      
      // 计算下一个工作日
      const today = now.getDay();
      let daysUntilWeekday = 1;
      
      if (today === 0) { // 周日
        daysUntilWeekday = 1; // 下周一
      } else if (today === 6) { // 周六
        daysUntilWeekday = 2; // 下周一
      } else { // 周一到周五
        daysUntilWeekday = 1; // 明天
      }
      
      targetTime.setDate(now.getDate() + daysUntilWeekday);
      targetTime.setHours(hour, minute, 0, 0);
      
    } else if (type === 'exactHour') {
      const hour = parseInt(match[1]);
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, 0, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'tomorrowExactHour') {
      const hour = parseInt(match[1]);
      targetTime.setDate(now.getDate() + 1);
      targetTime.setHours(hour, 0, 0, 0);
      
    } else if (type === 'todayExactHour') {
      const hour = parseInt(match[1]);
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, 0, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'dayAfterTomorrowExactHour') {
      const hour = parseInt(match[1]);
      targetTime.setDate(now.getDate() + 2);
      targetTime.setHours(hour, 0, 0, 0);
      
    } else if (type === 'tonightExactHour') {
      const hour = parseInt(match[1]);
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, 0, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'dailyExactHour') {
      const hour = parseInt(match[1]);
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, 0, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'tonight') {
      const hour = parseInt(match[1]);
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, 0, 0, 0);
      
      // 如果时间已过，设置为明天
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'tonightWithMinutes') {
      const hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, minute, 0, 0);
      
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
      
    } else if (type === 'tomorrowWithMinutes') {
      const timeOfDay = match[1]; // '上午', '下午', '晚上' 或 undefined
      const hour = parseInt(match[2]);
      const minute = parseInt(match[3]);
      let adjustedHour = hour;
      
      // 根据时间段调整小时
      if (timeOfDay === '下午' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '晚上' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '上午' && hour === 12) {
        adjustedHour = 0;
      }
      
      targetTime.setDate(now.getDate() + 1);
      targetTime.setHours(adjustedHour, minute, 0, 0);
      
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
        adjustedHour = 0;
      }
      
      targetTime.setDate(now.getDate());
      targetTime.setHours(adjustedHour, 0, 0, 0);
      
      // 如果时间已过，设置为明天
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'todayWithMinutes') {
      const timeOfDay = match[1];
      const hour = parseInt(match[2]);
      const minute = parseInt(match[3]);
      let adjustedHour = hour;
      
      if (timeOfDay === '下午' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '晚上' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '上午' && hour === 12) {
        adjustedHour = 0;
      }
      
      targetTime.setDate(now.getDate());
      targetTime.setHours(adjustedHour, minute, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'dayAfterTomorrow') {
      const timeOfDay = match[1];
      const hour = parseInt(match[2]);
      let adjustedHour = hour;
      
      if (timeOfDay === '下午' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '晚上' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '上午' && hour === 12) {
        adjustedHour = 0;
      }
      
      targetTime.setDate(now.getDate() + 2);
      targetTime.setHours(adjustedHour, 0, 0, 0);
      
    } else if (type === 'dayAfterTomorrowWithMinutes') {
      const timeOfDay = match[1];
      const hour = parseInt(match[2]);
      const minute = parseInt(match[3]);
      let adjustedHour = hour;
      
      if (timeOfDay === '下午' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '晚上' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '上午' && hour === 12) {
        adjustedHour = 0;
      }
      
      targetTime.setDate(now.getDate() + 2);
      targetTime.setHours(adjustedHour, minute, 0, 0);
      
    } else if (type === 'time') {
      const hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, minute, 0, 0);
      
      // 如果时间已过，设置为明天
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
    } else if (type === 'hoursLater') {
      const hours = parseInt(match[1]);
      targetTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
      
    } else if (type === 'minutesLater') {
      const minutes = parseInt(match[1]);
      targetTime = new Date(now.getTime() + minutes * 60 * 1000);
       
    } else if (type === 'secondsLater') {
      const seconds = parseInt(match[1]);
      targetTime = new Date(now.getTime() + seconds * 1000);
       
    } else if (type === 'hoursLaterChinese') {
      const hours = this.chineseToNumber(match[1]);
      targetTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
       
    } else if (type === 'minutesLaterChinese') {
      const minutes = this.chineseToNumber(match[1]);
      targetTime = new Date(now.getTime() + minutes * 60 * 1000);
       
    } else if (type === 'secondsLaterChinese') {
      const seconds = this.chineseToNumber(match[1]);
      targetTime = new Date(now.getTime() + seconds * 1000);
       
    } else if (type === 'daysLater') {
      let days;
      if (isNaN(parseInt(match[1]))) {
        // 中文数字
        days = this.chineseToNumber(match[1]);
      } else {
        // 阿拉伯数字
        days = parseInt(match[1]);
      }
      targetTime = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      targetTime.setHours(9, 0, 0, 0); // 默认上午9点
       
    } else if (type === 'daysLaterWithTime') {
      let days;
      if (isNaN(parseInt(match[1]))) {
        // 中文数字
        days = this.chineseToNumber(match[1]);
      } else {
        // 阿拉伯数字
        days = parseInt(match[1]);
      }
       
      const timeOfDay = match[2]; // '上午', '下午', '晚上', '中午' 或 undefined
      const hour = parseInt(match[3]);
      const minute = match[4] ? parseInt(match[4]) : 0;
      let adjustedHour = hour;
       
      // 根据时间段调整小时
      if (timeOfDay === '下午' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '晚上' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '上午' && hour === 12) {
        adjustedHour = 0;
      }
       
      targetTime = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      targetTime.setHours(adjustedHour, minute, 0, 0);
       
    } else if (type === 'tomorrowDate') {
      targetTime.setDate(now.getDate() + 1);
      targetTime.setHours(9, 0, 0, 0); // 默认上午9点
       
    } else if (type === 'dayAfterTomorrowDate') {
      targetTime.setDate(now.getDate() + 2);
      targetTime.setHours(9, 0, 0, 0);
       
    } else if (type === 'dayAfterDayAfterTomorrowDate') {
      targetTime.setDate(now.getDate() + 3);
      targetTime.setHours(9, 0, 0, 0);
    }

    // 处理星期
    if (type === 'nextWeek') {
      const weekMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0 };
      const targetDay = weekMap[match[1]];
      const currentDay = now.getDay();
      let daysToAdd = targetDay - currentDay;
      
      if (daysToAdd <= 0) {
        daysToAdd += 7; // 下周
      }
      
      targetTime.setDate(now.getDate() + daysToAdd);
      targetTime.setHours(9, 0, 0, 0);
    }

    // 处理时间段
    if (type === 'timeOfDay') {
      const timeOfDay = match[1];
      const hour = parseInt(match[2]);
      const minute = match[3] ? parseInt(match[3]) : 0;
      let adjustedHour = hour;
      
      if (timeOfDay === '下午' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '晚上' && hour < 12) {
        adjustedHour = hour + 12;
      } else if (timeOfDay === '上午' && hour === 12) {
        adjustedHour = 0;
      }
      
      targetTime.setDate(now.getDate());
      targetTime.setHours(adjustedHour, minute, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
    }
    
    return targetTime;
  }

  // 生成智能建议
  generateSuggestions(result) {
    const suggestions = [];
    
    if (!result.time) {
      suggestions.push('💡 可以添加时间，如"今晚20点"、"明天上午9点"');
    }
    
    if (result.priority === 'normal') {
      suggestions.push('💡 可以设置优先级，如"紧急"、"重要"');
    }
    
    if (!result.category) {
      suggestions.push('💡 可以指定分类，如"工作"、"生活"、"学习"');
    }
    
    if (result.repeatPattern === 'none') {
      suggestions.push('💡 可以设置重复，如"每天"、"每周一"');
    }
    
    if (result.tags.length === 0) {
      suggestions.push('💡 可以添加标签，如"#重要"、"#会议"');
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

  // 测试时间解析（用于调试）
  testTimeParsing(text) {
    console.log(`测试文本: "${text}"`);
    const processed = this.preprocessText(text);
    console.log(`预处理后: "${processed}"`);
    const time = this.parseTimeExpression(processed);
    console.log(`解析时间: ${time ? time.toLocaleString('zh-CN') : 'null'}`);
    return time;
  }

  // 计算置信度
  calculateConfidence(result) {
    let confidence = 0.5; // 基础置信度
    
    // 时间解析成功
    if (result.time) confidence += 0.2;
    
    // 分类识别成功
    if (result.category) confidence += 0.15;
    
    // 优先级设置
    if (result.priority !== 'normal') confidence += 0.1;
    
    // 重复模式识别
    if (result.repeatPattern !== 'none') confidence += 0.1;
    
    // 标签提取
    if (result.tags.length > 0) confidence += 0.05;
    
    // 消息内容长度适中
    if (result.message && result.message.length > 5 && result.message.length < 100) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }
}

module.exports = SmartParser; 