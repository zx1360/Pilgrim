<script setup>
import {ref, computed, watch} from "vue"
import axios from 'axios'
import qs from "qs"

import { useStatusStore } from "@/stores/statusStore"
const statusStore = useStatusStore()

import essayMessage from "./essay_message.vue"
import essayMd from "./essay_md.vue"
import essayHtml from "./essay_html.vue"


// # 工具函数
// 生成日期字符串
const today = computed(()=>{
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth()+1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
})


// # 数据请求
// 获取所有tags信息
const tagStates = ref([])
axios.get("/api/essay/tags")
.then(res=>{
  console.log(res.data)
  tagStates.value = res.data.map((item)=>({
    ...item,
    chosen: true
  }))
})
.catch(err=>{console.error(err)})

// 获取要展示的日记内容
const essays = ref([])
axios.get("/api/essay/essays/all/myself")
.then(res=>{
  essays.value = res.data
  yearStates.value = essays.value.map(() => false);
})
.catch(err=>{console.error(err)})

// 根据选择的标签获取对应随笔
function get_essays_by_tags(tagStates){
  axios.get("/api/essay/essays/some/myself", {
    params: {
      tags: tagStates.map(item=>item.name)
    },
    paramsSerializer: (params) => {
    return qs.stringify(params, { arrayFormat: 'repeat' });
  }
  })
    .then(res=>{
      if(res.data.length==0)
        return essays.value = []
      essays.value = res.data
      yearStates.value = essays.value.map(() => false);
  })
    .catch(err=>{console.error(err)})
}


// # 状态管理
const yearStates = ref([]);
const toggleYear = (index) => {
  // 使用全新数组赋值以触发更新
  yearStates.value = yearStates.value.map((state, i) => 
    i === index ? !state : state
  );
};

// 是否公开
const is_public = ref(1)

// 随笔格式
const writing_format = ref(0)
const highlight_choice = ref(null)
function format_switch(choice){
  writing_format.value = choice
  highlight_choice.value.style.left = 8.8*choice+"rem"
}

// 根据标签筛选随笔
function clear_tags(){
  tagStates.value.forEach(item=>{
    item.chosen = false
  })
}
function switch_tags(index){
  tagStates.value[index].chosen = !tagStates.value[index].chosen
  get_essays_by_tags(tagStates.value.filter(item=>item.chosen))
}


// # 写essay相关
const is_writing = ref(0)
const write_date = ref(today.value)
function write_click(){
  if(++is_writing.value>=2){
    // console.log(write_date.value)
  }
}

// 必须有文本内容和标签才能提交.
const can_submit = computed(()=>{
  return labels.value.length>0
})

// 添加的图片
const imgFiles = ref([])
const imgInput = ref(null)
function handleImageUpload(e) {
  if (!e.target.files || e.target.files.length === 0) {
    return
  }

  const files = Array.from(e.target.files)
  const newImages = []

  imgFiles.value = []
  // 处理每个选中的文件
  files.forEach(file => {
    imgFiles.value = []
    // 创建文件预览
    const reader = new FileReader()
    reader.onload = (event) => {
      // 将文件和预览地址保存到imgFiles
      imgFiles.value.push({
        file,
        preview: event.target.result
      })
    }
    reader.readAsDataURL(file)
  })
  console.log(imgFiles)

  // 清空文件输入框，以便可以重复选择相同的文件
  imgInput.value.value = ''
}

// 标签相关
const labels = ref([])
const label_writing = ref("")
function append_label(name){
  let label
  if(name){
    label = name
  }else{
    if(!label_writing.value){
      return
    }else{
      label = label_writing.value
      label_writing.value = ""
    }
  }

  if(label.trim().length==0){
    return
  }
  if(!labels.value.includes(label.trim())){
    labels.value.push(label)
  }
  getEssaysByDayAndTags()
}
function remove_label(index){
  labels.value.splice(index, 1)
  getEssaysByDayAndTags()
}
// 根据日期和标签获取是否可能覆盖随笔
function getEssaysByDayAndTags(){
  // 看看这种情况下有无可能覆盖的随笔.
  axios.get("/api/essay/essays/day", {
    params:{
      date: write_date.value,
      labels: labels.value
    },
    paramsSerializer: (params) => {
    return qs.stringify(params, { arrayFormat: 'repeat' });
  }
  }).then(res=>{
    const essay = res.data.data
    if(Object.keys(essay).length===0)
      return

    essayDiv_html.value = ""
    essay.content.split(/\r?\n/).forEach(paragraph=>{
      if(!/^!\|.*?\|.*?>$/.test(paragraph)){
        essayDiv_html.value +=`<div>${paragraph}</div>`
      }
    })
    console.log("有可覆盖的随笔")
  }).catch(err=>{console.error(err)})
}


// # 上传
const essayDiv = ref(null)
const essayDiv_html = ref("")
function submit_essay(){
  const formData = new FormData()

  formData.append("create_time", write_date.value)
  formData.append("format", writing_format.value)
  if(writing_format.value==1){
    formData.append("content", essayDiv.value.innerText)
    console.log(essayDiv.value.innerText)
  }else{
    formData.append("content",
    essayDiv.value.innerText.trim().split(/\r?\n/)
    .filter(paragraph => paragraph.trim().length > 0).join("\n")
  )
  }
  formData.append("word_count", essayDiv.value.innerText.trim().length)
  formData.append("is_public", is_public.value)

  labels.value.forEach(label=>{
    formData.append("labels", label)
  })
  imgFiles.value.forEach(fileObj => {
    formData.append('images', fileObj.file)
  })

  axios.post("/api/essay/new",
    formData,
    {headers: {
      "Content-Type": "multipart/form-data"
    },
    paramsSerializer: (params) => {
    return qs.stringify(params, { arrayFormat: 'repeat' });
    }
  }
  ).then(res=>{
    console.log("随笔提交成功.")
    location.reload(true)
  }).catch(err=>{console.error(err)})
}


// # 调用img_panel方法展示图片.
function show_imgs(imgs, img_index){
  statusStore.call_mask_method("show_imgs", imgs, img_index)
}
</script>



<template>
<div id="shelter">
  <div class="diary_frame">
    <!-- 往期日记容器 -->
    <div class="diary_box">
      <!-- 当前写入 -->
      <div v-if="is_writing>=2" class="cur_writing">
        <div class="writing_upper">
          <div class="cur_date">{{ write_date }}</div>
          <div class="public_setting">
            <div :style="{left: is_public?'50%':'0px'}" class="highlight_choice"></div>
            <div @click="is_public=1-is_public" class="public_btn">私密</div>
            <div @click="is_public=1-is_public" class="public_btn">公开</div>
          </div>
          <div class="format_box">
            <div ref="highlight_choice" class="highlight_choice"></div>
            <div @click="format_switch(0)" class="format_choice">说说</div>
            <div @click="format_switch(1)" class="format_choice">md笔记</div>
            <div @click="format_switch(2)" class="format_choice">类html</div>
          </div>
        </div>
        <div v-html="essayDiv_html" ref="essayDiv" class="input_text" contenteditable="true"></div>

        <!-- 图片/标签的设定 -->
        <div class="writing_appendix">
          <!-- TODO: 如果选了md格式, 那就上传图片改成上传.md文件 -->
          <div v-show="writing_format!=1" class="pic_relates">
            <div :class="{hasImage: imgFiles.length}" class="pic_box">
              <div v-for="(file, index) in imgFiles" :key="index" class="img">
                <img :src="file.preview" alt="">
              </div>
            </div>
            <div class="pic_btn">
              <label class="iconfont">&#xe611;</label>
              <input @change="handleImageUpload" ref="imgInput" type="file" accept="image/*" multiple>
            </div>
          </div>
          <div class="vertical_line"></div>
          <div class="label_box">
            <div v-for="(item, index) in labels" :key="index" class="label_appended">
              {{ item }}
              <span @click="remove_label(index)" class="iconfont">&#xe600;</span>
            </div>
            <div class="highly_used_labels">
              <div @click="append_label(item.name)" v-for="(item, index) in tagStates.slice(0, 4)" class="label_for_choose">
                {{ item.name }}
              </div>
            </div>
            <div class="label_append">
              <input v-model="label_writing" type="text">
              <span @click="append_label()" class="iconfont">&#xe601;</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 历来随笔内容 -->
      <div v-for="(essays_in_year, index) in essays" class="year_box">
        <div @click="toggleYear(index)" class="year_btn"></div>
        <div :class="{none: !yearStates[index]}" class="overview">{{ essays_in_year.year }}年: {{ essays_in_year.essay_count }}份记录, {{ essays_in_year.total_word_count }}字.</div>
        <div :class="{none: yearStates[index]}" class="essays">
          <div v-for="(essay) in essays_in_year.essays" class="day_box">
            <essayMessage @watch_imgs="show_imgs" v-if="essay.format==0" :essay="essay"></essayMessage>
            <essayMd v-if="essay.format==1" :essay="essay"></essayMd>
            <essayHtml @watch_imgs="show_imgs" v-if="essay.format==2" :essay="essay"></essayHtml>
          </div>
        </div>
      </div>
    </div>

    <!-- 类别栏 -->
    <div class="tag_shelter">
      <div @click="clear_tags" class="clear_tags iconfont">&#xe946;</div>
      <div class="tags">
        <div @click="switch_tags(index)" v-for="(item, index) in tagStates" :class=" {chosen: item.chosen}" class="tag_box">
          {{ item.name }}
          <span class="tag_count">{{ item.count }}</span>
        </div>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="btn_box iconfont">
      <div :class="{disabled: is_writing>=2}" @click="write_click" class="btn">&#xe60c;</div>
      <div :class="{disabled: is_writing<2}" @click="is_writing=0" class="btn">&#xe600;</div>
      <div :class="{disabled: is_writing<2||!can_submit}" @click="submit_essay" class="btn">&#xe676;</div>
    </div>
    <input v-model="write_date" v-show="is_writing==1" id="diary_date" type="date" min="2000-01-01" :max="today">
  </div>
</div>
</template>



<style scoped lang='less'>
@import url("./essay.less");
.none{
  display: none;
}
// 总体
#shelter{
  position: relative;
  margin: 0 auto;

  width: 64%;
  height: 100vh;
}
.diary_frame{
  padding: 0 3rem;
  width: 100%;
  height: 100%;

  color: #c6c5b8;
  background-color: rgb(30, 30, 30);
  overflow-y: auto;

  font-size: 1.8rem;
  font-family: "楷体";
}
.diary_frame::-webkit-scrollbar-track-piece{
  background-color: rgb(30, 30, 30);
}
</style>