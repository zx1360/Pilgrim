import "./assets/styles/cssreset.css"
import "./assets/styles/iconfont.css"
import "./assets/styles/common.css"

import router from "./views/router"

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
// import App from "./EssaysDemo.vue"

const app = createApp(App)

app.use(createPinia())
.use(router)

app.mount('#app')
