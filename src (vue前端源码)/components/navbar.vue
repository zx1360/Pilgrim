<script setup>
import {ref} from "vue"
import { useStatusStore } from "@/stores/statusStore"
const statusStore = useStatusStore()

// 侧边栏本身相关
const is_hidden = ref(false)
function toggle_hidden(){
  is_hidden.value = !is_hidden.value
  console.log(is_hidden.value)
}
const nav_items = ref([
  {title:"共勉", url:"/"},
  {title:"积微", url:"/booklet"},
  {title:"随笔", url:"/essay"},
  {title:"媒体", url:"/media"},
  {title:"管理", url:"/butler"},
  {title:"归档", url:"/archive"},
])

// 与mask组件交互
function switch_panel(index){
  statusStore.call_mask_method("show_panel", index)
}
</script>



<template>
  <aside :class="{'is_hidden':is_hidden}" id="sidebar">
    <button @click="toggle_hidden" class="navbar_toggle iconfont">&#xe675;</button>
    <nav class="nav_top">
      <div class="avatar">
        <img @click="switch_panel(0)" src="/icon/icon_idle.png" alt="">
      </div>
      <ol class="nav_items">
        <li v-for="item in nav_items" :key="item.title" class="nav_item">
          <RouterLink :to="item.url">{{ item.title }}</RouterLink>
        </li>
      </ol>
    </nav>
    <div class="nav_info iconfont">
      <a @click.prevent="switch_panel(1)" href="#">&#xe659;</a>
    </div>
  </aside>
</template>



<style scoped lang='less'>
#sidebar{
  position: fixed;
  left: 0rem;
  top: 0rem;
  
  width: 8rem;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.75);
  transition: left 0.5s ease-in-out;
  &.is_hidden{
    left: -8rem;
  }
}
// 隐藏/显示按钮
.navbar_toggle{
  position: absolute;
  right: -4rem;
  top: 1rem;
  width: 3.5rem;
  height: 3.5rem;

  border-radius: 50%;
  background-color: rgba(0,0,0,0.5);
  font-size: 2rem;
  text-align: center;
  line-height: 3.5rem;
  color: #d0d0d7;

  border: none;
  outline: none;
}
// 导航内容上部分
.nav_top{
  padding-top: 3rem;
  text-align: center;
  // 头像
  .avatar{
    margin-bottom: 2rem;
    img{
      width: 4.2rem;
      height: 4.2rem;
      cursor: pointer;
    }
  }
  // 链接列表
  .nav_items{
    font-size: 1.8rem;
    line-height: 2.8rem;
    .nav_item:hover{
      background-color: #726263;
    }
    a{
      display: block;
      padding: 1rem;
      color: #304a91;
    }
    a:hover{
      text-decoration: underline;
      text-decoration-thickness: 3px;
      text-decoration-color: #768f98;
      text-underline-offset: 6px;

      color: #d8c8b6;
    }
  }
}
/* 导航栏下半部分 */
.nav_info{
    position: absolute;
    bottom: 0px;

    width: 100%;

    text-align: center;
    font-size: 3.8rem;
    :hover{
      background-color: #726263;
    }
    a{
      display: block;
      color: #949eb3;

      padding: 1rem;
      :hover{
        color: #e9f4f8;
      }
    }
}
</style>