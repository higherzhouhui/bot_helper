# 🚀 小智助手 - 智能提醒 + 资讯聚合机器人

> **你的贴心智能小管家，让生活更有条理，资讯触手可及**

一个基于 Node.js 的 Telegram 智能机器人，集成了智能提醒管理、新闻资讯聚合、Web3 行业动态等多功能于一体。通过自然语言交互，让创建提醒变得简单自然；通过智能资讯聚合，让你第一时间获取最新信息。

## ✨ 核心特色

### 🧠 智能提醒系统
- **自然语言理解**：像跟朋友聊天一样创建提醒（"今晚20点提醒我开会"）
- **智能时间解析**：支持"明天上午9点"、"今晚8点"等自然表达
- **灵活操作**：完成、延后、小睡、编辑、删除等完整生命周期管理
- **分类管理**：工作、生活、学习等分类，让提醒更有条理
- **优先级设置**：紧急、重要、普通等优先级，重要事项不遗漏

### 📰 智能资讯中心
- **多源聚合**：新浪、网易、搜狐等主流媒体资讯
- **Web3 动态**：ChainFeeds、PANews、Investing 等行业资讯
- **智能去重**：72小时标题去重，避免重复信息
- **个性化推荐**：基于用户兴趣的资讯推送
- **一键收藏**：喜欢的内容一键收藏，随时回顾

### 🎯 用户体验优化
- **零学习成本**：自然语言交互，无需记忆复杂命令
- **智能反馈**：点赞、收藏、不感兴趣等用户反馈机制
- **安静时段**：设置免打扰时间，智能调整推送策略
- **数据统计**：个人使用数据统计，了解使用习惯

## 🚀 快速开始

### 1️⃣ 环境准备
```bash
# 克隆项目
git clone <your-repo-url>
cd body

# 安装依赖
npm install
```

### 2️⃣ 配置环境
在项目根目录创建环境配置文件：

**开发环境** (`.env.dev`)：
```ini
# Telegram Bot 配置
BOT_TOKEN=YOUR_BOT_TOKEN
TIMEZONE=Asia/Shanghai

# 环境标识
NODE_ENV=development
LOG_LEVEL=debug

# 数据库配置
DB_DIALECT=sqlite
DB_STORAGE=./data/dev_database.sqlite
DB_LOGGING=true

# 管理员配置
ADMIN_USER_IDS=123456789,987654321

# 功能配置
NEWS_CRAWL_INTERVAL=300000
REMINDER_CHECK_INTERVAL=10000
WEB3_CRAWL_INTERVAL=600000
```

**生产环境** (`.env`)：
```ini
BOT_TOKEN=YOUR_BOT_TOKEN
TIMEZONE=Asia/Shanghai
NODE_ENV=production
LOG_LEVEL=info
DB_DIALECT=sqlite
DB_STORAGE=./data/database.sqlite
DB_LOGGING=false
ADMIN_USER_IDS=123456789
NEWS_CRAWL_INTERVAL=300000
REMINDER_CHECK_INTERVAL=10000
WEB3_CRAWL_INTERVAL=600000
```

### 3️⃣ 初始化数据库
```bash
npm run init-db
```

### 4️⃣ 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start

# 打包后运行
npm run build
npm run start:dist
```

## 📱 使用指南

### 🔧 基础命令
- `/start` - 启动小智助手，获取主菜单
- `/help` - 查看详细使用帮助
- `/reminders` - 管理你的提醒事项
- `/news` - 浏览最新新闻资讯
- `/web3` - 获取 Web3 行业动态
- `/stats` - 查看个人使用统计

### 💡 智能提醒使用
**创建提醒**（直接发送消息）：
- "明天上午9点提醒我开会"
- "今晚8点提醒我健身"
- "下周一提醒我交报告"
- "每天下午3点提醒我喝水"

**管理提醒**：
- 查看提醒列表
- 编辑提醒内容、时间、分类
- 标记完成、延后、删除
- 设置重复模式

### 📰 资讯浏览
**新闻中心**：
- 最新资讯
- 热门新闻
- 分类浏览
- 关键词搜索
- 一键收藏

**Web3 动态**：
- 行业热点
- 项目动态
- 市场分析
- 技术趋势

## 🏗️ 技术架构

### 📁 项目结构
```
src/
├── bot.js                 # 主入口，事件路由与定时任务
├── config/               # 配置管理
├── models/               # 数据模型与关联
├── services/             # 业务逻辑服务层
├── handlers/             # 命令与回调处理器
├── middlewares/          # 中间件
├── constants/            # 常量定义
├── utils/                # 工具函数
└── scripts/              # 脚本工具
```

### 🗄️ 数据模型
- **用户系统**：User、UserSetting、UserNewsPreference
- **提醒系统**：Reminder、ReminderHistory、Category
- **资讯系统**：News、NewsCategory、NewsReadHistory
- **互动系统**：FavoriteNews、KeywordSubscription、AnalyticsEvent

### ⚡ 核心特性
- **自然语言处理**：智能解析用户意图
- **定时任务系统**：提醒检查、资讯抓取
- **数据持久化**：SQLite + Sequelize ORM
- **用户反馈系统**：点赞、收藏、不感兴趣
- **个性化推荐**：基于用户行为的智能推送

## 🔧 高级功能

### 👑 管理员功能
- **系统统计**：用户数量、提醒统计、资讯统计
- **用户管理**：查看用户列表、用户详情
- **数据监控**：系统运行状态、性能指标

### 📊 数据分析
- **用户行为**：使用频率、功能偏好
- **内容分析**：热门资讯、用户反馈
- **系统性能**：响应时间、错误率

## 🚀 部署方案

### 本地开发
```bash
npm run dev
```

### 生产部署
```bash
# 构建生产版本
npm run build

# 启动生产服务
npm run start:dist

# 使用 PM2 进程管理
npm run pm2:start
npm run pm2:restart
npm run pm2:stop
npm run pm2:logs
```

### Docker 部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/bot.js"]
```

## 🌟 产品优势

### 🎯 用户价值
- **时间管理**：智能提醒让生活更有条理
- **信息获取**：多源资讯聚合，信息不遗漏
- **个性化体验**：基于用户行为的智能推荐
- **操作简单**：自然语言交互，零学习成本

### 🚀 技术优势
- **模块化架构**：清晰的分层设计，易于维护扩展
- **性能优化**：智能缓存、异步处理、批量操作
- **数据安全**：用户数据隔离、权限控制
- **可扩展性**：插件化设计，支持功能扩展

### 💼 商业价值
- **用户粘性**：高频使用场景，用户留存率高
- **数据价值**：用户行为数据，支持精准营销
- **生态整合**：可对接更多第三方服务
- **变现潜力**：付费功能、广告植入、企业服务

## 🔮 未来规划

### 📅 短期目标
- [ ] 语音提醒功能
- [ ] 多语言支持
- [ ] 移动端优化
- [ ] 更多资讯源

### 🎯 中期目标
- [ ] AI 智能推荐
- [ ] 社交功能
- [ ] 企业版本
- [ ] API 开放平台

### 🚀 长期愿景
- [ ] 成为智能生活助手标杆
- [ ] 构建完整的用户生态
- [ ] 引领行业技术标准

## 🤝 贡献指南

我们欢迎所有形式的贡献！无论是：
- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码

请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详细流程。

## 📄 许可证

本项目采用 [MIT 许可证](./LICENSE)。

---

**小智助手** - 让智能生活触手可及 🚀

> 如有问题或建议，欢迎通过 [Issues](../../issues) 联系我们！ 