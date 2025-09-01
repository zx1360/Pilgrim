<script setup>
import axios from 'axios'
import {ref, inject} from "vue"


function get_data(){
  
}
const milestone_data = ref([{
  "_id": {
    "$oid": "684bc6e97a99ce387ac35404"
  },
  "userId": "",
  "start": "2023-03-18",
  "title": "做个韩漫阅读器",
  "desc": "下拉式,画面大小自适应应该是要很久之后学qt再做,或者时间多用python写",
  "img": "",
  "accomplish": "",
  "message": "2023/3/26,戳啦,感觉完全可以用浏览器实现,变相出口转内销了属于是"
},{
  "_id": {
    "$oid": "684d89313fde422362beda76"
  },
  "userId": "",
  "start": "2023-03-12",
  "title": "浅学JS做个网页.",
  "desc": "how不花钱公开资源",
  "img": "",
  "accomplish": "",
  "message": "2023/6/8借用github域名应该可以,现在的问题就是css和js没入门.继续加油吧!"
}])

const emit = defineEmits(["show_info"])
const record_info = [
  " 共计",
  " 已完成"
]
emit("show_info", record_info)

const is_modifying = inject("is_modifying")
</script>



<template>
<ul class="battles">
  <li v-for="(item, index) in milestone_data" :key="index" class="battle">
    <div class="battle_content">
      <div class="battle_img">
        <img :src="item.img" alt="">
      </div>
      <div class="battle_context">
        <div class="title_box" contenteditable="true">{{ item.title }}</div>
        <div class="desc_box" contenteditable="true">{{ item.desc }}</div>
      </div>
    </div>
    <div class="appending">
      <div class="battle_message">{{ item.message }}</div>
      <div class="time_box">
        <div class="battle_start">{{ item.start }}</div>
        <div class="battle_done">2024-01-02</div>
      </div>
    </div>
  </li>
</ul>
</template>



<style scoped lang='less'>
// 战役列表  TODO:已完成战役地样式
.battles{
  display: flex;
  flex-direction: column;
  padding: 0.6rem 0 0.6rem 1rem;
  .battle{
    margin: 0.3rem;
    padding: 0.2rem;
    border-radius: 4px;
    background-color: rgba(0,0,0,0.3);
  }
}
// 内容部分
.battle_content{
  display: flex;
  .battle_img{
    min-width: 6.4rem;
    border-radius: 6px;
    overflow: hidden;
    font-size: 2rem;
    img{
      width: 6.4rem;
      height: 8rem;
    }
  }
  .battle_context{
    flex-grow: 1;
    .title_box{
      float: left;
      padding-right: 1.2rem;
      font-size: 2.6rem;
      color: #94c4e1;
    }
    .desc_box{
      font-size: 1.4rem;
      text-align: justify;
      color: #99a3c5;
    }
  }
}
// 附加部分 起始,留言
.appending{
  display: flex;
  .battle_message{
    flex-grow: 1;
    font-size: 1.4rem;
    color: rgb(169, 150, 150);
  }
  .time_box{
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: hotpink;
    .battle_done{
      color: indianred;
    }
  }
}
</style>