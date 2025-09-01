import { createWebHistory, createRouter } from 'vue-router'

// import indexView from './index/indexView.vue'
// 路由懒加载, 跳转该页面才动态导入.

const indexView = ()=>import("./index/indexView.vue")
const bookletView = ()=>import("./booklet/bookletView.vue")
const essayView = ()=>import("./essay/essayView.vue")
const mediaView = ()=>import("./media/mediaView.vue")
const butlerView = ()=>import("./butler/butlerView.vue")
const archiveView = ()=>import("./archive/archiveView.vue")

const routes = [
  {path: '/', component: indexView},
  {path: '/booklet', component: bookletView,},
  {path: "/essay", component: essayView},
  {path: "/media", component: mediaView,
    children: [
      {
        path:"comic",
        component: ()=>import("./media/comic/comic.vue")
      },
      {
        path:"movie",
        component: ()=>import("./media/movie/movie.vue")
      },
      {
        path:"read",
        component: ()=>import("./media/read/read.vue")
      }
    ]
  },
  {path: "/butler", component: butlerView},
  {path: "/archive", component: archiveView}
]

const router = createRouter({
  // history: createWebHashHistory(),
  // 👇url显示更好但是似乎需要服务端配置?
  history: createWebHistory(),
  routes,
})

export default router