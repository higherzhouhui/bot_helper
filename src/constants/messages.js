// 消息模板常量模块

// 欢迎消息
const WELCOME_MESSAGE = `🎉 欢迎使用智能提醒助手！\n\n📋 主要功能：\n• ⏰ 智能提醒：支持自然语言输入\n• 🏷️ 分类管理：工作、生活、学习等\n• ⭐ 优先级：紧急、重要、普通、低\n• 🔄 重复提醒：每天、每周、每月等\n• 📰 新闻资讯：最新热点新闻\n\n\n💡 使用示例：\n• "今晚20点提醒我开会"\n• "明天上午9点重要提醒：提交报告"\n• "每天提醒我喝水"\n\n🔧 常用命令：\n/start - 开始使用\n/help - 查看帮助\n/reminders - 查看提醒\n/news - 最新新闻\n/stats - 统计信息`;

// 帮助消息
const HELP_MESSAGE = `❓ 使用帮助\n\n📝 创建提醒：\n• 直接发送：今晚20点提醒我开会\n• 带分类：明天上午9点工作提醒：提交报告\n• 带优先级：今晚22点紧急提醒：检查服务器\n• 带标签：每天提醒我喝水 #健康 #生活\n• 带备注：明天提醒我买礼物 备注：老婆生日\n\n🏷️ 分类说明：\n• 工作：工作相关提醒\n• 生活：日常生活提醒\n• 学习：学习相关提醒\n• 健康：健康相关提醒\n• 财务：财务相关提醒\n\n⭐ 优先级说明：\n• 🔴 紧急：需要立即处理\n• 🟡 重要：需要优先处理\n• 🟢 普通：正常处理\n• 🔵 低：可以延后处理\n\n🔄 重复模式：\n• 每天：每天重复\n• 每周：每周重复\n• 每月：每月重复\n• 工作日：周一到周五\n• 周末：周六和周日\n\n📱 操作按钮：\n• ✅ 完成：标记提醒为已完成\n• ⏰ 延后：延后10分钟提醒\n• 🔔 小睡：5分钟后再次提醒\n• ✏️ 修改：修改提醒内容\n• 🗑️ 删除：删除提醒\n\n🔧 其他命令：\n/reminders - 查看所有提醒\n/news - 获取最新新闻\n/stats - 查看统计信息`;

// 提醒相关消息
const REMINDER_MESSAGES = {
  CREATED: '✅ 提醒创建成功！',
  UPDATED: '✅ 提醒更新成功！',
  DELETED: '✅ 提醒删除成功！',
  COMPLETED: '✅ 提醒已完成！',
  DELAYED: '⏰ 提醒已延后10分钟！',
  SNOOZED: '🔔 提醒已小睡5分钟！',
  NOT_FOUND: '❌ 提醒不存在',
  ALREADY_COMPLETED: '⚠️ 提醒已经完成',
  INVALID_TIME: '❌ 时间格式不正确',
  INVALID_PRIORITY: '❌ 优先级不正确',
  INVALID_CATEGORY: '❌ 分类不存在'
};

// 新闻相关消息
const NEWS_MESSAGES = {
  NO_NEWS: '📰 暂无新闻',
  NO_HOT_NEWS: '📰 暂无热门新闻',
  NO_CATEGORIES: '🏷️ 暂无新闻分类',
  NO_CATEGORY_NEWS: '📰 该分类暂无新闻',
  SEARCH_NO_RESULTS: '🔍 没有找到相关新闻',
  CRAWL_FAILED: '❌ 爬取新闻失败，请重试',
  GET_FAILED: '❌ 获取新闻失败，请重试'
};

// 工作相关消息
const WORK_MESSAGES = {
  NO_WORK: '💼 暂无工作信息',
  REFRESH_SUCCESS: '🔄 工作信息已刷新',
  REFRESH_FAILED: '❌ 刷新工作信息失败，请重试',
  SEARCH_NO_RESULTS: '🔍 没有找到相关工作',
  NO_COMPANY_WORK: '🏢 该公司暂无工作信息'
};

// 错误消息
const ERROR_MESSAGES = {
  GENERAL: '❌ 操作失败，请重试',
  NETWORK: '❌ 网络连接失败，请重试',
  DATABASE: '❌ 数据库操作失败，请重试',
  VALIDATION: '❌ 输入验证失败，请重试',
  PERMISSION: '❌ 权限不足',
  NOT_FOUND: '❌ 资源不存在',
  RATE_LIMIT: '❌ 请求过于频繁，请稍后再试',
  SERVER_ERROR: '❌ 服务器内部错误'
};

// 成功消息
const SUCCESS_MESSAGES = {
  OPERATION: '✅ 操作成功！',
  SAVED: '✅ 保存成功！',
  UPDATED: '✅ 更新成功！',
  DELETED: '✅ 删除成功！',
  SENT: '✅ 发送成功！',
  PROCESSED: '✅ 处理成功！'
};

// 提示消息
const INFO_MESSAGES = {
  LOADING: '⏳ 正在处理，请稍候...',
  PROCESSING: '🔄 正在处理您的请求...',
  WAITING_INPUT: '💡 请输入相关信息...',
  SELECT_OPTION: '🔽 请选择选项：',
  CONFIRM_ACTION: '❓ 确认执行此操作？',
  NO_DATA: '📭 暂无数据',
  EMPTY_LIST: '📋 列表为空'
};

// 时间相关消息
const TIME_MESSAGES = {
  INVALID_FORMAT: '❌ 时间格式不正确，请使用：今晚20点、明天上午9点、30分钟后等',
  PAST_TIME: '⚠️ 时间已过去，请设置未来时间',
  TOO_FAR: '⚠️ 时间太远，建议设置近期时间',
  SUGGESTIONS: '💡 时间格式建议：\n• 今晚20点\n• 明天上午9点\n• 30分钟后\n• 2小时后\n• 下周一\n• 每月1号'
};

// 分类相关消息
const CATEGORY_MESSAGES = {
  SELECT_CATEGORY: '🏷️ 选择分类：',
  CATEGORY_SET: '✅ 分类已设置',
  CATEGORY_NOT_FOUND: '❌ 分类不存在',
  CREATE_CATEGORY: '🏷️ 创建新分类',
  CATEGORY_NAME: '请输入分类名称：',
  CATEGORY_ICON: '请输入分类图标（可选）：'
};

// 优先级相关消息
const PRIORITY_MESSAGES = {
  SELECT_PRIORITY: '⭐ 选择优先级：',
  PRIORITY_SET: '✅ 优先级已设置',
  PRIORITY_LEVELS: {
    URGENT: '🔴 紧急：需要立即处理',
    HIGH: '🟡 重要：需要优先处理',
    NORMAL: '🟢 普通：正常处理',
    LOW: '🔵 低：可以延后处理'
  }
};

// 统计相关消息
const STATS_MESSAGES = {
  REMINDER_STATS: '📊 提醒统计',
  NEWS_STATS: '📊 新闻统计',
  WORK_STATS: '📊 工作统计',
  TOTAL_COUNT: '总数',
  COMPLETED_COUNT: '已完成',
  PENDING_COUNT: '待处理',
  URGENT_COUNT: '紧急',
  HIGH_COUNT: '重要',
  NORMAL_COUNT: '普通',
  LOW_COUNT: '低'
};

// 搜索相关消息
const SEARCH_MESSAGES = {
  ENTER_KEYWORD: '🔍 请输入搜索关键词：',
  SEARCHING: '🔍 正在搜索...',
  NO_RESULTS: '🔍 没有找到相关结果',
  SEARCH_COMPLETE: '🔍 搜索完成',
  CONTINUE_SEARCH: '🔍 继续搜索',
  BACK_TO_LIST: '🔙 返回列表'
};

// 操作确认消息
const CONFIRMATION_MESSAGES = {
  DELETE_REMINDER: '🗑️ 确认删除此提醒？',
  CANCEL_REMINDER: '❌ 确认取消此提醒？',
  CLEANUP_COMPLETED: '🧹 确认清理所有已完成的提醒？',
  REFRESH_DATA: '🔄 确认刷新数据？',
  RESET_SETTINGS: '🔄 确认重置设置？'
};

module.exports = {
  WELCOME_MESSAGE,
  HELP_MESSAGE,
  REMINDER_MESSAGES,
  NEWS_MESSAGES,
  WORK_MESSAGES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  INFO_MESSAGES,
  TIME_MESSAGES,
  CATEGORY_MESSAGES,
  PRIORITY_MESSAGES,
  STATS_MESSAGES,
  SEARCH_MESSAGES,
  CONFIRMATION_MESSAGES
}; 