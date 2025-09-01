const {archiveDb} = require('../../config/db.config');
const path = require('path');
const fs = require('fs').promises;

class ArchiveModel {
  // 获取所有档案记录
  static async getAllArchives() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        strftime('%Y', a.create_time) AS year,
        strftime('%m-%d', a.create_time) AS date,
        a.id AS archive_id,
        a.content,
        t.name AS tag_name,
        i.file_name AS img_name
      FROM archives a
      LEFT JOIN archive_tag_relation atr ON a.id = atr.archive_id
      LEFT JOIN tags t ON atr.tag_id = t.id
      LEFT JOIN archive_images i ON a.id = i.archive_id
      ORDER BY a.create_time DESC; -- 按创建时间降序排列
    `;

    archiveDb.all(sql, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      // 格式化结果
      const result = {};
      rows.forEach(row => {
        const { year, date, archive_id, content, tag_name, img_name } = row;
        
        if (!result[year]) {
          result[year] = {
            year,
            archives: []
          };
        }
        
        let archive = result[year].archives.find(a => a.id === archive_id);
        if (!archive) {
          archive = {
            id: archive_id,
            date,
            content,
            labels: [],
            imgs: []
          };
          result[year].archives.push(archive);
        }
        
        if (tag_name && !archive.labels.includes(tag_name)) {
          archive.labels.push(tag_name);
        }
        
        if (img_name && !archive.imgs.includes(img_name)) {
          archive.imgs.push(`/img_storage/archive/${img_name}`);
        }
      });

      // 按年份降序排列
      const sortedResult = Object.values(result).sort((a, b) => b.year - a.year);
      
      // 确保每个年份下的档案按日期降序排列（已在SQL中处理）
      resolve(sortedResult);
    });
  });
}

  // 查找是否存在日期和标签完全相同的档案
  static findExistingArchive(createTime, labels) {
    return new Promise((resolve, reject) => {
      const baseQuery = `
        SELECT a.id
        FROM archives a
        JOIN archive_tag_relation r ON a.id = r.archive_id
        JOIN tags t ON r.tag_id = t.id
        WHERE a.create_time = ?
          AND t.name IN (${labels.map(() => '?').join(',')})
        GROUP BY a.id
        HAVING COUNT(DISTINCT t.name) = ?
      `;

      // 检查是否存在符合条件的档案
      archiveDb.get(baseQuery, [createTime, ...labels, labels.length], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(row ? row.id : null);
      });
    });
  }

  // 创建或更新档案
  static async createOrUpdateArchive(content, createTime, labels, files) {
    return new Promise((resolve, reject) => {
      archiveDb.serialize(() => {
        // 开始事务
        archiveDb.run('BEGIN TRANSACTION', async (err) => {
          if (err) {
            reject(err);
            return;
          }

          try {
            let archiveId;
            const imageDir = path.join(__dirname, '../../public/img_storage/archive');

            // 查找是否存在相同日期和标签的档案
            const existingId = await ArchiveModel.findExistingArchive(createTime, labels);

            if (existingId) {
              // 更新现有档案
              archiveId = existingId;

              // 获取旧图片列表
              const oldImages = await new Promise((resolve, reject) => {
                archiveDb.all(
                  'SELECT file_name FROM archive_images WHERE archive_id = ?',
                  [archiveId],
                  (err, rows) => {
                    if (err) {
                      reject(err);
                      return;
                    }
                    resolve(rows.map(row => row.file_name));
                  }
                );
              });

              // 删除旧图片文件
              for (const fileName of oldImages) {
                const filePath = path.join(imageDir, fileName);
                try {
                  await fs.unlink(filePath);
                } catch (unlinkErr) {
                  console.error('删除旧图片失败:', unlinkErr);
                }
              }

              // 删除旧的标签关系和图片关系
              await new Promise((resolve, reject) => {
                archiveDb.run(
                  'DELETE FROM archive_tag_relation WHERE archive_id = ?',
                  [archiveId],
                  (err) => {
                    if (err) {
                      reject(err);
                      return;
                    }
                    resolve();
                  }
                );
              });

              await new Promise((resolve, reject) => {
                archiveDb.run(
                  'DELETE FROM archive_images WHERE archive_id = ?',
                  [archiveId],
                  (err) => {
                    if (err) {
                      reject(err);
                      return;
                    }
                    resolve();
                  }
                );
              });

              // 更新档案内容
              await new Promise((resolve, reject) => {
                const stmt = archiveDb.prepare('UPDATE archives SET content = ? WHERE id = ?');
                stmt.run(content, archiveId, (err) => {
                  stmt.finalize();
                  if (err) {
                    reject(err);
                    return;
                  }
                  resolve();
                });
              });
            } else {
              // 创建新档案
              await new Promise((resolve, reject) => {
                const stmt = archiveDb.prepare(
                  'INSERT INTO archives (content, create_time) VALUES (?, ?)'
                );
                stmt.run(content, createTime, function(err) {
                  stmt.finalize();
                  if (err) {
                    reject(err);
                    return;
                  }
                  archiveId = this.lastID;
                  resolve();
                });
              });
            }

            // 处理标签
            if (labels && labels.length > 0) {
              const insertTag = archiveDb.prepare(
                'INSERT OR IGNORE INTO tags (name) VALUES (?)'
              );
              const insertRelation = archiveDb.prepare(
                'INSERT INTO archive_tag_relation (archive_id, tag_id) VALUES (?, (SELECT id FROM tags WHERE name = ?))'
              );

              for (const label of labels) {
                insertTag.run(label);
                insertRelation.run(archiveId, label);
              }

              insertTag.finalize();
              insertRelation.finalize();
            }

            // 处理图片
            if (files && files.length > 0) {
              // 确保目录存在
              await fs.mkdir(imageDir, { recursive: true });

              const insertImage = archiveDb.prepare(
                'INSERT INTO archive_images (archive_id, file_name) VALUES (?, ?)'
              );

              for (const file of files) {
                const timestamp = Date.now();
                const ext = path.extname(file.originalname);
                const fileName = `${timestamp}${ext}`;
                const filePath = path.join(imageDir, fileName);

                // 保存图片文件
                await fs.writeFile(filePath, file.buffer);
                insertImage.run(archiveId, fileName);
              }

              insertImage.finalize();
            }

            // 提交事务
            archiveDb.run('COMMIT', (err) => {
              if (err) {
                archiveDb.run('ROLLBACK');
                reject(err);
                return;
              }

              // 返回完整的档案信息
              resolve(ArchiveModel.getArchiveById(archiveId));
            });
          } catch (err) {
            archiveDb.run('ROLLBACK');
            reject(err);
          }
        });
      });
    });
  }

  // 根据ID获取档案
  static getArchiveById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT a.id, strftime('%Y', a.create_time) as year, 
               strftime('%m-%d', a.create_time) as date, 
               a.content, 
               group_concat(DISTINCT t.name) as labels,
               group_concat(DISTINCT i.file_name) as images
        FROM archives a
        LEFT JOIN archive_tag_relation r ON a.id = r.archive_id
        LEFT JOIN tags t ON r.tag_id = t.id
        LEFT JOIN archive_images i ON a.id = i.archive_id
        WHERE a.id = ?
        GROUP BY a.id;
      `;

      archiveDb.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (!row) {
          resolve(null);
          return;
        }

        const archive = {
          id: row.id,
          year: row.year,
          date: row.date,
          content: row.content,
          labels: row.labels ? row.labels.split(',') : [],
          imgs: row.images ? row.images.split(',').map(img => `/img_storage/archive/${img}`) : []
        };

        resolve(archive);
      });
    });
  }
}

module.exports = ArchiveModel;   