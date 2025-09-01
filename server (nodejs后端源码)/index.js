const express = require("express")
const path = require("path")

const {PORT} = require("./config/app.config")

// const indexRouter = require("./app/router/indexRouter")
const bookletRouter = require("./app/router/bookletRouter")
const essayRouter = require("./app/router/essayRouter")
const mediaRouter = require("./app/router/mediaRouter")
// const butlerRouter = require("./app/router/butlerRouter")
const archiveRouter = require("./app/router/archiveRouter")


const app = express()
global.rootPath = __dirname

// 中间件处理请求体
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 配置静态资源目录
app.use(express.static(path.join(__dirname, 'public')));


// TODO: 如果要转为使用Nginx, 考虑删掉'api', Nginx自带替换路径
// app.use("/api/", indexRouter)
app.use("/api/booklet", bookletRouter)
app.use("/api/essay", essayRouter)
app.use("/api/media", mediaRouter)
// app.use("/api/butler", butlerRouter)
app.use("/api/archive", archiveRouter)


app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// // 对于无法处理的报错输出400错误状态.
// app.use((err, req, res, next)=>{
//   if(err){
//     res.status(400).send(err.message)
//   }else{
//     next()
//   }
// })

app.listen(PORT, ()=>{
  console.log(`服务核心已连线...端口:${PORT}\n`)
})

