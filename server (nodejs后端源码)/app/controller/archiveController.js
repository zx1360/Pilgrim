const ArchiveModel = require('../model/archiveModel');


class ArchiveController {
  // 获取所有档案
  static async getAllArchives(req, res) {
    try {
      const archives = await ArchiveModel.getAllArchives();
      res.json(archives);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  // 创建或更新档案
  static async createArchive(req, res) {
    try {
      const { content, labels } = req.body;
      const files = req.files || [];
      
      // 验证输入
      if (!content) {
        return res.status(400).json({ error: '内容不能为空' });
      }
      
      // 创建时间
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const createTime = `${year}-${month}-${day}`; // YYYY-MM-DD
      
      // 解析标签
      const parsedLabels = labels ? labels.split(',') : [];
      
      // 保存到数据库（创建或更新）
      const archive = await ArchiveModel.createOrUpdateArchive(
        content,
        createTime,
        parsedLabels,
        files
      );
      
      res.status(200).json({
        message: '档案操作成功',
        archive
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: '操作档案失败' });
    }
  }
}

module.exports = ArchiveController;    