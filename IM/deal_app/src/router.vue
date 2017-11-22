<template>
    <div class="wrapper">
        <router-view class="template" ></router-view>

    </div>
</template>

<script>
    export default {
        name: 'Router',
        created() {
            let urlParams = new URLSearchParams(window.location.search);
            if(urlParams.has("restaurantId")){
                let restaurantId = urlParams.get("restaurantId");
                if(urlParams.get("showMenu")){
                    this.$router.push({path: '/rest_menu', query: {restId: restaurantId}});
                } else {
                    this.$router.push({path: '/restaurant_info', query: {restId: restaurantId, dist: 0}});
                }
            } else {
                this.$router.push('/');
            }
        }
    }
</script>