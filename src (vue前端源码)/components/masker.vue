<script setup>
  import { ref, watch, defineAsyncComponent, reactive, onMounted } from "vue"
  import { useStatusStore } from "@/stores/statusStore"
  const statusStore = useStatusStore()

  import panel_log from "./panel_log.vue"
  import panel_info from "./panel_info.vue"
  import panel_img from "./panel_img.vue"

  // 面板列表
  const mask_style = reactive({
    "visibility": "hidden"
  })
  const panels = [
    ()=>import("./panel_log.vue"),
    ()=>import("./panel_info.vue"),
    ()=>import("./panel_img.vue")
  ]

  // 监听全局状态, 切换面板并显示.
  const cur_panel = ref(0)

  function hide_mask(){
    cur_panel.value = -1
    mask_style.visibility = "hidden"
  }

  // 注册方法, 外部调用.
  onMounted(()=>{
    statusStore.register_mask_method("show_panel", (index)=>{
      cur_panel.value = index
      mask_style.visibility = "visible"
    })
  })
</script>



<template>
  <div @click.self="hide_mask" :style="mask_style" id="masker">
    <div class="display">
      <div @click.self="hide_mask" class="display_close iconfont">&#xe600;</div>
      <div class="panel_container">
        <panel_log v-show="cur_panel==0"></panel_log>
        <panel_info v-show="cur_panel==1"></panel_info>
        <panel_img v-show="cur_panel==2"></panel_img>
      </div>
      <div @click.self="hide_mask" class="tip">(单击框外任意处关闭...)</div>
    </div>
  </div>
</template>



<style scoped lang='less'>
  #masker{
    position: fixed;
    z-index: 10;
    
    // visibility: hidden;
    background-color: rgba(0, 0, 0, 0.45);
    width: 100vw;
    height: 100vh;
    // 剧中的展示区.
    .display{
      position: relative;
      margin: 8rem auto 0;

      width: 72%;
      height: 82%;
      border-radius: 3rem;
      background-color: rgba(0, 0, 0, 0.75);
      // 右上叉叉.
      .display_close{
        position: absolute;
        right: -36px;
        top: -36px;

        font-size: 36px;
        color: #949eb3;
        cursor: pointer;
      }
      // 下方小字
      .tip{
        margin: 2rem auto;

        text-align: center;
        color: #8b8b8f;
        font-size: 2rem;
        cursor: default;
      }
      // 实际内容
      .panel_container{
        visibility: inherit;
        overflow: hidden;
        width: 100%;
        height: 100%;
        .panel{
          height: 100%;
          width: 100%;
          border-radius: 2rem;
          overflow: hidden;
        }
      }
    }
  }
</style>