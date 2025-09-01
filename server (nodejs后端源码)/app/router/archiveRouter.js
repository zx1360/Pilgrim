const express = require('express');
const router = express.Router();
const ArchiveController = require('../controller/archiveController');
const multer = require('multer');
const path = require('path');

// 配置multer内存存储引擎
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('只允许上传图片文件!'));
  }
});

/**
 * @route GET /archives/all
 * @desc 获取所有档案
 * @access 公开
 */
router.get('/archives/all', ArchiveController.getAllArchives);

/**
 * @route POST /archives/write
 * @desc 创建或更新档案
 * @access 公开
 */
router.post(
  '/archives/write', 
  upload.array('files'), 
  ArchiveController.createArchive
);

module.exports = router; 