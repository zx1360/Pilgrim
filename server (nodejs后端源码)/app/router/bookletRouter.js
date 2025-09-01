const express = require('express');
const router = express.Router();
const { TaskController, taskUploadMiddleware } = require('../controller/bookletController');

// 获取今日任务
router.get('/routine/today', TaskController.getTodayTask);

// 提交任务
router.post('/routine/submit', TaskController.submitTask);

// 创建新样式
router.post('/routine/style/new', taskUploadMiddleware, TaskController.createNewStyle);

module.exports = router;    