<script setup>
import {computed} from "vue"
import { processContent, extractImageUrl, extractImageAlt } from './html_processor.js';


const props = defineProps({
  essay: Object
})
const emits = defineEmits(["watch_imgs"])

// # 渲染逻辑 类html格式的内容.
const processedContent = computed(() => (essay) => 
  processContent(essay.content)
);
const img_urls = computed(()=>(essay)=>
  processContent(essay.content).images.map(item=>extractImageUrl(item))
)
</script>



<template>
<div class="date">{{ essay.date }}</div>
<div class="content">
  <div v-for="(paragraph, paraIndex) in processedContent(essay).texts" :key="paraIndex" class="paragraph">
    {{ paragraph }}
  </div>
</div>
<div class="appendix">
  <div class="labels">
    <div class="label_icon iconfont">&#xe63e;</div>
    <div v-for="(item, index) in essay.labels" class="label">{{ item }}</div>
  </div>
  <div v-if="processedContent(essay).images.length>0" class="pics">
    <div @click="emits('watch_imgs', img_urls(essay), imgIndex)" v-for="(image, imgIndex) in processedContent(essay).images.slice(0,2)" :key="imgIndex" class="pic">
      <img :src="extractImageUrl(image)" :alt="extractImageAlt(image)">
    </div>
    <div v-if="processedContent(essay).images.length>2" class="pics_leftout">
      <div @click="emits('watch_imgs', img_urls(essay), 2)" class="bluring">+{{ processedContent(essay).images.length-2 }}</div>
      <img :src="extractImageUrl(processedContent(essay).images[2])" alt="">
    </div>
  </div>
</div>
</template>



<style scoped lang='less'>
.date{
  display: inline;
  border-bottom: 1px solid #fff;
}
.content{
  text-indent: 2em;
  .paragraph{
    margin-bottom: 1.2rem;
  }
}
// 附录, 标签及附件.
.appendix{
  display: flex;
  justify-content: end;
  align-items: end;
  width: 100%;
  .labels{
    display: flex;
    margin-right: 2rem;
  }
  .pics{
    display: flex;
    justify-content: stretch;
    border-radius: 1.2rem;
    overflow: hidden;
    .pic{
      display: flex;
      align-items: center;
      cursor: pointer;
      img{
        height: 16rem;
      }
    }
    .pics_leftout{
      position: relative;
      .bluring{
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        
        width: 100%;
        height: 100%;

        font-size: 4rem;
        color: #bbbaa7;
        background: rgba(0, 0, 0, 0.15); /* 半透明黑色背景 */
        backdrop-filter: blur(4px); /* 应用背景模糊效果 */
        cursor: pointer;
      }
      img{
        height: 16rem;
      }
    }
  }
}
</style>