<template>
    <div class="wrapper">
        <div class="top-pic-container" v-if="posts.photos && posts.photos.length > 0"
             :style="{height:windowHeight * 0.3148 + 'px'}">
            <div class="top-bar">
                <div class="back-button"
                     :style="{ backgroundImage: 'url(' + backImgUrl + ')', width: 0.024 * bodyWidth + 'px', height: 0.048 * bodyWidth  + 'px', marginLeft: 0.0453*bodyWidth  + 'px'}"
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
            <img class="top-pic" :src="posts.photos[0].path" :style="{height:windowHeight * 0.3148 + 'px'}"/>
        </div>
        <div class="top-pic-container" v-else :style="{height:windowHeight * 0.3148 + 'px'}">
            <div class="top-bar">
                <div class="back-button"
                     :style="{ backgroundImage: 'url(' + backImgUrl + ')', width: 0.024 * bodyWidth + 'px', height: 0.048 * bodyWidth  + 'px', marginLeft: 0.0453*bodyWidth  + 'px'}"
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
            <img class="top-pic" :src="nullUrl" :style="{height:windowHeight * 0.3148 + 'px'}"/>
        </div>
        <div class="overview" :style="{height:windowHeight * 0.135 + 'px'}">
            <div class="rest-name" v-if="posts.longNames"
                 :style="{marginLeft: 0.0453*bodyWidth  + 'px', marginTop: 0.0453*bodyWidth  + 'px', fontSize: 0.053*bodyWidth}">
                {{ posts.longNames[0].name }}
            </div>
            <div class="rest-tag"
                 :style="{height:bodyWidth * 0.07 + 'px', fontSize: bodyWidth * 0.03 + 'px',marginLeft: 0.0453*bodyWidth  + 'px', marginTop: 0.0225*bodyWidth  + 'px'}">
                {{(dist / 1000).toFixed(1) + ' ' + 'km'}}
            </div>
        </div>
        <div class="thin-grey" :style="{height:windowHeight * 0.024 + 'px'}"></div>
        <div class="info-bar" :style="{height:windowHeight * 0.162 + 'px'}">
            <div id="information"
                 :style="{marginLeft: 0.0453*bodyWidth  + 'px', marginTop: 0.053*bodyWidth  + 'px', fontSize: 0.043*bodyWidth + 'px'}">
                Information
            </div>
            <div class="list-info-container" :style="{marginTop: 0.03*bodyWidth  + 'px'}" @click="showHide()">
                <div class="list-left">
                    <img class="list-logo" id="clock" :src="clockUrl"
                         :style="{width:0.048 * bodyWidth + 'px', height: 0.048 * bodyWidth + 'px'}"/>
                    <div class="list-info" :style="{marginLeft: 0.0453*bodyWidth  + 'px', fontSize: 0.04*bodyWidth }"
                         v-if="posts.regular_hours">
                        {{dayStr}}
                    </div>
                    <div class="list-info" :style="{marginLeft: 0.0453*bodyWidth  + 'px', fontSize: 0.04*bodyWidth }"
                         v-else-if="!posts.regular_hours">
                        No Schedule Available
                    </div>
                </div>
                <div class="drop-button" id="drop-butt"
                     :style="{ backgroundImage: 'url(' + rightUrl + ')', width: 0.0213*bodyWidth  + 'px', height:0.032 * bodyWidth + 'px'}">
                </div>
            </div>
        </div>
        <div class="time-info" :style="{ display: showTime }">
            <div class="sched-container" v-if="timeArr.length > 0" :style="{fontSize: 0.0426*bodyWidth }">
                &#8226; Hours of Operation &#8226;
                <div class="each-day" v-for="aTime in timeArr" v-bind:key="aTime"
                     :style="{ marginTop: 0.075*bodyWidth+ 'px'}">
                    <div class="time-title" :style="{fontSize: 0.0373*bodyWidth}">
                        {{'-' + ' ' + aTime.theDay + ' ' + '-'}}
                    </div>
                    <div class="time-time" :style="{fontSize: 0.0373*bodyWidth}">
                        {{aTime.timeOne}}
                    </div>
                    <div v-if="aTime.timeTwo" class="time-time" :style="{fontSize: 0.0373*bodyWidth}">
                        {{aTime.timeTwo}}
                    </div>
                </div>
            </div>
            <div v-else-if="timeArr.length==0">
                No Schedule Available
            </div>
        </div>
        <div class="each-li" :style="{height: 0.16*bodyWidth + 'px', borderBottom: '1px solid #f1f1f1'}"
             @click="jump('map')">
            <div class="list-info-container">
                <div class="list-left">
                    <img class="list-logo" :src="markerUrl"
                         :style="{width:0.04 * bodyWidth + 'px', height: 0.053 * bodyWidth + 'px'}"/>
                    <div class="list-info" :style="{marginLeft: 0.0453*bodyWidth  + 'px', fontSize: 0.04*bodyWidth }"
                         v-if="posts.addresses">
                        {{posts.addresses.address1}}
                    </div>
                    <div class="list-info" :style="{marginLeft: 0.0453*bodyWidth  + 'px', fontSize: 0.04*bodyWidth }"
                         v-else-if="!posts.addresses">
                        No Address Available
                    </div>
                </div>
                <div class="drop-button"
                     :style="{ backgroundImage: 'url(' + rightUrl + ')', width: 0.0213*bodyWidth  + 'px', height:0.032 * bodyWidth + 'px'}">
                </div>
            </div>
        </div>
        <a :href="'tel:' + callNum" style="text-decoration: none;">
            <div class="each-li" :style="{height: 0.16*bodyWidth + 'px'}">
                <div class="list-info-container">
                    <div class="list-left">
                        <img class="list-logo" :src="phoneUrl"
                             :style="{width:0.04 * bodyWidth + 'px', height: 0.053 * bodyWidth + 'px'}"/>
                        <div class="list-info"
                             :style="{marginLeft: 0.0453*bodyWidth  + 'px', fontSize: 0.04*bodyWidth }"
                        >
                            {{phoneNum}}
                        </div>
                    </div>
                    <div class="drop-button"
                         :style="{ backgroundImage: 'url(' + rightUrl + ')', width: 0.0213*bodyWidth  + 'px', height:0.032 * bodyWidth + 'px'}">
                    </div>
                </div>
            </div>
        </a>
        <div class="bottom-grey" :style="{ height: 0.2346 * bodyWidth + 'px'}">
            <div class="bottom-logo"
                 :style="{ backgroundImage: 'url(' + bottomUrl + ')', width: 0.253*bodyWidth  + 'px', height:0.0533 * bodyWidth + 'px' }"></div>
        </div>
        <div class="pre-button" :style="{ height: 0.133 * bodyWidth + 'px', fontSize: 0.04*bodyWidth + 'px'}"
             @click="jump('menu')">
            PRE-ORDER
        </div>

    </div>
</template>

<style scoped>
    html body {
        max-width: 768px !important;
        overflow-x: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    }

    .cartBadge {
        background-color: #CB202D;
        color: white;
        position: absolute;
    }

    .pre-button {
        width: 100%;
        max-width: 800px !important;
        border-top: 1px solid #d8d8d8;
        display: flex;
        flex-direction: row;
        align-items: center;
        position: fixed;
        bottom: 0;
        z-index: 999;
        background: #cb202d;
        color: #fff;
        font-weight: 600;
        justify-content: center;
    }

    .bottom-bar {
        width: 100%;
        max-width: 800px !important;
        border-top: 1px solid #d8d8d8;
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        align-items: center;
        position: fixed;
        bottom: 0;
        z-index: 999;
    }

    .bottom-logo {
        background-repeat: no-repeat;
        background-size: contain;
    }

    .bottom-grey {
        width: 100%;
        background: #f9f9f9;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .list-logo {
        margin-left: 4.5%;
    }

    .each-li {
        width: 100%;
        display: flex;
        font-weight: 200;
        color: #555;
        justify-content: space-between;
        align-items: center;
    }

    .time-title {
        font-weight: 600;
        color: #333;
    }

    .time-time {
        color: #555;
        font-weight: 200;
        word-spacing: 1px;
    }

    .each-day {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .sched-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #333;
        font-weight: 600;
    }

    .time-info {
        width: 100%;
        height: auto;
        padding-top: 36px;
        padding-bottom: 36px;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: #fafafa;
    }

    .list-left {
        width: 80%;
        display: flex;
        flex-direction: row;
        align-content: center;
        justify-content: flex-start;
    }

    .drop-button {
        margin-right: 2%;
        background-size: contain;
        background-repeat: no-repeat;
    }

    .list-info {
        display: flex;
        font-weight: 200;
        color: #555;
        justify-content: center;
        align-items: center;
    }

    .list-info-container {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin-left: 4.5%;
        margin-right: 4.5%;
        width: 91%;
        height: 40%;
    }

    #information {
        font-weight: 600;
        color: #333;
    }

    .info-bar {
        width: 100%;
        display: flex;
        flex-direction: column;
        border-bottom: 1px solid #f1f1f1;

    }

    .cartBadge {
        background-color: #CB202D;
        color: white;
        position: absolute;
    }

    .top-pic-overlay {
        width: 100%;
        position: absolute;
        z-index: 1;
    }

    .thin-grey {
        width: 100%;
        background: #f9f9f9;
    }

    .rest-tag {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 20%;
        text-align: center;
        font-weight: 200;
        color: #999;
        background: #f2f2f2;
        border-radius: 5%;

    }

    .rest-name {
        color: #333;
        font-weight: 600;
    }

    .overview {
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    .top-bar {
        width: 100%;
        height: 8%;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        position: absolute;
        z-index: 2;
        max-width: 800px !important;
    }

    .back-button {
        background-size: contain;
    }

    .cart-button {
        background-size: contain;
    }

    .top-pic-container {
        width: 100%;
    }

    .top-pic {
        object-fit: cover;
        width: 100%;
    }

</style>

<script>
    //  import VueRouter from 'vue-router'
    import Nat from 'weex-nat';
    var windowHeight = window.innerHeight;
    var bodyWidth = window.innerWidth;
    import Vue from 'vue'
    var titleFontSize = 0.0426 * window.innerWidth;
    import axios from 'axios';
    import VueAxios from 'vue-axios'
    import config from './config.json'
    Vue.use(VueAxios, axios);
    var day;
    var dayNum = new Date().getDay();

    switch (dayNum) {
        case 0:
            day = "Sunday";
            break;
        case 1:
            day = "Monday";
            break;
        case 2:
            day = "Tuesday";
            break;
        case 3:
            day = "Wednesday";
            break;
        case 4:
            day = "Thursday";
            break;
        case 5:
            day = "Friday";
            break;
        case 6:
            day = "Saturday";
    }

    function formatPhoneNumber(s) {
        var s2 = ("" + s).replace(/\D/g, '');
        var m = s2.match(/^(\d{3})(\d{3})(\d{4})$/);
        return (!m) ? null : "(" + m[1] + ") " + m[2] + "-" + m[3];
    }

    export default {
        name: 'Restaurant_info',
        data() {
            return {
                posts: [],
                post: {},
                imgPaths: [],
                windowHeight: windowHeight,
                titleFontSize: titleFontSize,
                paramPost: null,
                error: null,
                restId: this.$route.query.restId,
                dist: this.$route.query.dist,
                nullUrl: './assets/images/Fill.png',
                backImgUrl: './assets/images/back@2x.png',
                bodyWidth: bodyWidth,
                cartUrl: './assets/images/cart@2x.png',
                overUrl: './assets/images/Rectangle.png',
                clockUrl: './assets/images/icn_clock@2x.png',
                day: day,
                dayNum: dayNum,
                dayStr: "Not Available Today",
                rightUrl: './assets/images/right@2x.png',
                showTime: 'none',
                timeArr: [],
                aTime: {},
                markerUrl: './assets/images/icn_location@2x.png',
                phoneUrl: './assets/images/icn_tele@2x.png',
                phoneNum: 'No Phone Number Available',
                callNum: '',
                bottomUrl: './assets/images/blogo.png',
                cartNum: this.$store.state.cart.total_quantity,
                config: config
            }
        },
        created() {
            if (typeof window.orientation === 'undefined') {
                let htmlWidth = document.documentElement.clientWidth;
                let htmlElement = document.getElementsByTagName('html')[0];
                htmlElement.style.minHeight = 1.7778 * htmlWidth;
                this.windowHeight = 1.7778 * htmlWidth;
            }
            axios.get(this.config.restApi + "/v1/restaurants/" + this.restId + "/common_attributes")
                .then(response => {
                    this.posts = response.data;
                    let post = this.posts;
                    if (post.photos && post.photos.length > 0) {
                        let path = post.photos[0].path;
                        if (path.substr(0, 5) === 'http:') {
                            this.posts.photos[0].path = 'https' + path.substr(4);
                        }
                    }
                    if (post.regular_hours) {
                        //back end data sucks!!!!!
                        let regHr = post.regular_hours;
                        for (let i = 0; i < regHr.length; i++) {
                            let timeObj = {};
                            let dStr = regHr[i];
                            let spaceNum = dStr.indexOf(" ");
                            if (spaceNum === -1) {
                                continue;
                            }
                            let subDay = dStr.substr(0, spaceNum);
                            timeObj.theDay = subDay;
                            let restTime = dStr.substr(spaceNum + 1);
                            let twoSpace = restTime.indexOf(" ");
                            // dont complain, i aint writing a helper for this, perfect the back end data
                            if (twoSpace === -1) {
                                let dash = restTime.indexOf('-');
                                let hours = parseInt(restTime.substr(0, 2));
                                let minutes = parseInt(restTime.substr(3, 2));
                                let ampm = hours >= 12 ? 'PM' : 'AM';
                                let tempHour = hours % 12;
                                tempHour = tempHour ? tempHour : 12; // the hour '0' should be '12'
                                minutes = minutes < 10 ? '0' + minutes : minutes;
                                timeObj.timeOne = tempHour + ':' + minutes + ' ' + ampm;
                                hours = parseInt(restTime.substr(dash + 1, 2));
                                minutes = parseInt(restTime.substr(dash + 4, 2));
                                ampm = hours >= 12 ? 'PM' : 'AM';
                                tempHour = hours % 12;
                                tempHour = tempHour ? tempHour : 12;
                                minutes = minutes < 10 ? '0' + minutes : minutes;
                                timeObj.timeOne = timeObj.timeOne + ' - ' + tempHour + ':' + minutes + ' ' + ampm;
                            } else {
                                let oneTime = restTime.substr(0, twoSpace);
                                let dashOne = oneTime.indexOf('-');
                                let hours = parseInt(oneTime.substr(0, 2));
                                let minutes = parseInt(oneTime.substr(3, 2));
                                let ampm = hours >= 12 ? 'PM' : 'AM';
                                let tempHour = hours % 12;
                                tempHour = tempHour ? tempHour : 12; // the hour '0' should be '12'
                                minutes = minutes < 10 ? '0' + minutes : minutes;
                                timeObj.timeOne = tempHour + ':' + minutes + ' ' + ampm;
                                hours = parseInt(oneTime.substr(dashOne + 1, 2));
                                minutes = parseInt(oneTime.substr(dashOne + 4, 2));
                                ampm = hours >= 12 ? 'PM' : 'AM';
                                tempHour = hours % 12;
                                tempHour = tempHour ? tempHour : 12;
                                minutes = minutes < 10 ? '0' + minutes : minutes;
                                timeObj.timeOne = timeObj.timeOne + ' - ' + tempHour + ':' + minutes + ' ' + ampm;

                                let twoTime = restTime.substr(twoSpace + 1);
                                let dashTwo = twoTime.indexOf('-');
                                hours = parseInt(twoTime.substr(0, 2));
                                minutes = parseInt(twoTime.substr(3, 2));
                                ampm = hours >= 12 ? 'PM' : 'AM';
                                tempHour = hours % 12;
                                tempHour = tempHour ? tempHour : 12; // the hour '0' should be '12'
                                minutes = minutes < 10 ? '0' + minutes : minutes;
                                timeObj.timeTwo = tempHour + ':' + minutes + ' ' + ampm;
                                hours = parseInt(twoTime.substr(dashTwo + 1, 2));
                                minutes = parseInt(twoTime.substr(dashTwo + 4, 2));
                                ampm = hours >= 12 ? 'PM' : 'AM';
                                tempHour = hours % 12;
                                tempHour = tempHour ? tempHour : 12;
                                minutes = minutes < 10 ? '0' + minutes : minutes;
                                timeObj.timeTwo = timeObj.timeTwo + ' - ' + tempHour + ':' + minutes + ' ' + ampm;
                            }
                            let that = this;
                            if (dStr.includes(this.day)) {
                                if (timeObj.timeTwo) {
                                    that.dayStr = that.day + ' ' + timeObj.timeOne + ' ' + timeObj.timeTwo;
                                }
                                else {
                                    that.dayStr = that.day + ' ' + timeObj.timeOne;
                                }
                            }
                            this.timeArr.push(timeObj);
                        }
                    }
                    if (post.officialPhone) {
                        let tempNum = post.officialPhone;
                        if (tempNum.substr(0, 1) === '1') {
                            tempNum = post.officialPhone.substr(1);
                            this.callNum = tempNum;
                            this.phoneNum = formatPhoneNumber(tempNum);
                        }
                        else {
                            this.callNum = tempNum;
                            this.phoneNum = formatPhoneNumber(tempNum);
                        }
                    }
                    console.log(this.timeArr);
                })
                .catch(e => {
                    // this.errors.push(e)
                })
        },
        methods: {
            jump: function (e) {
                if (e === 'map') {
                    if (this.posts.addresses && this.posts.addresses.location) {
                        this.$router.push({
                            path: '/map', query: {
                                restId: this.restId, dist: this.dist,
                                lat: this.posts.addresses.location.lat,
                                lon: this.posts.addresses.location.lon,
                                addr: this.posts.addresses.address1,
                                city: this.posts.addresses.city,
                            }
                        });
                    }
                }
                else if (e === 'menu') {
                    this.$router.push({
                        path: '/rest_menu', query: {
                            restId: this.restId,
                            restName: this.posts.longNames[0].name
                        }
                    });
                }
            },
            goBack: function () {
                this.$router.go(-1);
            },
            showHide(){
                if (this.showTime === 'none') {
                    this.showTime = 'flex';
                    document.getElementById("drop-butt").style.transform = "rotate(-90deg)";
                }
                else {
                    this.showTime = 'none';
                    document.getElementById("drop-butt").style.transform = "rotate(0deg)";
                }
            },
            logCart(){
                console.log(this.$store.state.cart);
            },
            goCart(){
                this.$router.push({path: '/cart'})
            },
        },

    }
</script>