/* eslint-disable */
<template>
  <div id="main" class="wrapper">
    <div class="header">
      <div id="search-container" @click="showSearch()">
        <img id='search-img' :src="searchUrl"/>
      </div>
      <div id="logo-container">
        <img id='logo-img' :src="logoUrl"/>
      </div>
      <div id="cart-container" @click="goCart">
        <img id="cart-img" :src="cartUrl"/>
        <div v-if="cartNum>0" :style="{ top: 0.025 * bodyWidth + 'px', right: 0.02*bodyWidth+ 'px',
               fontSize: 0.026 * bodyWidth + 'px', padding: 0.00267*bodyWidth + 'px' + ' ' + 0.0106 * bodyWidth + 'px', borderRadius: 0.02*bodyWidth+ 'px',
      }" class="cartBadge">
          {{cartNum}}
        </div>
      </div>
    </div>
    <div class="res-list">
      <ul v-if="posts && posts.length" style="list-style-type: none; padding:0">
        <li class='each-rest' v-for="post in posts" v-bind:key="post" :id="post._id">
          <div id="wine-large" v-if="post.isButton === true" @click="show()" :style="{ backgroundImage: 'url(' + wineImg + ')'}">

          </div>
          <div class="rest-detail" :style="{height:windowHeight * 0.4047976 + 'px'}"
             @click="jump('/restaurant_info', post._id, post.distance)">
            <div class="res-img-container" :style="{height:windowHeight * 0.3148 + 'px'}"
               v-if="post.photos && post.photos.length > 0">
              <img class="res-img" :src="post.photos[0].path"/>
            </div>
            <div class="res-img-container" :style="{height:windowHeight * 0.3148 + 'px'}"
               v-else>
              <img class="res-img" :src="nullUrl"/>
            </div>
            <div class="more-detail" :style="{height:windowHeight * 0.089 + 'px'}">
              <p class="res-name">{{post.longNames[0].name}}</p>
              <p class="sub-detail">{{(post.distance / 1000).toFixed(1) + ' ' + 'km'}}</p>
            </div>
            <div class="gray-bar" :style="{height:windowHeight * 0.016 + 'px'}">
            </div>
          </div>
        </li>
      </ul>
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
      <a :href="downLoadUrl" class="nav-web" id="down-load">
        <div>
          Download the App
        </div>
      </a>
    </modal>
    <modal name="searchModal" width="100%" height="100%">
      <div id="searchModal">
        <div class="header">
          <input autofocus type="search"
              v-model="searchMsg"
              placeholder="Search Restaurants"
              @blur="$modal.hide('searchModal')"
              @change="getNearbyRestaurants()"/>
        </div>
        <div class="searchList">
          <ul v-if="searchItems.length" style="list-style-type: none; padding:0">
            <li v-for="item in searchItems" v-bind:key="item">
              <div class='searchItem' @click="getNearbyRestaurants(item)">{{item}}</div>

            </li>
          </ul>
        </div>
      </div>
    </modal>
  </div>
</template>
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

  .sub-detail {
    font-weight: 400;
    margin-left: 17px;
    margin-top: 2px;
    font-size: 11px;
    color: #999;

  }

  body {
    max-width:800px !important;
  }

  .more-detail {
    width: 100%;
  }

  .res-img-container {
    display: flex;
    width: 100%;
  }

  .res-img {
    object-fit: cover;
    width: 100%;
  }

  .each-rest {
    font-size: 50px;
    color: black;
  }

  .rest-detail {
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

  .res-list {
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
<script>
  import Vue from 'vue'
  import axios from 'axios'
  import VueAxios from 'vue-axios'
  import config from './config.json'
  let windowHeight = window.innerHeight
  let titleFontSize = 0.0426 * window.innerWidth
  let bodyWidth = window.innerWidth
  Vue.use(VueAxios, axios)
  if (bodyWidth > 800) {
    let viewport = document.querySelector('meta[name=viewport]')
    viewport.setAttribute('content', 'width=414, height=736, initial-scale=1.0, maximum-scale=1.0, user-scalable=0')
  }
  export default {
    name: 'main',
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
        restUrl: './assets/images/tab_icon_home_selected.png',
        orderUrl: './assets/images/tab_icon_order.png',
        restText: '#CB202D',
        orderText: '#444',
        cartNum: this.$store.state.cart.total_quantity,
        lat: 49.2846797,
        lon: -123.1118038,
        config: config
      }
    },
    watch: {
      searchFlag: function () {
        this.getNearbyRestaurants()
      }
    },
    created () {
      let os = this.getOs()
      this.getNearbyRestaurants()
      if (os === 'Mac OS' || os === 'iOS') {
        this.downLoadUrl = 'https://itunes.apple.com/ca/app/fandine/id952824896'
      } else {
        this.downLoadUrl = 'https://play.google.com/store/apps/details?id=fandine.consumer.na&hl=en'
      }
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
      show () {
        this.$modal.show('more-rewards')
      },
      hide () {
        this.$modal.hide('more-rewards')
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
        this.$router.push({path: '/restaurant_info', query: {restId: id, dist: dist}})
        this.selectedPath = e
        console.log(id)
      },
      toCart () {
        console.log('to cart is good')
      },
      getParams () {
        return this.$route.params
      },
      getNearbyRestaurants (keyword) {
        let urlParams = new URLSearchParams('distance=40000&from=1&page_size=100&order_type=PREORDER&restaurant_type=all')
        urlParams.set('lat', this.lat)
        urlParams.set('lon', this.lon)
        if (keyword && keyword.length) {
          urlParams.set('keyword', keyword)
        } else if (this.searchMsg.length) {
          urlParams.set('keyword', this.searchMsg)
          if (this.searchItems.indexOf(this.searchMsg) === -1) {
            this.searchItems.push(this.searchMsg)
          }
//          this.searchMsg = ''
        }
        axios.get(this.config.restApi + '/v3/nearby_restaurants?' + urlParams.toString())
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
            this.$modal.hide('searchModal')
          })
          .catch((e) => {
            // this.errors.push(e)
          })
      },
      logCart () {
        console.log(this.$store.state.cart)
      },
      goCart () {
        this.$router.push({path: '/cart'})
      }
    }
  }
</script>
/* eslint-enable */
