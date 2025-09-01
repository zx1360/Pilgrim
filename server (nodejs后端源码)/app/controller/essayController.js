const EssayModel = require('../model/essayModel');
const multer = require('multer');

class EssayController {
  // 获取日期和标签完全相同的随笔.
  static async getEssayByDayAndLabels(req, res) {
    try {
      const { date, labels } = req.query;
      
      // 参数验证
      if (!date) {
        return res.status(400).json({ 
          success: false, 
          message: '缺少必要参数: date' 
        });
      }
      
      const parsedLabels = Array.isArray(labels) 
        ? labels 
        : labels ? [labels] : [];
      
      // 查询随笔
      const essay = await EssayModel.getEssayByDayAndLabels(date, parsedLabels);
      
      res.status(200).json({ 
        success: true, 
        data: essay || {} 
      });
    } catch (error) {
      console.error('获取随笔失败:', error);
      res.status(500).json({ 
        success: false, 
        message: '服务器内部错误',
        error: error.message
      });
    }
  }

  /**
   * 获取所有公开随笔
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async getAllPublicEssays(req, res) {
    try {
      const essays = await EssayModel.getAllPublicEssays();
      res.json(essays);
    } catch (error) {
      console.error('获取公开随笔失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  /**
   * 获取所有随笔（包括非公开）
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async getAllEssays(req, res) {
    try {
      const essays = await EssayModel.getAllEssays();
      res.json(essays);
    } catch (error) {
      console.error('获取所有随笔失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  /**
   * 根据标签获取公开随笔
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async getEssaysByTags(req, res) {
    try {
      const tags = Array.isArray(req.query.tags) 
        ? req.query.tags 
        : [req.query.tags].filter(t => t);
      
      if (!tags || tags.length === 0) {
        return res.status(400).json({ error: '请提供至少一个标签' });
      }
      
      const essays = await EssayModel.getEssaysByTags(tags);
      res.json(essays);
    } catch (error) {
      console.error('根据标签获取公开随笔失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  /**
   * 根据标签获取所有随笔（包括非公开）
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async getEssaysByTagsMyself(req, res) {
    try {
      const tags = Array.isArray(req.query.tags) 
        ? req.query.tags 
        : [req.query.tags].filter(t => t);
      
      if (!tags || tags.length === 0) {
        return res.status(204).json([]);
      }
      
      const essays = await EssayModel.getEssaysByTagsMyself(tags);
      res.json(essays);
    } catch (error) {
      console.error('根据标签获取所有随笔失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  /**
   * 获取所有标签及其文章计数
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async getAllTags(req, res) {
    try {
      const tags = await EssayModel.getAllTags();
      res.json(tags);
    } catch (error) {
      console.error('获取标签列表失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }



  /**
   * 创建随笔的控制器方法
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  static async createEssay(req, res) {
    try {
      // 从请求中获取表单数据
      const {
        create_time: createTime,
        format,
        content,
        word_count: wordCount,
        is_public: isPublic,
        labels
      } = req.body;

      // 解析标签数组
      const parsedLabels = Array.isArray(labels)
        ? labels
        : labels ? [labels] : [];

      // 检查是否有相同日期和标签的随笔
      const shouldReplace = await EssayModel.getEssayByDayAndLabels(
        createTime,
        parsedLabels,
        true
      );

      // 如果存在相同日期和标签的随笔，则删除
      if (shouldReplace) {
        const existingEssay = await EssayModel.getEssayByDayAndLabels(
          createTime,
          parsedLabels
        );
        await EssayModel.deleteEssay(existingEssay.id);
      }

      // 处理上传的图片
      const files = req.files || [];
      const images = await EssayModel.saveImages(files);

      // 构建最终内容 (在原有内容后添加图片引用)
      let finalContent = content;
      if (images.length > 0) {
        // 为每个图片添加引用标记
        const imageReferences = images
          .map(img => `!|${img.caption}|<${img.url}>`)
          .join('\n');
        
        // 将图片引用添加到内容末尾
        finalContent = `${finalContent}\n${imageReferences}`;
      }

      // 保存随笔
      const essayData = {
        createTime,
        format: parseInt(format),
        content: finalContent,
        wordCount: parseInt(wordCount),
        isPublic: isPublic === 'true' || isPublic === '1'
      };

      const essayId = await EssayModel.saveEssay(essayData);

      // 处理标签
      await EssayModel.processTags(essayId, parsedLabels);

      res.status(201).json({
        success: true,
        message: '随笔创建成功',
        data: { essayId }
      });
    } catch (error) {
      console.error('创建随笔失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
      });
    }
  }
}


/**
 * Multer中间件配置 - 处理图片上传
 */
const storage = multer.memoryStorage(); // 存储在内存中，稍后保存
const essayUploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 16 * 1024 * 1024 // 16MB限制
  }
}).array('images');

module.exports = {
  EssayController,
  essayUploadMiddleware
};  