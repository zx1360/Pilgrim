<script setup>
  
</script>



<template>
  <div id="panel_log">
    <img src="" alt="" class="log_img">
    <div class="log_part">
      <h4>登录</h4>
      <form class="log_form">
        <input type="text">
        <input type="text">
        <input class="submit_btn" type="submit" value="">
      </form>
      <div class="fn">
        <a href="javascript;;">忘记密码</a>
        <a href="javascript;;">注册</a>
      </div>
    </div>
  </div>
</template>



<style scoped lang='less'>
#panel_log{
  display: flex;
  height: 100%;
  .log_img{
    width: 40%;
  }
  .log_part{
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 60%;
    .log_form{
      display: flex;
      flex-direction: column;
      .submit_btn{
        margin-left: auto;
        width: 40%;
      }
    }
  }
}
</style>