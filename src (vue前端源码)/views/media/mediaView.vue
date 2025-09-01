<script setup>
import {ref, computed} from "vue"
import { useRouter } from "vue-router"
const router = useRouter()

// 类别路由绑定.
const types = ref([
  {title: "观影", url:"/media/movie"},
  {title: "漫画", url:"/media/comic"},
  {title: "阅读", url:"/media/read"},
])
router.replace(types.value[0].url)

const type_choice = ref(0)
function switch_type(index){
  router.replace(types.value[index].url)
  type_choice.value = index
}


// 追加相关.
const isHome = ref(true)


// 右侧相关.
const isLike = ref(false)
const favorite_font = computed(()=>{
  if(isLike.value){
    return "&#x1019b;"
  }else{
    return "&#x10193;"
  }
})
</script>



<template>
<div id="shelter">
  <!-- 左侧边栏 -->
  <div class="left_sidebox">
    <div class="operate_box iconfont">
      <div v-show="isHome" class="append">&#xe60f;</div>
      <div class="home">&#xe65b;</div>
    </div>

    <div class="type_box">
      <div :style="{top: type_choice*5+'rem'}" class="type_chosen_mask"></div>
      <div @click="switch_type(index)" v-for="(item, index) in types" class="type_btn">
        {{ item.title }}
      </div>
    </div>
  </div>

  <!-- 右侧边栏 -->
  <div class="right_sidebox iconfont">
    <div class="chapters">&#x10196;</div>
    <div class="favorite">&#x10193;</div>
  </div>

  <router-view></router-view>
</div>
</template>



<style scoped lang='less'>
#shelter{
  position: relative;
  margin: 0 auto;
  width: 70%;
  height: 100vh;

  background-color: pink;
}



// 左侧边栏, 包括操作栏和类别栏.
.left_sidebox{
  position: absolute;
  bottom: 0px;
  left: -5rem;
  width: 5rem;
}
.operate_box{
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  font-size: 2.1rem;
  color: antiquewhite;
  div{
    padding: 1rem;
    cursor: pointer;
    &:hover{
      background-color: rgba(0,0,0,0.35);
    }
  }
}
.type_box{
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  .type_chosen_mask{
    position: absolute;
    left: 0px;
    top: 0px;

    width: 100%;
    height: 5rem;
    background-color: rgba(0,0,0,0.5);
    transition: top 0.4s cubic-bezier(0.075, 0.82, 0.165, 1);
  }
  .type_btn{
    padding: 1rem 0;
    width: 100%;
    height: 5rem;

    text-align: center;
    font-size: 2.1rem;
    color: antiquewhite;
    cursor: pointer;
  }
  .type_btn:hover{
    background-color: rgba(0,0,0,0.35);
  }
}


// 右侧边栏, 包括跳转章节和收藏某章节.
.right_sidebox{
  position: absolute;
  bottom: 0px;
  right: -5rem;
  width: 5rem;
}
</style>