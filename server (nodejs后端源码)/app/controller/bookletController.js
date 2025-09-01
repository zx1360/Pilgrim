const Model = require('../model/bookletModel');
const multer = require('multer');
const path = require('path');

class TaskController {
    static storage = multer.memoryStorage();
    static upload = multer({ storage: TaskController.storage });
    static taskUploadMiddleware = TaskController.upload.array('tasks');

    static async getTodayTask(req, res) {
        try {
            const result = await Model.getTodayTaskData();
            res.json(result);
        } catch (err) {
            console.error('获取今日任务失败:', err);
            res.status(500).json({ error: '服务器内部错误' });
        }
    }

    static async submitTask(req, res) {
        console.log('提交任务请求:', req.body);
        try {
            const { style_id, finish, message } = req.body;
            
            // 验证参数
            if (!style_id || !Array.isArray(finish) || typeof message !== 'string') {
                return res.status(400).json({ error: '参数格式不正确' });
            }
            
            // 转换为数字数组并验证任务完成状态
            const finishArray = finish.map(Number);
            
            // 检查转换后的值是否为有效的0或1
            if (finishArray.some(val => isNaN(val) || (val !== 0 && val !== 1))) {
                return res.status(400).json({ error: '任务完成状态必须为0或1' });
            }
            
            // 提交任务并获取记录ID
            const recordId = await Model.submitTask(parseInt(style_id), finishArray, message);
            
            res.json({ 
                success: true,
                recordId
            });
        } catch (err) {
            console.error('提交任务失败:', err);
            res.status(500).json({ error: err.message || '服务器内部错误' });
        }
    }

    static async createNewStyle(req, res) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: '请上传任务图片' });
            }
            
            const tasks = req.files.map((file, index) => {
                if (!req.body[`taskData${index}`]) {
                    throw new Error(`缺少任务${index}的元数据`);
                }
                const taskData = JSON.parse(req.body[`taskData${index}`]);
                return {
                    imgFile: file,
                    title: taskData.title,
                    description: taskData.description
                };
            });
            
            await Model.createNewStyle(tasks);
            res.json({ success: true });
        } catch (err) {
            console.error('创建新样式失败:', err);
            res.status(500).json({ error: err.message || '服务器内部错误' });
        }
    }
}

module.exports = {
    TaskController,
    taskUploadMiddleware: TaskController.taskUploadMiddleware
};    