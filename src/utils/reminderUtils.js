// 提醒工具函数模块

// 格式化提醒消息
function formatReminderMessage(reminder) {
  const priorityText = getPriorityText(reminder.priority);
  const categoryText = reminder.category ? reminder.category.name : '无分类';
  const tagsText = reminder.tags && reminder.tags.length > 0 ? `\n🏷️ 标签：${reminder.tags.join(', ')}` : '';
  const notesText = reminder.notes ? `\n📝 备注：${reminder.notes}` : '';
  const repeatText = reminder.repeatPattern ? `\n🔄 重复：${getRepeatText(reminder.repeatPattern)}` : '';

  return `⏰ 提醒详情\n\n💬 内容：${reminder.message}\n📅 时间：${reminder.reminderTime.toLocaleString('zh-CN')}\n🏷️ 分类：${categoryText}\n⭐ 优先级：${priorityText}${tagsText}${notesText}${repeatText}\n\n⏱️ 状态：${reminder.isCompleted ? '✅ 已完成' : '⏳ 待处理'}`;
}

// 创建操作按钮
function createActionButtons(reminderId) {
  return {
    inline_keyboard: [
      [
        { text: '✅ 完成', callback_data: `complete_${reminderId}` },
        { text: '⏰ 延后10分钟', callback_data: `delay_${reminderId}` }
      ],
      [
        { text: '🔔 小睡5分钟', callback_data: `snooze_${reminderId}` },
        { text: '✏️ 修改', callback_data: `edit_${reminderId}` }
      ],
      [
        { text: '🗑️ 删除', callback_data: `delete_${reminderId}` }
      ]
    ]
  };
}

// 创建提醒创建后的按钮
function createReminderCreatedButtons(reminderId) {
  return {
    inline_keyboard: [
      [
        { text: '✏️ 修改', callback_data: `edit_${reminderId}` },
        { text: '❌ 取消', callback_data: `cancel_${reminderId}` }
      ]
    ]
  };
}

// 获取优先级文本
function getPriorityText(priority) {
  const priorityMap = {
    'urgent': '🔴 紧急',
    'high': '🟡 重要',
    'normal': '🟢 普通',
    'low': '🔵 低'
  };
  return priorityMap[priority] || '🟢 普通';
}

// 获取重复模式文本
function getRepeatText(repeatPattern) {
  const repeatMap = {
    'daily': '每天',
    'weekly': '每周',
    'monthly': '每月',
    'yearly': '每年',
    'workdays': '工作日',
    'weekends': '周末'
  };
  return repeatMap[repeatPattern] || repeatPattern;
}

// 创建分类选择键盘
function createCategoryKeyboard(categories, reminderId = null) {
  const keyboard = {
    inline_keyboard: [
      ...categories.map(cat => [{
        text: `${cat.icon} ${cat.name}`,
        callback_data: reminderId ? `set_category_${reminderId}_${cat.id}` : `category_${cat.id}`
      }])
    ]
  };

  if (reminderId) {
    keyboard.inline_keyboard.push([
      { text: '🔙 返回', callback_data: `back_to_edit_${reminderId}` }
    ]);
  }

  return keyboard;
}

// 创建优先级选择键盘
function createPriorityKeyboard(reminderId = null) {
  const priorities = [
    { text: '🔴 紧急', value: 'urgent' },
    { text: '🟡 重要', value: 'high' },
    { text: '🟢 普通', value: 'normal' },
    { text: '🔵 低', value: 'low' }
  ];

  const keyboard = {
    inline_keyboard: [
      ...priorities.map(p => [{
        text: p.text,
        callback_data: reminderId ? `set_priority_${reminderId}_${p.value}` : `priority_${p.value}`
      }])
    ]
  };

  if (reminderId) {
    keyboard.inline_keyboard.push([
      { text: '🔙 返回', callback_data: `back_to_edit_${reminderId}` }
    ]);
  }

  return keyboard;
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

// 验证时间格式
function validateTimeInput(timeInput) {
  // 简单的时间验证逻辑
  const timePatterns = [
    /^(\d{1,2}):(\d{2})$/, // 20:30
    /^今晚(\d{1,2})点/, // 今晚20点
    /^明天上午(\d{1,2})点/, // 明天上午9点
    /^(\d{1,2})分钟后/, // 30分钟后
    /^(\d{1,2})小时后/ // 2小时后
  ];

  return timePatterns.some(pattern => pattern.test(timeInput));
}

// 创建统计信息消息
function createStatsMessage(stats) {
  return `📊 提醒统计\n\n📝 总数：${stats.total}\n✅ 已完成：${stats.completed}\n⏳ 待处理：${stats.pending}\n🔴 紧急：${stats.urgent}\n🟡 重要：${stats.high}\n🟢 普通：${stats.normal}\n🔵 低：${stats.low}`;
}

module.exports = {
  formatReminderMessage,
  createActionButtons,
  createReminderCreatedButtons,
  getPriorityText,
  getRepeatText,
  createCategoryKeyboard,
  createPriorityKeyboard,
  formatTimeDisplay,
  validateTimeInput,
  createStatsMessage
}; 