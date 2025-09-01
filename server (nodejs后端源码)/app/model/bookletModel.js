const { bookletDb } = require('../../config/db.config');
const path = require('path');
const fs = require('fs').promises;

class Model {
    static async getLatestStyle() {
        return new Promise((resolve, reject) => {
            bookletDb.get(
                'SELECT * FROM styles ORDER BY start_date DESC LIMIT 1',
                (err, row) => {
                    err ? reject(err) : resolve(row || null);
                }
            );
        });
    }

    static async checkStyleExists(date) {
        return new Promise((resolve, reject) => {
            bookletDb.get(
                'SELECT id FROM styles WHERE start_date = ?',
                [date],
                (err, row) => {
                    err ? reject(err) : resolve(row ? row.id : null);
                }
            );
        });
    }

    static async checkStyleHasRecords(styleId) {
        return new Promise((resolve, reject) => {
            bookletDb.get(
                'SELECT COUNT(*) as count FROM records WHERE style_id = ?',
                [styleId],
                (err, row) => {
                    err ? reject(err) : resolve(row.count > 0);
                }
            );
        });
    }

    static async deleteStyle(styleId) {
        return new Promise((resolve, reject) => {
            bookletDb.serialize(() => {
                bookletDb.run(
                    'DELETE FROM tasks WHERE style_id = ?',
                    [styleId],
                    (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        bookletDb.run(
                            'DELETE FROM styles WHERE id = ?',
                            [styleId],
                            (err) => err ? reject(err) : resolve()
                        );
                    }
                );
            });
        });
    }

    static async createStyle(startDate) {
        return new Promise((resolve, reject) => {
            bookletDb.run(
                'INSERT INTO styles (start_date, valid_checkin, fully_done, longest_streak, longest_fully_streak) VALUES (?, 0, 0, 0, 0)',
                [startDate],
                function(err) { // 注意这里使用普通函数而不是箭头函数，以便获取正确的this
                    err ? reject(err) : resolve(this.lastID);
                }
            );
        });
    }

    static async getTasksByStyleId(styleId) {
        return new Promise((resolve, reject) => {
            bookletDb.all(
                'SELECT * FROM tasks WHERE style_id = ? ORDER BY id ASC',
                [styleId],
                (err, rows) => err ? reject(err) : resolve(rows || [])
            );
        });
    }

    static async createTasks(styleId, tasks) {
        return new Promise((resolve, reject) => {
            const stmt = bookletDb.prepare(
                'INSERT INTO tasks (style_id, title, description, image) VALUES (?, ?, ?, ?)'
            );
            tasks.forEach(task => stmt.run(styleId, task.title, task.description, task.imagePath));
            stmt.finalize(err => err ? reject(err) : resolve());
        });
    }

    static async getTodayRecord(styleId, date) {
        return new Promise((resolve, reject) => {
            bookletDb.get(
                'SELECT * FROM records WHERE style_id = ? AND record_date = ?',
                [styleId, date],
                (err, row) => err ? reject(err) : resolve(row || {})
            );
        });
    }

    static async getTaskRecords(recordId) {
        return new Promise((resolve, reject) => {
            bookletDb.all(
                'SELECT * FROM task_records WHERE record_id = ?',
                [recordId],
                (err, rows) => err ? reject(err) : resolve(rows || [])
            );
        });
    }

    static async createOrUpdateRecord(styleId, recordDate, message) {
        return new Promise((resolve, reject) => {
            bookletDb.get(
                'SELECT id FROM records WHERE style_id = ? AND record_date = ?',
                [styleId, recordDate],
                (err, row) => {
                    if (err) return reject(err);
                    if (row) {
                        bookletDb.run(
                            'UPDATE records SET message = ? WHERE id = ?',
                            [message, row.id],
                            (err) => err ? reject(err) : resolve(row.id)
                        );
                    } else {
                        bookletDb.run(
                            'INSERT INTO records (style_id, record_date, message) VALUES (?, ?, ?)',
                            [styleId, recordDate, message],
                            function(err) { // 使用普通函数获取正确的this
                                err ? reject(err) : resolve(this.lastID);
                            }
                        );
                    }
                }
            );
        });
    }

    static async updateTaskRecords(recordId, styleId, finishArray) {
        const tasks = await this.getTasksByStyleId(styleId);
        const taskIdMap = tasks.reduce((map, task, index) => {
            map[task.id] = index;
            return map;
        }, {});

        return new Promise((resolve, reject) => {
            bookletDb.serialize(() => {
                bookletDb.run('BEGIN TRANSACTION', (err) => {
                    if (err) return reject(err);
                    const stmt = bookletDb.prepare(
                        `INSERT INTO task_records (record_id, task_id, is_done) 
                         VALUES (?, ?, ?)
                         ON CONFLICT(record_id, task_id) DO UPDATE SET is_done = excluded.is_done`
                    );
                    tasks.forEach(task => {
                        const taskIndex = taskIdMap[task.id];
                        const isDone = taskIndex < finishArray.length ? finishArray[taskIndex] : 0;
                        stmt.run(recordId, task.id, isDone);
                    });
                    stmt.finalize((err) => {
                        if (err) {
                            bookletDb.run('ROLLBACK', () => reject(err));
                            return;
                        }
                        bookletDb.run('COMMIT', (err) => err ? reject(err) : resolve());
                    });
                });
            });
        });
    }

    static async getTodayTaskData() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        
        const style = await this.getLatestStyle();
        if (!style) return {};
        const tasks = await this.getTasksByStyleId(style.id);
        const record = await this.getTodayRecord(style.id, today);
        const taskRecords = await this.getTaskRecords(record.id || null);
        const tasksWithStatus = tasks.map(task => {
            const taskRecord = taskRecords.find(tr => tr.task_id === task.id);
            return {
                title: task.title,
                description: task.description,
                image: task.image,
                is_done: taskRecord ? taskRecord.is_done : 0
            };
        });
        return {
            style: {
                style_id: style.id,
                start_date: style.start_date,
                valid_checkin: style.valid_checkin,
                fully_done: style.fully_done,
                longest_streak: style.longest_streak,
                longest_fully_streak: style.longest_fully_streak
            },
            tasks: tasksWithStatus,
            message: record.message || ''
        };
    }

    static async submitTask(styleId, finish, message) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;

        const style = await this.getStyleById(styleId);
        if (!style) throw new Error(`找不到样式ID: ${styleId}`);
        
        // 创建或更新记录，并获取正确的recordId
        const recordId = await this.createOrUpdateRecord(styleId, today, message);
        
        // 更新任务记录
        await this.updateTaskRecords(recordId, styleId, finish);
        
        // 刷新样式统计信息
        await this.refresh_info(styleId);
        
        return recordId;
    }

    static async createNewStyle(tasks) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        
        const existingStyleId = await this.checkStyleExists(today);
        if (existingStyleId) {
            const hasRecords = await this.checkStyleHasRecords(existingStyleId);
            if (hasRecords) throw new Error('今天已有打卡记录，次日再新建样式');
            await this.deleteStyle(existingStyleId);
        }
        const styleId = await this.createStyle(today);
        
        const imgDir = path.join(__dirname, '../../public/img_storage/booklet');
        await fs.mkdir(imgDir, { recursive: true });
        const processedTasks = await Promise.all(
            tasks.map(async task => {
                if (!task.imgFile) {
                    throw new Error('任务图片不存在');
                }
                const ext = path.extname(task.imgFile.originalname);
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`;
                const savePath = path.join(imgDir, fileName);
                const dbPath = `/img_storage/booklet/${fileName}`;
                await fs.writeFile(savePath, task.imgFile.buffer);
                return { title: task.title, description: task.description, imagePath: dbPath };
            })
        );
        await this.createTasks(styleId, processedTasks);
    }

    static async getStyleById(styleId) {
        return new Promise((resolve, reject) => {
            bookletDb.get(
                'SELECT * FROM styles WHERE id = ?',
                [styleId],
                (err, row) => err ? reject(err) : resolve(row || null)
            );
        });
    }

    static async debugGetTaskRecords(recordId) {
        return new Promise((resolve, reject) => {
            bookletDb.all(
                'SELECT * FROM task_records WHERE record_id = ?',
                [recordId],
                (err, rows) => err ? reject(err) : resolve(rows || [])
            );
        });
    }

    static async refresh_info(styleId) {
        const style = await this.getStyleById(styleId);
        if (!style) throw new Error(`找不到样式ID: ${styleId}`);
        
        const records = await new Promise((resolve, reject) => {
            bookletDb.all(
                'SELECT * FROM records WHERE style_id = ? ORDER BY record_date ASC',
                [styleId],
                (err, rows) => err ? reject(err) : resolve(rows || [])
            );
        });
        
        let validCheckin = 0;        // 有效打卡次数（有记录就算）
        let fullyDone = 0;           // 全通打卡次数（完成所有任务）
        let longestStreak = 0;       // 最长连续打卡天数（有记录就算）
        let longestFullyStreak = 0;  // 最长连续全通打卡天数
        let currentStreak = 0;
        let currentFullyStreak = 0;
        let prevDate = null;
        const tasks = await this.getTasksByStyleId(styleId);
        const totalTasks = tasks.length;
        
        for (const record of records) {
            // 只要有记录就算作一次有效打卡
            validCheckin++;
            
            const taskRecords = await this.getTaskRecords(record.id);
            const isFullyDone = taskRecords.length === totalTasks && 
                               taskRecords.every(tr => tr.is_done === 1);
            
            if (isFullyDone) fullyDone++;
            
            // 计算连续打卡天数
            if (prevDate) {
                const currentDate = new Date(record.record_date);
                const prevDateObj = new Date(prevDate);
                const dateDiff = Math.floor((currentDate - prevDateObj) / (1000 * 60 * 60 * 24));
                
                // 连续打卡逻辑
                if (dateDiff === 1) {
                    currentStreak++;
                } else if (dateDiff > 1) {
                    currentStreak = 1;
                }
                longestStreak = Math.max(longestStreak, currentStreak);
                
                // 连续全通打卡逻辑
                if (dateDiff === 1 && isFullyDone) {
                    currentFullyStreak++;
                } else if (isFullyDone) {
                    currentFullyStreak = 1;
                } else {
                    currentFullyStreak = 0;
                }
                longestFullyStreak = Math.max(longestFullyStreak, currentFullyStreak);
            } else {
                currentStreak = 1;
                longestStreak = 1;
                if (isFullyDone) {
                    currentFullyStreak = 1;
                    longestFullyStreak = 1;
                }
            }
            
            prevDate = record.record_date;
        }
        
        await new Promise((resolve, reject) => {
            bookletDb.run(
                'UPDATE styles SET valid_checkin = ?, fully_done = ?, longest_streak = ?, longest_fully_streak = ? WHERE id = ?',
                [validCheckin, fullyDone, longestStreak, longestFullyStreak, styleId],
                (err) => err ? reject(err) : resolve({ 
                    validCheckin, 
                    fullyDone, 
                    longestStreak, 
                    longestFullyStreak 
                })
            );
        });
    }

    static async refresh_all_styles_info() {
        const styles = await new Promise((resolve, reject) => {
            bookletDb.all('SELECT * FROM styles', (err, rows) => err ? reject(err) : resolve(rows || []));
        });
        
        for (const style of styles) {
            try {
                await this.refresh_info(style.id);
                console.log(`[定时任务] 刷新样式 ${style.id} 统计信息成功`);
            } catch (err) {
                console.error(`[定时任务] 刷新样式 ${style.id} 统计信息失败:`, err);
            }
        }
        return { message: '所有样式统计信息刷新完成'};
    }
}
// 启用定时任务
// Model.refresh_all_styles_info();

module.exports = Model;