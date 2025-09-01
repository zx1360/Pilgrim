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
<!-- 处理多张图片的情况 -->
<div v-if="processedContent(essay).images.length >= 2" class="pics">
  <div @click="emits('watch_imgs', img_urls(essay), imgIndex)" v-for="(image, imgIndex) in processedContent(essay).images" :key="imgIndex" class="pic">
    <img :src="extractImageUrl(image)" :alt="extractImageAlt(image)">
  </div>
</div>
<!-- 处理单张图片的情况 -->
<div  @click="emits('watch_imgs', img_urls(essay))" v-else-if="processedContent(essay).images.length === 1" class="single_pic">
  <img 
    :src="extractImageUrl(processedContent(essay).images[0])" 
    :alt="extractImageAlt(processedContent(essay).images[0])"
  >
</div>

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
.pics{
  float: left;
  margin-left: 2em;

  display: flex;
  flex-wrap: wrap;
  align-items: stretch;

  max-width: 60%;
  .pic{
    display: flex;
    align-items: center;
    
    max-height: 42rem;
    width: 50%;
    object-fit: contain;
    background-color: rgba(114, 98, 99, 0.42);
    cursor: pointer;
    img{
      width: 100%;
      max-height: 42rem;
      border-radius: 8px;
      overflow: hidden;
    }
  }
}
.single_pic{
  float: left;
  text-align: center;

  max-height: 42rem;
  width: 60%;
  cursor: pointer;
  img{
    padding: 4px;
    max-height: 42rem;
    max-width: 100%;
    object-fit: contain;

    border-radius: 8px;
  }
}
// 附录, 标签及附件.
.appendix{
  // margin-left: auto;
  .labels{
    display: flex;
    .label_icon{
      margin-left: auto;
    }
  }
}
</style>