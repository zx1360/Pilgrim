const sqlite3 = require("sqlite3").verbose()
const path = require("path")


const db_path = path.join(__dirname, "../app_database/")


// #### 积微页
const bookletDb = new sqlite3.Database(path.join(db_path, "booklet/punch_card.db"), (err)=>{
  if(err){
    console.error(err)
  }
  bookletDb.serialize(()=>{
    bookletDb.run('pragma foreign_key = on', (err) => {
      if (err) {
        console.error('外键约束启用失败:', err.message);
      }
    })
    // 创建样式表，添加自增主键
    bookletDb.run(`create table if not exists styles(
        id integer primary key autoincrement,
        start_date date not null unique,
        valid_checkin integer not null default 0,
        fully_done integer not null default 0,
        longest_streak integer not null default 0,
        longest_fully_streak integer not null default 0
    )`);

    // 创建任务表，使用自增ID作为主键，关联到styles的自增ID
    bookletDb.run(`create table if not exists tasks(
        id integer primary key autoincrement,
        style_id integer not null,
        title text not null,
        description text not null,
        image text not null,
        foreign key (style_id) references styles(id) ON DELETE CASCADE
    )`);

    // 创建记录表，使用自增ID作为主键，关联到styles的自增ID
    bookletDb.run(`create table if not exists records(
        id integer primary key autoincrement,
        style_id integer not null,
        record_date date not null,
        message text not null,
        FOREIGN KEY (style_id) REFERENCES styles(id) ON DELETE CASCADE,
        UNIQUE (style_id, record_date)
    )`);

    // 创建任务完成记录表，关联到records和tasks的自增ID
    bookletDb.run(`create table if not exists task_records(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id integer not null,
        task_id integer not null,
        is_done integer not null CHECK (is_done IN (0, 1)),
        foreign key (record_id) references records(id) ON DELETE CASCADE,
        foreign key (task_id) references tasks(id) ON DELETE CASCADE,
        UNIQUE (record_id, task_id)
    )`);
  })
})



// #### 随笔页
const essayDb = new sqlite3.Database(path.join(db_path, "essay/essay.db"), (err)=>{
  if(err){
    console.error(err)
  }
  essayDb.serialize(()=>{
    // 启用外键约束
    essayDb.run('pragma foreign_key = on', (err) => {
      if (err) {
        console.error('外键约束启用失败:', err.message);
      }
    })
    essayDb.run(`
      create table if not exists essays(
        id integer primary key autoincrement,
        create_time datetime not null default current_timestamp,
        --  0=纯文本, 1=Markdown, 2=HTML(还没想好呈现形式)
        format integer not null check(format in (0, 1, 2)),
        content text not null,
        word_count integer default 0,
        is_public boolean default 1
      );`)
    essayDb.run(`
      create table if not exists tags(
        id integer primary key autoincrement,
        name text not null unique
      );`)
    essayDb.run(`
      create table if not exists essay_tag_links(
        essay_id integer not null,
        tag_id integer not null,
        primary key(essay_id, tag_id),
        foreign key (essay_id) references essays(id) on delete cascade,
        foreign key (tag_id) references tags(id) on delete cascade
      );`)
    essayDb.run(`
      CREATE INDEX IF NOT EXISTS idx_essays_create_time ON essays (create_time);
      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags (name);
      CREATE INDEX IF NOT EXISTS idx_essay_tag_relations_tag_id ON essay_tag_relations (tag_id);
      `)
  })
})



// #### 归档页
const archiveDb = new sqlite3.Database(path.join(db_path, "archive/archive.db"), (err)=>{
  if(err){
    console.error(err)
  }
  archiveDb.serialize(()=>{
    archiveDb.run('pragma foreign_key = on', (err) => {
      if (err) {
        console.error('外键约束启用失败:', err.message);
      }
    })
    const sql = `
    -- 档案表
    CREATE TABLE IF NOT EXISTS archives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      create_time TEXT NOT NULL,
      content TEXT NOT NULL
    );
    
    -- 标签表
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
    
    -- 档案与标签关联表
    CREATE TABLE IF NOT EXISTS archive_tag_relation (
      archive_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (archive_id, tag_id),
      FOREIGN KEY (archive_id) REFERENCES archives(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
    
    -- 档案图片表
    CREATE TABLE IF NOT EXISTS archive_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      archive_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      FOREIGN KEY (archive_id) REFERENCES archives(id) ON DELETE CASCADE
    );
    
    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_archives_create_time ON archives(create_time);
    CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
  `;

  archiveDb.exec(sql, (err) => {
    if (err) {
      console.error('创建表结构失败:', err.message);
    }
  });
  })
})



module.exports = {
  bookletDb,
  essayDb,
  archiveDb,
}
