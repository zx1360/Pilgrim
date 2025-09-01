<script setup>
import {onMounted, ref} from "vue"
import { useStatusStore } from "@/stores/statusStore"
const statusStore = useStatusStore()

const img_index = ref(0)
const img_urls = ref([])

// 调用'切换到img面板'函数
function switch_panel(index){
  statusStore.call_mask_method("show_panel", index)
}

// 暴露方法, 接收一个或多个图片链接用以展示
onMounted(()=>{
  statusStore.register_mask_method("show_imgs", (imgs, index)=>{
    if(0<index && index<imgs.length){
      img_index.value = index
    }else{
      img_index.value = 0
    }
    img_urls.value = Array.isArray(imgs)? imgs: [imgs]

    switch_panel(2)
  })
})

// 图片展示的一些操作函数
function switch_img(change){
  if(img_index.value+change<0 || img_index.value+change>img_urls.value.length-1){
    return
  }
  img_index.value = img_index.value+change
}
</script>



<template>
<div id="panel_img">
  <div @click="switch_img(-1)" :class="{switch_not_active: img_index<=0}" class="switch_btn">
    <div><</div>
  </div>
  <div class="img_showcase">
    <img :src="img_urls[img_index]" alt="">
  </div>
  <div @click="switch_img(1)" :class="{switch_not_active: img_index>=img_urls.length-1}" class="switch_btn">
    <div>></div>
  </div>
</div>
</template>



<style scoped lang='less'>
#panel_img{
  display: flex;
  align-items: center;
  height: 100%;
  // 左右按钮
  .switch_btn{
    height: 75%;
    width: 4.2rem;

    font-size: 4.2rem;
    cursor: pointer;
    border-radius: 2rem;
    background-color: rgba(110, 109, 77, 0.4);
    div{
      display: flex;
      justify-content: center;
      align-items: center;

      width: 100%;
      height: 100%;
    }
    &:hover{
      color: antiquewhite;
    }
  }
  .switch_not_active{
    pointer-events: none;
  }
  // 图片展示
  .img_showcase{
    flex-grow: 1;
    height: 100%;

    border-radius: 2rem;
    overflow: hidden;
    img{
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}
</style>