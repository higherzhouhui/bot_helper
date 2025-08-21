# Telegram 智能提醒 + 新闻/Web3 资讯机器人

一个基于 Node.js 的 Telegram 机器人，支持智能提醒（自然语言解析、编辑、延后/小睡等）与新闻/Web3 资讯聚合（带超链接标题、分类/热门/搜索、定时抓取与存储）。

## 功能特性
- ⏰ 智能提醒
  - 自然语言创建提醒（如“今晚20点提醒我开会”）
  - 完成、延后10分钟、小睡5分钟
  - 支持编辑内容/时间/分类/优先级
  - 分类、优先级、标签、备注、重复模式
- 📰 新闻中心
  - 最新/热门/分类/搜索
  - 列表标题为可点击超链接（HTML）
  - 定时抓取多来源资讯，去重入库
- 🕸️ Web3 资讯
  - 数据源：ChainFeeds、PANews、Investing(中文)
  - /web3 命令与菜单入口；一键抓取最新
- 💾 数据持久化
  - SQLite + Sequelize
  - 完整的模型关联与查询
- ⚙️ 配置与部署
  - `.env` / `.env.dev` 分环境配置
  - esbuild 打包、PM2 进程守护

## 快速开始
1) 安装依赖
```bash
npm install
```

2) 配置环境
在项目根目录创建 `.env.dev`（开发）与 `.env`（生产），至少包含：
```ini
# Telegram
BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
TIMEZONE=Asia/Shanghai

# DB
DB_PATH=./data/database.sqlite
DB_DIALECT=sqlite
DB_STORAGE=./data/database.sqlite
DB_LOGGING=false

# News & Reminders (单位：秒)
NEWS_CRAWL_INTERVAL=300
REMINDER_CHECK_INTERVAL=10
REMINDER_REPEAT_INTERVAL=300
LOG_LEVEL=info
NODE_ENV=development
```

3) 初始化数据库（首次）
```bash
npm run init-db
```

4) 启动
- 开发（Windows）：
```bash
npm run dev
```
- 生产：
```bash
npm start
```

5) 常用命令
- `/start` 欢迎/主菜单
- `/help` 使用帮助
- `/reminders` 查看提醒
- `/news` 新闻中心
- `/web3` Web3 资讯
- `/stats` 统计信息

## 项目结构
```text
src/
  bot.js                      # 入口，事件/回调路由、定时任务
  init-db.js                  # 初始化数据库脚本
  config/
    index.js                  # 加载 .env / .env.dev，导出 config 与校验
  models/
    index.js                  # Sequelize 模型与关联（User/Reminder/.../News）
  services/
    reminderService.js        # 提醒相关 CRUD、查询、到期获取等
    newsService.js            # 新闻/Web3 抓取与存储、查询、统计
  handlers/
    commandHandler.js         # /start /help /reminders /stats 与通用回调
    reminderHandler.js        # 提醒创建/编辑/按钮处理
    newsHandler.js            # 新闻与 Web3 指令与回调、搜索
  middlewares/
    errorHandler.js           # 统一错误捕获与处理
  constants/
    keyboards.js              # Inline 键盘配置（含 Web3 主菜单）
    messages.js               # 文本模板
  utils/
    smartParser.js            # 自然语言解析（时间/优先级/标签等）
    dateUtils.js              # 日期工具
    textUtils.js              # 文本工具
    validationUtils.js        # 校验工具
    reminderUtils.js          # 提醒展示/键盘/格式化
  scripts/
    crawlNews.js              # 手动触发新闻抓取（可选）
```

## 数据模型（节选）
- `User(id, username, firstName, lastName, timezone, language)`
- `Reminder(userId, chatId, message, reminderTime, status, priority, categoryId, tags[], notes, snoozeUntil, repeatPattern, repeatEndDate, repeatCount)`
- `ReminderHistory(reminderId, userId, chatId, message, reminderTime, repeatCount, actionType, categoryId, priority, tags[], createdAt)`
- `NewsCategory(name, displayName, icon, color, isActive, sortOrder)`
- `News(title, summary, source, sourceUrl, imageUrl, categoryId, tags[], publishTime, viewCount, isHot, isTop, status)`
- `UserNewsPreference(userId, categoryId, isSubscribed)`
- `NewsReadHistory(userId, newsId, readAt)`

## 事件与回调
- 文本输入：
  - 自然语言解析提醒；或识别“新闻/热点/资讯/...”触发新闻搜索
  - 正在编辑/搜索时，输入被路由到对应上下文
- 回调前缀：
  - 提醒：`complete_` `delay_` `snooze_` `edit_*` `delete_` ...
  - 新闻：`news_latest` `news_hot` `news_categories` `news_search` `news_stats` `news_category_{id}`
  - Web3：`web3_latest` `web3_hot` `web3_search` `web3_chainfeeds` `web3_panews` `web3_investing`

## 定时任务
- 提醒轮询：`REMINDER_CHECK_INTERVAL` 秒检查一次到期提醒并发送按钮操作消息
- 新闻抓取：按 `NEWS_CRAWL_INTERVAL` 轮询预设源/分类（新浪/网易/搜狐）
- Web3 抓取：以 `NEWS_CRAWL_INTERVAL/2` 的节奏轮询 `ChainFeeds / PANews / Investing(中文)`

## 构建与部署
- 打包（esbuild）：
```bash
npm run build
```
- 生产启动（打包后）：
```bash
npm run start:dist
```
- PM2（可选）：
```bash
npm run pm2:start
npm run pm2:restart
npm run pm2:stop
npm run pm2:logs
```

## 注意事项
- Telegram HTML 消息需设置 `parse_mode: 'HTML'`，并建议 `disable_web_page_preview: true`
- esbuild 已排除无关数据库驱动（pg、mysql2、mariadb、tedious、oracledb），使用 SQLite
- Windows 下开发脚本使用 `set NODE_ENV=development` 形式

## 参考数据源
- ChainFeeds: https://www.chainfeeds.xyz/
- PANews: https://www.panewslab.com/zh
- Investing 中文: https://cn.investing.com

## 许可证
MIT 