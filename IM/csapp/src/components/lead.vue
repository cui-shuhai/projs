/* eslint-disable */
<template>
  <div class="wrapper">
    <div class="header">
      <div id="search-container" @click="showSearch()">
        <img id='search-img' :src="searchUrl"/>
      </div>
      <div id="logo-container">
        <img id='logo-img' :src="logoUrl"/>
      </div>      
    </div>
    <div id='main-items' class="items-list">
      <ul v-if="posts && posts.length" style="list-style-type: none; padding:0">
        <li class='each-main_item' v-for="post in posts" v-bind:key="post" :id="post._id">
          <div id="wine-large" v-if="post.isButton === true" @click="showItem(post._id)" :style="{ backgroundImage: 'url(' + wineImg + ')'}">

          </div>
          <div class="merchant-detail" :style="{height:windowHeight * 0.4047976 + 'px'}"
             @click="jump('/main_item', post._id)">
            <div class="main_item-img-container" :style="{height:windowHeight * 0.3148 + 'px'}"
               v-if="post.photos && post.photos.length > 0">
              <img class="main_item-img" :src="post.photos[0].path"/>
            </div>
            <div class="main_item-img-container" :style="{height:windowHeight * 0.3148 + 'px'}"
               v-else>
              <img class="main_item-img" :src="nullUrl"/>
            </div>
            <div class="more-detail" :style="{height:windowHeight * 0.089 + 'px'}">
              <p class="res-name">{{post.longNames[0].name}}</p>
            </div>
            <div class="gray-bar" :style="{height:windowHeight * 0.016 + 'px'}">
            </div>
          </div>
        </li>
      </ul>
    </div>  
    <div class="footer">
      <div class="button-container" id="home" @click="jumpTwo('/')">
        <img class="button-icon" :src="promotionUrl"/>
        <p style="margin:0" :style="{color: restText}">Special Offers</p>
      </div>
      <div class="button-container" id="home" @click="jumpTwo('/')">
        <img class="button-icon" :src="merchantsUrl"/>
        <p style="margin:0" :style="{color: restText}">Other Shops</p>
      </div>
      <div class="button-container" id="home" @click="jumpTwo('/')">
        <img class="button-icon" :src="merchantRegisterUrl"/>
        <p style="margin:0" :style="{color: restText}">Merchant Register</p>
      </div>
      <div class="button-container" id="orders" @click="jumpTwo('/order')">
        <img class="button-icon" :src="orderUrl"/>
        <p style="margin:0" :style="{color: orderText}">Orders</p>
      </div>
    </div>
    <modal name="searchModal" width="100%" height="100%">
      <div id="searchModal">
        <div class="header">
          <input autofocus type="search"
              v-model="searchMsg"
              placeholder="Search ..."
              @blur="$modal.hide('searchModal')"
              @change="getSearchItems(searchMsg)"/>
        </div>
        <div class="searchList">
          <ul v-if="searchItems.length" style="list-style-type: none; padding:0">
            <li v-for="item in searchItems" v-bind:key="item">
              <div class='searchItem' @click="getSearchItems(item)">{{item}}</div>
            </li>
          </ul>
        </div>
      </div>
    </modal>
  </div>
</template>
<script>
  import Vue from 'vue'
  import VModal from 'vue-js-modal'
  import axios from 'axios'
  import VueAxios from 'vue-axios'
  import config from './config.json'
  let windowHeight = window.innerHeight
  let titleFontSize = 0.0426 * window.innerWidth
  let bodyWidth = window.innerWidth
  Vue.use(VModal)
  Vue.use(VueAxios, axios)
  if (bodyWidth > 800) {
    let viewport = document.querySelector('meta[name=viewport]')
    viewport.setAttribute('content', 'width=414, height=736, initial-scale=1.0, maximum-scale=1.0, user-scalable=0')
  }

  export default {
    name: 'Lead',
    data () {
      return {
        wineImg: './assets/images/wine-large.png',
        searchItems: [],
        searchFlag: false,
        pivotY: 1,
        downLoadUrl: null,
        searchUrl: './assets/images/shape@3x.png',
        logoUrl: './assets/images/logo@3x.png',
        cartUrl: './assets/images/nav_icon_cart_black@2x.png',
        nullUrl: './assets/images/Fill.png',
        postData: [],
        posts: [],
        post: {},
        imgPaths: [],
        searchMsg: '',
        bodyWidth: bodyWidth,
        windowHeight: windowHeight,
        titleFontSize: titleFontSize,
        selectedPath: '/',
        promotionUrl: './assets/images/tab_icon_home_selected.png',
        merchantsUrl: './assets/images/tab_icon_home_selected.png',
        merchantRegisterUrl: './assets/images/tab_icon_home_selected.png',
        orderUrl: './assets/images/tab_icon_order.png',
        restText: '#CB202D',
        orderText: '#444',
        cartNum: 12,
        lat: 49.2846797,
        lon: -123.1118038,
        config: config
      }
    },
    watch: {
      searchFlag: function () {
        this.getSearchItems()
      }
    },
    created () {
      let os = this.getOs()
      this.getSearchItems()
      if (os === 'Mac OS' || os === 'iOS') {
        this.downLoadUrl = 'https://localhost'
      } else {
        this.downLoadUrl = 'https://play.google.com/store/apps/details?id=fandine.consumer.na&hl=en'
      }
      // this.$modal.hide('searchModal')
    },
    beforeCreate () {
      let self = this
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
          self.lat = position.coords.latitude
          self.lon = position.coords.longitude
          self.searchFlag = !self.searchFlag
        }, function () {
          self.searchFlag = !self.searchFlag
        })
      } else {
        self.searchFlag = !self.searchFlag
      }
    },
    methods: {
      showSearch () {
        this.$modal.show('searchModal')
      },
      showItem (itemId) {
        this.$router.push({path: 'main_item', query: {itemId: itemId}})
      },
      getOs () {
        let userAgent = window.navigator.userAgent
        let platform = window.navigator.platform
        let macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K']
        let windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE']
        let iosPlatforms = ['iPhone', 'iPad', 'iPod']
        let os = null

        if (macosPlatforms.indexOf(platform) !== -1) {
          os = 'Mac OS'
        } else if (iosPlatforms.indexOf(platform) !== -1) {
          os = 'iOS'
        } else if (windowsPlatforms.indexOf(platform) !== -1) {
          os = 'Windows'
        } else if (/Android/.test(userAgent)) {
          os = 'Android'
        } else if (!os && /Linux/.test(platform)) {
          os = 'Linux'
        }
        return os
      },
      listRestaurants () {
      },
      jumpTwo (p) {
        this.$router.push({path: p, query: {}})
      },
      jump (e, id, dist) {
        this.$router.push({path: '/main_item', query: {itemId: id}})
        this.selectedPath = e
        console.log(id)
      },
      toCart () {
        console.log('to cart is good')
      },
      getParams () {
        return this.$route.params
      },
      getSearchItems (keyword) {
        /*
        let urlParams = new URLSearchParams('page_size=100&order_type=PREORDER&item_type=all')
        let restUrl = this.config.restApi + '/v1/man_items?' + urlParams.toString()
        axios.get(restUrl)
          .then((response) => {
            this.posts = response.data
            for (let i = 0; i < this.posts.length; i++) {
              let post = this.posts[i]
              post.isButton = (i === 2)
              if (post.photos) {
                if (post.photos.length > 0) {
                  let path = post.photos[0].path
                  if (path.substr(0, 5) === 'http:') {
                    this.posts[i].photos[0].path = 'https' + path.substr(4)
                  }
                }
              }
            }
          })
          .catch((e) => {
            // this.errors.push(e)
            console.log(e)
          })
          */

        this.posts = [
          {
            photos: [
              {path: 'xxxx'}
            ],
            longNames: [
              {name: 'item1' + this.$store.state.cart.total_quantity}
            ]
          },
          {
            photos: [
              {path: 'xxxx'}
            ],
            longNames: [
              {name: 'item2' + this.$store.state.cart.total_quantity}
            ]
          },
          {
            photos: [
              {path: 'xxxx'}
            ],
            longNames: [
              {name: 'item3'}
            ]
          }
        ]
        this.$modal.hide('searchModal')
      },
      logCart () {
        console.log('logCart')
      },
      goCart () {
        this.$router.push({path: '/cart'})
      }
    }
  }
</script>
<style>
  #wine-large{
    width: 100%;
    height: 38.33vw;
    background-size:contain;
    background-repeat: no-repeat;
    margin-bottom: 3vw;
  }
  .cartBadge {
    background-color: #CB202D;
    color: white;
    position: absolute;
  }

  .footer {
    width: 100%;
    max-width:800px !important;
    height: 50px;
    background: #fff;
    display: flex;
    position: fixed;
    bottom: 0;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    border-top: 1px solid #f4f4f4;
  }

  .button-container {
    width: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-top: 2px;
  }

  .button-icon {
    width: 15px;
  }

  #home {
    font-size: 10px;
    color: #CB202D;
  }

  #orders {
    font-size: 10px;
    color: #444;
  }

  .gray-bar {
    width: 100%;
    background-color: #f9f9f9;
  }

  .res-name {
    font-weight: 600;
    margin-left: 17px;
    font-size: 16px;
    color: #333;
    margin-bottom: 0;
  }

  body {
    max-width:800px !important;
  }

  .more-detail {
    width: 100%;
  }

  .main_item-img-container {
    display: flex;
    width: 100%;
  }

  .main_item-img {
    object-fit: cover;
    width: 100%;
  }

  .each-main_item {
    font-size: 50px;
    color: black;
  }

  .merchant-detail {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  body {
    margin: 0;
  }

  .header {
    width: 100%;
    height: 50px;
    border-bottom: 1px solid #f4f4f4;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    position: fixed;
    z-index: 100;
    background: #fff;
    top: 0;
    max-width:800px !important;
  }

  #logo-img {
    width: 80px;
  }

  #logo-container {
    margin-left: 0;
  }

  #search-img {
    width: 20px;
    margin-left: 17px;
  }

  #cart-img {
    width: 20px;
    margin-right: 17px;
  }

  .items-list {
    margin-top: 51px;
    padding-bottom: 10%;
  }

  .searchList {
    margin-top: 51px;
    padding-bottom: 10%;
  }
  .searchItem {
    font-size: 14px;
    height: 52px;
    line-height: 52px;
    overflow:hidden;
    color: #333333;
    background: #ffffff;
    padding-left: 10%;
  }
  #searchModal{
    background: #f0f0f0;
    width: 100%;
    height: 100%;
  }
  input[type=search] {
    color: #999999;
    font-size: 16px;
    display: block;
    height:100%;
    padding-left: 10%;
    padding-right: 10%;
    width: 100%;
    background: #ffffff;
    border: 0;
    border-radius: 0;
    -webkit-appearance: none;
  }
</style>
/* eslint-enable */
