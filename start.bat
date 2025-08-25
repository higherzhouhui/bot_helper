@echo off
chcp 65001 >nul
echo 🚀 小智助手启动脚本
echo ========================

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未检测到Node.js，请先安装Node.js 16.0.0或更高版本
    echo 💡 下载地址：https://nodejs.org/
    pause
    exit /b 1
)

REM 检查npm是否可用
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：npm不可用，请检查Node.js安装
    pause
    exit /b 1
)

echo ✅ Node.js版本：
node --version
echo ✅ npm版本：
npm --version
echo.

REM 检查环境配置文件
if not exist ".env" (
    if exist ".env.example" (
        echo ⚠️  警告：未找到.env配置文件
        echo 💡 正在复制.env.example为.env...
        copy ".env.example" ".env"
        echo ✅ 已创建.env配置文件，请编辑并填入正确的BOT_TOKEN等信息
        echo.
        echo 🔧 请编辑.env文件，设置以下必需配置：
        echo    BOT_TOKEN=your_telegram_bot_token_here
        echo.
        pause
        exit /b 1
    ) else (
        echo ❌ 错误：未找到环境配置文件模板.env.example
        echo 💡 请确保项目文件完整
        pause
        exit /b 1
    )
)

REM 检查依赖是否安装
if not exist "node_modules" (
    echo 📦 正在安装项目依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo.
)

REM 检查数据库是否初始化
if not exist "data\database.sqlite" (
    echo 🗄️  正在初始化数据库...
    npm run init
    if %errorlevel% neq 0 (
        echo ❌ 数据库初始化失败
        pause
        exit /b 1
    )
    echo ✅ 数据库初始化完成
    echo.
)

echo 🚀 正在启动小智助手...
echo 💡 提示：按Ctrl+C可以停止机器人
echo.

REM 启动机器人
npm start

echo.
echo 👋 小智助手已停止运行
pause 