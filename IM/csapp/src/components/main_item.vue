/* eslint-disable */
<template>
  <div class="wrapper" id="grey-wrap">
    <div class="top-pic-container" :style="{height:windowHeight * 0.3148 + 'px'}">
      <div class="top-bar">
        <div class="back-button"
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
    <div class="info-wrapper"
       :style="{paddingTop: bodyWidth * 0.064 + 'px', paddingBottom: bodyWidth * 0.064 + 'px'}">
      <div class="item-title" :style="{fontSize:bodyWidth * 0.0533 + 'px'}">
        {{itemName}}
      </div>
      <div class="item-price" :style="{fontSize:bodyWidth * 0.048 + 'px', marginTop:bodyWidth * 0.0426 + 'px'}">
        {{'$' + itemPrice}}
      </div>
      <hr id="the-hr" :style="{marginTop:bodyWidth * 0.0533 + 'px'}"/>
      <div class="desc-container" :style="{marginTop:bodyWidth * 0.064 + 'px'}">
        <div class="desc-title">
          {{descWord}}
        </div>
        <div v-if="itemDesc !== ''" class="desc-detail"
           :style="{marginTop:bodyWidth * 0.048 + 'px', fontSize:bodyWidth * 0.04 + 'px'}">
          {{itemDesc}}
        </div>
        <div v-else class="desc-detail"
           :style="{marginTop:bodyWidth * 0.048 + 'px', fontSize:bodyWidth * 0.04 + 'px'}">
          Sorry, no description available at the moment.
        </div>
      </div>
    </div>
    <div class="bottom-grey" :style="{ height: 0.6 * bodyWidth + 'px'}">
      <div class="bottom-logo"
         :style="{ backgroundImage: 'url(' + bottomUrl + ')', width: 0.253*bodyWidth + 'px', height:0.0533 * bodyWidth + 'px' }"></div>
    </div>
    <div class="bottom-bar" :style="{ height: 0.133 * bodyWidth + 'px'}">
      <div class="pre-button" :style="{ fontSize: 0.04 * bodyWidth + 'px'}" @click="toCart">
        ADD TO CART
      </div>
    </div>
  </div>
</template>


<script>
  let bodyWidth = window.innerWidth
  var windowHeight = window.innerHeight
  if (bodyWidth > 800) {
    let viewport = document.querySelector('meta[name=viewport]')
    viewport.setAttribute('content', 'width=414, height=736, initial-scale=1.0, maximum-scale=1.0, user-scalable=0')
  }
  export default {
    name: 'MainItem',
    data () {
      return {
        bottomUrl: './assets/images/blogo.png',
        windowHeight: windowHeight,
        bodyWidth: bodyWidth,
        itemId: '',
        itemName: '',
        itemDesc: '',
        itemPrice: '',
        itemPic: '',
        cartUrl: './assets/images/cart@2x.png',
        overUrl: './assets/images/Rectangle.png',
        backImgUrl: './assets/images/back@2x.png',
        descWord: 'Description',
        cartNum: this.$store.state.cart.total_quantity,
        locale: 'en_US'
      }
    },
    created () {
      this.itemId = this.$route.query.itemId
      this.itemName = this.$route.query.itemName
      this.itemPrice = this.$route.query.itemPrice
      if (this.$route.query.itemPic !== undefined) {
        if (this.$route.query.itemPic === 'npic') {
          this.itemPic = './assets/images/Fill.png'
        } else if (this.$route.query.itemPic.substr(0, 5) === 'http:') {
          this.itemPic = 'https' + this.$route.query.itemPic.substr(4)
        } else this.itemPic = this.$route.query.itemPic
      }
      this.itemDesc = this.$route.query.itemDesc
      console.log('desc: ' + this.itemDesc)
    },
    methods: {
      goBack: function () {
        this.$router.go(-1)
      },
      logCart () {
        console.log(this.$store.state.cart)
      },
      goCart () {
        this.$router.push({path: '/cart'})
      },
      toCart () {
        let item = this.$route.query.itemObj
        let itemId = item._id
        let picUrl, itemName
        let restId = this.$route.query.restId
        if (item.photos && item.photos.length > 0) {
          if (item.photos[0].path.substr(0, 5) === 'http:') {
            picUrl = 'https' + item.photos[0].path.substr(4)
          } else picUrl = item.photos[0].path
        } else picUrl = './assets/images/Fill.png'
        if (item.longNames[0].locale === this.locale) {
          itemName = item.longNames[0].name
        } else if (item.longNames[1].locale === this.locale) {
          itemName = item.longNames[1].name
        } else {
          itemName = 'no name'
        }
        let price = item.BasePrice
        let cartLength = Object.keys(this.$store.state.cart).length
        if ((restId in this.$store.state.cart) && (cartLength > 1)) {
          if (itemId in this.$store.state.cart[restId]) {
            this.$store.state.cart[restId][itemId].quantity += 1
          } else {
            let cartObj = {
              [itemId]: {
                itemId: itemId,
                quantity: 1,
                picUrl: picUrl,
                itemName: itemName,
                price: price
              }
            }
            Object.assign(this.$store.state.cart[restId], cartObj)
          }
          this.$store.state.cart.total_quantity += 1
          this.cartNum = this.$store.state.cart.total_quantity
        } else if (!(restId in this.$store.state.cart) && (cartLength === 1)) {
          let cartObj = {
            [restId]: {
              [itemId]: {
                itemId: itemId,
                quantity: 1,
                picUrl: picUrl,
                itemName: itemName,
                price: price
              }
            },
            restName: this.$route.query.restName
          }
          Object.assign(this.$store.state.cart, cartObj)
          this.$store.state.cart.total_quantity += 1
          this.cartNum = this.$store.state.cart.total_quantity
        } else {
          // console.log(cartLength)
          // console.log('>: ' + ( restId in this.$store.state.cart ) && ( cartLength > 1))
          alert('Your cart has items from a different restaurant, clear the cart to continue.')
        }
      }
    }
  }
</script>
<style>
  .cartBadge {
    background-color: #CB202D;
    color: white;
    position: absolute;
  }
  .pre-button {
    background: #cb202d;
    width: 50%;
    height: 100%;
    color: #fff;
    font-weight: 600;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .bottom-bar {
    background: #fff;
    width: 100%;
    border-top: 1px solid #d8d8d8;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    position: fixed;
    bottom: 0;
    z-index: 1;
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

  .desc-detail {
    color: #666;
    font-weight: 200;
  }

  .desc-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  .desc-title {
    font-weight: 600;
    color: #333;
  }

  #the-hr {
    border: none;
    height: 1px;
    background-color: #f1f1f1;
  }

  .item-price {
    font-weight: 600;
    color: #CB202D;
  }

  .item-title {
    font-weight: 600;
    color: #333;

  }

  .info-wrapper {
    width: 87.2%;
    padding-left: 6.4%;
    padding-right: 6.4%;
    height: auto;
  }

  .top-bar {
    width: 100%;
    height: 8%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    position: fixed;
    z-index: 2;
    top: 0;
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

  .top-pic-overlay {
    width: 100%;
    position: absolute;
    z-index: 1;
  }

</style>
/* eslint-enable */
