const { essayDb } = require('../../config/db.config');
const path = require('path');
const fs = require('fs').promises;

class EssayModel {
  // ####### 读日记
  /**
   * 检查指定日期和标签的随笔是否存在
   * @param {string} date - 日期 (YYYY-MM-DD格式)
   * @param {string[]} labels - 标签数组
   * @returns {Promise<{id: number}|null>} - 存在则返回随笔ID对象，否则返回null
   */
  static async checkExistingEssayWithLabels(date, labels) {
    return new Promise((resolve, reject) => {
      if (!labels || labels.length === 0) {
        return resolve(null);
      }
      
      const placeholders = labels.map(() => '?').join(',');
      const sql = `
        SELECT e.id
        FROM essays e
        JOIN essay_tag_links et ON e.id = et.essay_id
        JOIN tags t ON et.tag_id = t.id
        WHERE e.create_time = ?
        GROUP BY e.id
        HAVING COUNT(DISTINCT t.id) = ? 
          AND NOT EXISTS (
            SELECT 1 FROM essay_tag_links et2 
            JOIN tags t2 ON et2.tag_id = t2.id 
            WHERE et2.essay_id = e.id 
              AND t2.name NOT IN (${placeholders})
        )
      `;
      
      essayDb.get(sql, [date, labels.length, ...labels], (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }
  
   /**
   * 获取指定日期和标签的随笔（精确匹配）
   * @param {string} date - 日期 (YYYY-MM-DD格式)
   * @param {string[]} labels - 标签数组
   * @returns {Promise<Object|null>} - 随笔对象（包含标签），不存在则返回null
   */
  static async getEssayByDayAndLabels(date, labels) {
    return new Promise((resolve, reject) => {
      if (!labels || labels.length === 0) {
        return resolve(null);
      }
      
      const placeholders = labels.map(() => '?').join(',');
      const sql = `
        SELECT e.*, GROUP_CONCAT(t.name) AS tag_names
        FROM essays e
        JOIN essay_tag_links et ON e.id = et.essay_id
        JOIN tags t ON et.tag_id = t.id
        WHERE e.create_time = ?
        GROUP BY e.id
        HAVING COUNT(DISTINCT t.id) = ? 
          AND NOT EXISTS (
            SELECT 1 FROM essay_tag_links et2 
            JOIN tags t2 ON et2.tag_id = t2.id 
            WHERE et2.essay_id = e.id 
              AND t2.name NOT IN (${placeholders})
        )
      `;
      
      essayDb.get(sql, [date, labels.length, ...labels], (err, row) => {
        if (err) reject(err);
        else {
          const essay = row ? {
            ...row,
            tags: row.tag_names ? row.tag_names.split(',') : []
          } : null;
          resolve(essay);
        }
      });
    });
  }

  /**
   * 获取所有公开随笔
   * @returns {Promise<Array>} 按年份分组的随笔列表
   */
  static async getAllPublicEssays() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT e.*, GROUP_CONCAT(t.name) as labels
        FROM essays e
        LEFT JOIN essay_tag_links etl ON e.id = etl.essay_id
        LEFT JOIN tags t ON etl.tag_id = t.id
        WHERE e.is_public = 1
        GROUP BY e.id
        ORDER BY e.create_time DESC
      `;
      
      essayDb.all(query, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(this.formatEssaysResponse(rows));
        }
      });
    });
  }

  /**
   * 获取所有随笔（包括非公开）
   * @returns {Promise<Array>} 按年份分组的随笔列表
   */
  static async getAllEssays() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT e.*, GROUP_CONCAT(t.name) as labels
        FROM essays e
        LEFT JOIN essay_tag_links etl ON e.id = etl.essay_id
        LEFT JOIN tags t ON etl.tag_id = t.id
        GROUP BY e.id
        ORDER BY e.create_time DESC
      `;
      
      essayDb.all(query, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(this.formatEssaysResponse(rows));
        }
      });
    });
  }

  /**
   * 根据标签获取公开随笔（包含任一标签即可）
   * @param {Array<string>} tags 标签数组
   * @returns {Promise<Array>} 按年份分组的随笔列表
   */
  static async getEssaysByTags(tags) {
    return this.getEssaysByTagsInternal(tags, true);
  }

  /**
   * 根据标签获取所有随笔（包括非公开，包含任一标签即可）
   * @param {Array<string>} tags 标签数组
   * @returns {Promise<Array>} 按年份分组的随笔列表
   */
  static async getEssaysByTagsMyself(tags) {
    return this.getEssaysByTagsInternal(tags, false);
  }

  /**
   * 内部方法：根据标签获取随笔（包含任一标签即可）
   * @param {Array<string>} tags 标签数组
   * @param {boolean} onlyPublic 是否只获取公开随笔
   * @returns {Promise<Array>} 按年份分组的随笔列表
   */
  static async getEssaysByTagsInternal(tags, onlyPublic) {
    return new Promise((resolve, reject) => {      
      const placeholders = tags.map(() => '?').join(',');
      const publicCondition = onlyPublic ? 'AND e.is_public = 1' : '';
      
      const query = `
        SELECT e.*, GROUP_CONCAT(t.name) as labels
        FROM essays e
        JOIN essay_tag_links etl ON e.id = etl.essay_id
        JOIN tags t ON etl.tag_id = t.id
        WHERE t.name IN (${placeholders})
        ${publicCondition}
        GROUP BY e.id
        ORDER BY e.create_time DESC
      `;
      
      essayDb.all(query, tags, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(this.formatEssaysResponse(rows));
        }
      });
    });
  }

  // ####### 读标签
  /**
   * 获取所有标签及其文章计数
   * @returns {Promise<Array>} 标签列表
   */
  static async getAllTags() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT t.id, t.name, COUNT(etl.essay_id) as count
        FROM tags t
        LEFT JOIN essay_tag_links etl ON t.id = etl.tag_id
        GROUP BY t.id
        ORDER BY count DESC
      `;
      
      essayDb.all(query, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 格式化随笔响应数据
   * @param {Array} essays 原始随笔数据
   * @returns {Array} 格式化后的随笔数据
   */
  static formatEssaysResponse(essays) {
    if (!essays || essays.length === 0) {
      return [];
    }
    
    // 按年份分组
    const groupedByYear = {};
    
    essays.forEach(essay => {
      // 格式化日期
      const createDate = new Date(essay.create_time+"Z"); // 不使用本地时间读取, 否则会变更.
      const year = createDate.getFullYear();
      const formattedDate = createDate.toISOString().split('T')[0];
      
      // 处理标签
      const labels = essay.labels ? essay.labels.split(',') : [];
      
      // 初始化年份分组
      if (!groupedByYear[year]) {
        groupedByYear[year] = {
          year,
          essay_count: 0,
          total_word_count: 0,
          essays: []
        };
      }
      
      // 添加到分组
      groupedByYear[year].essay_count++;
      groupedByYear[year].total_word_count += essay.word_count || 0;
      groupedByYear[year].essays.push({
        ...essay,
        date: formattedDate,
        labels
      });
    });
    
    // 转换为数组并排序
    return Object.values(groupedByYear).sort((a, b) => b.year - a.year);
  }



  // ######## 写日记
  /**
   * 检查指定创建时间是否存在随笔记录
   * @param {string} createTime - 随笔创建时间 (YYYY-MM-DD格式)
   * @returns {Promise<{id: number}|null>} - 如果存在返回包含id的对象，否则返回null
   */
  static async checkExistingEssay(createTime) {
    return new Promise((resolve, reject) => {
      essayDb.get(
        'SELECT id FROM essays WHERE create_time = ?',
        [createTime],
        (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        }
      );
    });
  }

  /**
 * 删除指定ID的随笔及其关联标签和图片
 * @param {number} essayId - 随笔ID
 * @returns {Promise<void>}
 */
static async deleteEssay(essayId) {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. 获取随笔内容以提取图片URL
      const essay = await this.getEssayById(essayId);
      if (!essay) return resolve();
      
      // 2. 提取所有图片URL
      const imageUrls = this.extractImageUrls(essay.content);
      
      // 3. 开始事务
      essayDb.serialize(() => {
        essayDb.run('BEGIN TRANSACTION', (err) => {
          if (err) return reject(err);
          
          // 4. 删除随笔-标签关联
          essayDb.run(
            'DELETE FROM essay_tag_links WHERE essay_id = ?',
            [essayId],
            (err) => {
              if (err) {
                essayDb.run('ROLLBACK');
                return reject(err);
              }
              
              // 5. 删除随笔记录
              essayDb.run(
                'DELETE FROM essays WHERE id = ?',
                [essayId],
                (err) => {
                  if (err) {
                    essayDb.run('ROLLBACK');
                    return reject(err);
                  }
                  
                  // 6. 提交事务
                  essayDb.run('COMMIT', (err) => {
                    if (err) return reject(err);
                    
                    // 7. 异步删除图片文件
                    this.deleteImages(imageUrls).catch(console.error);
                    resolve();
                  });
                }
              );
            }
          );
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

  /**
   * 保存随笔数据到数据库
   * @param {Object} essayData - 随笔数据
   * @param {string} essayData.createTime - 创建时间
   * @param {number} essayData.format - 内容格式(0=纯文本, 1=Markdown, 2=HTML)
   * @param {string} essayData.content - 随笔内容
   * @param {number} essayData.wordCount - 字数统计
   * @param {boolean} essayData.isPublic - 是否公开
   * @returns {Promise<number>} - 新创建的随笔ID
   */
  static async saveEssay(essayData) {
    return new Promise((resolve, reject) => {
      essayDb.run(
        `INSERT INTO essays (create_time, format, content, word_count, is_public) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          essayData.createTime,
          essayData.format,
          essayData.content,
          essayData.wordCount,
          essayData.isPublic ? 1 : 0
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  /**
   * 处理随笔标签，不存在的标签会被创建
   * @param {number} essayId - 随笔ID
   * @param {string[]} tags - 标签数组
   * @returns {Promise<void>}
   */
  static async processTags(essayId, tags) {
    return new Promise((resolve, reject) => {
      essayDb.serialize(() => {
        const insertTag = (tag) => {
          return new Promise((res, rej) => {
            essayDb.get(
              'SELECT id FROM tags WHERE name = ?',
              [tag],
              (err, row) => {
                if (err) rej(err);
                else if (row) {
                  essayDb.run(
                    'INSERT INTO essay_tag_links (essay_id, tag_id) VALUES (?, ?)',
                    [essayId, row.id],
                    (err) => err ? rej(err) : res()
                  );
                } else {
                  essayDb.run(
                    'INSERT INTO tags (name) VALUES (?)',
                    [tag],
                    function(err) {
                      if (err) rej(err);
                      else {
                        essayDb.run(
                          'INSERT INTO essay_tag_links (essay_id, tag_id) VALUES (?, ?)',
                          [essayId, this.lastID],
                          (err) => err ? rej(err) : res()
                        );
                      }
                    }
                  );
                }
              }
            );
          });
        };

        Promise.all(tags.map(insertTag))
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  /**
   * 保存上传的图片并返回图片URL
   * @param {Express.Multer.File[]} files - 上传的文件数组
   * @returns {Promise<Object[]>} - 图片信息数组，包含文件名和URL
   */
  static async saveImages(files) {
    // TODO: 替换Nginx后路径替换.
    const saveDir = path.join(__dirname, '../../public/img_storage/essay');
    const imageUrls = [];

    try {
      // 确保目录存在
      await fs.mkdir(saveDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // 生成唯一文件名
      const fileName = `img_${Date.now()}_${i}${path.extname(file.originalname)}`;
      const filePath = path.join(saveDir, fileName);
      const relativePath = `/img_storage/essay/${fileName}`;

      // 保存文件
      await fs.writeFile(filePath, file.buffer);
      
      imageUrls.push({
        url: relativePath,
        caption: `图片${i + 1}`
      });
    }

    return imageUrls;
  }

  /**
 * 根据ID获取随笔
 * @param {number} essayId - 随笔ID
 * @returns {Promise<Object|null>} - 随笔对象，不存在则返回null
 */
static async getEssayById(essayId) {
  return new Promise((resolve, reject) => {
    essayDb.get(
      'SELECT content FROM essays WHERE id = ?',
      [essayId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      }
    );
  });
}

/**
 * 从内容中提取图片URL
 * @param {string} content - 随笔内容
 * @returns {string[]} - 图片URL数组
 */
static extractImageUrls(content) {
  if (!content) return [];
  // 匹配格式: !|图片说明|<图片URL>
  const regex = /!\|.*?\|<(.*?)>/g;
  const matches = content.match(regex);
  if (!matches) return [];
  
  return matches.map(match => {
    const url = match.match(/<(.*?)>/);
    return url ? url[1] : '';
  }).filter(Boolean);
}

/**
 * 删除图片文件
 * @param {string[]} imageUrls - 图片URL数组
 * @returns {Promise<void>}
 */
static async deleteImages(imageUrls) {
  if (imageUrls.length === 0) return;
  
  const saveDir = path.join(__dirname, '../../public');
  
  for (const url of imageUrls) {
    try {
      // 解析URL获取文件路径
      const filePath = path.join(saveDir, url.replace(/^\/+/, ''));
      // 检查文件是否存在
      await fs.access(filePath);
      // 删除文件
      await fs.unlink(filePath);
    } catch (error) {
      // 忽略文件不存在的错误
      if (error.code !== 'ENOENT') {
        console.error('删除图片失败:', error);
      }
    }
  }
}
}



module.exports = EssayModel;  