#!/usr/bin/env node

/**
 * 删除Web3分类的数据库迁移脚本
 * 运行方式: node src/scripts/removeWeb3Category.js
 */

const { sequelize, NewsCategory, News, UserNewsPreference } = require('../models');

console.log('🚀 开始删除Web3分类...');

async function removeWeb3Category() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 查找Web3分类
    const web3Category = await NewsCategory.findOne({
      where: { name: 'web3' }
    });

    if (!web3Category) {
      console.log('ℹ️ Web3分类不存在，无需删除');
      return;
    }

    console.log(`📋 找到Web3分类: ID=${web3Category.id}, 名称=${web3Category.name}`);

    // 查找科技分类
    const techCategory = await NewsCategory.findOne({
      where: { name: 'tech' }
    });

    if (!techCategory) {
      console.log('❌ 科技分类不存在，无法重新分类Web3新闻');
      return;
    }

    console.log(`📋 找到科技分类: ID=${techCategory.id}, 名称=${techCategory.name}`);

    // 统计Web3分类下的新闻数量
    const web3NewsCount = await News.count({
      where: { categoryId: web3Category.id }
    });

    console.log(`📰 Web3分类下有 ${web3NewsCount} 条新闻`);

    if (web3NewsCount > 0) {
      // 将Web3分类下的新闻重新分类到科技分类
      await News.update(
        { categoryId: techCategory.id },
        { where: { categoryId: web3Category.id } }
      );
      console.log(`✅ 已将 ${web3NewsCount} 条新闻重新分类到科技分类`);
    }

    // 删除用户对Web3分类的偏好设置
    const deletedPreferences = await UserNewsPreference.destroy({
      where: { categoryId: web3Category.id }
    });
    console.log(`🗑️ 删除了 ${deletedPreferences} 条Web3分类的用户偏好设置`);

    // 删除Web3分类
    await web3Category.destroy();
    console.log('✅ Web3分类已删除');

    // 验证删除结果
    const remainingWeb3Category = await NewsCategory.findOne({
      where: { name: 'web3' }
    });

    if (!remainingWeb3Category) {
      console.log('✅ Web3分类删除验证成功');
    } else {
      console.log('❌ Web3分类删除验证失败');
    }

    // 显示当前分类列表
    const remainingCategories = await NewsCategory.findAll({
      order: [['sortOrder', 'ASC']]
    });

    console.log('\n📋 当前新闻分类列表:');
    remainingCategories.forEach(cat => {
      console.log(`  ${cat.icon} ${cat.displayName || cat.name} (ID: ${cat.id})`);
    });

    console.log('\n🎉 Web3分类删除完成！');

  } catch (error) {
    console.error('❌ 删除Web3分类失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行脚本
if (require.main === module) {
  removeWeb3Category()
    .then(() => {
      console.log('✨ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { removeWeb3Category }; 