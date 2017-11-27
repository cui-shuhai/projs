<template>
    <div class="wrapper">
        <div class="top-nav" :style="{height: 0.117 * bodyWidth + 'px'}">
            <div class="back-button"
                 :style="{ backgroundImage: 'url(' + backImgUrl + ')', width: 0.024 * bodyWidth + 'px', height: 0.048 * bodyWidth  + 'px', marginLeft: 0.0453*bodyWidth  + 'px'}"
                 @click="goBack"></div>
            <div :style="{marginLeft: '5%'}">
                Menu
            </div>
            <div class="trans-cart">
                <div class="clear" id="trans"
                     :style="{ backgroundImage: 'url(' + transUrl + ')', width: 0.0453 * bodyWidth + 'px', height: 0.048 * bodyWidth  + 'px'}"
                     @click="trans">
                </div>
                <div class="theCart" @click="goCart"
                     :style="{ backgroundImage: 'url(' + cartUrl + ')', width: 0.053 * bodyWidth + 'px', height: 0.0613 * bodyWidth  + 'px', marginRight: 0.0453*bodyWidth  + 'px'}">
                    <div v-if="cartNum>0" :style="{ top: 0.01 * bodyWidth + 'px', right: 0.02*bodyWidth+ 'px',
                              fontSize: 0.026 * bodyWidth + 'px', padding: 0.00267*bodyWidth + 'px' + ' ' + 0.0106 * bodyWidth + 'px', borderRadius: 0.02*bodyWidth+ 'px'}"
                         id="updateCart" class="cartBadge">
                        {{cartNum}}
                    </div>
                </div>
            </div>
        </div>
        <div class="menu-wrapper" :style="{marginTop: 0.117 * bodyWidth + 'px'}">
            <div class="catalogue" v-if="locale === 'en_US'">
                <scrollactive ref="scrollactive" :offset="offset" :always-track="alwaysTrack" :duration="duration"
                              :click-to-scroll="clickToScroll" :bezier-easing-value="easing">
                    <a v-for="aCat in cataArr" v-bind:key="aCat" class="each-cat scrollactive-item"
                       :href="'#' + aCat.en.substr(0, 10).split(' ').join('-').toLowerCase()"
                       :id="aCat.en.substr(0, 10).split(' ').join('-').toUpperCase()"
                       :style="{ height: 0.16*bodyWidth+ 'px', fontSize: 0.04*bodyWidth+'px'}"
                    >
                        {{aCat.en}}
                    </a>
                    <a class="each-cat" :style="{ height: 0.16*bodyWidth+ 'px'}"></a>
                </scrollactive>
            </div>
            <div v-else class="catalogue">
                <scrollactive ref="scrollactive" :offset="offset" :always-track="alwaysTrack" :duration="duration"
                              :click-to-scroll="clickToScroll" :bezier-easing-value="easing">
                    <a v-for="aCat in cataArr" v-bind:key="aCat" class="each-cat scrollactive-item"
                       :href="'#' + aCat.en.substr(0, 10).split(' ').join('-').toLowerCase()"
                       :id="aCat.en.substr(0, 10).split(' ').join('-').toUpperCase()"
                       :style="{ height: 0.16*bodyWidth+ 'px', fontSize: 0.04*bodyWidth+'px'}"
                    >
                        {{aCat.cn}}
                    </a>
                    <a class="each-cat" :style="{ height: 0.16*bodyWidth+ 'px'}"></a>
                </scrollactive>
            </div>
            <div class="items-wrapper">
                <div class="each-cat-item" v-if="formatCats.length>0" v-for="aCat in formatCats" v-bind:key="aCat"
                     :id="aCat.en.substr(0, 10).split(' ').join('-').toLowerCase()"
                     :style="{ paddingTop: 0.06*bodyWidth+ 'px', fontSize: 0.04*bodyWidth+'px', fontWeight: '600'}">
                    <span v-if="locale === 'en_US'">{{aCat.en}}</span>
                    <span v-else-if="locale === 'zh_CN'">{{aCat.cn}}</span>
                    <div class="each-item" v-for="anItem in posts[aCat.en]" v-bind:key="anItem"
                         :style="{ height: 0.533*bodyWidth+ 'px', marginTop: 0.0453*bodyWidth+ 'px'}">
                        <div class="item-img" v-if="anItem.photos && anItem.photos.length > 0"
                             :style="{ backgroundImage: 'url(' + addS(anItem.photos[0].path) + ')'}"
                             @click="jump(anItem)">
                        </div>
                        <div class="item-img" v-else
                             :style="{ backgroundImage: 'url(' + nullUrl + ')'}"
                             @click="jump(anItem)"
                        >
                        </div>
                        <div v-if="anItem.longNames[0].name.length > (0.072 * bodyWidth) && anItem.longNames[0].locale === locale">
                            <div class="item-name" :style="{ marginTop: 0.0453*bodyWidth+ 'px'}">
                                {{anItem.longNames[0].name.substr(0, Math.floor(0.06 * bodyWidth)) + '...'}}
                            </div>
                        </div>
                        <div v-else-if="anItem.longNames[1].name.length > (0.072 * bodyWidth) && anItem.longNames[0].locale === locale">
                            <div class="item-name" :style="{ marginTop: 0.0453*bodyWidth+ 'px'}">
                                {{anItem.longNames[1].name.substr(0, Math.floor(0.06 * bodyWidth)) + '...'}}
                            </div>
                        </div>
                        <div v-else-if="anItem.longNames[0].locale === locale">
                            <div class="item-name" :style="{ marginTop: 0.0453*bodyWidth+ 'px'}">
                                {{anItem.longNames[0].name}}
                            </div>
                        </div>
                        <div v-else-if="anItem.longNames[1].locale === locale">
                            <div class="item-name" :style="{ marginTop: 0.0453*bodyWidth+ 'px'}">
                                {{anItem.longNames[1].name}}
                            </div>
                        </div>

                        <div class="priceNcart" :style="{ marginTop: 0.0453*bodyWidth+ 'px'}">
                            {{'$' + anItem.BasePrice}}
                            <div class="add-cart"
                                 :style="{ backgroundImage: 'url(' + redCartUrl + ')', width: 0.064 * bodyWidth + 'px', height: 0.064 * bodyWidth  + 'px'}"
                                 @click="toCart(anItem)"
                            >
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style>
    .red-bar {
        width: 5%;
        margin-right: 5%;
        height: 70%;
        background: #CB202D;
    }

    .is-active {
        background: #fff;
        border-left: solid #CB202D;
    }

    .item-name {
        font-weight: 400;
    }

    a {
        text-decoration: none;
    }

    .trans-cart {
        width: 20%;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    .cartBadge {
        background-color: #CB202D;
        color: white;
        position: absolute;
    }

    .add-cart {
        background-repeat: no-repeat;
        background-size: contain;
    }

    .priceNcart {
        color: #CB202D;
        display: flex;
        width: 100%;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    .item-img {
        width: 100%;
        height: 65%;
        background-repeat: no-repeat;
        background-size: cover;
        background-position: center;
    }

    .each-cat-item {
        padding-left: 6.415%;
        padding-right: 6.415%;
        width: 87.16%;
        font-weight: 400;
        color: #333;
    }

    .items-wrapper {
        width: 70.7%;
        background: #fff;
        display: flex;
        flex-direction: column;
        margin-left: 29.3%;
        position: relative;
        -webkit-overflow-scrolling: touch;
    }

    #trans {
        background-repeat: no-repeat;
        background-size: contain;
    }

    .each-cat {
        width: 92%;
        color: #333;
        font-weight: 600;
        word-wrap: break-word;
        text-align: left;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        padding-left: 5%;
    }

    .catalogue {
        width: 29.3%;
        background: #f6f6f6;
        display: flex;
        flex-direction: column;
        position: fixed;
        left: 0;
        overflow-y: scroll;
        height: 100%;
    }

    .active {
        width: 90%;
        color: #CB202D;
        font-weight: 600;
        word-wrap: break-word;
        text-align: left;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        padding-left: 5%;
        padding-right: 5%;
    }

    .menu-wrapper {
        width: 100%;
        display: flex;
        flex-direction: row;
    }

    .theCart {
        background-size: contain;
        background-repeat: no-repeat;
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
        border-bottom: 1px solid #f4f4f4;
        position: fixed;
        background: #fff;
        top: 0;
        z-index: 999;
    }

</style>
<script>
    var windowHeight = window.innerHeight;
    var bodyWidth = window.innerWidth;
    import axios from 'axios';
    import Vue from 'vue'
    import VueAxios from 'vue-axios'
    import config from './config.json'
    Vue.use(VueAxios, axios);
    import scrollactive from 'vue-scrollactive'
    Vue.use(scrollactive);


    export default {
        name: 'RestMenu',
        data() {
            return {
                alwaysTrack: false,
                duration: 600,
                clickToScroll: true,
                offset: 52,
                easing: '.5,0,.35,1',
                scrollPos: 0,
                windowHeight: windowHeight,
                bodyWidth: bodyWidth,
                posts: null,
                restId: null,
                backImgUrl: './assets/images/black_back@2x.png',
                cartUrl: './assets/images/nav_icon_cart_black@2x.png',
                cataArr: [],
                aCat: '',
                itemArr: [],
                anItem: '',
                nullUrl: './assets/images/Fill.png',
                formatCats: [],
                redCartUrl: './assets/images/redcart@2x.png',
                cartArr: [],
                toggleBadge: 'none',
                locale: 'en_US',
                cartNum: this.$store.state.cart.total_quantity,
                enUs: 'flex',
                zhCh: 'none',
                transUrl: './assets/images/chin.png',
                config: config,
            }
        },
        created() {
            this.restId = this.$route.query.restId;
            axios.get(this.config.restApi + "/v1/restaurants/" + this.restId + "/catalogues_menus?menu_type=is_preorder")
                .then(response => {
                    let chineseArr = [];
                    axios.get(this.config.restApi + "/v1/restaurants/" + this.restId + "/catalogues_menus?menu_type=is_preorder&locale=zh_CN")
                        .then(chineseResponse => {
                            chineseArr = Object.keys(chineseResponse.data);
                            this.posts = response.data;
                            this.cataArr = Object.keys(this.posts);
                            let that = this;
                            for (let i = 0; i < this.cataArr.length; i++) {
                                let catKey = this.cataArr[i];
                                let item = this.posts[catKey];
                                this.itemArr.push(item);
                            }
                            let tempArr = [];
                            this.formatCats = [];
                            for(let i = 0; i < this.cataArr.length; i++){
                                let tempObj = {
                                    "en": this.cataArr[i],
                                    "cn": chineseArr[i]
                                };
                                tempArr.push(tempObj);
                                let clone = Object.assign({}, tempObj);
                                that.formatCats.push(clone);
                            }
                            this.cataArr = tempArr;
                            for (let i = 0; i < this.cataArr.length; i++) {
                                if (this.cataArr[i].en.length > 15) {
                                    let temp = that.cataArr[i].en;
                                    let subTemp = temp.substr(0, 15) + '...';
                                    that.cataArr[i].en = subTemp;
                                }
                                if (this.cataArr[i].cn.length > 7) {
                                    let temp = that.cataArr[i].cn;
                                    let subTemp = temp.substr(0, 7) + '...';
                                    that.cataArr[i].cn = subTemp;
                                }
                            }
                            console.log(this.posts);
                            this.dynamicItemsFunction();
                            console.log('CATA IS: ' + this.cataArr);
                        })
                        .catch(e => {
                        });
                    // JSON responses are automatically parsed.
                })
                .catch(e => {
                    // this.errors.push(e)
                });

        },
        computed: {
            cart() {
                return this.$store.state.cart;
            }
        },
        methods: {
            goBack: function () {
                this.$router.go(-1);
            },
            toCart(item){
                let itemId = item._id;
                let picUrl, itemName;
                let restId = this.$route.query.restId;
                if (item.photos && item.photos.length > 0) {
                    let path = item.photos[0].path;
                    if (path.substr(0, 5) === 'http:') {
                        item.photos[0].path = 'https' + path.substr(4);
                    }
                    picUrl = item.photos[0].path;
                }
                else picUrl = './assets/images/Fill.png';
                if (item.longNames[0].locale === this.locale) {
                    itemName = item.longNames[0].name;
                }
                else if (item.longNames[1].locale === this.locale) {
                    itemName = item.longNames[1].name;
                }
                else {
                    itemName = 'no name'
                }
                let price = item.BasePrice;
                let cartLength = Object.keys(this.$store.state.cart).length;
                if (( restId in this.$store.state.cart ) && ( cartLength > 1)) {
                    if (itemId in this.$store.state.cart[restId]) {
                        this.$store.state.cart[restId][itemId].quantity += 1;
                    }
                    else {
                        let cartObj = {
                            [itemId]: {
                                itemId: itemId,
                                quantity: 1,
                                picUrl: picUrl,
                                itemName: itemName,
                                price: price
                            }
                        };
                        Object.assign(this.$store.state.cart[restId], cartObj);
                    }
                    this.$store.state.cart.total_quantity += 1;
                    this.cartNum = this.$store.state.cart.total_quantity;
                }
                else if (!(restId in this.$store.state.cart) && ( cartLength === 1)) {
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
                    };
                    Object.assign(this.$store.state.cart, cartObj);
                    this.$store.state.cart.total_quantity += 1;
                    this.cartNum = this.$store.state.cart.total_quantity;
                }
                else {
                    //console.log(cartLength);
                    // console.log('>: ' + ( restId in this.$store.state.cart )  && ( cartLength >  1));
                    alert('Your cart has items from a different restaurant, clear the cart to continue.');
                }

            },
            logCart(){
                console.log(this.$store.state.cart);
            },
            goCart(){
                this.$router.push({path: '/cart'});
            },
            dynamicItemsFunction() {
                // Add your items
                this.$refs.scrollactive.setScrollactiveItems();
            },
            trans(){
                if (this.locale === 'en_US') {
                    this.locale = 'zh_CN'
                }
                else {
                    this.locale = 'en_US'
                }
            },
            jump: function (anItem) {
                let itemId = anItem._id;
                let itemName = anItem.longNames;
                let itemPic;
                if (anItem.photos && anItem.photos.length > 0) {
                    itemPic = anItem.photos[0].path;
                }
                else itemPic = 'npic';
                let itemPrice = anItem.BasePrice;
                let itemDesc;
                if (anItem.description && anItem.description.length > 0 && anItem.description[0].name !== '' && anItem.description[0].locale === this.locale) {
                    itemDesc = anItem.description[0].name;
                }
                else if (anItem.description && anItem.description.length > 0 && anItem.description[1].name !== '' && anItem.description[1].locale === this.locale){
                    itemDesc = anItem.description[1].name;
                }
                else itemDesc = 'Sorry, no description available at the moment.';
                //console.log(itemId + itemName + itemDesc + itemPrice + itemPic);
                if (itemName[0].locale === this.locale) {
                    itemName = itemName[0].name;
                }
                else if (itemName[1]) {
                    itemName = itemName[1].name;
                }

                this.$router.push({
                    path: '/each_item', query: {
                        itemId: itemId,
                        itemName: itemName,
                        itemDesc: itemDesc,
                        itemPrice: itemPrice,
                        itemPic: itemPic,
                        itemObj: anItem,
                        restId: this.restId,
                        restName: this.$route.query.restName
                    }
                });
            },
            addS(httpString){
                if(httpString.substr(0, 5) === 'http:'){
                    return 'https' + httpString.substr(4);
                }
                else return httpString;
            }
        }
    }
</script>