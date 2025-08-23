#!/usr/bin/env node

/**
 * 为现有用户设置默认分类的脚本
 * 运行方式: node src/scripts/setupDefaultCategories.js
 */

const { sequelize, User, Category } = require('../models');
const reminderService = require('../services/reminderService');

console.log('🚀 开始为现有用户设置默认分类...');

async function setupDefaultCategoriesForAllUsers() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 获取所有用户
    const users = await User.findAll();
    console.log(`📊 找到 ${users.length} 个用户`);

    if (users.length === 0) {
      console.log('ℹ️ 没有找到任何用户，跳过分类设置');
      return;
    }

    let successCount = 0;
    let skipCount = 0;

    for (const user of users) {
      try {
        console.log(`\n👤 处理用户: ${user.firstName || 'Unknown'} (ID: ${user.id})`);
        
        // 检查用户是否已有分类
        const existingCategories = await Category.findAll({
          where: { userId: user.id }
        });

        if (existingCategories.length > 0) {
          console.log(`  ⏭️ 用户已有 ${existingCategories.length} 个分类，跳过`);
          skipCount++;
          continue;
        }

        // 为用户创建默认分类
        await reminderService.createDefaultCategories(user.id);
        
        // 验证分类创建成功
        const newCategories = await Category.findAll({
          where: { userId: user.id }
        });
        
        console.log(`  ✅ 成功创建 ${newCategories.length} 个默认分类`);
        console.log(`     ${newCategories.map(cat => `${cat.icon} ${cat.name}`).join(', ')}`);
        
        successCount++;
        
      } catch (error) {
        console.error(`  ❌ 为用户 ${user.id} 创建分类失败:`, error.message);
      }
    }

    console.log('\n🎉 默认分类设置完成！');
    console.log(`📊 统计结果:`);
    console.log(`  ✅ 成功设置: ${successCount} 个用户`);
    console.log(`  ⏭️ 跳过设置: ${skipCount} 个用户`);
    console.log(`  📝 总计处理: ${users.length} 个用户`);

  } catch (error) {
    console.error('❌ 设置默认分类失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行脚本
if (require.main === module) {
  setupDefaultCategoriesForAllUsers()
    .then(() => {
      console.log('✨ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { setupDefaultCategoriesForAllUsers }; 