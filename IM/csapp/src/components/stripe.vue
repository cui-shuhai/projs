<template>
  <div class="wrapper">
    <div class="top-nav" :style="{height: 0.117 * bodyWidth + 'px'}">
      <div class="back-button"
         :style="{ backgroundImage: 'url(' + backImgUrl + ')', width: 0.024 * bodyWidth + 'px', height: 0.048 * bodyWidth + 'px', marginLeft: 0.0453*bodyWidth + 'px'}"
         @click="goBack"></div>
      <div id="stripe-title">
        Payment Information
      </div>
    </div>
    <div class="confirm-note">
      By clicking "CONFIRM", you authorize FanDine to deduct payment after you enjoy your pre-order meal.
    </div>
    <div class="form-wrapper" :style="{marginTop: 0.117 * bodyWidth + 'px'}">
      <div class="st-grey-bar"></div>
      <form id="stripe-form">
        <label>
          <span id="card-number">Card Number</span>
          <div id="card-number-element" class="field"></div>
        </label>
        <div class="st-grey-bar"></div>
        <label>
          <span id="card-expiry">Card Expiry</span>
          <div id="card-expiry-element" class="field"></div>
        </label>
        <div class="st-grey-bar"></div>
        <label>
          <span id="card-cvc">Security Code</span>
          <div id="card-cvc-element" class="field"></div>
        </label>
        <div class="outcome">
          <div class="error" role="alert"></div>
          <div class="success">
            Success! Please wait...
          </div>
          <div class="error">
            Error
          </div>
        </div>

      </form>
    </div>
    <bounce-loader :loading="isLoading" :color="spinnerColor"
            :style="{position: 'fixed', marginLeft: '42%', top: '40%'}"></bounce-loader>
    <div class="st-grey-bar-big" :style="{height: 0.4 * windowHeight + 'px'}">
      <div class="save-slider-container">
        <div>Save Card</div>
        <label class="switch">
          <input id="check-save" type="checkbox" checked/>
          <span class="slider round"></span>
        </label>
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
      <div class="pre-button" @click="" :style="{display:'flex', justifyContent: 'center'}">
        <button form="stripe-form" type="submit" id="st-pay" :style="{ fontSize: 0.04*bodyWidth + 'px'}"
            @click="showLoad()"><p :style="{marginLeft:'40%'}">CONFIRM</p>
        </button>
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

  Vue.use(VueAxios, axios)
  var windowHeight = window.innerHeight
  var bodyWidth = window.innerWidth

  export default {
    name: 'Stripe',
    mounted () {
      let script = document.createElement('script')
      script.src = 'https://js.stripe.com/v3/'
      script.onload = () => {
        console.log('Stripe Script loaded and ready')
        this.configStripe()
      }
      document.body.appendChild(script)
    },
    data () {
      return {
        windowHeight: windowHeight,
        bodyWidth: bodyWidth,
        complete: false,
        stripekey: config.stripekey,
        backImgUrl: './assets/images/black_back@2x.png',
        totalDue: null,
        token: this.$route.query.token,
        fdId: this.$route.query.fdId,
        config: config,
        isLoading: false,
        spinnerColor: '##EF727F'
      }
    },
    created () {
      this.totalDue = this.$route.query.totalDue
    },
    methods: {
      submitOrder (stripeToken) {
        var header = {
          headers: {'Authorization': 'Bearer ' + this.token}
        }
        let userId = this.fdId
        let that = this
        let isSaveCard = document.getElementById('check-save').checked
        if (isSaveCard) {
          axios.post(that.config.paymentApi + '/v1/users/' + userId + '/stripe_customer', {
            stripe_token: stripeToken,
            device_id: that.$route.query.facebookId,
            mobile: that.$route.query.facebookId
          }, header)
            .then(function (response) {
              axios.post(that.config.paymentApi + '/v1/users/' + userId + '/accept_preauth_clauses', {
                'restaurant_id': that.$route.query.restId,
                'order_id': that.$route.query.orderId,
                'use_stripe_customer': true,
                'device_id': that.$route.query.facebookId,
                'mobile': that.$route.query.facebookId
              }, header)
                .then(function (response) {
                  that.clearCart()
                  that.$router.push({
                    path: '/receipt',
                    query: {
                      orderId: that.$route.query.orderId,
                      fdId: that.fdId,
                      token: that.token
                    }
                  })
                  console.log(JSON.stringify(response))
                }).catch(function (error) {
                  that.isLoading = false
                  console.log(error)
                })
            }).catch(function (error) {
              that.isLoading = false
              console.log(error)
            })
        } else {
          axios.post(that.config.paymentApi + '/v1/users/' + userId + '/accept_preauth_clauses', {
            'restaurant_id': that.$route.query.restId,
            'order_id': that.$route.query.orderId,
            'stripe_token': stripeToken,
            'save_stripe_customer': isSaveCard,
            'use_stripe_customer': false,
            'device_id': that.$route.query.facebookId,
            'mobile': that.$route.query.facebookId
//          restaurant_id: that.$route.query.restId,
//          order_id: that.$route.query.orderId,
//          stripe_token: token
          }, header)
            .then(function (response) {
              that.clearCart()
              that.$router.push({
                path: '/receipt',
                query: {
                  orderId: that.$route.query.orderId,
                  fdId: that.fdId,
                  token: that.token
                }
              })
              console.log(JSON.stringify(response))
            }).catch(function (error) {
//            let errorElement = document.querySelector('.error')
//            errorElement.textContent = error.response.data.messages.en
//            errorElement.classList.add('visible')
              that.isLoading = false
              console.log(error)
            })
        }
      },
      configStripe () {
        // eslint-disable-next-line
        var stripe = Stripe(this.config.stripekey)
        var elements = stripe.elements()
        var fontSizeNum = 0.037 * this.bodyWidth
        var fontSize = fontSizeNum.toString() + 'px'
        var cardNumber = elements.create('cardNumber', {
          style: {
            base: {
              iconColor: '#CB212D',
              color: '#999',
              lineHeight: '60px',
              fontWeight: 400,
              fontFamily: '"Helvetica Neue", "Helvetica", sans-serif',
              fontSize: fontSize,
              textAlign: 'right',
              '::placeholder': {
                color: '#CFD7DF'
              }
            }
          }
        })
        cardNumber.mount('#card-number-element')

        var cardExpiry = elements.create('cardExpiry', {
          style: {
            base: {
              iconColor: '#CB212D',
              color: '#999',
              lineHeight: '60px',
              fontWeight: 400,
              textAlign: 'right',
              fontFamily: '"Helvetica Neue", "Helvetica", sans-serif',
              fontSize: fontSize,
              '::placeholder': {
                color: '#CFD7DF'
              }
            }
          }
        })
        cardExpiry.mount('#card-expiry-element')

        var cardCvc = elements.create('cardCvc', {
          style: {
            base: {
              iconColor: '#CB212D',
              color: '#999',
              lineHeight: '60px',
              fontWeight: 400,
              textAlign: 'right',
              fontFamily: '"Helvetica Neue", "Helvetica", sans-serif',
              fontSize: fontSize,
              '::placeholder': {
                color: '#CFD7DF'
              }
            }
          }
        })
        cardCvc.mount('#card-cvc-element')
        let that = this

        function setOutcome (result) {
          var successElement = document.querySelector('.success')
          var errorElement = document.querySelector('.error')
          successElement.classList.remove('visible')
          errorElement.classList.remove('visible')
          if (result.token) {
            // alert(JSON.stringify(result.token))
            that.submitOrder(result.token.id)
            that.isLoading = true
          } else if (result.error) {
            errorElement.textContent = result.error.message
            errorElement.classList.add('visible')
            // $('.error').text(result.error)
          }
        }

        cardNumber.on('change', function (event) {
          setOutcome(event)
        })
        cardCvc.on('change', function (event) {
          setOutcome(event)
        })
        cardExpiry.on('change', function (event) {
          setOutcome(event)
        })
        document.querySelector('form').addEventListener('submit', function (e) {
          e.preventDefault()
          var form = document.querySelector('form')
          var extraDetails = {}
          console.log(form)
          stripe.createToken(cardNumber, extraDetails).then(setOutcome)
        })
      },
      goBack: function () {
        this.$router.go(-1)
      },
      clearCart () {
        this.$store.replaceState(
          {
            cart: {
              total_quantity: 0
            }
          }
        )
      },
      showLoad () {
        this.isLoading = true
      }

    },
    components: {
      BounceLoader
    }
  }
</script>
<style scoped>
  /* The switch - the box around the slider */
  .switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 34px;
    padding: 0;
    border: none;
    margin: 0 4.5%;
  }

  /* Hide default HTML checkbox */
  .switch input {
    display: none;
  }

  /* The slider */
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: .4s;
    transition: .4s;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    -webkit-transition: .4s;
    transition: .4s;
  }

  input:checked + .slider {
    background-color: #79A2D1;
  }

  input:focus + .slider {
    box-shadow: 0 0 1px #79A2D1;
  }

  input:checked + .slider:before {
    -webkit-transform: translateX(26px);
    -ms-transform: translateX(26px);
    transform: translateX(26px);
  }

  /* Rounded sliders */
  .slider.round {
    border-radius: 34px;
  }

  .slider.round:before {
    border-radius: 50%;
  }

  .save-slider-container {
    width: 100%;
    height: 60px;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    color: #999;
    font-size: 16px;
  }

  #stripe-title {
    margin-right: 30%;
  }

  #st-pay {
    width: 100%;
    height: 100%;
    color: #fff;
    font-weight: 600;
    display: flex;
    align-items: center;
    padding: 0;
    border: none;
    background: none;
  }

  .st-grey-bar-big {
    width: 100%;
    background: #fafafa;
  }

  .st-grey-bar {
    width: 100%;
    height: 20px;
    background: #fafafa;
  }

  body {
    background: #fafafa;
  }

  label {
    position: relative;
    color: #444;
    font-weight: 400;
    height: 60px;
    line-height: 60px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    padding: 0 4.5%;
    border-top: 1px solid #ececec;
    border-bottom: 1px solid #ececec;
  }

  .field {
    background: white;
    font-weight: 400;
    color: #999;
    outline: none;
    height: 60px;
    line-height: 60px;
    cursor: text;
    width: 50%;
    border-top: 1px solid #ecececec;
    border-bottom: 1px solid #ecececec;
  }

  .field::-webkit-input-placeholder {
    color: #CFD7DF;
  }

  .field::-moz-placeholder {
    color: #CFD7DF;
  }

  .field:-ms-input-placeholder {
    color: #CFD7DF;
  }

  .outcome {
    float: left;
    width: 100%;
    padding-top: 8px;
    min-height: 20px;
    text-align: center;
  }

  .success, .error {
    display: none;
    font-size: 13px;
  }

  .success.visible, .error.visible {
    display: inline;
  }

  .error {
    color: #E4584C;
  }

  .success {
    color: #F8B563;
  }

  .success .token {
    font-weight: 500;
    font-size: 13px;
  }
  .confirm-note {
    margin: 15vw 4vw 0 4vw;
    color: #89511E;
    background: #FEFCE3;
    font-size: 4vw;
  }

</style>
