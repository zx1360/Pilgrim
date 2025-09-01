<script setup>
import axios from 'axios'
import {ref, inject} from "vue"


const emits = defineEmits(["show_info", "refresh"])


// # 数据请求
const style_id = ref(null)
const data_tasks = ref([])
const task_status = ref([])
const message = ref("")
function get_today(){
  axios.get("/api/booklet/routine/today")
  .then(res=>{
    const data = res.data
    style_id.value = data.style.style_id
    data_tasks.value = data.tasks
    task_status.value = data_tasks.value.map(item=>parseInt(item.is_done))
    message.value = data.message

    emits("show_info", [
      `始于: ${data.style.start_date}`,
      `${data.style.valid_checkin} 打卡天数`,
      `${data.style.fully_done} 全通天数`,
      `${data.style.longest_streak} 最长连续打卡天数`,
      `${data.style.longest_fully_streak} 最长连续全通天数`
    ])
  }).catch(err=>{console.error(err)})
}
get_today()


// # 操作函数
function task_click(index){
  task_status.value.splice(index, 1, 1-task_status.value[index])
}


// # 提交请求
function submit_today(){
  axios.post("/api/booklet/routine/submit",{
    style_id: style_id.value,
    finish: task_status.value,
    message: message.value
  }).then(res=>{
    console.log(res.data)
    emits("refresh")
  }).catch(err=>console.error(err))
}



// 新样式相关
const is_modifying = inject("is_modifying")
const newTasks = ref([{
  file: null,
  title: "",
  description: ""
}])
const image_previewURL = ref(["/icon/favicon.ico"])

// 提交新样式
function submit_newStyle(){
  const formData = new FormData()

  newTasks.value.forEach((item, index)=>{
    formData.append("tasks", item.file)
    formData.append(`taskData${index}`, JSON.stringify({
      title: item.title,
      description: item.description
    }))
  })
  axios.post("/api/booklet/routine/style/new",
    formData,
    {headers: {
      "Content-Type": "multipart/form-data"
    },
    paramsSerializer: (params) => {
    return qs.stringify(params, { arrayFormat: 'repeat' });
    }
  })
  .then(res=>console.log(res.data))
  .catch(err=>{console.error(err)})
}

// # 操作函数
function update_title(text, index){
  newTasks.value[index].title = text
}
function update_desc(text, index){
  newTasks.value[index].description = text
}

// 增加一个任务
function append_task(){
  newTasks.value.push({
    file: null,
    title: "",
    description: ""
  })
  image_previewURL.value.push("/icon/favicon.ico")
}
// 选择图片, 加入File对象, 展示缩略图.
function select_image(event, index){
  const file = event.target.files[0]
  if(file){
    newTasks.value[index].file = file
    const reader = new FileReader();
    reader.onload = (event) => {
      image_previewURL.value[index] = event.target.result;
    };
    reader.readAsDataURL(file);
  }
}

// # 大图展示图片
const show_imgs = inject("show_imgs")
</script>



<template>
  <!-- 日常样式 -->
<ul v-show="!is_modifying" class="tasks">
  <li v-for="(item, index) in data_tasks" :key="index" class="task">
    <div class="task_img">
      <img @click="show_imgs(item.image)" :src="item.image" alt="">
    </div>
    <div class="task_context">
      <div class="title_box" contenteditable="true">{{ item.title }}</div>
      <div class="desc_box" contenteditable="true">{{ item.description }}</div>
    </div>
    <div @click="task_click(index)" :class="{checked: task_status[index]==1}" class="task_btn"></div>
  </li>
</ul>
<!-- 底部留言,提交. -->
<div v-show="!is_modifying" class="bottom">
  <textarea v-model="message" class="message" placeholder="给今天的自己留段话吧..."></textarea>
  <input @click="submit_today" type="button" class="submit" value="提交">
</div>

<!-- 新建样式 -->
<ul v-if="is_modifying" class="new_tasks">
  <li v-for="(item, index) in newTasks" class="task">
    <div class="task_img">
      <input @change="select_image($event, index)" type="file" class="file" accept="image/*">
      <img :src="image_previewURL[index]" alt="">
    </div>
    <div class="task_context">
      <div @blur="update_title($event.target.innerText, index)" class="title_box" contenteditable="true" aria-placeholder="任务标题.">{{ item.title }}</div>
      <div @blur="update_desc($event.target.innerText, index)" class="desc_box" contenteditable="true" aria-placeholder="任务描述.">{{ item.description }}</div>
    </div>
  </li>
  
  <div class="modify_btns iconfont">
    <div @click="append_task" class="btn_append">&#xe601;</div>
    <div @click="is_modifying=false" class="btn_cancel">&#xe600;</div>
    <div @click="submit_newStyle" class="btn_confirm">&#xe63f;</div>
  </div>
</ul>
</template>



<style scoped lang='less'>
// 任务列表
.tasks{
  display: flex;
  flex-direction: column;
  padding: 0.6rem 0 0.6rem 1rem;
  .task{
    position: relative;
    display: flex;
    align-items: stretch;
    margin: 0.5rem;

    border-radius: 4px;
    background-color: rgba(0, 0, 0, 0.3);
    .task_img{
      min-width: 6.4rem;
      border-radius: 6px;
      overflow: hidden;
      img{
        width: 6.4rem;
      }
    }
    .task_context{
      flex-grow: 1;
      align-items: stretch;
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
    .task_btn{
      flex-shrink: 0;
      width: 4rem;
      height: 3.2rem;
      align-self: flex-end;

      border-radius: 4px;
      border: 2px solid pink;
      font-size: 3.2rem;
      cursor: pointer;
      &::after{
        content: "〇";
        color: peru;
        font-weight: 700;
      }
      &.checked::after{
        content: "✔";
        color: greenyellow;
      }
    }
  }
}

// 打卡的底部留言及提交
.bottom{
  display: flex;
  justify-content: space-between;
  align-items: stretch;

  padding: 0.6rem 0 0.6rem 1rem;
  width: 100%;
  .message{
    flex-grow: 1;
    margin: 0 3.2rem 0 1.2rem;

    border: 2px solid pink;
    border-radius: 5px;
    height: 9.6rem;

    background-color: rgb(214, 230, 253);
    font-size: 1.6rem;
  }
  .submit{
    flex-shrink: 0;
    align-self: flex-end;
    width: 10rem;
    height: 6.4rem;

    cursor: pointer;
    background: linear-gradient(135deg,#315a9d,#fff3b5,#de935c);
    font-size: 3rem;
    text-align: center;
    line-height: 6.4rem;
    border-radius: 4px;
    &:hover{
      border: 2px solid #fff968;
    }
  }
}

// 新建样式部分.
.new_tasks{
  display: flex;
  flex-direction: column;
  align-items: stretch;
  .task{
    position: relative;
    display: flex;
    align-items: center;
    margin: 0.5rem;

    border-radius: 4px;
    background-color: rgba(0,0,0,0.3);
    .task_img{
      min-width: 6.4rem;
      border-radius: 6px;
      overflow: hidden;
      input{
        position: absolute;
        opacity: 0;
        
        width: 6.4rem;
        height: 100%;
      }
      img{
        width: 6.4rem;
      }
    }
    .task_context{
      flex-grow: 1;
      align-self: stretch;
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
      .title_box:empty::before, .desc_box:empty::before{
        content:attr(aria-placeholder);
        font-size: 2rem;
      }
    }
  }
  // 关于新样式的按钮栏
  .modify_btns{
    order: 6;
    display: flex;
    align-items: center;
    justify-content: end;
    margin: 0.5rem;

    background: linear-gradient(145deg, #0f172a, #0284c7, #ec4899);
    width: 100%;
    height: 4.8rem;
    border-radius: 4px;
    .btn_append{
      margin-right: auto;
    }
    div{
      margin: 0 1rem;
      font-size: 4rem;
      cursor: pointer;
      &:hover{
        border-radius: 4px;
        border: 2px solid #334155;
      }
    }
  }
}
</style>