# .gitignore 文件说明

本文档解释了项目中 `.gitignore` 文件的作用和各个过滤规则的原因。

## 🚫 为什么需要 .gitignore？

`.gitignore` 文件用于告诉 Git 哪些文件和目录不应该被版本控制。这对于保护敏感信息、避免提交不必要的文件、保持仓库整洁非常重要。

## 📁 主要过滤类别

### 1. 🔐 敏感配置文件
```
.env
.env.local
.env.development
.env.production
.env.test
.env.*.local
```
**原因**：这些文件包含敏感信息，如：
- 数据库密码
- API密钥
- 机器人Token
- 管理员用户ID
- 其他敏感配置

**风险**：如果提交到Git，可能导致：
- 安全漏洞
- 信息泄露
- 账户被盗用
- 系统被攻击

### 2. 💾 数据文件和备份
```
data/
*.sqlite
*.sqlite3
*.db
backup/
*.backup
*.bak
```
**原因**：
- 数据库文件包含用户数据，不应该在版本控制中
- 备份文件通常很大，会增加仓库体积
- 不同环境的数据库内容不同

### 3. 📝 日志文件
```
logs/
*.log
*.log.backup
```
**原因**：
- 日志文件包含运行时信息，不适合版本控制
- 日志文件会不断增长
- 可能包含敏感信息（如用户ID、IP地址等）

### 4. 🗂️ 临时和缓存文件
```
temp/
tmp/
cache/
*.tmp
*.temp
```
**原因**：
- 这些文件是临时生成的，不需要版本控制
- 每次构建或运行都会重新生成
- 会增加仓库体积和提交复杂度

### 5. 🔑 密钥和证书文件
```
secrets/
keys/
*.key
*.pem
*.crt
*.p12
```
**原因**：
- 这些是加密密钥和证书文件
- 绝对不能提交到版本控制
- 泄露会导致严重的安全问题

### 6. 🏗️ 构建和依赖文件
```
node_modules/
dist/
coverage/
```
**原因**：
- `node_modules` 可以通过 `npm install` 重新生成
- `dist` 是构建产物，应该从源码构建
- `coverage` 是测试覆盖率报告，每次运行都会生成

## ✅ 应该提交的文件

以下文件应该被版本控制：

- 源代码文件（`src/` 目录）
- 配置文件模板（`.env.example`）
- 文档文件（`README.md`、`docs/`）
- 脚本文件（`start.bat`、`start.sh`）
- 项目配置文件（`package.json`、`ecosystem.config.js`）

## 🚨 安全提醒

1. **永远不要提交 `.env` 文件**
2. **检查提交前是否包含敏感信息**
3. **使用 `.env.example` 作为配置模板**
4. **定期检查 `.gitignore` 是否完整**

## 🔧 如何检查被忽略的文件

```bash
# 查看被忽略的文件
git status --ignored

# 查看某个文件是否被忽略
git check-ignore filename

# 强制添加被忽略的文件（谨慎使用）
git add -f filename
```

## 📋 最佳实践

1. **在项目开始时就设置好 `.gitignore`**
2. **定期检查和更新 `.gitignore`**
3. **团队成员都要了解 `.gitignore` 的重要性**
4. **使用 `git status` 检查提交前的状态**
5. **考虑使用 `pre-commit` 钩子进行自动检查**

## 🆘 如果意外提交了敏感文件

如果不小心提交了敏感文件，立即：

1. **删除敏感文件**
2. **从Git历史中完全移除**
3. **更改所有相关的密钥和密码**
4. **通知团队成员检查本地副本**

```bash
# 从Git历史中完全删除文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch sensitive_file" \
  --prune-empty --tag-name-filter cat -- --all

# 强制推送更改
git push origin --force --all
```

---

**记住**：安全第一！宁可多过滤一些文件，也不要冒险提交敏感信息。 