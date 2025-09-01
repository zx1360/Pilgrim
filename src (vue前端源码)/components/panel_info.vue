<script setup>
  import {onMounted, ref} from 'vue'

  const iframe = ref(null)

  // 滚动回顶端
  function iframe_to_top(){
    iframe.value.contentWindow.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }
</script>



<template>
  <div id="panel_info">
    <iframe ref="iframe" id="info_frame" src="/info.html" frameborder="0"></iframe>
    <div @click="iframe_to_top" class="top_btn iconfont">👆</div>
  </div>
</template>



<style scoped lang='less'>
#panel_info{
  height: 100%;
}
#info_frame{
  width: 100%;
  height: 100%;
  border-radius: 2rem;
}
.top_btn{
  position: absolute;
  right: 3.6rem;
  bottom: 3.6rem;
  background-color: dimgray;

  font-size: 3.6rem;
  color: #ff6565;
  border-radius: 50%;
  border: 2px solid #07c2b5;
  cursor: pointer;
  :hover{
    background-color: bisque;
  }
}
</style>