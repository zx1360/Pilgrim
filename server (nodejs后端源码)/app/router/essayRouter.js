const express = require('express');
const router = express.Router();
const {EssayController, essayUploadMiddleware} = require('../controller/essayController');


// 获取日期和标签完全对应的随笔
router.get("/essays/day", EssayController.getEssayByDayAndLabels)

// 获取所有公开随笔
router.get('/essays/all', EssayController.getAllPublicEssays);

// 根据标签获取公开随笔
router.get('/essays/some', EssayController.getEssaysByTags);

// 获取所有随笔（包括非公开）
router.get('/essays/all/myself', EssayController.getAllEssays);

// 根据标签获取所有随笔（包括非公开）
router.get('/essays/some/myself', EssayController.getEssaysByTagsMyself);

// 获取所有标签及其文章计数
router.get('/tags', EssayController.getAllTags);


// 创建新随笔
router.post(
  '/new',
  essayUploadMiddleware,
  EssayController.createEssay
);

module.exports = router; 