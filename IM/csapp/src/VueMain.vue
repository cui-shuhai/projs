<template>
  <div id="vuemain">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'vuemain'
}
</script>
<style>
  #vuemain {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
  } 
</style>
