// 键盘布局常量模块

// 主菜单键盘
const MAIN_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '⏰ 创建提醒', callback_data: 'create_reminder' },
      { text: '📋 我的提醒', callback_data: 'my_reminders' }
    ],
    [
      { text: '📰 最新资讯', callback_data: 'news_latest' },
      { text: '🕸️ Web3 资讯', callback_data: 'web3_latest' }
    ],
    [
      { text: '🏷️ 新闻分类', callback_data: 'news_categories' },
      { text: '🔍 搜索资讯', callback_data: 'news_search' }
    ],
    [
      { text: '⚙️ 个人设置', callback_data: 'user_settings' },
      { text: '❓ 帮助', callback_data: 'help' }
    ]
  ]
};

// 提醒操作键盘
const REMINDER_ACTION_KEYBOARD = (reminderId) => ({
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
});

// 提醒创建后键盘
const REMINDER_CREATED_KEYBOARD = (reminderId) => ({
	inline_keyboard: [
		[
			{ text: '✏️ 修改', callback_data: `edit_${reminderId}` },
			{ text: '❌ 取消', callback_data: `cancel_${reminderId}` }
		]
	]
});

// 编辑提醒键盘
const EDIT_REMINDER_KEYBOARD = (reminderId) => ({
	inline_keyboard: [
		[
			{ text: '✏️ 修改内容', callback_data: `edit_content_${reminderId}` },
			{ text: '⏰ 修改时间', callback_data: `edit_time_${reminderId}` }
		],
		[
			{ text: '🏷️ 修改分类', callback_data: `edit_category_${reminderId}` },
			{ text: '⭐ 修改优先级', callback_data: `edit_priority_${reminderId}` }
		],
		[
			{ text: '🔙 返回', callback_data: `back_to_reminder_${reminderId}` }
		]
	]
});

// 分类选择键盘
const CATEGORY_SELECTION_KEYBOARD = (categories, reminderId = null) => {
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
};

// 优先级选择键盘
const PRIORITY_SELECTION_KEYBOARD = (reminderId = null) => {
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
};

// 新闻主菜单键盘
const NEWS_MAIN_KEYBOARD = {
	inline_keyboard: [
		[
			{ text: '🔥 热门新闻', callback_data: 'news_hot' },
			{ text: '📊 新闻统计', callback_data: 'news_stats' }
		],
		[
			{ text: '🏷️ 新闻分类', callback_data: 'news_categories' },
			{ text: '🔍 搜索新闻', callback_data: 'news_search' }
		]
	]
};

// Web3 主菜单键盘
const WEB3_MAIN_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '🔥 热门 Web3', callback_data: 'web3_hot' },
      { text: '🔍 搜索 Web3', callback_data: 'web3_search' }
    ],
    [
      { text: '📡 ChainFeeds', callback_data: 'web3_chainfeeds' },
      { text: '📰 PANews', callback_data: 'web3_panews' },
      { text: '📈 Investing', callback_data: 'web3_investing' }
    ]
  ]
};

// 新闻分类键盘
const NEWS_CATEGORIES_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '🚀 科技', callback_data: 'category_tech' },
      { text: '💰 财经', callback_data: 'category_finance' }
    ],
    [
      { text: '⚽ 体育', callback_data: 'category_sports' },
      { text: '🎬 娱乐', callback_data: 'category_ent' }
    ],
    [
      { text: '🌍 国际', callback_data: 'category_world' },
      { text: '🏠 社会', callback_data: 'category_society' }
    ],
    [
      { text: '💊 健康', callback_data: 'category_health' }
    ],
    [
      { text: '🔙 返回主菜单', callback_data: 'main_menu' }
    ]
  ]
};

// 新闻详情键盘
const NEWS_DETAIL_KEYBOARD = (categoryId) => ({
	inline_keyboard: [
		[
			{ text: '🔙 返回分类', callback_data: 'news_categories' },
			{ text: '📰 最新新闻', callback_data: 'news_latest' }
		]
	]
});

// 提醒列表键盘
const REMINDER_LIST_KEYBOARD = {
	inline_keyboard: [
		[
			{ text: '⏰ 创建提醒', callback_data: 'create_reminder' },
			{ text: '📊 统计信息', callback_data: 'reminder_stats' }
		],
		[
			{ text: '🔍 搜索提醒', callback_data: 'search_reminders' },
			{ text: '🗑️ 清理已完成', callback_data: 'cleanup_completed' }
		]
	]
};

// 统计信息键盘
const STATS_KEYBOARD = {
	inline_keyboard: [
		[
			{ text: '📋 查看提醒', callback_data: 'my_reminders' },
			{ text: '⏰ 创建提醒', callback_data: 'create_reminder' }
		],
		[
			{ text: '🔙 返回主菜单', callback_data: 'back_to_main' }
		]
	]
};

// 帮助键盘
const HELP_KEYBOARD = {
	inline_keyboard: [
		[
			{ text: '⏰ 创建提醒', callback_data: 'create_reminder' },
			{ text: '📋 我的提醒', callback_data: 'my_reminders' }
		],
		[
			{ text: '🔙 返回主菜单', callback_data: 'back_to_main' }
		]
	]
};

// 搜索键盘
const SEARCH_KEYBOARD = (type = 'general') => {
	const baseKeyboard = [
		[
			{ text: '🔍 继续搜索', callback_data: `${type}_search` },
			{ text: '🔙 返回', callback_data: `${type}_back` }
		]
	];

	return { inline_keyboard: baseKeyboard };
};

// 确认操作键盘
const CONFIRMATION_KEYBOARD = (action, id) => ({
	inline_keyboard: [
		[
			{ text: '✅ 确认', callback_data: `confirm_${action}_${id}` },
			{ text: '❌ 取消', callback_data: `cancel_${action}_${id}` }
		]
	]
});

// 返回键盘
const BACK_KEYBOARD = (callbackData) => ({
	inline_keyboard: [
		[
			{ text: '🔙 返回', callback_data: callbackData }
		]
	]
});

// 取消键盘
const CANCEL_KEYBOARD = (callbackData) => ({
	inline_keyboard: [
		[
			{ text: '❌ 取消', callback_data: callbackData }
		]
	]
});

// 分页键盘
const PAGINATION_KEYBOARD = (currentPage, totalPages, baseCallback, extraButtons = []) => {
	const keyboard = {
		inline_keyboard: []
	};

	// 添加分页按钮
	if (totalPages > 1) {
		const paginationRow = [];
		
		if (currentPage > 1) {
			paginationRow.push({ text: '◀️ 上一页', callback_data: `${baseCallback}_page_${currentPage - 1}` });
		}
		
		paginationRow.push({ text: `${currentPage}/${totalPages}`, callback_data: 'page_info' });
		
		if (currentPage < totalPages) {
			paginationRow.push({ text: '下一页 ▶️', callback_data: `${baseCallback}_page_${currentPage + 1}` });
		}
		
		keyboard.inline_keyboard.push(paginationRow);
	}

	// 添加额外按钮
	if (extraButtons.length > 0) {
		keyboard.inline_keyboard.push(extraButtons);
	}

	return keyboard;
};

// 设置键盘
const SETTINGS_KEYBOARD = {
	inline_keyboard: [
		[
			{ text: '🔔 通知设置', callback_data: 'settings_notifications' },
			{ text: '🌍 语言设置', callback_data: 'settings_language' }
		],
		[
			{ text: '⏰ 提醒设置', callback_data: 'settings_reminders' },
			{ text: '📰 新闻设置', callback_data: 'settings_news' }
		],
		[
			{ text: '🔙 返回主菜单', callback_data: 'back_to_main' }
		]
	]
};

module.exports = {
	MAIN_KEYBOARD,
	REMINDER_ACTION_KEYBOARD,
	REMINDER_CREATED_KEYBOARD,
	EDIT_REMINDER_KEYBOARD,
	CATEGORY_SELECTION_KEYBOARD,
	PRIORITY_SELECTION_KEYBOARD,
	NEWS_MAIN_KEYBOARD,
	WEB3_MAIN_KEYBOARD,
	NEWS_CATEGORIES_KEYBOARD,
	NEWS_DETAIL_KEYBOARD,
	REMINDER_LIST_KEYBOARD,
	STATS_KEYBOARD,
	HELP_KEYBOARD,
	SEARCH_KEYBOARD,
	CONFIRMATION_KEYBOARD,
	BACK_KEYBOARD,
	CANCEL_KEYBOARD,
	PAGINATION_KEYBOARD,
	SETTINGS_KEYBOARD
}; 