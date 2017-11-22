<template>
  <div class='wrapper' id='grey-wrap'>
    <div class='top-pic-container' :style='{height:windowHeight * 0.3148 + 'px'}'>
      <div class='top-bar'>
        <div class='back-button'
      :style="{ backgroundImage: 'url(' + backImgUrl + ')', width: 0.024 * bodyWidth + 'px', height: 0.048 * bodyWidth + 'px', marginLeft: 0.0453*bodyWidth + 'px'}"
      @click="goBack"></div>
           <div class="cart-button" @click="goCart"
      :style="{ backgroundImage: 'url(' + cartUrl + ')', width: 0.0506 * bodyWidth + 'px', height: 0.0453 * bodyWidth + 'px', marginRight: 0.0453*bodyWidth + 'px'}">
             <div v-if="cartNum>0" :style="{ top: 0.025 * bodyWidth + 'px', right: 0.02*bodyWidth+ 'px',
        fontSize: 0.026 * bodyWidth + 'px', padding: 0.00267*bodyWidth + 'px' + ' ' + 0.0106 * bodyWidth + 'px', borderRadius: 0.02*bodyWidth+ 'px',
     }" class="cartBadge">
      {{cartNum}}
             </div>
           </div>
         </div>
          <img class="top-pic-overlay" :src="overUrl" :style="{height:windowHeight * 0.154 + 'px'}"/>
          <img class="top-pic" :src="itemPic" :style="{height:windowHeight * 0.3148 + 'px'}"/>
       </div>
     </div>
   </div>
</template>

<style>
</style>

<script>
</script>
