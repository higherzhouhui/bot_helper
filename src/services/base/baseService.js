// 基础服务模块
const { Op } = require('sequelize');

class BaseService {
  constructor(model) {
    this.model = model;
  }

  // 创建记录
  async create(data) {
    try {
      const result = await this.model.create(data);
      return result;
    } catch (error) {
      console.error(`创建${this.model.name}失败:`, error);
      throw error;
    }
  }

  // 批量创建记录
  async bulkCreate(dataArray, options = {}) {
    try {
      const results = await this.model.bulkCreate(dataArray, {
        ignoreDuplicates: true,
        ...options
      });
      return results;
    } catch (error) {
      console.error(`批量创建${this.model.name}失败:`, error);
      throw error;
    }
  }

  // 根据ID查找记录
  async findById(id, options = {}) {
    try {
      const result = await this.model.findByPk(id, options);
      return result;
    } catch (error) {
      console.error(`根据ID查找${this.model.name}失败:`, error);
      throw error;
    }
  }

  // 查找单条记录
  async findOne(where, options = {}) {
    try {
      const result = await this.model.findOne({
        where,
        ...options
      });
      return result;
    } catch (error) {
      console.error(`查找${this.model.name}失败:`, error);
      throw error;
    }
  }

  // 查找多条记录
  async findAll(where = {}, options = {}) {
    try {
      const results = await this.model.findAll({
        where,
        ...options
      });
      return results;
    } catch (error) {
      console.error(`查找${this.model.name}失败:`, error);
      throw error;
    }
  }

  // 分页查找
  async findAndCountAll(where = {}, options = {}) {
    try {
      const { page = 1, limit = 10, ...otherOptions } = options;
      const offset = (page - 1) * limit;
      
      const results = await this.model.findAndCountAll({
        where,
        limit,
        offset,
        ...otherOptions
      });
      
      return {
        ...results,
        page,
        limit,
        totalPages: Math.ceil(results.count / limit)
      };
    } catch (error) {
      console.error(`分页查找${this.model.name}失败:`, error);
      throw error;
    }
  }

  // 更新记录
  async update(where, data) {
    try {
      const [affectedCount] = await this.model.update(data, { where });
      return affectedCount;
    } catch (error) {
      console.error(`更新${this.model.name}失败:`, error);
      throw error;
    }
  }

  // 根据ID更新记录
  async updateById(id, data) {
    try {
      const [affectedCount] = await this.model.update(data, {
        where: { id }
      });
      return affectedCount;
    } catch (error) {
      console.error(`根据ID更新${this.model.name}失败:`, error);
      throw error;
    }
  }

  // 删除记录
  async delete(where) {
    try {
      const affectedCount = await this.model.destroy({ where });
      return affectedCount;
    } catch (error) {
      console.error(`删除${this.model.name}失败:`, error);
      throw error;
    }
  }

  // 根据ID删除记录
  async deleteById(id) {
    try {
      const affectedCount = await this.model.destroy({
        where: { id }
      });
      return affectedCount;
    } catch (error) {
      console.error(`根据ID删除${this.model.name}失败:`, error);
      throw error;
    }
  }

  // 软删除记录（如果模型支持）
  async softDelete(where) {
    try {
      if (this.model.rawAttributes.deletedAt) {
        const [affectedCount] = await this.model.update(
          { deletedAt: new Date() },
          { where }
        );
        return affectedCount;
      } else {
        return await this.delete(where);
      }
    } catch (error) {
      console.error(`软删除${this.model.name}失败:`, error);
      throw error;
    }
  }

  // 恢复软删除的记录
  async restore(where) {
    try {
      if (this.model.rawAttributes.deletedAt) {
        const [affectedCount] = await this.model.update(
          { deletedAt: null },
          { where }
        );
        return affectedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.error(`恢复${this.model.name}失败:`, error);
      throw error;
    }
  }

  // 统计记录数量
  async count(where = {}) {
    try {
      const count = await this.model.count({ where });
      return count;
    } catch (error) {
      console.error(`统计${this.model.name}数量失败:`, error);
      throw error;
    }
  }

  // 检查记录是否存在
  async exists(where) {
    try {
      const count = await this.model.count({ where });
      return count > 0;
    } catch (error) {
      console.error(`检查${this.model.name}是否存在失败:`, error);
      throw error;
    }
  }

  // 递增字段值
  async increment(field, where, amount = 1) {
    try {
      const [affectedCount] = await this.model.increment(field, {
        where,
        by: amount
      });
      return affectedCount;
    } catch (error) {
      console.error(`递增${this.model.name}字段失败:`, error);
      throw error;
    }
  }

  // 递减字段值
  async decrement(field, where, amount = 1) {
    try {
      const [affectedCount] = await this.model.decrement(field, {
        where,
        by: amount
      });
      return affectedCount;
    } catch (error) {
      console.error(`递减${this.model.name}字段失败:`, error);
      throw error;
    }
  }

  // 查找或创建记录
  async findOrCreate(where, defaults = {}) {
    try {
      const [result, created] = await this.model.findOrCreate({
        where,
        defaults
      });
      return { result, created };
    } catch (error) {
      console.error(`查找或创建${this.model.name}失败:`, error);
      throw error;
    }
  }

  // 查找或创建记录（如果不存在则创建）
  async findOrCreateBy(where, defaults = {}) {
    try {
      const [result, created] = await this.model.findOrCreate({
        where,
        defaults
      });
      return result;
    } catch (error) {
      console.error(`查找或创建${this.model.name}失败:`, error);
      throw error;
    }
  }

  // 批量更新
  async bulkUpdate(dataArray, updateFields, whereField = 'id') {
    try {
      const results = [];
      for (const data of dataArray) {
        const where = { [whereField]: data[whereField] };
        const updateData = {};
        
        for (const field of updateFields) {
          if (data[field] !== undefined) {
            updateData[field] = data[field];
          }
        }
        
        if (Object.keys(updateData).length > 0) {
          const [affectedCount] = await this.model.update(updateData, { where });
          results.push({ id: data[whereField], affected: affectedCount > 0 });
        }
      }
      return results;
    } catch (error) {
      console.error(`批量更新${this.model.name}失败:`, error);
      throw error;
    }
  }

  // 事务操作
  async transaction(callback) {
    try {
      const result = await this.model.sequelize.transaction(callback);
      return result;
    } catch (error) {
      console.error(`事务操作${this.model.name}失败:`, error);
      throw error;
    }
  }

  // 原始查询
  async rawQuery(sql, options = {}) {
    try {
      const results = await this.model.sequelize.query(sql, {
        type: this.model.sequelize.QueryTypes.SELECT,
        ...options
      });
      return results;
    } catch (error) {
      console.error(`原始查询${this.model.name}失败:`, error);
      throw error;
    }
  }

  // 聚合查询
  async aggregate(aggregateFunction, field, where = {}, options = {}) {
    try {
      const result = await this.model.findOne({
        attributes: [
          [this.model.sequelize.fn(aggregateFunction, this.model.sequelize.col(field)), 'result']
        ],
        where,
        ...options
      });
      
      return result ? result.getDataValue('result') : null;
    } catch (error) {
      console.error(`聚合查询${this.model.name}失败:`, error);
      throw error;
    }
  }

  // 获取最大值
  async getMax(field, where = {}) {
    return await this.aggregate('MAX', field, where);
  }

  // 获取最小值
  async getMin(field, where = {}) {
    return await this.aggregate('MIN', field, where);
  }

  // 获取平均值
  async getAvg(field, where = {}) {
    return await this.aggregate('AVG', field, where);
  }

  // 获取总和
  async getSum(field, where = {}) {
    return await this.aggregate('SUM', field, where);
  }

  // 获取计数
  async getCount(field = '*', where = {}) {
    return await this.aggregate('COUNT', field, where);
  }
}

module.exports = BaseService; 