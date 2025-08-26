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

  // 解析提醒文本（增强版）
  parseReminderText(text) {
    if (!text || typeof text !== 'string') {
      return {
        time: null,
        message: '',
        category: 'general',
        priority: 'normal',
        tags: [],
        repeatPattern: 'none',
        notes: '',
        confidence: 0,
        suggestions: [],
        content: {},
        smartTags: []
      };
    }

    try {
      const processedText = text.trim();
      
      // 基础解析
      const result = {
        time: null,
        message: '',
        category: 'general',
        priority: 'normal',
        tags: [],
        repeatPattern: 'none',
        notes: '',
        confidence: 0,
        suggestions: [],
        content: {},
        smartTags: []
      };

      // 1. 解析时间
      result.time = this.parseTimeExpression(processedText);
      
      // 2. 智能内容提取
      result.content = this.extractSmartContent(processedText);
      
      // 3. 解析优先级
      result.priority = this.parsePriority(processedText);
      
      // 4. 解析分类
      result.category = this.parseCategory(processedText);
      
      // 5. 解析重复模式
      result.repeatPattern = this.parseRepeatPattern(processedText);
      
      // 6. 解析标签
      result.tags = this.parseTags(processedText);
      
      // 7. 解析备注
      result.notes = this.parseNotes(processedText);
      
      // 8. 生成智能标签
      result.smartTags = this.generateSmartTags(result.content, result.category, result.priority);
      
      // 9. 合并标签（去重）
      result.tags = [...new Set([...result.tags, ...result.smartTags])];
      
      // 10. 清理消息内容
      result.message = this.cleanMessage(processedText);
      
      // 11. 如果没有提取到动作，使用清理后的消息
      if (!result.content.action && result.message) {
        result.content.action = result.message;
        result.content.description = result.message;
      }
      
      // 12. 计算置信度
      result.confidence = this.calculateConfidence(result);
      
      // 13. 生成建议
      result.suggestions = this.generateSuggestions(result);
      
      return result;
      
    } catch (error) {
      console.error('解析提醒文本时发生错误:', error);
      return {
        time: null,
        message: text.trim(),
        category: 'general',
        priority: 'normal',
        tags: [],
        repeatPattern: 'none',
        notes: '',
        confidence: 0.1,
        suggestions: ['解析失败，请检查输入格式'],
        content: {},
        smartTags: []
      };
    }
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
      .replace(/(\d+)\s*点\s*(\d{1,2})?分/g, '')
      .replace(/(\d+)\s*:\s*(\d{1,2})/, '')
      .replace(/(\d+)\s*点/, '')
      .replace(/(\d+)\s*小时后?/, '')
      .replace(/(\d+)\s*分钟后?/, '')
      .replace(/(\d+)\s*天后?/, '')
      .replace(/(\d+)\s*周后?/, '')
      .replace(/(\d+)\s*月后?/, '')
      .replace(/(\d+)\s*年后?/, '')
      .replace(/(下个?|上个?)\s*(周一|周二|周三|周四|周五|周六|周日|星期[一二三四五六日])/, '')
      .replace(/(周一|周二|周三|周四|周五|周六|周日|星期[一二三四五六日])/, '')
      .replace(/(每天|每周|每月|每年|天天|日日|周周|月月|年年)/g, '')
      .replace(/(\d+)\s*号/, '')
      .replace(/(\d+)\s*日/, '');
    
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
      // 高优先级：具体时间模式
      { pattern: /每天\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'dailyTime' },
      { pattern: /每天\s*(\d{1,2}):(\d{1,2})/, type: 'dailyTime' },
      { pattern: /每日\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'dailyTime' },
      { pattern: /每日\s*(\d{1,2}):(\d{1,2})/, type: 'dailyTime' },
      
      // 具体日期时间（带分钟）
      { pattern: /明天\s*(上午|下午|晚上|中午)?\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'tomorrowWithMinutes' },
      { pattern: /今天\s*(上午|下午|晚上|中午)?\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'todayWithMinutes' },
      { pattern: /后天\s*(上午|下午|晚上|中午)?\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'dayAfterTomorrowWithMinutes' },
      { pattern: /今晚\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'tonightWithMinutes' },
      { pattern: /明晚\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'tomorrowNightWithMinutes' },
      
      // 具体日期时间（不带分钟）
      { pattern: /明天\s*(上午|下午|晚上|中午)?\s*(\d{1,2})点/, type: 'tomorrow' },
      { pattern: /今天\s*(上午|下午|晚上|中午)?\s*(\d{1,2})点/, type: 'today' },
      { pattern: /后天\s*(上午|下午|晚上|中午)?\s*(\d{1,2})点/, type: 'dayAfterTomorrow' },
      { pattern: /今晚\s*(\d{1,2})点/, type: 'tonight' },
      { pattern: /明晚\s*(\d{1,2})点/, type: 'tomorrowNight' },
      
      // 工作日/周末时间
      { pattern: /工作日\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'workdayTime' },
      { pattern: /工作日\s*(\d{1,2})点/, type: 'workdaySimple' },
      { pattern: /周末\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'weekendTime' },
      { pattern: /周末\s*(\d{1,2})点/, type: 'weekendSimple' },
      
      // 每周特定时间
      { pattern: /每周\s*([一二三四五六日天])\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'weeklySpecificTime' },
      { pattern: /每周\s*([一二三四五六日天])\s*(\d{1,2})点/, type: 'weeklySpecificHour' },
      { pattern: /每\s*([一二三四五六日天])\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'weeklySpecificTime' },
      { pattern: /每\s*([一二三四五六日天])\s*(\d{1,2})点/, type: 'weeklySpecificHour' },
      
      // 每月特定时间
      { pattern: /每月\s*(\d{1,2})号\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'monthlySpecificTime' },
      { pattern: /每月\s*(\d{1,2})号\s*(\d{1,2})点/, type: 'monthlySpecificHour' },
      { pattern: /每月\s*(\d{1,2})日\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'monthlySpecificTime' },
      { pattern: /每月\s*(\d{1,2})日\s*(\d{1,2})点/, type: 'monthlySpecificHour' },
      
      // 相对时间（精确）
      { pattern: /(\d+)\s*小时\s*(\d+)\s*分钟后/, type: 'hoursMinutesLater' },
      { pattern: /(\d+)\s*小时\s*(\d+)\s*分钟后/, type: 'hoursMinutesLater' },
      { pattern: /(\d+)\s*小时\s*(\d+)\s*分后/, type: 'hoursMinutesLater' },
      
      // 相对时间（小时）
      { pattern: /(\d+)\s*小时\s*后/, type: 'hoursLater' },
      { pattern: /(\d+)\s*小时后/, type: 'hoursLater' },
      { pattern: /(\d+)\s*个\s*小时\s*后/, type: 'hoursLater' },
      { pattern: /(\d+)\s*个\s*小时后/, type: 'hoursLater' },
      
      // 相对时间（分钟）
      { pattern: /(\d+)\s*分钟\s*后/, type: 'minutesLater' },
      { pattern: /(\d+)\s*分钟后/, type: 'minutesLater' },
      { pattern: /(\d+)\s*个\s*分钟\s*后/, type: 'minutesLater' },
      { pattern: /(\d+)\s*个\s*分钟后/, type: 'minutesLater' },
      
      // 相对时间（秒）
      { pattern: /(\d+)\s*秒\s*后/, type: 'secondsLater' },
      { pattern: /(\d+)\s*秒后/, type: 'secondsLater' },
      
      // 中文数字相对时间
      { pattern: /(一|两|三|四|五|六|七|八|九|十)\s*小时\s*后/, type: 'hoursLaterChinese' },
      { pattern: /(一|两|三|四|五|六|七|八|九|十)\s*分钟后/, type: 'minutesLaterChinese' },
      { pattern: /(一|两|三|四|五|六|七|八|九|十)\s*秒后/, type: 'secondsLaterChinese' },
      
      // 英文简写时间单位
      { pattern: /(\d+)\s*[Ss]\s*后/, type: 'secondsLater' },
      { pattern: /(\d+)\s*[Mm]\s*后/, type: 'minutesLater' },
      { pattern: /(\d+)\s*[Hh]\s*后/, type: 'hoursLater' },
      { pattern: /(\d+)\s*[Dd]\s*后/, type: 'daysLater' },
      
      // 具体日期
      { pattern: /明天/, type: 'tomorrowDate' },
      { pattern: /后天/, type: 'dayAfterTomorrowDate' },
      { pattern: /大后天/, type: 'dayAfterDayAfterTomorrowDate' },
      { pattern: /昨天/, type: 'yesterdayDate' },
      { pattern: /前天/, type: 'dayBeforeYesterdayDate' },
      
      // 星期相关
      { pattern: /下\s*周\s*([一二三四五六日天])\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'nextWeekSpecificTime' },
      { pattern: /下\s*周\s*([一二三四五六日天])\s*(\d{1,2})点/, type: 'nextWeekSpecificHour' },
      { pattern: /下\s*周\s*([一二三四五六日天])/, type: 'nextWeek' },
      { pattern: /下\s*个\s*([一二三四五六日天])/, type: 'nextWeek' },
      { pattern: /这\s*周\s*([一二三四五六日天])\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'thisWeekSpecificTime' },
      { pattern: /这\s*周\s*([一二三四五六日天])\s*(\d{1,2})点/, type: 'thisWeekSpecificHour' },
      { pattern: /这\s*周\s*([一二三四五六日天])/, type: 'thisWeek' },
      
      // 周末
      { pattern: /下\s*个\s*周末\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'nextWeekendSpecificTime' },
      { pattern: /下\s*个\s*周末\s*(\d{1,2})点/, type: 'nextWeekendSpecificHour' },
      { pattern: /下\s*个\s*周末/, type: 'nextWeekend' },
      { pattern: /下\s*周末\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'nextWeekendSpecificTime' },
      { pattern: /下\s*周末\s*(\d{1,2})点/, type: 'nextWeekendSpecificHour' },
      { pattern: /下\s*周末/, type: 'nextWeekend' },
      
      // 月度时间
      { pattern: /(月底|月末)\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'endOfMonthTime' },
      { pattern: /(月底|月末)\s*(\d{1,2})点/, type: 'endOfMonthHour' },
      { pattern: /(月初|月初)\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'beginOfMonthTime' },
      { pattern: /(月初|月初)\s*(\d{1,2})点/, type: 'beginOfMonthHour' },
      { pattern: /(月中|月中)\s*(\d{1,2})点\s*(\d{1,2})分/, type: 'midOfMonthTime' },
      { pattern: /(月中|月中)\s*(\d{1,2})点/, type: 'midOfMonthHour' },
      
      // 标准时间格式
      { pattern: /(\d{1,2}):(\d{1,2})/, type: 'time' },
      { pattern: /(\d{1,2})点\s*(\d{1,2})分/, type: 'timeChinese' },
      { pattern: /(\d{1,2})点/, type: 'timeHourOnly' },
      
      // 口语化时间
      { pattern: /(一会儿|等会儿|稍后|过会儿)/, type: 'soon' },
      { pattern: /(马上|立刻|立即)/, type: 'immediately' },
      { pattern: /(现在|当前)/, type: 'now' },
      
      // 时段默认时间
      { pattern: /(早上|上午)/, type: 'morningDefault' },
      { pattern: /(中午)/, type: 'noonDefault' },
      { pattern: /(下午)/, type: 'afternoonDefault' },
      { pattern: /(傍晚)/, type: 'duskDefault' },
      { pattern: /(晚上|夜里|夜间)/, type: 'eveningDefault' },
      { pattern: /(凌晨)/, type: 'lateNightDefault' },
      
      // 饭点时间
      { pattern: /(饭点|吃饭时间|午饭|午餐)/, type: 'lunchDefault' },
      { pattern: /(晚饭|晚餐|晚饭点)/, type: 'dinnerDefault' },
      { pattern: /(早饭|早餐|早饭点)/, type: 'breakfastDefault' },
      
      // 模糊时间
      { pattern: /(\d{1,2})点左右/, type: 'aroundHour' },
      { pattern: /(\d{1,2})点多/, type: 'aroundHour' },
      { pattern: /(\d{1,2})点前/, type: 'beforeHour' },
      { pattern: /(\d{1,2})点后/, type: 'afterHour' },
      
      // 每天重复
      { pattern: /每天\s*(\d{1,2})点/, type: 'dailySimple' },
      { pattern: /每日\s*(\d{1,2})点/, type: 'dailySimple' },
      { pattern: /天天\s*(\d{1,2})点/, type: 'dailySimple' },
      
      // 每周重复
      { pattern: /每周\s*(\d{1,2})点/, type: 'weeklySimple' },
      { pattern: /每\s*周\s*(\d{1,2})点/, type: 'weeklySimple' },
      
      // 每月重复
      { pattern: /每月\s*(\d{1,2})点/, type: 'monthlySimple' },
      { pattern: /每\s*月\s*(\d{1,2})点/, type: 'monthlySimple' },
      
      // 每年重复
      { pattern: /每年\s*(\d{1,2})点/, type: 'yearlySimple' },
      { pattern: /每\s*年\s*(\d{1,2})点/, type: 'yearlySimple' },
      
      // 工作日/周末重复
      { pattern: /工作日\s*(\d{1,2})点/, type: 'workdaySimple' },
      { pattern: /周末\s*(\d{1,2})点/, type: 'weekendSimple' },
      
      // 相对日期（不带时间）
      { pattern: /(一|两|三|四|五|六|七|八|九|十|百|千|万)\s*天\s*后/, type: 'daysLater' },
      { pattern: /(\d+)\s*天\s*后/, type: 'daysLater' },
      { pattern: /(一|两|三|四|五|六|七|八|九|十|百|千|万)\s*周\s*后/, type: 'weeksLater' },
      { pattern: /(\d+)\s*周\s*后/, type: 'weeksLater' },
      { pattern: /(一|两|三|四|五|六|七|八|九|十|百|千|万)\s*月\s*后/, type: 'monthsLater' },
      { pattern: /(\d+)\s*月\s*后/, type: 'monthsLater' },
      
      // 时段+时间
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
    
    try {
      switch (type) {
        case 'dailyTime':
          const hour = parseInt(match[1]);
          const minute = parseInt(match[2]);
          targetTime.setDate(now.getDate());
          targetTime.setHours(hour, minute, 0, 0);
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'tomorrowWithMinutes':
          const timeOfDay1 = match[1];
          const hour1 = parseInt(match[2]);
          const minute1 = parseInt(match[3]);
          let adjustedHour1 = this.adjustHourForTimeOfDay(hour1, timeOfDay1);
          targetTime.setDate(now.getDate() + 1);
          targetTime.setHours(adjustedHour1, minute1, 0, 0);
          break;
          
        case 'todayWithMinutes':
          const timeOfDay2 = match[1];
          const hour2 = parseInt(match[2]);
          const minute2 = parseInt(match[3]);
          let adjustedHour2 = this.adjustHourForTimeOfDay(hour2, timeOfDay2);
          targetTime.setDate(now.getDate());
          targetTime.setHours(adjustedHour2, minute2, 0, 0);
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'dayAfterTomorrowWithMinutes':
          const timeOfDay3 = match[1];
          const hour3 = parseInt(match[2]);
          const minute3 = parseInt(match[3]);
          let adjustedHour3 = this.adjustHourForTimeOfDay(hour3, timeOfDay3);
          targetTime.setDate(now.getDate() + 2);
          targetTime.setHours(adjustedHour3, minute3, 0, 0);
          break;
          
        case 'tonightWithMinutes':
          const hour4 = parseInt(match[1]);
          const minute4 = parseInt(match[2]);
          targetTime.setDate(now.getDate());
          targetTime.setHours(hour4, minute4, 0, 0);
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'tomorrowNightWithMinutes':
          const hour5 = parseInt(match[1]);
          const minute5 = parseInt(match[2]);
          targetTime.setDate(now.getDate() + 1);
          targetTime.setHours(hour5, minute5, 0, 0);
          break;
          
        case 'workdayTime':
          const hour6 = parseInt(match[1]);
          const minute6 = parseInt(match[2]);
          targetTime = this.getNextWorkdayTime(hour6, minute6);
          break;
          
        case 'weekendTime':
          const hour7 = parseInt(match[1]);
          const minute7 = parseInt(match[2]);
          targetTime = this.getNextWeekendTime(hour7, minute7);
          break;
          
        case 'weeklySpecificTime':
          const weekDay = this.chineseWeekdayToNumber(match[1]);
          const hour8 = parseInt(match[2]);
          const minute8 = parseInt(match[3]);
          targetTime = this.getNextWeekdayTime(hour8, minute8, weekDay);
          break;
          
        case 'monthlySpecificTime':
          const day = parseInt(match[1]);
          const hour9 = parseInt(match[2]);
          const minute9 = parseInt(match[3]);
          targetTime = this.getNextMonthDayTime(day, hour9, minute9);
          break;
          
        case 'hoursMinutesLater':
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          targetTime.setTime(now.getTime() + hours * 60 * 60 * 1000 + minutes * 60 * 1000);
          break;
          
        case 'nextWeekSpecificTime':
          const weekDay2 = this.chineseWeekdayToNumber(match[1]);
          const hour10 = parseInt(match[2]);
          const minute10 = parseInt(match[3]);
          targetTime = this.getNextWeekdayTime(hour10, minute10, weekDay2, 1);
          break;
          
        case 'thisWeekSpecificTime':
          const weekDay3 = this.chineseWeekdayToNumber(match[1]);
          const hour11 = parseInt(match[2]);
          const minute11 = parseInt(match[3]);
          targetTime = this.getNextWeekdayTime(hour11, minute11, weekDay3, 0);
          break;
          
        case 'nextWeekendSpecificTime':
          const hour12 = parseInt(match[1]);
          const minute12 = parseInt(match[2]);
          targetTime = this.getNextWeekendTime(hour12, minute12);
          break;
          
        case 'endOfMonthTime':
          const hour13 = parseInt(match[2]);
          const minute13 = parseInt(match[3]);
          targetTime = this.getEndOfMonthTime(hour13, minute13);
          break;
          
        case 'beginOfMonthTime':
          const hour14 = parseInt(match[2]);
          const minute14 = parseInt(match[3]);
          targetTime = this.getBeginOfMonthTime(hour14, minute14);
          break;
          
        case 'midOfMonthTime':
          const hour15 = parseInt(match[2]);
          const minute15 = parseInt(match[3]);
          targetTime = this.getMidOfMonthTime(hour15, minute15);
          break;
          
        case 'timeChinese':
          const hour16 = parseInt(match[1]);
          const minute16 = parseInt(match[2]);
          targetTime.setDate(now.getDate());
          targetTime.setHours(hour16, minute16, 0, 0);
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'timeHourOnly':
          const hour17 = parseInt(match[1]);
          targetTime.setDate(now.getDate());
          targetTime.setHours(hour17, 0, 0, 0);
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'soon':
          targetTime.setTime(now.getTime() + 10 * 60 * 1000); // 10分钟后
          break;
          
        case 'immediately':
          targetTime.setTime(now.getTime() + 1 * 60 * 1000); // 1分钟后
          break;
          
        case 'now':
          targetTime.setTime(now.getTime() + 1 * 60 * 1000); // 1分钟后
          break;
          
        case 'morningDefault':
          targetTime.setDate(now.getDate());
          targetTime.setHours(9, 0, 0, 0); // 默认上午9点
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'noonDefault':
          targetTime.setDate(now.getDate());
          targetTime.setHours(12, 0, 0, 0); // 默认中午12点
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'afternoonDefault':
          targetTime.setDate(now.getDate());
          targetTime.setHours(15, 0, 0, 0); // 默认下午3点
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'eveningDefault':
          targetTime.setDate(now.getDate());
          targetTime.setHours(19, 0, 0, 0); // 默认晚上7点
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'lunchDefault':
          targetTime.setDate(now.getDate());
          targetTime.setHours(12, 0, 0, 0); // 默认午饭时间12点
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'dinnerDefault':
          targetTime.setDate(now.getDate());
          targetTime.setHours(18, 0, 0, 0); // 默认晚饭时间6点
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'breakfastDefault':
          targetTime.setDate(now.getDate());
          targetTime.setHours(8, 0, 0, 0); // 默认早饭时间8点
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'aroundHour':
          const hour18 = parseInt(match[1]);
          targetTime.setDate(now.getDate());
          targetTime.setHours(hour18, 30, 0, 0); // 默认半点
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'beforeHour':
          const hour19 = parseInt(match[1]);
          targetTime.setDate(now.getDate());
          targetTime.setHours(hour19 - 1, 30, 0, 0); // 提前1.5小时
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'afterHour':
          const hour20 = parseInt(match[1]);
          targetTime.setDate(now.getDate());
          targetTime.setHours(hour20 + 1, 30, 0, 0); // 延后1.5小时
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'dailySimple':
          const hour21 = parseInt(match[1]);
          targetTime.setDate(now.getDate());
          targetTime.setHours(hour21, 0, 0, 0);
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'weeklySimple':
          const hour22 = parseInt(match[1]);
          targetTime = this.getNextWeekdayTime(hour22, 0);
          break;
          
        case 'monthlySimple':
          const hour23 = parseInt(match[1]);
          targetTime = this.getNextMonthDayTime(1, hour23, 0);
          break;
          
        case 'yearlySimple':
          const hour24 = parseInt(match[1]);
          targetTime.setDate(now.getDate());
          targetTime.setHours(hour24, 0, 0, 0);
          if (targetTime <= now) {
            targetTime.setFullYear(targetTime.getFullYear() + 1);
          }
          break;
          
        case 'workdaySimple':
          const hour25 = parseInt(match[1]);
          targetTime = this.getNextWorkdayTime(hour25, 0);
          break;
          
        case 'weekendSimple':
          const hour26 = parseInt(match[1]);
          targetTime = this.getNextWeekendTime(hour26, 0);
          break;
          
        case 'tomorrowDate':
          targetTime.setDate(now.getDate() + 1);
          targetTime.setHours(9, 0, 0, 0); // 默认上午9点
          break;
          
        case 'dayAfterTomorrowDate':
          targetTime.setDate(now.getDate() + 2);
          targetTime.setHours(9, 0, 0, 0); // 默认上午9点
          break;
          
        case 'dayAfterDayAfterTomorrowDate':
          targetTime.setDate(now.getDate() + 3);
          targetTime.setHours(9, 0, 0, 0); // 默认上午9点
          break;
          
        case 'yesterdayDate':
          targetTime.setDate(now.getDate() - 1);
          targetTime.setHours(9, 0, 0, 0); // 默认上午9点
          break;
          
        case 'dayBeforeYesterdayDate':
          targetTime.setDate(now.getDate() - 2);
          targetTime.setHours(9, 0, 0, 0); // 默认上午9点
          break;
          
        case 'nextWeek':
          const weekDay4 = this.chineseWeekdayToNumber(match[1]);
          targetTime = this.getNextWeekdayTime(9, 0, weekDay4, 1);
          break;
          
        case 'thisWeek':
          const weekDay5 = this.chineseWeekdayToNumber(match[1]);
          targetTime = this.getNextWeekdayTime(9, 0, weekDay5, 0);
          break;
          
        case 'nextWeekend':
          targetTime = this.getNextWeekendTime(9, 0);
          break;
          
        case 'endOfMonth':
          targetTime = this.getEndOfMonthTime(9, 0);
          break;
          
        case 'beginOfMonth':
          targetTime = this.getBeginOfMonthTime(9, 0);
          break;
          
        case 'midOfMonth':
          targetTime = this.getMidOfMonthTime(9, 0);
          break;
          
        case 'time':
          const hour27 = parseInt(match[1]);
          const minute27 = parseInt(match[2]);
          targetTime.setDate(now.getDate());
          targetTime.setHours(hour27, minute27, 0, 0);
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'timeOfDay':
          const timeOfDay4 = match[1];
          const hour28 = parseInt(match[2]);
          const minute28 = parseInt(match[3] || 0);
          let adjustedHour28 = this.adjustHourForTimeOfDay(hour28, timeOfDay4);
          targetTime.setDate(now.getDate());
          targetTime.setHours(adjustedHour28, minute28, 0, 0);
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        // 保持原有的处理逻辑
        case 'tomorrow':
          const hour29 = parseInt(match[2]);
          const timeOfDay5 = match[1];
          let adjustedHour29 = this.adjustHourForTimeOfDay(hour29, timeOfDay5);
          targetTime.setDate(now.getDate() + 1);
          targetTime.setHours(adjustedHour29, 0, 0, 0);
          break;
          
        case 'today':
          const hour30 = parseInt(match[2]);
          const timeOfDay6 = match[1];
          let adjustedHour30 = this.adjustHourForTimeOfDay(hour30, timeOfDay6);
          targetTime.setDate(now.getDate());
          targetTime.setHours(adjustedHour30, 0, 0, 0);
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'dayAfterTomorrow':
          const hour31 = parseInt(match[2]);
          const timeOfDay7 = match[1];
          let adjustedHour31 = this.adjustHourForTimeOfDay(hour31, timeOfDay7);
          targetTime.setDate(now.getDate() + 2);
          targetTime.setHours(adjustedHour31, 0, 0, 0);
          break;
          
        case 'tonight':
          const hour32 = parseInt(match[1]);
          targetTime.setDate(now.getDate());
          targetTime.setHours(hour32, 0, 0, 0);
          if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
          break;
          
        case 'tomorrowNight':
          const hour33 = parseInt(match[1]);
          targetTime.setDate(now.getDate() + 1);
          targetTime.setHours(hour33, 0, 0, 0);
          break;
          
        case 'hoursLater':
          const hours2 = parseInt(match[1]);
          targetTime.setTime(now.getTime() + hours2 * 60 * 60 * 1000);
          break;
          
        case 'minutesLater':
          const minutes2 = parseInt(match[1]);
          targetTime.setTime(now.getTime() + minutes2 * 60 * 1000);
          break;
          
        case 'secondsLater':
          const seconds = parseInt(match[1]);
          targetTime.setTime(now.getTime() + seconds * 1000);
          break;
          
        case 'daysLater':
          const days = this.chineseToNumber(match[1]);
          targetTime.setDate(now.getDate() + days);
          targetTime.setHours(9, 0, 0, 0); // 默认上午9点
          break;
          
        case 'weeksLater':
          const weeks = this.chineseToNumber(match[1]);
          targetTime.setDate(now.getDate() + weeks * 7);
          targetTime.setHours(9, 0, 0, 0); // 默认上午9点
          break;
          
        case 'monthsLater':
          const months = this.chineseToNumber(match[1]);
          targetTime.setMonth(now.getMonth() + months);
          targetTime.setHours(9, 0, 0, 0); // 默认上午9点
          break;
          
        case 'hoursLaterChinese':
          const hours3 = this.chineseToNumber(match[1]);
          targetTime.setTime(now.getTime() + hours3 * 60 * 60 * 1000);
          break;
          
        case 'minutesLaterChinese':
          const minutes3 = this.chineseToNumber(match[1]);
          targetTime.setTime(now.getTime() + minutes3 * 60 * 1000);
          break;
          
        case 'secondsLaterChinese':
          const seconds2 = this.chineseToNumber(match[1]);
          targetTime.setTime(now.getTime() + seconds2 * 1000);
          break;
          
        case 'weeklySpecificHour':
          const weekDayHour1 = this.chineseWeekdayToNumber(match[1]);
          const hourHour1 = parseInt(match[2]);
          targetTime = this.getNextWeekdayTime(hourHour1, 0, weekDayHour1);
          break;
          
        case 'monthlySpecificHour':
          const dayHour1 = parseInt(match[1]);
          const hourHour2 = parseInt(match[2]);
          targetTime = this.getNextMonthDayTime(dayHour1, hourHour2, 0);
          break;
          
        case 'nextWeekSpecificHour':
          const weekDayHour2 = this.chineseWeekdayToNumber(match[1]);
          const hourHour3 = parseInt(match[2]);
          targetTime = this.getNextWeekdayTime(hourHour3, 0, weekDayHour2, 1);
          break;
          
        case 'thisWeekSpecificHour':
          const weekDayHour3 = this.chineseWeekdayToNumber(match[1]);
          const hourHour4 = parseInt(match[2]);
          targetTime = this.getNextWeekdayTime(hourHour4, 0, weekDayHour3, 0);
          break;
          
        case 'nextWeekendSpecificHour':
          const hourHour5 = parseInt(match[1]);
          targetTime = this.getNextWeekendTime(hourHour5, 0);
          break;
          
        case 'endOfMonthHour':
          const hourHour6 = parseInt(match[1]);
          targetTime = this.getEndOfMonthTime(hourHour6, 0);
          break;
          
        case 'beginOfMonthHour':
          const hourHour7 = parseInt(match[1]);
          targetTime = this.getBeginOfMonthTime(hourHour7, 0);
          break;
          
        case 'midOfMonthHour':
          const hourHour8 = parseInt(match[1]);
          targetTime = this.getMidOfMonthTime(hourHour8, 0);
          break;
          
        default:
          console.warn(`未知的时间类型: ${type}`);
          return null;
      }
      
      return targetTime;
      
    } catch (error) {
      console.error(`解析时间失败 (类型: ${type}):`, error);
      return null;
    }
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

  // 新增：调整小时数根据时段
  adjustHourForTimeOfDay(hour, timeOfDay) {
    if (!timeOfDay) return hour;
    
    switch (timeOfDay) {
      case '下午':
        return hour < 12 ? hour + 12 : hour;
      case '晚上':
      case '夜里':
      case '夜间':
        return hour < 12 ? hour + 12 : hour;
      case '上午':
        return hour === 12 ? 0 : hour;
      case '中午':
        return hour === 12 ? 12 : hour;
      default:
        return hour;
    }
  }

  // 新增：获取下一个工作日时间
  getNextWorkdayTime(hour, minute, weekDay = null, weekOffset = 0) {
    const now = new Date();
    let targetTime = new Date();
    
    if (weekDay !== null) {
      // 指定星期几
      targetTime = this.getNextWeekdayTime(hour, minute, weekDay, weekOffset);
    } else {
      // 下一个工作日（周一到周五）
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, minute, 0, 0);
      
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
      // 跳过周末
      while (targetTime.getDay() === 0 || targetTime.getDay() === 6) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
    }
    
    return targetTime;
  }

  // 新增：获取下一个周末时间
  getNextWeekendTime(hour, minute) {
    const now = new Date();
    let targetTime = new Date();
    
    targetTime.setDate(now.getDate());
    targetTime.setHours(hour, minute, 0, 0);
    
    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    // 找到下一个周末
    while (targetTime.getDay() !== 0 && targetTime.getDay() !== 6) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    return targetTime;
  }

  // 新增：获取下一个指定星期几的时间
  getNextWeekdayTime(hour, minute, weekDay, weekOffset = 0) {
    const now = new Date();
    let targetTime = new Date();
    
    // 计算目标日期
    const currentWeekDay = now.getDay();
    const daysToAdd = (weekDay - currentWeekDay + 7 + weekOffset * 7) % 7;
    
    if (daysToAdd === 0 && now.getHours() >= hour) {
      // 如果今天是目标日期但时间已过，设置为下周
      targetTime.setDate(now.getDate() + 7);
    } else {
      targetTime.setDate(now.getDate() + daysToAdd);
    }
    
    targetTime.setHours(hour, minute, 0, 0);
    return targetTime;
  }

  // 新增：获取下一个指定日期的时间
  getNextMonthDayTime(day, hour, minute) {
    const now = new Date();
    let targetTime = new Date();
    
    targetTime.setDate(day);
    targetTime.setHours(hour, minute, 0, 0);
    
    if (targetTime <= now) {
      // 如果本月已过，设置为下月
      targetTime.setMonth(targetTime.getMonth() + 1);
    }
    
    return targetTime;
  }

  // 新增：获取月底时间
  getEndOfMonthTime(hour, minute) {
    const now = new Date();
    let targetTime = new Date();
    
    // 设置为当前月的最后一天
    targetTime.setMonth(targetTime.getMonth() + 1, 0);
    targetTime.setHours(hour, minute, 0, 0);
    
    if (targetTime <= now) {
      // 如果本月已过，设置为下月
      targetTime.setMonth(targetTime.getMonth() + 1, 0);
    }
    
    return targetTime;
  }

  // 新增：获取月初时间
  getBeginOfMonthTime(hour, minute) {
    const now = new Date();
    let targetTime = new Date();
    
    // 设置为当前月的第一天
    targetTime.setDate(1);
    targetTime.setHours(hour, minute, 0, 0);
    
    if (targetTime <= now) {
      // 如果本月已过，设置为下月
      targetTime.setMonth(targetTime.getMonth() + 1, 1);
    }
    
    return targetTime;
  }

  // 新增：获取月中时间
  getMidOfMonthTime(hour, minute) {
    const now = new Date();
    let targetTime = new Date();
    
    // 设置为当前月的第15天
    targetTime.setDate(15);
    targetTime.setHours(hour, minute, 0, 0);
    
    if (targetTime <= now) {
      // 如果本月已过，设置为下月
      targetTime.setMonth(targetTime.getMonth() + 1, 15);
    }
    
    return targetTime;
  }

  // 新增：中文星期转数字
  chineseWeekdayToNumber(chinese) {
    const weekMap = {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0
    };
    return weekMap[chinese] || 1;
  }

  // 新增：智能内容提取
  extractSmartContent(text) {
    const content = {
      action: '',           // 动作
      object: '',           // 对象
      location: '',         // 地点
      person: '',           // 人物
      description: '',      // 描述
      urgency: '',          // 紧急程度
      notes: ''             // 备注
    };

    // 提取动作
    const actionPatterns = [
      /提醒我\s*(.+)/,
      /记得\s*(.+)/,
      /帮我\s*(.+)/,
      /请\s*(.+)/,
      /麻烦\s*(.+)/,
      /需要\s*(.+)/,
      /要\s*(.+)/,
      /准备\s*(.+)/,
      /安排\s*(.+)/,
      /计划\s*(.+)/,
      /处理\s*(.+)/,
      /完成\s*(.+)/,
      /检查\s*(.+)/,
      /确认\s*(.+)/,
      /联系\s*(.+)/,
      /通知\s*(.+)/,
      /回复\s*(.+)/,
      /提交\s*(.+)/,
      /审核\s*(.+)/,
      /审批\s*(.+)/
    ];

    for (const pattern of actionPatterns) {
      const match = text.match(pattern);
      if (match) {
        content.action = match[1].trim();
        break;
      }
    }

    // 提取地点
    const locationPatterns = [
      /在\s*(.+?)(?:\s*提醒|\s*记得|\s*帮我|\s*请|\s*麻烦|\s*需要|\s*要|\s*准备|\s*安排|\s*计划|\s*处理|\s*完成|\s*检查|\s*确认|\s*联系|\s*通知|\s*回复|\s*提交|\s*审核|\s*审批|$)/,
      /到\s*(.+?)(?:\s*提醒|\s*记得|\s*帮我|\s*请|\s*麻烦|\s*需要|\s*要|\s*准备|\s*安排|\s*计划|\s*处理|\s*完成|\s*检查|\s*确认|\s*联系|\s*通知|\s*回复|\s*提交|\s*审核|\s*审批|$)/,
      /去\s*(.+?)(?:\s*提醒|\s*记得|\s*帮我|\s*请|\s*麻烦|\s*需要|\s*要|\s*准备|\s*安排|\s*计划|\s*处理|\s*完成|\s*检查|\s*确认|\s*联系|\s*通知|\s*回复|\s*提交|\s*审核|\s*审批|$)/
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        content.location = match[1].trim();
        break;
      }
    }

    // 提取人物
    const personPatterns = [
      /和\s*(.+?)(?:\s*一起|\s*见面|\s*开会|\s*讨论|\s*商量|\s*确认|\s*联系|\s*通知|\s*回复|\s*提交|\s*审核|\s*审批|$)/,
      /给\s*(.+?)(?:\s*打电话|\s*发邮件|\s*发消息|\s*发微信|\s*发短信|\s*通知|\s*汇报|\s*报告|\s*提交|\s*审核|\s*审批|$)/,
      /向\s*(.+?)(?:\s*汇报|\s*报告|\s*提交|\s*申请|\s*请示|\s*确认|\s*反馈|\s*通知|$)/
    ];

    for (const pattern of personPatterns) {
      const match = text.match(pattern);
      if (match) {
        content.person = match[1].trim();
        break;
      }
    }

    // 提取紧急程度
    const urgencyPatterns = [
      /(紧急|urgent|立即|马上|立刻|asap|as soon as possible)/,
      /(重要|high|关键|critical)/,
      /(普通|normal|一般|常规)/,
      /(低|low|不急|慢慢|不急)/
    ];

    for (const pattern of urgencyPatterns) {
      const match = text.match(pattern);
      if (match) {
        content.urgency = match[1];
        break;
      }
    }

    // 提取备注
    const notePatterns = [
      /备注[：:]\s*(.+)/,
      /说明[：:]\s*(.+)/,
      /注意[：:]\s*(.+)/,
      /详情[：:]\s*(.+)/,
      /note[：:]\s*(.+)/,
      /description[：:]\s*(.+)/
    ];

    for (const pattern of notePatterns) {
      const match = text.match(pattern);
      if (match) {
        content.notes = match[1].trim();
        break;
      }
    }

    // 智能组合内容
    if (content.action && !content.object) {
      content.object = content.action;
    }

    if (content.action && content.location) {
      content.description = `在${content.location}${content.action}`;
    } else if (content.action && content.person) {
      content.description = `和${content.person}${content.action}`;
    } else if (content.action) {
      content.description = content.action;
    }

    return content;
  }

  // 新增：智能标签生成
  generateSmartTags(content, category, priority) {
    const tags = [];
    
    // 基于内容的标签
    if (content.action) {
      if (content.action.includes('开会') || content.action.includes('会议')) {
        tags.push('会议');
      }
      if (content.action.includes('报告') || content.action.includes('汇报')) {
        tags.push('报告');
      }
      if (content.action.includes('项目') || content.action.includes('任务')) {
        tags.push('项目');
      }
      if (content.action.includes('检查') || content.action.includes('确认')) {
        tags.push('检查');
      }
      if (content.action.includes('联系') || content.action.includes('通知')) {
        tags.push('沟通');
      }
    }

    // 基于地点的标签
    if (content.location) {
      if (content.location.includes('公司') || content.location.includes('办公室')) {
        tags.push('工作');
      }
      if (content.location.includes('家') || content.location.includes('家里')) {
        tags.push('生活');
      }
      if (content.location.includes('医院') || content.location.includes('诊所')) {
        tags.push('健康');
      }
      if (content.location.includes('学校') || content.location.includes('教室')) {
        tags.push('学习');
      }
    }

    // 基于人物的标签
    if (content.person) {
      if (content.person.includes('老板') || content.person.includes('领导') || content.person.includes('经理')) {
        tags.push('工作');
      }
      if (content.person.includes('朋友') || content.person.includes('同学')) {
        tags.push('社交');
      }
      if (content.person.includes('医生') || content.person.includes('护士')) {
        tags.push('健康');
      }
    }

    // 基于分类的标签
    if (category) {
      tags.push(category);
    }

    // 基于优先级的标签
    if (priority === 'urgent') {
      tags.push('紧急');
    } else if (priority === 'high') {
      tags.push('重要');
    }

    // 去重并返回
    return [...new Set(tags)];
  }

  // 新增：解析优先级
  parsePriority(text) {
    if (!text) return 'normal';
    
    const priorityPatterns = [
      { pattern: /(紧急|urgent|立即|马上|立刻|asap|as soon as possible)/, priority: 'urgent' },
      { pattern: /(重要|high|关键|critical)/, priority: 'high' },
      { pattern: /(普通|normal|一般|常规)/, priority: 'normal' },
      { pattern: /(低|low|不急|慢慢|不急)/, priority: 'low' }
    ];

    for (const { pattern, priority } of priorityPatterns) {
      if (pattern.test(text)) {
        return priority;
      }
    }
    
    return 'normal';
  }

  // 新增：解析分类
  parseCategory(text) {
    if (!text) return 'general';
    
    const categoryPatterns = [
      { pattern: /(工作|work|上班|会议|开会|项目|任务|deadline|公司|办公室|会议室)/, category: 'work' },
      { pattern: /(生活|life|吃饭|睡觉|购物|买菜|家务|家|家里|做饭|健身)/, category: 'life' },
      { pattern: /(学习|study|读书|上课|作业|考试|复习|学校|教室|培训)/, category: 'study' },
      { pattern: /(健康|health|运动|健身|跑步|瑜伽|吃药|医院|体检|诊所)/, category: 'health' },
      { pattern: /(娱乐|entertainment|游戏|打游戏|电竞|电影|爬山|旅游|旅行)/, category: 'entertainment' },
      { pattern: /(财务|finance|钱|工资|房租|账单|投资|理财)/, category: 'finance' }
    ];

    for (const { pattern, category } of categoryPatterns) {
      if (pattern.test(text)) {
        return category;
      }
    }
    
    return 'general';
  }

  // 新增：解析重复模式
  parseRepeatPattern(text) {
    if (!text) return 'none';
    
    const repeatPatterns = [
      { pattern: /(每天|daily|天天|每日)/, repeatType: 'daily' },
      { pattern: /(每周|weekly|星期|周)/, repeatType: 'weekly' },
      { pattern: /(每月|monthly|月)/, repeatType: 'monthly' },
      { pattern: /(每年|yearly|年)/, repeatType: 'yearly' },
      { pattern: /(工作日|workday)/, repeatType: 'workdays' },
      { pattern: /(周末|weekend)/, repeatType: 'weekends' }
    ];

    for (const { pattern, repeatType } of repeatPatterns) {
      if (pattern.test(text)) {
        return repeatType;
      }
    }
    
    return 'none';
  }

  // 新增：解析标签
  parseTags(text) {
    if (!text) return [];
    
    const tags = [];
    
    // 提取#标签
    const hashTags = text.match(/#(\w+)/g);
    if (hashTags) {
      tags.push(...hashTags.map(tag => tag.substring(1)));
    }
    
    // 提取关键词标签
    const keywordTags = [
      '会议', '报告', '项目', '任务', '检查', '确认', '联系', '通知',
      '工作', '生活', '学习', '健康', '娱乐', '财务', '紧急', '重要'
    ];
    
    keywordTags.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.push(keyword);
      }
    });
    
    return [...new Set(tags)];
  }

  // 新增：解析备注
  parseNotes(text) {
    if (!text) return '';
    
    const noteSeparators = [
      '备注：', '备注:', '说明：', '说明:', '注意：', '注意:', 
      '详情：', '详情:', 'note：', 'note:', 'description：', 'description:'
    ];
    
    for (const separator of noteSeparators) {
      const index = text.indexOf(separator);
      if (index !== -1) {
        return text.substring(index + separator.length).trim();
      }
    }
    
    return '';
  }
}

module.exports = SmartParser; 