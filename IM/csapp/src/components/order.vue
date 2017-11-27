<template>
  <div class='wrapper'>
    <div class='top-nav' :style="{height: 0.117 * bodyWidth + 'px'}">
      <div :style="{marginLeft: '45%'}">
        Orders
      </div>
      <div class='cart-button' @click='goCart'
         :style="{ backgroundImage: 'url(' + cartUrl + ')', width: 0.0506 * bodyWidth + 'px', height: 0.0453 * bodyWidth + 'px', marginRight: 0.0453*bodyWidth + 'px'}">
        <div v-if="cartNum>0" :style="{ top: 0.025 * bodyWidth + 'px', right: 0.02*bodyWidth+ 'px',
               fontSize: 0.026 * bodyWidth + 'px', padding: 0.00267*bodyWidth + 'px' + ' ' + 0.0106 * bodyWidth + 'px', borderRadius: 0.02*bodyWidth+ 'px',
          }" class="cartBadge">
          {{cartNum}}
        </div>
      </div>
    </div>
    <div id="reward-container" @click="show()" :style="{ backgroundImage: 'url(' + wineImg + ')'}">
      Want to Get More Rewards?
    </div>
    <div class="empty-container" v-if="orderArr.length === 0" :style="{marginTop: '4vw'}">
      <div class="empty-msg">
        You haven't ordered anything yet.
      </div>
      <div class="empty-cart" :style="{height: 0.37 * windowHeight + 'px'}">
        <img :src="emptyCart" :style="{width: 0.405 * bodyWidth + 'px', height: 0.32 * bodyWidth + 'px'}"/>
      </div>
    </div>
    <div v-else class="item-container" :style="{marginTop: 0.117 * bodyWidth + 'px'}">
      <div class="cart-item-list">
        <div class="cart-each-item"
           :style="{height: 0.24 * bodyWidth + 'px', paddingBottom: 0.0453*bodyWidth + 'px', paddingTop: 0.0453*bodyWidth + 'px'}"
           v-for="anOrder in orderArr" :key="anOrder">
          <div class="cart-item-img" :style="{ backgroundImage: 'url(' + anOrder.pic + ')'}"
             v-on:click="goReceipt(anOrder.orderId, anOrder.checkStatus, anOrder.isCaptured)">
          </div>
          <div class="cart-item-detail" :style="{justifyContent: 'space-around'}">
            <div class="cart-item-name" :style="{fontSize: 0.04*bodyWidth + 'px', fontWeight:400}"
               v-on:click="goReceipt(anOrder.orderId, anOrder.checkStatus, anOrder.isCaptured)">
              {{anOrder.name}}
            </div>
            <div class="order-item-bottom" v-on:click="goReceipt(anOrder.orderId, anOrder.checkStatus,anOrder.isCaptured)">
              <div class="order-item-time" :style="{fontSize: 0.029*bodyWidth + 'px'}">
                {{anOrder.time}}
              </div>
            </div>
            <div v-if="anOrder.checkStatus === 'nope'" class="checkin-button"
               v-on:click="checkIn(anOrder.orderId)" :id="anOrder.orderId">
              Check-In
            </div>
            <div v-else-if="anOrder.checkStatus === 'notYet'" class="expire-button" v-on:click="notYet();">
              Check-In
            </div>
            <div v-else-if="anOrder.checkStatus === 'expire'" class="expire-button">
              Expired
            </div>
          </div>
        </div>
      </div>
    </div>
    <bounce-loader :loading="isLoading" :color="spinnerColor" :style="{marginLeft: '42%'}"></bounce-loader>
    <div class="bottom-grey" :style="{ height: 0.6 * bodyWidth + 'px'}">
      <div class="bottom-logo"
         :style="{ backgroundImage: 'url(' + bottomUrl + ')', width: 0.253*bodyWidth + 'px', height:0.0533 * bodyWidth + 'px' }"></div>
    </div>
    <div class="footer">
      <div class="button-container" id="home" @click="jumpTwo('/')">
        <img class="button-icon" :src="restUrl"/>
        <p style="margin:0" :style="{color: restText}">Restaurants</p>
      </div>
      <div class="button-container" id="orders" @click="jumpTwo('/order')">
        <img class="button-icon" :src="orderUrl"/>
        <p style="margin:0" :style="{color: orderText}">Orders</p>
      </div>
    </div>
    <modal name="more-rewards" id="more-rewards" :pivotY="pivotY" width="100%" height="27%">
      <div id="close-x">
        <div id="close-butt" @click="hide()">
          &times;
        </div>
      </div>
      <a href="https://www.fandine.com" class="nav-web" id="goto-web">
        <div>
          Go to FanDine Website
        </div>
      </a>
      <a :href="downLoadUrl" class="nav-web" id="down-load">
        <div>
          Download the App
        </div>
      </a>
    </modal>
  </div>
</template>
<style>
  #down-load{
    color: #fff;
    background-color: #CB202D;
    margin-top: 4vw;
  }
  #goto-web{
    color: #CB202D;
  }
  .nav-web{
    border: 1px solid #CB202D;
    text-decoration: none;
    width: 92vw;
    height: 7.64vh;
    display: flex;
    margin: 0 4vw;
    justify-content: center;
    align-items: center;
  }
  #close-butt{
    font-size: 10vw;
    margin-right: 4vw;
    font-weight: 300;
  }
  .empty-msg{
    width: 100%;
    text-align: center;
    margin-top: 0;
  }
  #close-x{
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
  #reward-container{
    margin-top: 12vw;
    color: #fff;
    text-shadow: 0 2px #333;
    width: 100%;
    background-size: contain;
    height: 24vw;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 5vw;
  }
  .expire-button {
    color: #fff;
    width: 60%;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #9B9B9B;
    border-radius: 30px;
    margin-left: 40%;
    font-size: 4vw;
    font-weight: 300;
  }

  .checkin-button {
    color: #fff;
    width: 60%;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #CB212D;
    border-radius: 30px;
    margin-left: 40%;
    font-size: 4vw;
    font-weight: 300;
  }

  .order-item-desc {
    font-weight: 400;
    color: #444;
    word-wrap: break-word;
    width: 100%;
    height: auto;
  }

  .order-item-time {
    font-weight: 400;
    color: #999;
  }

  .order-item-bottom {
    width: 90.6%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    margin-top: -8%;
  }
</style>

<script>
/* eslint-disable */
  var windowHeight = window.innerHeight
  var bodyWidth = window.innerWidth
  import axios from 'axios'
  import Vue from 'vue'
  import VueAxios from 'vue-axios'
  import config from './config.json'
  import BounceLoader from 'vue-spinner/src/PulseLoader.vue'

  Vue.use(VueAxios, axios)

  export default {
    name: 'Order',
    components: {
      BounceLoader
    },
    data() {
      return {
        pivotY: 1,
        downLoadUrl: null,
        wineImg: './assets/images/wine.png',
        windowHeight: windowHeight,
        bodyWidth: bodyWidth,
        cartNum: this.$store.state.cart.total_quantity,
        cartUrl: './assets/images/nav_icon_cart_black@2x.png',
        restUrl: './assets/images/tab_icon_home_black@2x.png',
        orderUrl: './assets/images/tab_icon_order-red@2x.png',
        restText: '#444',
        orderText: '#CB202D',
        orderArr: [],
        emptyCart: './assets/images/noorder@2x.png',
        anOrder: null,
        bottomUrl: './assets/images/blogo.png',
        fdId: null,
        token: null,
        uid: null,
        accessToken: null,
        config: config,
        isLoading: true,
        spinnerColor: "#EF727F",
        spinnerSize: "20px",
        noCheckArr: [],
        checkArr: [],
        expireArr: []
      }
    },
    created() {
      let os = this.getOs();
      if(os === 'Mac OS' || os === 'iOS'){
        this.downLoadUrl = 'https://itunes.apple.com/ca/app/fandine/id952824896'
      }
      else{
        this.downLoadUrl = 'https://play.google.com/store/apps/details?id=fandine.consumer.na&hl=en'
      }
      this.fbLogin();

    },
    methods: {
      show() {
        this.$modal.show('more-rewards');
      },
      hide() {
        this.$modal.hide('more-rewards');
      },
      notYet(){
        alert('You can check in within 2 hours before or after your reservation time.')
      },
      goBack: function () {
        this.$router.go(-1);
      },
      goCart() {
        this.$router.push({path: '/cart'})
      },
      jumpTwo(p) {
        this.$router.push({path: p, query: {}});
      },
      goReceipt(id, status, isCaptured) {
        console.log(status);
        if(status === 'nope' || status === 'notYet'){
          this.$router.push({
            path: '/receipt', query: {
              orderId: id,
              fdId: this.fdId,
              token: this.token
            }
          });
        }
        else if(status === 'expire'){
          this.$router.push({
            path: '/expire_receipt', query: {
              orderId: id,
              fdId: this.fdId,
              token: this.token
            }
          });
        }
        else if (status === 'checked' && isCaptured === false){
          this.$router.push({
            path: '/check_in', query: {
              orderId: id,
              fdId: this.fdId,
              token: this.token
            }
          });
        }
        else if (status === 'checked' && isCaptured === true){
          this.$router.push({
            path: '/expire_receipt', query: {
              orderId: id,
              fdId: this.fdId,
              token: this.token
            }
          });
        }
      },
      getOs() {
        let userAgent = window.navigator.userAgent,
          platform = window.navigator.platform,
          macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
          windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
          iosPlatforms = ['iPhone', 'iPad', 'iPod'],
          os = null;

        if (macosPlatforms.indexOf(platform) !== -1) {
          os = 'Mac OS';
        } else if (iosPlatforms.indexOf(platform) !== -1) {
          os = 'iOS';
        } else if (windowsPlatforms.indexOf(platform) !== -1) {
          os = 'Windows';
        } else if (/Android/.test(userAgent)) {
          os = 'Android';
        } else if (!os && /Linux/.test(platform)) {
          os = 'Linux';
        }
        return os;
      },
      checkIn(orderId) {
        let that = this;
        if (confirm('Check-in right now?') === true) {
          let header = {
            headers: {'Authorization': 'Bearer ' + that.token}
          };
          let putUrl = that.config.orderApi + '/v1/users/' + that.fdId + '/orders/' + orderId + '/actions/picked_up?isServer=FALSE';
          axios.put(putUrl, {}, header)
            .then(function (response) {
              alert("Success! You have checked in, enjoy your meal!");
              let buttonElm = document.getElementById(orderId);
              buttonElm.style.display = "none";
              that.$router.push({
                path: '/check_in', query: {
                  orderId: orderId,
                  fdId: that.fdId,
                  token: that.token
                }
              });
            })
            .catch(function (err) {
              console.log(JSON.stringify(err));
            })
        }
      },
      getTimeDifference(timeStr){
        let now = new Date();
        let endDate = new Date(timeStr);
        let diff = endDate - now;
        let hours = Math.floor(diff / 3.6e6);
        return hours;
      },
      getOrders(){
        let that = this;
        if (this.fdId !== null && this.token !== null) {
          let header = {
            headers: {'Authorization': 'Bearer ' + that.token}
          };
          axios.get(that.config.orderApi + '/v1/users/' + that.fdId + '/past_orders_only_without_review?page_size=99&locale=en_US&order_type=PREORDER', header)
            .then(function (response) {
              console.log(JSON.stringify(response));
              let tempOrder = response.data;
              if (tempOrder === []) {
                return
              }
              for (let i = 0; i < tempOrder.length; i++) {
                let picPath;
                if (tempOrder[i].restaurant_logo) {
                  picPath = tempOrder[i].restaurant_logo;
                  if (picPath.substr(0, 5) === 'http:') {
                    picPath = 'https' + picPath.substr(4);
                  }
                }
                else {
                  picPath = './assets/images/Fill.png'
                }
                let oItems = tempOrder[i].order_items;
                let itemStr = '';
                for (let j = 0; j < oItems.length; j++) {
                  if (itemStr === '') {
                    itemStr = oItems[j].menu_item_name;
                  }
                  else {
                    itemStr = itemStr + ', ' + oItems[j].menu_item_name;
                  }
                }
                if (itemStr.length > 60) {
                  itemStr = itemStr.substr(0, 47) + '...'
                }
                let date = new Date(tempOrder[i].submit_time).toString();
                let createTime = date.substr(4, 11) + ' ' + date.substr(16, 5);
                let checkStatus;
                //Alright, check status means the check-in status, notYet means the order is placed, but can't check in yet, nope means the order is ready to check in
                if (tempOrder[i].is_expired === undefined) {
                  // NOTE: on rare occasion the note might be present in the data
                  if(!tempOrder[i].note){
                    continue;
                  }
                  let timeDiff = that.getTimeDifference(tempOrder[i].note.effective_date);
                  if(timeDiff > 2){
                    checkStatus = 'notYet';
                  }
                  else if(timeDiff < -2){
                    checkStatus = 'expire';
                  }
                  else checkStatus = 'nope';
                }
                if (tempOrder[i].is_expired) {
                  checkStatus = 'expire';
                }
                let isCaptured = false;
                if(tempOrder[i].payment_status){
                  if(tempOrder[i].payment_status === 'CAPTURED'){
                    isCaptured = true;
                  }
                }
                let oObj = {
                  name: tempOrder[i].restaurant_name,
                  pic: picPath,
                  checkStatus: checkStatus,
                  time: createTime,
                  isCaptured:isCaptured,
                  orderId: tempOrder[i].order_id
                };
                if(checkStatus === 'nope' || checkStatus === 'notYet'){
                  that.noCheckArr.push(oObj);
                }
                else{
                  that.expireArr.push(oObj);
                }
              }
              that.getCheckedOnly();
            })
            .catch(function (error) {
              alert(error);
              console.log(error);
            });
        }
      },
      getCheckedOnly() {
        let that = this;
        let header = {
          headers: {'Authorization': 'Bearer ' + that.token}
        };
        axios.get(that.config.orderApi + '/v1/users/' + that.fdId + '/past_orders_only_without_review?page_size=99&locale=en_US', header)
          .then(function (response) {
            console.log(JSON.stringify(response));
            let tempOrder = response.data;
            if (tempOrder === []) {
              return
            }
            for (let i = 0; i < tempOrder.length; i++) {
              let picPath;
              if (tempOrder[i].order_type === "PREORDER") {
                if (tempOrder[i].restaurant_logo) {
                  picPath = tempOrder[i].restaurant_logo;
                  if (picPath.substr(0, 5) === 'http:') {
                    picPath = 'https' + picPath.substr(4);
                  }
                }
                else {
                  picPath = './assets/images/Fill.png'
                }
                let oItems = tempOrder[i].order_items;
                let itemStr = '';
                for (let j = 0; j < oItems.length; j++) {
                  if (itemStr === '') {
                    itemStr = oItems[j].menu_item_name;
                  }
                  else {
                    itemStr = itemStr + ', ' + oItems[j].menu_item_name;
                  }
                }
                if (itemStr.length > 60) {
                  itemStr = itemStr.substr(0, 47) + '...'
                }
                let date = new Date(tempOrder[i].submit_time).toString();
                let isCaptured = false;
                if(tempOrder[i].payment_status){
                  if(tempOrder[i].payment_status === 'CAPTURED'){
                    isCaptured = true;
                  }
                }
                let createTime = date.substr(4, 11) + ' ' + date.substr(16, 5);
                let checkStatus = 'checked';
                let oObj = {
                  name: tempOrder[i].restaurant_name,
                  pic: picPath,
                  checkStatus: checkStatus,
                  time: createTime,
                  orderId: tempOrder[i].order_id,
                  isCaptured: isCaptured
                };
                that.checkArr.push(oObj);
              }
            }
            that.orderArr = that.noCheckArr.concat(that.checkArr).concat(that.expireArr);
          })
          .catch(function (error) {
            alert(error);
            console.log(error);
          });
      },
      fbLogin() {
        let that = this;
        let header = {
          headers: {
            'Authorization': that.config.basic,
            'Content-Type': that.config.ctype
          },
        };

        function getId() {
          let userUrl = that.config.tokendetail + that.token;
          axios.get(userUrl, header).then(function (response) {
            that.fdId = response.data.user.id;
            console.log(that.fdId);
            that.getOrders();
            that.isLoading = false;
          }).catch(function (error) {
            alert(JSON.stringify(error));
            console.log(JSON.stringify(error));
          });
        }

        function do_fb_login() {
          FB.login(function (response) {
            if (response.authResponse) {
              console.log('Welcome! Fetching your information.... ');
              that.uid = response.authResponse.userID;
              that.accessToken = response.authResponse.accessToken;
              let form = 'grant_type=password&username=FACEBOOK&password=' + that.accessToken;
              axios.post(that.config.fbOauth,
                form, header)
                .then(function (response) {
                  that.token = response.data.access_token;
                  console.log(that.token);
                  getId();
                }).catch(function (error) {
                alert(JSON.stringify(error));
                console.log(JSON.stringify(error));
              });
            } else {
              alert('You need to login before continuing');
              that.isLoading = false;
            }
          });
        }

        FB.getLoginStatus(function (response) {
          if (response.status === 'connected') {
            that.uid = response.authResponse.userID;
            that.accessToken = response.authResponse.accessToken;
            //alert(that.uid + ' ' + that.accessToken);
            let form = 'grant_type=password&username=FACEBOOK&password=' + that.accessToken;
            axios.post(that.config.fbOauth,
              form, header)
              .then(function (response) {
                that.token = response.data.access_token;
                console.log(that.token);
                getId();
              }).catch(function (error) {
              alert(JSON.stringify(error));
              console.log(JSON.stringify(error));
            });
          }
          else {
            do_fb_login();
          }
        });

      }
    }
  }
/* eslint-enable */
</script>
