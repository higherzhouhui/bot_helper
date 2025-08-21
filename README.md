# Telegram 智能提醒助手 + 新闻资讯机器人

一个功能强大的 Telegram 机器人，集成了智能提醒、新闻资讯和工作信息收集功能。

## 🚀 功能特性

### 智能提醒系统
- 🕐 自然语言时间解析（今晚20点、明天上午9点等）
- 🏷️ 支持分类、优先级、标签和备注
- 🔄 连续提醒机制（未确认时自动重复）
- ⏰ 支持延时和重复提醒
- 📱 操作按钮（完成、延时10分钟、再提醒、修改、删除）
- ✏️ 支持修改提醒内容、时间、分类、优先级
- 🗑️ 支持删除提醒

### 新闻资讯
- 📰 多源新闻聚合（新浪、网易、搜狐）
- 🔍 智能新闻搜索
- 📊 热门新闻排行
- 🏷️ 新闻分类浏览
- 📖 阅读历史记录

### 工作信息收集
- 💼 掘金技术文章
- 🦆 电鸭工作信息
- 🔗 一键跳转原文

## 🛠️ 技术架构

- **后端**: Node.js + Express
- **数据库**: SQLite + Sequelize ORM
- **消息队列**: 内置定时器系统
- **部署**: PM2 进程管理
- **构建**: esbuild 打包

## 📦 环境配置

### 开发环境
```bash
# 复制开发环境配置
cp env.dev .env.dev

# 编辑配置
vim .env.dev

# 启动开发模式
npm run dev:win  # Windows
npm run dev      # Linux/Mac
```

### 生产环境
```bash
# 复制生产环境配置
cp env .env

# 编辑配置
vim .env

# 启动生产模式
npm start
```

### 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `BOT_TOKEN` | Telegram Bot Token | 必需 |
| `NODE_ENV` | 运行环境 | development |
| `DB_PATH` | 数据库路径 | ./data/database.sqlite |
| `TIMEZONE` | 时区设置 | Asia/Shanghai |
| `LOG_LEVEL` | 日志级别 | info |
| `DB_LOGGING` | 数据库日志 | false |

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
# 开发环境
cp env.dev .env.dev
# 编辑 .env.dev 文件，填入你的 BOT_TOKEN

# 生产环境
cp env .env
# 编辑 .env 文件，填入你的 BOT_TOKEN
```

### 3. 初始化数据库
```bash
npm run init-db
```

### 4. 启动机器人
```bash
# 开发环境
npm run dev:win  # Windows
npm run dev      # Linux/Mac

# 生产环境
npm start
```

## 📋 可用命令

### 机器人命令
- `/start` - 启动机器人
- `/help` - 显示帮助信息
- `/reminders` - 查看当前提醒
- `/history` - 查看提醒历史
- `/stats` - 查看统计信息
- `/news` - 浏览新闻
- `/hot` - 热门新闻
- `/work` - 工作信息

### 提醒操作
- **✅ 已完成** - 标记任务完成，停止重复提醒
- **⏰ 延后10分钟** - 将提醒延后10分钟，重置重复计数
- **✏️ 修改** - 修改提醒内容、时间、分类、优先级
- **😴 小睡30分钟** - 将提醒小睡30分钟
- **🗑️ 删除** - 删除提醒，停止重复提醒

### 开发命令
```bash
npm run dev:win    # 开发模式 (Windows)
npm run dev        # 开发模式 (Linux/Mac)
npm run build      # 构建项目
npm run start:dist # 运行构建版本
```

### PM2 部署命令
```bash
npm run pm2:start   # 启动 PM2
npm run pm2:restart # 重启 PM2
npm run pm2:stop    # 停止 PM2
npm run pm2:logs    # 查看日志
```

## 🗄️ 数据库结构

- **users** - 用户信息
- **reminders** - 提醒记录
- **reminder_history** - 提醒历史
- **categories** - 提醒分类
- **reminder_templates** - 提醒模板
- **news_categories** - 新闻分类
- **news** - 新闻内容
- **user_news_preferences** - 用户新闻偏好
- **news_read_history** - 新闻阅读历史
- **work_posts** - 工作信息

## 🔧 高级配置

### 自定义提醒间隔
在环境变量中设置：
```bash
REMINDER_CHECK_INTERVAL=10000      # 检查间隔 (毫秒)
REMINDER_REPEAT_INTERVAL=300000    # 重复间隔 (毫秒)
```

### 自定义新闻爬取
```bash
NEWS_CRAWL_INTERVAL=300000         # 爬取间隔 (毫秒)
NEWS_MAX_AGE=86400000             # 新闻最大年龄 (毫秒)
```

## 📝 使用示例

### 创建提醒
```
今晚20点提醒我开会
明天上午9点吃药
今天下午3点提现
20:30 提醒我打电话
```

### 带分类和优先级的提醒
```
今晚20点提醒我开会 #工作 #重要
明天上午9点吃药 #健康 #紧急
```

### 修改提醒
点击提醒消息中的 **✏️ 修改** 按钮，可以：
- **修改内容** - 重新输入提醒内容
- **修改时间** - 重新设置提醒时间
- **修改分类** - 选择新的分类
- **修改优先级** - 设置新的优先级（紧急/重要/普通/低）

### 删除提醒
点击提醒消息中的 **🗑️ 删除** 按钮，可以永久删除提醒。

### 提醒创建后的操作
提醒创建成功后，会在消息下方显示两个按钮：
- **✏️ 修改提醒** - 立即修改刚创建的提醒
- **🗑️ 取消提醒** - 删除刚创建的提醒

## 🚨 注意事项

1. **BOT_TOKEN**: 必须从 @BotFather 获取有效的 Token
2. **数据库**: 首次运行会自动创建数据库文件
3. **权限**: 所有关注机器人的用户都可以使用
4. **时区**: 默认使用 Asia/Shanghai 时区
5. **日志**: 生产环境建议关闭详细日志

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## �� 许可证

MIT License 