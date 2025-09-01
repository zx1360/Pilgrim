<script setup>
import {ref} from "vue"
import axios from 'axios'

import { useStatusStore } from "@/stores/statusStore"
const statusStore = useStatusStore()


// # 获取数据
const archive_data = ref([])
const year_showing = ref([])
axios.get("/api/archive/archives/all")
.then(res=>{
  console.log(res.data)
  archive_data.value = res.data
  year_showing.value = res.data.map(()=>true)
}).catch(err=>console.error(err))
// // TODO: 筛选特定标签的数据. ( 这里记录的是攻下难关的记录, 本就少, 感觉按标签获取没必要.
// axios.get("/api/archive/archives/some", )

// # 写archive
const archiveContent = ref("")
const archiveLabels = ref([])
function submit_archive(){
  const formData = new FormData()
  archiveFiles.value.forEach(item=>{
    formData.append("files", item.file)
  })
  formData.append("content", archiveContent.value)
  archiveLabels.value.forEach(item=>{
    formData.append("labels", item)
  })

  axios.post("/api/archive/archives/write",
    formData,
    {headers: {
      "Content-Type": "multipart/form-data"
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: 'repeat' });
      }
    }
  ).then(res=>{
    console.log(res.data)
    location.reload(true)
  }).catch(err=>console.error(err))
}

// 添加的图片
const archiveFiles = ref([])
const imgInput = ref(null)
function handleImageUpload(e) {
  if (!e.target.files || e.target.files.length === 0) {
    return
  }

  const files = Array.from(e.target.files)

  archiveFiles.value = []
  files.forEach(file => {
    archiveFiles.value = []
    const reader = new FileReader()
    reader.onload = (event) => {
      archiveFiles.value.push({
        file,
        preview: event.target.result
      })
    }
    reader.readAsDataURL(file)
  })

  imgInput.value.value = ''
}
// 标签
const label_writing = ref("")
function append_label(){
  let label
  label = label_writing.value
  label_writing.value = ""

  if(label.trim().length==0){
    return
  }
  if(!archiveLabels.value.includes(label.trim())){
    archiveLabels.value.push(label)
  }
}
function remove_label(index){
  archiveLabels.value.splice(index, 1)
}

// # 状态管理
const isWriting = ref(false)
function fold_year(index){
  year_showing.value.splice(index, 1, !year_showing.value[index])
}

// # 调用img_panel方法展示图片.
function show_imgs(imgs){
  console.log(imgs)
  statusStore.call_mask_method("show_imgs", imgs)
}
</script>



<template>
<div id="shelter">
  <!-- 写入archive部分 -->
  <div v-show="isWriting" class="write_box">
    <!-- 关闭按钮和提交按钮 -->
    <div @click="isWriting=false" class="close iconfont">&#xe600;</div>
    <div :class="{inactive: archiveLabels.length==0}" @click="submit_archive" class="submit iconfont">&#xe676;</div>
    <!-- 文本内容 -->
    <textarea v-model="archiveContent" class="content"></textarea>
    <!-- 底部图片/标签 -->
    <div class="bottom">
      <!-- 如果上传了图片, 展示 -->
      <div :class="{hasImage: archiveFiles.length}" class="pic_relates">
        <div v-for="(file, index) in archiveFiles" :key="index" class="pic">
          <img :src="file.preview" alt="">
        </div>
        <div class="pic_btn">
          <label @click="imgInput.click" class="iconfont">&#xe611;</label>
          <input @change="handleImageUpload" ref="imgInput" type="file" accept="image/*" multiple>
        </div>
      </div>
      <div class="vertical_line"></div>
      <!-- 标签 -->
      <div class="label_box">
        <div v-for="(item, index) in archiveLabels" :key="index" class="label_appended">
          {{ item }}
          <span @click="remove_label(index)" class="iconfont">&#xe600;</span>
        </div>
        <div class="label_append">
          <input v-model="label_writing" type="text">
          <span @click="append_label" class="iconfont">&#xe601;</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 标题大字, 点击开始写 -->
  <div class="title_box">
    <span @click="isWriting=true" class="title">Archives</span>
  </div>

  <!-- 标签栏 -->
  <div class="tag_box">
    <div class="tags">

    </div>
  </div>

  <!-- 往期archives视图 -->
  <div class="archive_box">
    <div v-for="(item, yearIndex) in archive_data" :key="yearIndex" class="year_box">
      <div @click="fold_year(yearIndex)" class="year">{{ item.year }}</div>
      <div v-show="!year_showing[yearIndex]" class="overview">{{ item.archives.length }} 条记录.</div>
      <div v-show="year_showing[yearIndex]" class="archives">
        <div v-for="(archive, archiveIndex) in item.archives" :key="archiveIndex" class="archive">
          <div class="time_axis"></div>
          <div class="content">
            <div class="content_upper">
              <div class="date">{{ archive.date }}</div>
              <div class="text">
                {{ archive.content }}
              </div>
            </div>
            <div class="appendix">
              <div class="labels">
                <div class="label_icon iconfont">&#xe63e;</div>
                <div v-for="(label) in archive.labels" class="label">{{ label }}</div>
              </div>
              <div v-if="archive.imgs.length" @click="show_imgs(archive.imgs)" class="archive_showImage iconfont">&#xe611; +{{ archive.imgs.length }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>



<style scoped lang='less'>
@import url(./archive.less);
#shelter{
  position: relative;
  margin: 0 auto;
  display: flex;
  flex-direction: column;

  width: 108rem;
  height: 100vh;
  overflow: hidden;
}
</style>