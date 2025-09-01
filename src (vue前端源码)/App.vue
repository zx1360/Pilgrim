<script setup>
import masker from './components/masker.vue';
import navbar from './components/navbar.vue';
</script>



<template>
<navbar></navbar>
<masker></masker>
<!-- 也许可以考虑<suspense>异步加载 -->
<div class="viewer">
  <RouterView></RouterView>
</div>
</template>



<style scoped lang='less'>
.viewer{
width: 100%;
height: 100%;
}
</style>