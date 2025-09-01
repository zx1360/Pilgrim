<script setup>
import {onMounted, ref} from "vue"
import MarkdownIt from "markdown-it";


const props = defineProps({
  essay: Object
})
// const emits = defineEmits(["watch_imgs"])

const essay_html = ref("")
const essay_div = ref(null)
const md = ref(null)

onMounted(()=>{
  md.value = new MarkdownIt()
  render_md()
})

const render_md = ()=>{
  if(md.value){
    essay_html.value = md.value.render(props.essay.content)
  }
}
</script>



<template>
<div class="date">{{ essay.date }}</div>
<div class="content">
  <div ref="essay_div" v-html="essay_html" class="md_essay"></div>
</div>
<div class="appendix">
  <div class="labels">
    <div class="label_icon iconfont">&#xe63e;</div>
    <div v-for="(item) in essay.labels" class="label">{{ item }}</div>
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
}
</style>