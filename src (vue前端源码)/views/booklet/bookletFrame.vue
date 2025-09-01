<script setup>
import {ref} from "vue"
import routine from "./routine.vue"
import milestone from './milestone.vue'


const props = defineProps({
  isRoutine: Boolean
})

// 根据打卡/试炼存储记录信息
const record_info = ref([])
function render_info(infos){
  record_info.value = infos
}

// 提交行为之后触发刷新
const frame_key = ref(0)
</script>



<template>
<div id="routine">
  <!-- 左边内容部分 -->
  <div class="routine_cont">
    <div class="upper">可尝试将游戏移动到其他位置并更新安装路径。</div>
    <component @refresh="frame_key++" :key="frame_key" @show_info="render_info" :is="props.isRoutine? routine: milestone"></component>
  </div>

  <!-- 右边视图部分 -->
  <div class="inspector">
    <div class="punch_info">
      <div class="avatar_box">
        <img src="/icon/icon_idle.png" alt="">
      </div>
      <div class="records">
        <div v-for="(item, index) in record_info" :key="index" class="record">{{ item }}</div>
      </div>
    </div>
    <div class="anim_box">
      <img src="" alt="">
    </div>
  </div>
</div>
</template>



<style scoped lang='less'>
#routine{
  display: flex;
  justify-content: space-between;

  width: 100%;
  height: 100%;
  background-size: cover;
  background-image: url("/background_image/hell_taker.png");
  overflow: hidden;
  border-radius: 6px;
}
// 左侧内容部分
.routine_cont{
  display: flex;
  flex-direction: column;
  width: 70%;
  // motto部分
  .upper{
    padding: 0.6rem;
    border-bottom: 2px solid #BBB;

    font-size: 3.2rem;
    color: oldlace;
  }
}
// 右侧视窗
.inspector{
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;

  width: 28%;
  .punch_info{
    padding-top: 24%;
    // 头像
    .avatar_box{
      display: flex;
      justify-content: center;
      align-items: center;
    }
    img{
      // TODO: 显式说明传方形或偏水平的头像.
      width: 12.8rem;
      min-height: 12.8rem;
      max-height: 20rem;
      object-fit: contain;
      opacity: 0.7;
    }
    // 记录信息
    .records{
      margin-top: 10%;
      padding: 1rem;
      display: flex;

      flex-direction: column;
      align-items: center;
      border-radius: 2rem;
      background-color: rgba(0,0,0,0.25);
      .record{
        margin-top: 0.4rem;
        font-size: 1.6rem;
        color: #ffcc00;
      }
    }
  }
  .anim_box{
    height: 24%;
    width: 80%;
    margin-bottom: 16%;

    cursor: pointer;
    border-radius: 5px;
    background-color: rgba(0, 0, 0, 0.6);
  }
}
</style>