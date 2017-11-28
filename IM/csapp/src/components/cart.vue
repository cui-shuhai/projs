<template>
  <div class="wrapper">
    <div class="top-nav" :style="{height: 0.117 * bodyWidth + 'px'}">
      <div class="back-button"
         :style="{ backgroundImage: 'url(' + backImgUrl + ')', width: 0.024 * bodyWidth + 'px', height: 0.048 * bodyWidth + 'px', marginLeft: 0.0453*bodyWidth + 'px'}"
         @click="goBack"></div>
      <div id="c-title">
        Cart
      </div>
      <div class="clear" :style="{fontSize: 0.04 * bodyWidth + 'px'}" @click="clearCart">
        Clear Cart
      </div>
    </div>
    <div class="empty-container" v-if="$store.state.cart.total_quantity === 0"
       :style="{marginTop: '20vw'}">
      <div class="empty-msg">
        You haven't added anything yet.
      </div>
      <div class="empty-cart" :style="{height: 0.37 * windowHeight + 'px'}">
        <img :src="emptyCart" :style="{width: 0.405 * bodyWidth + 'px', height: 0.32 * bodyWidth + 'px'}"/>
      </div>
    </div>
    <div v-else class="item-container" :style="{marginTop: 0.117 * bodyWidth + 'px'}">
      <div class="banner" :style="{ backgroundImage: 'url(' + bannerUrl + ')', height: 0.16 * bodyWidth + 'px'}">
        <div class="cart-rest-name" :style="{fontSize: 0.048 * bodyWidth + 'px'}">
          {{$store.state.cart.restName}}
        </div>
      </div>
      <div class="cart-item-list">
        <div class="cart-each-item"
           :style="{height: 0.24 * bodyWidth + 'px', paddingBottom: 0.0453*bodyWidth + 'px', paddingTop: 0.0453*bodyWidth + 'px'}"
           v-for="aCart in cartObj" :key="aCart" :id="aCart.itemId">
          <div class="cart-item-img" :style="{ backgroundImage: 'url(' + aCart.picUrl + ')'}">
          </div>
          <div class="cart-item-detail">
            <div class="cart-item-name" :style="{fontSize: 0.04*bodyWidth + 'px'}">
              {{aCart.itemName}}
            </div>
            <div class="cart-item-bottom">
              <div class="cart-item-price" :style="{fontSize: 0.048*bodyWidth + 'px'}">
                {{'$' + aCart.price}}
              </div>
              <div class="cart-item-quan" :style="{fontSize: 0.0373*bodyWidth + 'px'}">
                <div class="cart-item-func"
                   :style="{ backgroundImage: 'url(' + minusUrl + ')', height: 0.064 * bodyWidth + 'px', width: 0.064 * bodyWidth + 'px'}"
                   @click="subOne(aCart)"></div>
                {{aCart.quantity}}
                <div class="cart-item-func"
                   :style="{ backgroundImage: 'url(' + plusUrl + ')', height: 0.064 * bodyWidth + 'px', width: 0.064 * bodyWidth + 'px'}"
                   @click="addOne(aCart)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <bounce-loader :loading="isLoading" :color="spinnerColor" :style="{position: 'fixed', marginLeft: '42%', top: '40%'}"></bounce-loader>
      <div class="bottom-bar" :style="{ height: 0.133 * bodyWidth + 'px'}">
        <div class="cart-sub">
          <div>
            Subtotal:
          </div>
          <div id="s-total">
            {{'$' + subTotal}}
          </div>
        </div>
        <div class="pre-button" :style="{ fontSize: 0.04*bodyWidth + 'px'}" @click="toPayment()">
          Place Order
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import axios from 'axios'
  import Vue from 'vue'
  import VueAxios from 'vue-axios'
  import config from './config.json'
  import BounceLoader from 'vue-spinner/src/BounceLoader.vue'
  var windowHeight = window.innerHeight
  var bodyWidth = window.innerWidth
  Vue.use(VueAxios, axios)
  /* window.fbAsyncInit = function () {
     FB.init({
      appId: '1892641684310260',
      cookie: true, // enable cookies to allow the server to access
              // the session
      xfbml: true, // parse social plugins on this page
      version: 'v2.8' // use graph api version 2.8
    })
    FB.getLoginStatus(function (response) {
      checkLoginState(response)
    })
  } */
  // Load the SDK asynchronously
  /* (function (d, s, id) {
    var js
    var fjs = d.getElementsByTagName(s)[0]
    if (d.getElementById(id)) return
    js = d.createElement(s)
    js.id = id
    js.src = '//connect.facebook.net/en_US/sdk.js'
    fjs.parentNode.insertBefore(js, fjs)
  }(document, 'script', 'facebook-jssdk')) */

  export default {
    name: 'Cart',
    data () {
      return {
        windowHeight: windowHeight,
        bodyWidth: bodyWidth,
        backImgUrl: './assets/images/black_back@2x.png',
        emptyCart: './assets/images/noorder@2x.png',
        bannerUrl: './assets/images/blackground@2x.png',
        cartObj: [],
        aCart: '',
        minusUrl: './assets/images/icon_reduce@2x.png',
        plusUrl: './assets/images/icon_plus@2x.png',
        restId: '',
        subTotal: 0,
        postItems: [],
        uid: null,
        accessToken: null,
        fandineId: null,
        token: null,
        config: config,
        isLoading: false,
        spinnerColor: '#EF727F'
      }
    },
    created () {
      this.reCalc()
    },
    components: {
      BounceLoader
    },
    methods: {
      toPayment () {
        this.$router.push({path: '/payment'})
      },
      reCalc () {
        let cObj = this.$store.state.cart
        let cKeys = Object.keys(cObj)
        let sTotal = 0
        this.cartObj = []
        if (cKeys.length > 1) {
          let subObj
          for (let i = 0; i < cKeys.length; i++) {
            if (cKeys[i] !== 'total_quantity' && cKeys[i] !== 'restName') {
              subObj = cObj[cKeys[i]]
              this.restId = cKeys[i]
            }
          }
          let sKeys = Object.keys(subObj)
          for (let i = 0; i < sKeys.length; i++) {
            sTotal += subObj[sKeys[i]].quantity * subObj[sKeys[i]].price
            this.cartObj.push(subObj[sKeys[i]])
          }
          this.subTotal = sTotal.toFixed(2)
        }
        console.log(this.cartObj)
        this.postItems = []
        for (let i = 0; i < this.cartObj.length; i++) {
          let temp = this.cartObj[i]
          let itemObj = {
            item_id: temp.itemId,
            quantity: temp.quantity
          }
          this.postItems.push(itemObj)
        }
      },
      goDetail () {
        let id = this.fandineId
        let token = this.token
        let that = this
        var header = {
          headers: {'Authorization': 'Bearer ' + token}
        }
        this.reCalc()
        axios.get(that.config.orderApi + '/v2/users/' + id + '/current_orders', header)
          .then(function (response) {
            console.log(JSON.stringify(response))
            if (Object.keys(response.data).length !== 0) {
              let orderId = response.data.order_id
              axios.put(that.config.orderApi + '/v1/users/' + id + '/orders/' + orderId + '/cancel_order', {}, header).then(function (response) {
                console.log(JSON.stringify(response))
                axios.post(that.config.orderApi + '/v2/users/' + id + '/simple_orders?is_takeout=false&order_type=PREORDER', {
                  restaurant_id: that.restId,
                  order_items: that.postItems
                }, header).then(function (response) {
                  console.log(JSON.stringify(response))
                  let orderId = response.data.id
                  that.$router.push({
                    path: '/order_detail',
                    query: {
                      subTotal: that.subTotal,
                      restId: that.restId,
                      orderId: orderId,
                      fdId: id,
                      token: token,
                      facebookId: that.uid
                    }
                  })
                }).catch(function (error) {
                  console.log(error)
                })
              })
            } else {
              axios.post(that.config.orderApi + '/v2/users/' + id + '/simple_orders?is_takeout=false&order_type=PREORDER', {
                restaurant_id: that.restId,
                order_items: that.postItems
              }, header).then(function (response) {
                console.log(JSON.stringify(response))
                let orderId = response.data.id
                that.$router.push({
                  path: '/order_detail',
                  query: {
                    subTotal: that.subTotal,
                    restId: that.restId,
                    orderId: orderId,
                    fdId: id,
                    token: token,
                    facebookId: that.uid
                  }
                })
              }).catch(function (error) {
                console.log(error)
              })
            }
          }).catch(function (error) {
            console.log(error)
          })
      },
      goBack: function () {
        this.$router.go(-1)
      },
      clearCart () {
        if (this.$store.state.cart.total_quantity !== 0) {
          if (confirm('Are you sure you want to clear the cart?') === true) {
            this.$store.replaceState(
              {
                cart: {
                  total_quantity: 0
                }
              }
            )
          }
        }
      },
      addOne (item) {
        this.$store.state.cart[this.restId][item.itemId].quantity += 1
        this.$store.state.cart.total_quantity += 1
        this.subTotal = parseFloat(this.subTotal) + item.price
        this.subTotal = this.subTotal.toFixed(2)
      },
      subOne (item) {
        let itemNum = this.$store.state.cart[this.restId][item.itemId].quantity
        if (itemNum === 1) {
          document.getElementById(item.itemId).setAttribute('style', 'display:none')
          delete this.$store.state.cart[this.restId][item.itemId]
          this.$store.state.cart.total_quantity -= 1
          if (this.$store.state.cart.total_quantity === 0) {
            this.$store.replaceState(
              {
                cart: {
                  total_quantity: 0
                }
              }
            )
          }
        } else {
          this.$store.state.cart[this.restId][item.itemId].quantity -= 1
          this.$store.state.cart.total_quantity -= 1
        }
        this.subTotal = parseFloat(this.subTotal) - item.price
        this.subTotal = this.subTotal.toFixed(2)
      }
    }
  }
</script>

<style>
  input{
    box-shadow: none;
  }
  #s-total {
    color: #CB202D;
  }

  .cart-sub {
    width: 40%;
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding-left: 5%;
    padding-right: 5%;
  }

  .cart-item-func {
    background-size: contain;
    background-repeat: no-repeat;
  }

  .cart-item-quan {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    color: #333;
    width: 55%;
    align-items: center;
  }

  .cart-item-name {
    color: #333;
    font-weight: 200;
  }

  .cart-item-price {
    color: #CB202D;
    font-weight: 200;
  }

  .cart-item-bottom {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 90.6%;
    position: absolute;
    bottom: 0;

  }

  .cart-item-img {
    width: 47%;
    height: 100%;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
  }

  .cart-item-detail {
    width: 48.47%;
    padding-left: 4.53%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .cart-each-item {
    width: 100%;
    display: flex;
    flex-direction: row;
    border-bottom: 1px solid #ececec;
    align-items: stretch;
  }

  .cart-item-list {
    width: 91%;
    padding-left: 4.5%;
    padding-right: 4.5%;
    padding-bottom: 10%;
  }

  .cart-rest-name {
    padding-left: 4.5%;
    color: #fff;
    font-weight: 200;
    width: 95.5%;
  }

  .banner {
    width: 100%;
    background-size: contain;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
  }

  .item-container {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .empty-msg {
    width: 100%;
    text-align: left;
    margin-top: 6%;
    margin-left: 4.5%;
  }

  .empty-cart {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .empty-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

  }

  #c-title {
    margin-left: 12%;
    font-weight: 600;
  }

  .clear {
    color: #333;
    margin-right: 4.5%;
  }

  .back-button {
    background-size: contain;
    background-repeat: no-repeat;
  }

  .top-nav {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
</style>

