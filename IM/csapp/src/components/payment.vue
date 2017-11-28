<template>
  <div class="wrapper">
    <div class="top-nav" :style="{height: 0.117 * bodyWidth + 'px'}">
      <div class="back-button"
         :style="{ backgroundImage: 'url(' + backImgUrl + ')', width: 0.024 * bodyWidth + 'px', height: 0.048 * bodyWidth + 'px', marginLeft: 0.0453*bodyWidth + 'px'}"
         @click="goBack"></div>
      <div id="c-title">
        Payment
      </div>
      <div class="clear" :style="{fontSize: 0.04 * bodyWidth + 'px'}" @click="cancelOrder()">
        Cancel Order
      </div>
    </div>
    <div class="pm-top" :style="{marginTop: 0.117 * bodyWidth + 'px'}">
      <div class="pm-li" :style="{height: 0.1493 * bodyWidth + 'px'}">
        <div class="pm-name">
          Date & Time
        </div>
        <div class="pm-val" :style="{fontSize: 0.04 * bodyWidth + 'px'}">
          {{$route.query.time}}
        </div>
      </div>
      <div class="pm-li" :style="{height: 0.1493 * bodyWidth + 'px'}">
        <div class="pm-name">
          Guests
        </div>
        <div class="pm-val" :style="{fontSize: 0.04 * bodyWidth + 'px'}">
          {{$route.query.gNum}}
        </div>
      </div>
      <div class="pm-li" :style="{height: 0.1493 * bodyWidth + 'px'}">
        <div class="pm-name">
          Contact Number
        </div>
        <div class="pm-val" :style="{fontSize: 0.04 * bodyWidth + 'px'}">
          {{$route.query.cNum}}
        </div>
      </div>
      <div class="pm-li-col" :style="{height: 0.22 * bodyWidth + 'px'}">
        <div class="pm-name" :style="{marginTop: '5%'}">
          Extra Note
        </div>
        <div class="pm-val" :style="{fontSize: 0.04 * bodyWidth + 'px'}" id="e-note">
          {{$route.query.note}}
        </div>
      </div>
    </div>
    <div id="grey-bg" :style="{ backgroundImage: 'url(' + bgUrl + ')', height: 0.16 * bodyWidth + 'px'}">
      <div id="pay-rest-name" :style="{fontSize: 0.048 * bodyWidth + 'px'}">
        {{restName}}
      </div>
    </div>
    <div class="payment-bottom">
      <div class="each-payment" v-for="cItem in cartItems" :key="cItem"
         :style="{fontSize: 0.04*bodyWidth + 'px', height: 0.15 * bodyWidth + 'px'}">
        <div>
          {{cItem.itemName}}
        </div>
        <div class="each-right">
          <div>
            {{'X' + cItem.quantity}}
          </div>
          <div>
            ${{(cItem.price * cItem.quantity).toFixed(2)}}
          </div>
        </div>
      </div>
      <div class="pay-subli" :style="{fontSize: 0.04*bodyWidth + 'px', height: 0.15 * bodyWidth + 'px'}">
        <div class="pay-li-name">
          Subtotal:
        </div>
        <div>
          ${{$route.query.subTotal}}
        </div>
      </div>
      <div class="pay-subli" :style="{fontSize: 0.04*bodyWidth + 'px', height: 0.15 * bodyWidth + 'px'}">
        <div class="pay-li-name">
          GST:
        </div>
        <div>
          ${{tax}}
        </div>
      </div>
      <div class="pay-subli" :style="{fontSize: 0.04*bodyWidth + 'px', height: 0.15 * bodyWidth + 'px'}">
        <div class="pay-li-name">
          Additional Savings:
        </div>
        <div :style="{color:'#CB202D'}">
          -${{saving}}
        </div>
      </div>
      <div class="pay-subli-hori"
         :style="{fontSize: 0.04*bodyWidth + 'px', height: 0.4 * bodyWidth + 'px', paddingBottom: 0.133 * bodyWidth + 'px'}">
        <div class="subli-spec">
          <div class="pay-li-name">
            Tips:
          </div>
          <div>
            ${{tip}}
          </div>
        </div>
        <div class="tip-slider">
          <vue-slider ref="slider" v-model="tipPerc" v-bind="sliderOpt.default"></vue-slider>
        </div>
        <div :style="{color:'#CB202D'}">
          * You can modify tips after check-in
        </div>
      </div>
    </div>
    <div class="bottom-bar" :style="{ height: 0.133 * bodyWidth + 'px', zIndex: 999}">
      <div class="cart-sub">
        <div>
          Total Due:
        </div>
        <div id="s-total">
          {{'$' + totalDue}}
        </div>
      </div>
      <div class="pre-button" :style="{ fontSize: 0.04*bodyWidth + 'px'}" @click="goStripe()">
        PLACE ORDER
      </div>
    </div>
  </div>
</template>
<script>
  import vueSlider from 'vue-slider-component'
  import axios from 'axios'
  import Vue from 'vue'
  import VueAxios from 'vue-axios'
  import config from './config.json'
  Vue.use(VueAxios, axios)
  let windowHeight = window.innerHeight
  let bodyWidth = window.innerWidth

  export default {
    name: 'Payment',
    watch: {
      'tipPerc' (val) {
        let perIn = val.indexOf('%')
        let tipStr = val.substr(0, perIn)
        let st = this.subT
        this.tip = (parseFloat(st) * (tipStr / 100)).toFixed(2)
        // console.log(this.tip + ' ' + this.subT + ' ' + this.tax + ' ' + this.saving)
        this.totalDue = (parseFloat(this.tip) + parseFloat(this.subT) + parseFloat(this.tax) - parseFloat(this.saving)).toFixed(2)
      }
    },
    data () {
      return {
        windowHeight: windowHeight,
        bodyWidth: bodyWidth,
        backImgUrl: './assets/images/black_back@2x.png',
        restId: '',
        bgUrl: './assets/images/bg_gray@2x.png',
        restName: '',
        saving: null,
        cartItems: [],
        cItem: null,
        tax: 0,
        tip: 0,
        tipArr: [],
        tipPerc: 1,
        totalDue: 0,
        subT: null,
        sliderOpt: {
          default: {
            value: 0,
            width: '100%',
            height: 6,
            direction: 'horizontal',
            dotSize: 26,
            eventType: 'auto',
            min: 0,
            max: 25,
            interval: 1,
            disabled: true,
            show: true,
            realTime: false,
            tooltip: 'always',
            clickable: true,
            tooltipDir: 'top',
            piecewise: false,
            piecewiseLabel: false,
            lazy: false,
            reverse: false,
            speed: 0.5,
            formatter: null,
            bgStyle: null,
            data: [],
            sliderStyle: {
              background: '#E9E8E9'
            },
            tooltipStyle: null,
            processStyle: {
              background: '#9B9B9B'
            },
            piecewiseStyle: null
          }
        },
        fdId: this.$route.query.fdId,
        token: this.$route.query.token,
        config: config
      }
    },
    created () {
      let elms = document.getElementsByClassName('vue-slider-piecewise-dot')
      this.subT = this.$route.query.subTotal
      for (let i = 0; i < elms.length; i++) {
        elms[i].setAttribute('style', 'position: absolute;left: 50%;top: 50%;width: 100%;height: 100%;display: inline-block;border-radius: 50%;transform: translate(-50%,-50%);z-index: 2;transition: all .3s;')
      }
      for (let i = 0; i < 26; i++) {
        this.sliderOpt.default.data.push(i + '%')
      }
      let that = this
      this.restId = this.$route.query.restId
      this.restName = this.$store.state.cart.restName
      let cart = this.$store.state.cart[this.restId]
      let itemKeys = Object.keys(cart)
      for (let i = 0; i < itemKeys.length; i++) {
        this.cartItems.push(cart[itemKeys[i]])
      }
      let header = {
        headers: {'Authorization': 'Bearer ' + this.token}
      }
      axios.get(that.config.orderApi + '/v2/orders/' + this.$route.query.orderId + '/simple_bill', header).then(function (response) {
        console.log(response)
        that.tax = response.data.total_tax
        that.tipPerc = response.data.default_tip_rate.toString() + '%'
        that.sliderOpt.default.value = response.data.default_tip_rate.toString() + '%'
        that.tip = response.data.tip
        that.totalDue = parseFloat(response.data.total_amount_to_pay_with_bd_and_gd)
        that.saving = parseFloat(response.data.blue_dollar_savings)
        console.log(that.tipPerc + ' ' + that.sliderOpt.default.value)
      }).catch(function (error) {
        alert(error)
        console.log(error)
      })
    },
    methods: {
      cancelOrder () {
        let header = {
          headers: {'Authorization': 'Bearer ' + this.token}
        }
        let id = this.fdId
        let that = this
        if (confirm('Are you sure you want to clear the cart?') === true) {
          axios.put(that.config.orderApi + '/v1/users/' + id + '/orders/' + that.$route.query.orderId + '/cancel_order', {}, header)
            .then(function (response) {
              that.$store.replaceState(
                {
                  cart: {
                    total_quantity: 0
                  }
                }
              )
              that.$router.push({path: '/', query: {}})
            })
            .catch(function (error) {
              alert('Sorry, something went wrong, please try again in a bit', error)
            })
        }
      },
      goBack: function () {
        this.$router.go(-1)
      },
      goStripe () {
        let header = {
          headers: {'Authorization': 'Bearer ' + this.token},
          'Content-Type': 'application/json'
        }
        let that = this
        axios.get(that.config.paymentApi + '/v1/users/' + that.fdId + '/stripe_customer' + '?device_id=' + that.$route.query.facebookId + '&mobile=' + that.$route.query.facebookId, header).then(function (response) {
          let customerId = response.data.customer_id
          let lastFour = response.data.last4
          if (customerId === undefined || lastFour === undefined) {
            that.$router.push({
              path: '/stripe',
              query: {
                restId: that.restId,
                totalDue: that.totalDue,
                orderId: that.$route.query.orderId,
                fdId: that.fdId,
                token: that.token,
                facebookId: that.$route.query.facebookId
              }
            })
          } else {
            that.$router.push({
              path: '/saved',
              query: {
                restId: that.restId,
                totalDue: that.totalDue,
                orderId: that.$route.query.orderId,
                fdId: that.fdId,
                token: that.token,
                facebookId: that.$route.query.facebookId,
                cutomerId: customerId,
                lastFour: lastFour
              }
            })
          }
        }).catch(function (error) {
          console.log(JSON.stringify(error))
          if (error.response.status === 404) {
            that.$router.push({
              path: '/stripe',
              query: {
                restId: that.restId,
                totalDue: that.totalDue,
                orderId: that.$route.query.orderId,
                fdId: that.fdId,
                token: that.token,
                facebookId: that.$route.query.facebookId
              }
            })
          } else {
            alert('Sorry, something went wrong, please try again later.')
          }
        })
      }
    },
    components: {
      vueSlider
    }
  }
</script>
<style>
  .vue-slider-dot{
    background: #9B9B9B;
  }
  .tip-tile {
    color: #CB202D;
    font-weight: 200;
  }

  .pm-li-col {
    border-bottom: 1px solid #f4f4f4;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
  }

  .tip-slider {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
  }

  .pay-li-name {
    font-weight: 600;
  }

  .pay-subli-hori {
    width: 100%;
    border-bottom: 1px solid #fafafa;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
  }

  .subli-spec {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .pay-subli {
    width: 100%;
    border-bottom: 1px solid #fafafa;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .each-right {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 30%;
  }

  .each-payment {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #fafafa;
    color: #444;
  }

  .payment-bottom {
    width: 91%;
    padding: 0 4.5% 0 4.5%;

  }

  #pay-rest-name {
    margin-left: 4.5%;
    color: #444;
    font-weight: 600;
  }

  #grey-bg {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    background-size: contain;
  }

  #e-note {
    width: 100%;
    height: 65%;
    word-wrap: break-word;
    margin-top: 2%;
  }

  .pm-val {
    color: #444;
    font-weight: 200;
  }

  .pm-name {
    color: #444;
    font-weight: 600;
  }

  .pm-li {
    border-bottom: 1px solid #f4f4f4;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .pm-top {
    width: 91%;
    margin: 0 4.5% 0 4.5%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .vue-slider-piecewise-dot {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 100%;
    height: 100%;
    display: inline-block;
    /* background-color: rgba(0,0,0,.16); */
    border-radius: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
    transition: all .3s;
  }
</style>
