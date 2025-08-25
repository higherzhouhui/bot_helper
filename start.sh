#!/bin/bash

# 小智助手启动脚本
echo "🚀 小智助手启动脚本"
echo "========================"

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未检测到Node.js，请先安装Node.js 16.0.0或更高版本"
    echo "💡 下载地址：https://nodejs.org/"
    exit 1
fi

# 检查npm是否可用
if ! command -v npm &> /dev/null; then
    echo "❌ 错误：npm不可用，请检查Node.js安装"
    exit 1
fi

echo "✅ Node.js版本："
node --version
echo "✅ npm版本："
npm --version
echo

# 检查环境配置文件
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "⚠️  警告：未找到.env配置文件"
        echo "💡 正在复制.env.example为.env..."
        cp ".env.example" ".env"
        echo "✅ 已创建.env配置文件，请编辑并填入正确的BOT_TOKEN等信息"
        echo
        echo "🔧 请编辑.env文件，设置以下必需配置："
        echo "   BOT_TOKEN=your_telegram_bot_token_here"
        echo
        read -p "按回车键继续..."
        exit 1
    else
        echo "❌ 错误：未找到环境配置文件模板.env.example"
        echo "💡 请确保项目文件完整"
        exit 1
    fi
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装项目依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
    echo
fi

# 检查数据库是否初始化
if [ ! -f "data/database.sqlite" ]; then
    echo "🗄️  正在初始化数据库..."
    npm run init
    if [ $? -ne 0 ]; then
        echo "❌ 数据库初始化失败"
        exit 1
    fi
    echo "✅ 数据库初始化完成"
    echo
fi

echo "🚀 正在启动小智助手..."
echo "💡 提示：按Ctrl+C可以停止机器人"
echo

# 启动机器人
npm start

echo
echo "👋 小智助手已停止运行" 