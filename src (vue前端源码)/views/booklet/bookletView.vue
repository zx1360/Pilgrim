<script setup>
import {ref, provide} from "vue"
import bookletFrame from "./bookletFrame.vue"

import { useStatusStore } from "@/stores/statusStore"
const statusStore = useStatusStore()


// # 是否是打卡/正在修改样式
const is_routine = ref(true)
const is_modifying = ref(false)
provide("is_modifying", is_modifying)

// # 展示图片
provide("show_imgs", (imgs, img_index)=>{
  statusStore.call_mask_method("show_imgs", imgs, img_index)
})
</script>



<template>
<div id="shelter">
  <!-- 左下实际内容视图 -->
  <bookletFrame :isRoutine="is_routine"></bookletFrame>
  <div class="side_box iconfont">
    <div class="modifying_mask"></div>
    <div :class="{modifying:is_modifying}" @click="is_modifying=!is_modifying" class="modify_btn">&#xe602;</div>
    <div class="switch_box">
      <div :style="{top: is_routine? '0px': '5.1rem'}" class="highlight_bg"></div>
      <div @click="is_routine=true; is_modifying=false" class="routine_btn">&#xe62e;</div>
      <div @click="is_routine=false; is_modifying=false" class="milestone_btn">&#xe8d4;</div>
    </div>
  </div>
</div>
</template>



<style scoped lang="less">
#shelter{
  position: relative;
  margin: 10rem auto;
  
  width: 64%;
  height: 78%;
  font-family: "Times";
  // 侧边按钮盒
  .side_box{
    position: absolute;
    left: -4.4rem;
    bottom: 0px;
    font-size: 4rem;
    // 更新修改按钮
    .modify_btn{
      border-radius: 6px;
      color: #BBB;
      background-color: rgb(105, 101, 101);
      cursor: pointer;
      &.modifying{
        color: #6d6565;
        background-color: #3f3838;
      }
    }
    // 类别切换
    .switch_box{
      position: relative;
      margin-top: 1.8rem;

      border-radius: 6px;
      color: pink;
      background-color: gray;
      & :first-child{
        position: absolute;
        width: 4.4rem;
        height: 5.1rem;

        border-radius: 6px;
        background-color: rgba(90, 84, 84, 0.6);

        transition: top 0.4s cubic-bezier(0.075, 0.82, 0.165, 1);
      }
      & :not(:first-child){
        padding: 2px;
        cursor: pointer;
      }
      & :nth-child(2){
        margin-bottom: 1.4rem;
      }
    }
  }
}
</style>