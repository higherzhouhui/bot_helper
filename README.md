# 🚀 小智助手 - 智能提醒 + 资讯聚合机器人

> 你的贴心智能小管家，支持自然语言提醒设置、新闻资讯聚合、Web3资讯等多项功能

## ✨ 主要功能

### 🔔 智能提醒系统
- **自然语言解析**：支持"今晚20点提醒我开会"、"明天上午9点重要提醒：提交报告"等自然表达
- **智能分类**：自动识别工作、生活、学习、健康、娱乐等分类
- **优先级管理**：支持紧急、重要、普通、低四个优先级
- **重复提醒**：支持每天、每周、每月、每年等重复模式
- **标签系统**：支持#重要、#会议等标签标记

### 📰 新闻资讯聚合
- **多源爬取**：支持腾讯新闻、今日头条、新华网、财经网、虎扑体育等权威网站
- **智能分类**：自动分类到科技、财经、体育、娱乐、国际、社会、健康等分类
- **热门新闻**：实时展示热门新闻排行
- **搜索功能**：支持关键词搜索新闻
- **分页浏览**：每页6条新闻，支持上一页/下一页导航

### 🕸️ Web3资讯专区
- **专业资讯**：专注区块链、加密货币、DeFi、NFT等Web3领域
- **实时更新**：定期爬取最新Web3资讯
- **分类浏览**：支持按来源、时间等分类浏览

### ⚙️ 用户设置
- **个性化配置**：支持通知设置、语言设置、提醒偏好等
- **使用统计**：提供个人使用数据统计
- **偏好管理**：可设置新闻分类偏好

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- SQLite3 或 MySQL/PostgreSQL
- 稳定的网络连接

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/xiaozhi-assistant.git
cd xiaozhi-assistant
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
# 复制环境配置模板
cp .env.example .env

# 编辑配置文件，填入你的BOT_TOKEN等信息
# 必需配置：
# BOT_TOKEN=your_telegram_bot_token_here
```

4. **初始化数据库**
```bash
npm run init
```

5. **启动机器人**
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 🔧 配置说明

### 环境变量配置

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `BOT_TOKEN` | Telegram机器人Token | - | ✅ |
| `NODE_ENV` | 运行环境 | development | ❌ |
| `TIMEZONE` | 时区设置 | Asia/Shanghai | ❌ |
| `NEWS_CRAWL_INTERVAL` | 新闻爬取间隔(毫秒) | 300000 | ❌ |
| `REMINDER_CHECK_INTERVAL` | 提醒检查间隔(毫秒) | 10000 | ❌ |

### 数据库配置

项目默认使用SQLite数据库，数据文件存储在`./data/database.sqlite`。

如需使用其他数据库，请修改环境变量：
```bash
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=xiaozhi_assistant
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

## 📱 使用指南

### 基础命令

- `/start` - 启动机器人，显示主菜单
- `/help` - 显示帮助信息
- `/web3` - 进入Web3资讯专区

### 设置提醒

**自然语言格式：**
```
今晚20点提醒我开会
明天上午9点重要提醒：提交报告
每天8点提醒我喝水
每周一9点提醒我团队会议
30分钟后提醒我检查邮件
```

**支持的时间格式：**
- 具体时间：今晚20点、明天上午9点、后天下午3点
- 相对时间：30分钟后、2小时后、明天、下周
- 重复时间：每天8点、每周一9点、每月1号

**支持的分类：**
- 工作：会议、项目、任务、deadline等
- 生活：吃饭、购物、家务、取快递等
- 学习：读书、上课、作业、考试等
- 健康：运动、吃药、体检、冥想等
- 娱乐：游戏、电影、音乐、聚会等

### 新闻浏览

- 点击"🔥 热门新闻"查看热门新闻排行
- 点击"🏷️ 新闻分类"按分类浏览新闻
- 点击"🔍 搜索新闻"搜索特定内容
- 点击"📊 新闻统计"查看新闻数据统计

### Web3资讯

- 点击"🕸️ Web3 资讯"进入专区
- 支持按来源浏览：币安、CoinDesk、Decrypt等
- 支持关键词搜索Web3相关内容

## 🛠️ 故障排除

### 常见问题

#### 1. 机器人无响应
**检查项：**
- BOT_TOKEN是否正确
- 网络连接是否正常
- 机器人是否被用户阻止

**解决方案：**
```bash
# 检查机器人状态
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"

# 查看日志
npm run pm2:logs
```

#### 2. 新闻无法爬取
**检查项：**
- 网络连接是否正常
- 目标网站是否可访问
- 爬取间隔是否设置过短

**解决方案：**
```bash
# 手动测试爬取
npm run crawl-news

# 检查网络连接
ping news.qq.com
```

#### 3. 提醒功能异常
**检查项：**
- 数据库是否正常
- 时区设置是否正确
- 提醒检查间隔是否合理

**解决方案：**
```bash
# 重新初始化数据库
npm run init

# 检查数据库状态
sqlite3 ./data/database.sqlite ".tables"
```

#### 4. 内存占用过高
**检查项：**
- 新闻数据是否过多
- 定时器是否正常清理
- 日志文件是否过大

**解决方案：**
```bash
# 清理旧数据
npm run cleanup

# 重启服务
npm run pm2:restart
```

### 日志分析

项目使用结构化日志，便于问题排查：

```bash
# 查看实时日志
npm run pm2:logs

# 查看错误日志
grep "ERROR" logs/app.log

# 查看特定用户操作
grep "chatId: 123456789" logs/app.log
```

### 性能优化

1. **数据库优化**
   - 定期清理过期数据
   - 创建必要的索引
   - 使用连接池

2. **网络优化**
   - 设置合理的爬取间隔
   - 使用代理池（如需要）
   - 实现请求重试机制

3. **内存优化**
   - 限制新闻数据存储量
   - 定期清理缓存
   - 监控内存使用情况

## 🔒 安全考虑

### 访问控制
- 支持管理员用户配置
- 可设置IP白名单/黑名单
- 支持请求频率限制

### 数据安全
- 敏感信息加密存储
- 支持数据备份和恢复
- 定期清理过期数据

### 网络安全
- 支持HTTPS代理
- 请求超时和重试机制
- 错误信息脱敏处理

## 📊 监控和维护

### 健康检查
```bash
# 检查服务状态
npm run pm2:status

# 检查数据库连接
npm run health-check

# 检查磁盘空间
df -h
```

### 数据备份
```bash
# 备份数据库
cp ./data/database.sqlite ./backup/database_$(date +%Y%m%d_%H%M%S).sqlite

# 备份配置文件
cp .env ./backup/env_$(date +%Y%m%d_%H%M%S)
```

### 性能监控
- 响应时间监控
- 内存使用监控
- 数据库性能监控
- 网络请求监控

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发环境设置
```bash
# 安装开发依赖
npm install --save-dev

# 运行测试
npm test

# 代码格式化
npm run format

# 代码检查
npm run lint
```

### 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具的变动

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 支持与反馈

- 📧 邮箱：support@xiaozhi-assistant.com
- 💬 讨论区：[GitHub Discussions](https://github.com/your-username/xiaozhi-assistant/discussions)
- 🐛 问题反馈：[GitHub Issues](https://github.com/your-username/xiaozhi-assistant/issues)
- 📖 文档：[项目Wiki](https://github.com/your-username/xiaozhi-assistant/wiki)

---

**小智助手** - 让生活更智能，让工作更高效！ 🚀 