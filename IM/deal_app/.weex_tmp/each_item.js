// { "framework": "Vue" }
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var App = __webpack_require__(13);
	App.el = '#root';
	new Vue(App);

/***/ }),
/* 1 */,
/* 2 */
/***/ (function(module, exports) {

	/* globals __VUE_SSR_CONTEXT__ */

	// this module is a runtime utility for cleaner component module output and will
	// be included in the final webpack user bundle

	module.exports = function normalizeComponent (
	  rawScriptExports,
	  compiledTemplate,
	  injectStyles,
	  scopeId,
	  moduleIdentifier /* server only */
	) {
	  var esModule
	  var scriptExports = rawScriptExports = rawScriptExports || {}

	  // ES6 modules interop
	  var type = typeof rawScriptExports.default
	  if (type === 'object' || type === 'function') {
	    esModule = rawScriptExports
	    scriptExports = rawScriptExports.default
	  }

	  // Vue.extend constructor export interop
	  var options = typeof scriptExports === 'function'
	    ? scriptExports.options
	    : scriptExports

	  // render functions
	  if (compiledTemplate) {
	    options.render = compiledTemplate.render
	    options.staticRenderFns = compiledTemplate.staticRenderFns
	  }

	  // scopedId
	  if (scopeId) {
	    options._scopeId = scopeId
	  }

	  var hook
	  if (moduleIdentifier) { // server build
	    hook = function (context) {
	      // 2.3 injection
	      context =
	        context || // cached call
	        (this.$vnode && this.$vnode.ssrContext) || // stateful
	        (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext) // functional
	      // 2.2 with runInNewContext: true
	      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
	        context = __VUE_SSR_CONTEXT__
	      }
	      // inject component styles
	      if (injectStyles) {
	        injectStyles.call(this, context)
	      }
	      // register component module identifier for async chunk inferrence
	      if (context && context._registeredComponents) {
	        context._registeredComponents.add(moduleIdentifier)
	      }
	    }
	    // used by ssr in case component is cached and beforeCreate
	    // never gets called
	    options._ssrRegister = hook
	  } else if (injectStyles) {
	    hook = injectStyles
	  }

	  if (hook) {
	    var functional = options.functional
	    var existing = functional
	      ? options.render
	      : options.beforeCreate
	    if (!functional) {
	      // inject component registration as beforeCreate hook
	      options.beforeCreate = existing
	        ? [].concat(existing, hook)
	        : [hook]
	    } else {
	      // register for functioal component in vue file
	      options.render = function renderWithStyleInjection (h, context) {
	        hook.call(context)
	        return existing(h, context)
	      }
	    }
	  }

	  return {
	    esModule: esModule,
	    exports: scriptExports,
	    options: options
	  }
	}


/***/ }),
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */
/***/ (function(module, exports) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	// css base code, injected by the css-loader
	module.exports = function() {
		var list = [];

		// return the list of modules as css string
		list.toString = function toString() {
			var result = [];
			for(var i = 0; i < this.length; i++) {
				var item = this[i];
				if(item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};

		// import a list of modules into the list
		list.i = function(modules, mediaQuery) {
			if(typeof modules === "string")
				modules = [[null, modules, ""]];
			var alreadyImportedModules = {};
			for(var i = 0; i < this.length; i++) {
				var id = this[i][0];
				if(typeof id === "number")
					alreadyImportedModules[id] = true;
			}
			for(i = 0; i < modules.length; i++) {
				var item = modules[i];
				// skip already imported module
				// this implementation is not 100% perfect for weird media query combinations
				//  when a module is imported multiple times with different media queries.
				//  I hope this will never occur (Hey this way we have smaller bundles)
				if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
					if(mediaQuery && !item[2]) {
						item[2] = mediaQuery;
					} else if(mediaQuery) {
						item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
					}
					list.push(item);
				}
			}
		};
		return list;
	};


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

	/*
	  MIT License http://www.opensource.org/licenses/mit-license.php
	  Author Tobias Koppers @sokra
	  Modified by Evan You @yyx990803
	*/

	var hasDocument = typeof document !== 'undefined'

	if (false) {
	  if (!hasDocument) {
	    throw new Error(
	    'vue-style-loader cannot be used in a non-browser environment. ' +
	    "Use { target: 'node' } in your Webpack config to indicate a server-rendering environment."
	  ) }
	}

	var listToStyles = __webpack_require__(10)

	/*
	type StyleObject = {
	  id: number;
	  parts: Array<StyleObjectPart>
	}

	type StyleObjectPart = {
	  css: string;
	  media: string;
	  sourceMap: ?string
	}
	*/

	var stylesInDom = {/*
	  [id: number]: {
	    id: number,
	    refs: number,
	    parts: Array<(obj?: StyleObjectPart) => void>
	  }
	*/}

	var head = hasDocument && (document.head || document.getElementsByTagName('head')[0])
	var singletonElement = null
	var singletonCounter = 0
	var isProduction = false
	var noop = function () {}

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	var isOldIE = typeof navigator !== 'undefined' && /msie [6-9]\b/.test(navigator.userAgent.toLowerCase())

	module.exports = function (parentId, list, _isProduction) {
	  isProduction = _isProduction

	  var styles = listToStyles(parentId, list)
	  addStylesToDom(styles)

	  return function update (newList) {
	    var mayRemove = []
	    for (var i = 0; i < styles.length; i++) {
	      var item = styles[i]
	      var domStyle = stylesInDom[item.id]
	      domStyle.refs--
	      mayRemove.push(domStyle)
	    }
	    if (newList) {
	      styles = listToStyles(parentId, newList)
	      addStylesToDom(styles)
	    } else {
	      styles = []
	    }
	    for (var i = 0; i < mayRemove.length; i++) {
	      var domStyle = mayRemove[i]
	      if (domStyle.refs === 0) {
	        for (var j = 0; j < domStyle.parts.length; j++) {
	          domStyle.parts[j]()
	        }
	        delete stylesInDom[domStyle.id]
	      }
	    }
	  }
	}

	function addStylesToDom (styles /* Array<StyleObject> */) {
	  for (var i = 0; i < styles.length; i++) {
	    var item = styles[i]
	    var domStyle = stylesInDom[item.id]
	    if (domStyle) {
	      domStyle.refs++
	      for (var j = 0; j < domStyle.parts.length; j++) {
	        domStyle.parts[j](item.parts[j])
	      }
	      for (; j < item.parts.length; j++) {
	        domStyle.parts.push(addStyle(item.parts[j]))
	      }
	      if (domStyle.parts.length > item.parts.length) {
	        domStyle.parts.length = item.parts.length
	      }
	    } else {
	      var parts = []
	      for (var j = 0; j < item.parts.length; j++) {
	        parts.push(addStyle(item.parts[j]))
	      }
	      stylesInDom[item.id] = { id: item.id, refs: 1, parts: parts }
	    }
	  }
	}

	function createStyleElement () {
	  var styleElement = document.createElement('style')
	  styleElement.type = 'text/css'
	  head.appendChild(styleElement)
	  return styleElement
	}

	function addStyle (obj /* StyleObjectPart */) {
	  var update, remove
	  var styleElement = document.querySelector('style[data-vue-ssr-id~="' + obj.id + '"]')

	  if (styleElement) {
	    if (isProduction) {
	      // has SSR styles and in production mode.
	      // simply do nothing.
	      return noop
	    } else {
	      // has SSR styles but in dev mode.
	      // for some reason Chrome can't handle source map in server-rendered
	      // style tags - source maps in <style> only works if the style tag is
	      // created and inserted dynamically. So we remove the server rendered
	      // styles and inject new ones.
	      styleElement.parentNode.removeChild(styleElement)
	    }
	  }

	  if (isOldIE) {
	    // use singleton mode for IE9.
	    var styleIndex = singletonCounter++
	    styleElement = singletonElement || (singletonElement = createStyleElement())
	    update = applyToSingletonTag.bind(null, styleElement, styleIndex, false)
	    remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true)
	  } else {
	    // use multi-style-tag mode in all other cases
	    styleElement = createStyleElement()
	    update = applyToTag.bind(null, styleElement)
	    remove = function () {
	      styleElement.parentNode.removeChild(styleElement)
	    }
	  }

	  update(obj)

	  return function updateStyle (newObj /* StyleObjectPart */) {
	    if (newObj) {
	      if (newObj.css === obj.css &&
	          newObj.media === obj.media &&
	          newObj.sourceMap === obj.sourceMap) {
	        return
	      }
	      update(obj = newObj)
	    } else {
	      remove()
	    }
	  }
	}

	var replaceText = (function () {
	  var textStore = []

	  return function (index, replacement) {
	    textStore[index] = replacement
	    return textStore.filter(Boolean).join('\n')
	  }
	})()

	function applyToSingletonTag (styleElement, index, remove, obj) {
	  var css = remove ? '' : obj.css

	  if (styleElement.styleSheet) {
	    styleElement.styleSheet.cssText = replaceText(index, css)
	  } else {
	    var cssNode = document.createTextNode(css)
	    var childNodes = styleElement.childNodes
	    if (childNodes[index]) styleElement.removeChild(childNodes[index])
	    if (childNodes.length) {
	      styleElement.insertBefore(cssNode, childNodes[index])
	    } else {
	      styleElement.appendChild(cssNode)
	    }
	  }
	}

	function applyToTag (styleElement, obj) {
	  var css = obj.css
	  var media = obj.media
	  var sourceMap = obj.sourceMap

	  if (media) {
	    styleElement.setAttribute('media', media)
	  }

	  if (sourceMap) {
	    // https://developer.chrome.com/devtools/docs/javascript-debugging
	    // this makes source maps inside style tags work properly in Chrome
	    css += '\n/*# sourceURL=' + sourceMap.sources[0] + ' */'
	    // http://stackoverflow.com/a/26603875
	    css += '\n/*# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + ' */'
	  }

	  if (styleElement.styleSheet) {
	    styleElement.styleSheet.cssText = css
	  } else {
	    while (styleElement.firstChild) {
	      styleElement.removeChild(styleElement.firstChild)
	    }
	    styleElement.appendChild(document.createTextNode(css))
	  }
	}


/***/ }),
/* 10 */
/***/ (function(module, exports) {

	/**
	 * Translates the list format produced by css-loader into something
	 * easier to manipulate.
	 */
	module.exports = function listToStyles (parentId, list) {
	  var styles = []
	  var newStyles = {}
	  for (var i = 0; i < list.length; i++) {
	    var item = list[i]
	    var id = item[0]
	    var css = item[1]
	    var media = item[2]
	    var sourceMap = item[3]
	    var part = {
	      id: parentId + ':' + i,
	      css: css,
	      media: media,
	      sourceMap: sourceMap
	    }
	    if (!newStyles[id]) {
	      styles.push(newStyles[id] = { id: id, parts: [part] })
	    } else {
	      newStyles[id].parts.push(part)
	    }
	  }
	  return styles
	}


/***/ }),
/* 11 */,
/* 12 */,
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

	var disposed = false
	function injectStyle (ssrContext) {
	  if (disposed) return
	  __webpack_require__(14)
	}
	var Component = __webpack_require__(2)(
	  /* script */
	  __webpack_require__(16),
	  /* template */
	  __webpack_require__(62),
	  /* styles */
	  injectStyle,
	  /* scopeId */
	  null,
	  /* moduleIdentifier (server only) */
	  null
	)
	Component.options.__file = "/home/scui/projs/IM/deal_app/src/each_item.vue"
	if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
	if (Component.options.functional) {console.error("[vue-loader] each_item.vue: functional components are not supported with templates, they should use render functions.")}

	/* hot reload */
	if (false) {(function () {
	  var hotAPI = require("vue-hot-reload-api")
	  hotAPI.install(require("vue"), false)
	  if (!hotAPI.compatible) return
	  module.hot.accept()
	  if (!module.hot.data) {
	    hotAPI.createRecord("data-v-88191f9a", Component.options)
	  } else {
	    hotAPI.reload("data-v-88191f9a", Component.options)
	  }
	  module.hot.dispose(function (data) {
	    disposed = true
	  })
	})()}

	module.exports = Component.exports


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag

	// load the styles
	var content = __webpack_require__(15);
	if(typeof content === 'string') content = [[module.id, content, '']];
	if(content.locals) module.exports = content.locals;
	// add the styles to the DOM
	var update = __webpack_require__(9)("19e9694c", content, false);
	// Hot Module Replacement
	if(false) {
	 // When the styles change, update the <style> tags
	 if(!content.locals) {
	   module.hot.accept("!!../../../../../../usr/lib/node_modules/weex-toolkit/node_modules/weex-previewer/node_modules/weex-builder/node_modules/css-loader/index.js!../../../../../../usr/lib/node_modules/weex-toolkit/node_modules/weex-previewer/node_modules/weex-builder/node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-88191f9a\",\"scoped\":false,\"hasInlineConfig\":false}!../../../../../../usr/lib/node_modules/weex-toolkit/node_modules/weex-previewer/node_modules/weex-builder/node_modules/vue-loader/lib/selector.js?type=styles&index=0!./each_item.vue", function() {
	     var newContent = require("!!../../../../../../usr/lib/node_modules/weex-toolkit/node_modules/weex-previewer/node_modules/weex-builder/node_modules/css-loader/index.js!../../../../../../usr/lib/node_modules/weex-toolkit/node_modules/weex-previewer/node_modules/weex-builder/node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-88191f9a\",\"scoped\":false,\"hasInlineConfig\":false}!../../../../../../usr/lib/node_modules/weex-toolkit/node_modules/weex-previewer/node_modules/weex-builder/node_modules/vue-loader/lib/selector.js?type=styles&index=0!./each_item.vue");
	     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
	     update(newContent);
	   });
	 }
	 // When the module is disposed, remove the <style> tags
	 module.hot.dispose(function() { update(); });
	}

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(8)();
	// imports


	// module
	exports.push([module.id, "\n.cartBadge {\n    background-color: #CB202D;\n    color: white;\n    position: absolute;\n}\n.pre-button {\n    background: #cb202d;\n    width: 50%;\n    height: 100%;\n    color: #fff;\n    font-weight: 600;\n    display: flex;\n    justify-content: center;\n    align-items: center;\n}\n.bottom-bar {\n    background: #fff;\n    width: 100%;\n    border-top: 1px solid #d8d8d8;\n    display: flex;\n    flex-direction: row;\n    justify-content: flex-end;\n    align-items: center;\n    position: fixed;\n    bottom: 0;\n    z-index: 1;\n}\n.bottom-logo {\n    background-repeat: no-repeat;\n    background-size: contain;\n}\n.bottom-grey {\n    width: 100%;\n    background: #f9f9f9;\n    display: flex;\n    justify-content: center;\n    align-items: center;\n}\n.desc-detail {\n    color: #666;\n    font-weight: 200;\n}\n.desc-container {\n    width: 100%;\n    display: flex;\n    flex-direction: column;\n    justify-content: flex-start;\n}\n.desc-title {\n    font-weight: 600;\n    color: #333;\n}\n#the-hr {\n    border: none;\n    height: 1px;\n    background-color: #f1f1f1;\n}\n.item-price {\n    font-weight: 600;\n    color: #CB202D;\n}\n.item-title {\n    font-weight: 600;\n    color: #333;\n}\n.info-wrapper {\n    width: 87.2%;\n    padding-left: 6.4%;\n    padding-right: 6.4%;\n    height: auto;\n}\n.top-bar {\n    width: 100%;\n    height: 8%;\n    display: flex;\n    flex-direction: row;\n    justify-content: space-between;\n    align-items: center;\n    position: fixed;\n    z-index: 2;\n    top: 0;\n}\n.back-button {\n    background-size: contain;\n}\n.cart-button {\n    background-size: contain;\n}\n.top-pic-container {\n    width: 100%;\n}\n.top-pic {\n    object-fit: cover;\n    width: 100%;\n}\n.top-pic-overlay {\n    width: 100%;\n    position: absolute;\n    z-index: 1;\n}\n\n", ""]);

	// exports


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _assign = __webpack_require__(17);

	var _assign2 = _interopRequireDefault(_assign);

	var _defineProperty2 = __webpack_require__(54);

	var _defineProperty3 = _interopRequireDefault(_defineProperty2);

	var _keys = __webpack_require__(58);

	var _keys2 = _interopRequireDefault(_keys);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//

	var windowHeight = window.innerHeight;
	var bodyWidth = window.innerWidth;

	exports.default = {
	    name: 'EachItem',
	    data: function data() {
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
	        };
	    },
	    created: function created() {
	        this.itemId = this.$route.query.itemId;
	        this.itemName = this.$route.query.itemName;
	        this.itemPrice = this.$route.query.itemPrice;
	        if (this.$route.query.itemPic === 'npic') {
	            this.itemPic = './assets/images/Fill.png';
	        } else if (this.$route.query.itemPic.substr(0, 5) === 'http:') {
	            this.itemPic = 'https' + this.$route.query.itemPic.substr(4);
	        } else this.itemPic = this.$route.query.itemPic;
	        this.itemDesc = this.$route.query.itemDesc;
	        console.log('desc: ' + this.itemDesc);
	    },

	    methods: {
	        goBack: function goBack() {
	            this.$router.go(-1);
	        },
	        logCart: function logCart() {
	            console.log(this.$store.state.cart);
	        },
	        goCart: function goCart() {
	            this.$router.push({ path: '/cart' });
	        },
	        toCart: function toCart() {
	            var item = this.$route.query.itemObj;
	            var itemId = item._id;
	            var picUrl = void 0,
	                itemName = void 0;
	            var restId = this.$route.query.restId;
	            if (item.photos && item.photos.length > 0) {
	                if (item.photos[0].path.substr(0, 5) === 'http:') {
	                    picUrl = 'https' + item.photos[0].path.substr(4);
	                } else picUrl = item.photos[0].path;
	            } else picUrl = './assets/images/Fill.png';
	            if (item.longNames[0].locale === this.locale) {
	                itemName = item.longNames[0].name;
	            } else if (item.longNames[1].locale === this.locale) {
	                itemName = item.longNames[1].name;
	            } else {
	                itemName = 'no name';
	            }
	            var price = item.BasePrice;
	            var cartLength = (0, _keys2.default)(this.$store.state.cart).length;
	            if (restId in this.$store.state.cart && cartLength > 1) {
	                if (itemId in this.$store.state.cart[restId]) {
	                    this.$store.state.cart[restId][itemId].quantity += 1;
	                } else {
	                    var cartObj = (0, _defineProperty3.default)({}, itemId, {
	                        itemId: itemId,
	                        quantity: 1,
	                        picUrl: picUrl,
	                        itemName: itemName,
	                        price: price
	                    });
	                    (0, _assign2.default)(this.$store.state.cart[restId], cartObj);
	                }
	                this.$store.state.cart.total_quantity += 1;
	                this.cartNum = this.$store.state.cart.total_quantity;
	            } else if (!(restId in this.$store.state.cart) && cartLength === 1) {
	                var _cartObj3;

	                var _cartObj2 = (_cartObj3 = {}, (0, _defineProperty3.default)(_cartObj3, restId, (0, _defineProperty3.default)({}, itemId, {
	                    itemId: itemId,
	                    quantity: 1,
	                    picUrl: picUrl,
	                    itemName: itemName,
	                    price: price
	                })), (0, _defineProperty3.default)(_cartObj3, 'restName', this.$route.query.restName), _cartObj3);
	                (0, _assign2.default)(this.$store.state.cart, _cartObj2);
	                this.$store.state.cart.total_quantity += 1;
	                this.cartNum = this.$store.state.cart.total_quantity;
	            } else {
	                //console.log(cartLength);
	                // console.log('>: ' + ( restId in this.$store.state.cart )  && ( cartLength >  1));
	                alert('Your cart has items from a different restaurant, clear the cart to continue.');
	            }
	        }
	    }
	};
	module.exports = exports['default'];

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(18), __esModule: true };

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

	__webpack_require__(19);
	module.exports = __webpack_require__(22).Object.assign;


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

	// 19.1.3.1 Object.assign(target, source)
	var $export = __webpack_require__(20);

	$export($export.S + $export.F, 'Object', { assign: __webpack_require__(35) });


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

	var global = __webpack_require__(21);
	var core = __webpack_require__(22);
	var ctx = __webpack_require__(23);
	var hide = __webpack_require__(25);
	var PROTOTYPE = 'prototype';

	var $export = function (type, name, source) {
	  var IS_FORCED = type & $export.F;
	  var IS_GLOBAL = type & $export.G;
	  var IS_STATIC = type & $export.S;
	  var IS_PROTO = type & $export.P;
	  var IS_BIND = type & $export.B;
	  var IS_WRAP = type & $export.W;
	  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
	  var expProto = exports[PROTOTYPE];
	  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE];
	  var key, own, out;
	  if (IS_GLOBAL) source = name;
	  for (key in source) {
	    // contains in native
	    own = !IS_FORCED && target && target[key] !== undefined;
	    if (own && key in exports) continue;
	    // export native or passed
	    out = own ? target[key] : source[key];
	    // prevent global pollution for namespaces
	    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
	    // bind timers to global for call from export context
	    : IS_BIND && own ? ctx(out, global)
	    // wrap global constructors for prevent change them in library
	    : IS_WRAP && target[key] == out ? (function (C) {
	      var F = function (a, b, c) {
	        if (this instanceof C) {
	          switch (arguments.length) {
	            case 0: return new C();
	            case 1: return new C(a);
	            case 2: return new C(a, b);
	          } return new C(a, b, c);
	        } return C.apply(this, arguments);
	      };
	      F[PROTOTYPE] = C[PROTOTYPE];
	      return F;
	    // make static versions for prototype methods
	    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
	    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
	    if (IS_PROTO) {
	      (exports.virtual || (exports.virtual = {}))[key] = out;
	      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
	      if (type & $export.R && expProto && !expProto[key]) hide(expProto, key, out);
	    }
	  }
	};
	// type bitmap
	$export.F = 1;   // forced
	$export.G = 2;   // global
	$export.S = 4;   // static
	$export.P = 8;   // proto
	$export.B = 16;  // bind
	$export.W = 32;  // wrap
	$export.U = 64;  // safe
	$export.R = 128; // real proto method for `library`
	module.exports = $export;


/***/ }),
/* 21 */
/***/ (function(module, exports) {

	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var global = module.exports = typeof window != 'undefined' && window.Math == Math
	  ? window : typeof self != 'undefined' && self.Math == Math ? self
	  // eslint-disable-next-line no-new-func
	  : Function('return this')();
	if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef


/***/ }),
/* 22 */
/***/ (function(module, exports) {

	var core = module.exports = { version: '2.5.1' };
	if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

	// optional / simple context binding
	var aFunction = __webpack_require__(24);
	module.exports = function (fn, that, length) {
	  aFunction(fn);
	  if (that === undefined) return fn;
	  switch (length) {
	    case 1: return function (a) {
	      return fn.call(that, a);
	    };
	    case 2: return function (a, b) {
	      return fn.call(that, a, b);
	    };
	    case 3: return function (a, b, c) {
	      return fn.call(that, a, b, c);
	    };
	  }
	  return function (/* ...args */) {
	    return fn.apply(that, arguments);
	  };
	};


/***/ }),
/* 24 */
/***/ (function(module, exports) {

	module.exports = function (it) {
	  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
	  return it;
	};


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

	var dP = __webpack_require__(26);
	var createDesc = __webpack_require__(34);
	module.exports = __webpack_require__(30) ? function (object, key, value) {
	  return dP.f(object, key, createDesc(1, value));
	} : function (object, key, value) {
	  object[key] = value;
	  return object;
	};


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

	var anObject = __webpack_require__(27);
	var IE8_DOM_DEFINE = __webpack_require__(29);
	var toPrimitive = __webpack_require__(33);
	var dP = Object.defineProperty;

	exports.f = __webpack_require__(30) ? Object.defineProperty : function defineProperty(O, P, Attributes) {
	  anObject(O);
	  P = toPrimitive(P, true);
	  anObject(Attributes);
	  if (IE8_DOM_DEFINE) try {
	    return dP(O, P, Attributes);
	  } catch (e) { /* empty */ }
	  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
	  if ('value' in Attributes) O[P] = Attributes.value;
	  return O;
	};


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(28);
	module.exports = function (it) {
	  if (!isObject(it)) throw TypeError(it + ' is not an object!');
	  return it;
	};


/***/ }),
/* 28 */
/***/ (function(module, exports) {

	module.exports = function (it) {
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = !__webpack_require__(30) && !__webpack_require__(31)(function () {
	  return Object.defineProperty(__webpack_require__(32)('div'), 'a', { get: function () { return 7; } }).a != 7;
	});


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

	// Thank's IE8 for his funny defineProperty
	module.exports = !__webpack_require__(31)(function () {
	  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
	});


/***/ }),
/* 31 */
/***/ (function(module, exports) {

	module.exports = function (exec) {
	  try {
	    return !!exec();
	  } catch (e) {
	    return true;
	  }
	};


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(28);
	var document = __webpack_require__(21).document;
	// typeof document.createElement is 'object' in old IE
	var is = isObject(document) && isObject(document.createElement);
	module.exports = function (it) {
	  return is ? document.createElement(it) : {};
	};


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

	// 7.1.1 ToPrimitive(input [, PreferredType])
	var isObject = __webpack_require__(28);
	// instead of the ES6 spec version, we didn't implement @@toPrimitive case
	// and the second argument - flag - preferred type is a string
	module.exports = function (it, S) {
	  if (!isObject(it)) return it;
	  var fn, val;
	  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
	  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
	  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
	  throw TypeError("Can't convert object to primitive value");
	};


/***/ }),
/* 34 */
/***/ (function(module, exports) {

	module.exports = function (bitmap, value) {
	  return {
	    enumerable: !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable: !(bitmap & 4),
	    value: value
	  };
	};


/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	// 19.1.2.1 Object.assign(target, source, ...)
	var getKeys = __webpack_require__(36);
	var gOPS = __webpack_require__(51);
	var pIE = __webpack_require__(52);
	var toObject = __webpack_require__(53);
	var IObject = __webpack_require__(40);
	var $assign = Object.assign;

	// should work with symbols and should have deterministic property order (V8 bug)
	module.exports = !$assign || __webpack_require__(31)(function () {
	  var A = {};
	  var B = {};
	  // eslint-disable-next-line no-undef
	  var S = Symbol();
	  var K = 'abcdefghijklmnopqrst';
	  A[S] = 7;
	  K.split('').forEach(function (k) { B[k] = k; });
	  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
	}) ? function assign(target, source) { // eslint-disable-line no-unused-vars
	  var T = toObject(target);
	  var aLen = arguments.length;
	  var index = 1;
	  var getSymbols = gOPS.f;
	  var isEnum = pIE.f;
	  while (aLen > index) {
	    var S = IObject(arguments[index++]);
	    var keys = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S);
	    var length = keys.length;
	    var j = 0;
	    var key;
	    while (length > j) if (isEnum.call(S, key = keys[j++])) T[key] = S[key];
	  } return T;
	} : $assign;


/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

	// 19.1.2.14 / 15.2.3.14 Object.keys(O)
	var $keys = __webpack_require__(37);
	var enumBugKeys = __webpack_require__(50);

	module.exports = Object.keys || function keys(O) {
	  return $keys(O, enumBugKeys);
	};


/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

	var has = __webpack_require__(38);
	var toIObject = __webpack_require__(39);
	var arrayIndexOf = __webpack_require__(43)(false);
	var IE_PROTO = __webpack_require__(47)('IE_PROTO');

	module.exports = function (object, names) {
	  var O = toIObject(object);
	  var i = 0;
	  var result = [];
	  var key;
	  for (key in O) if (key != IE_PROTO) has(O, key) && result.push(key);
	  // Don't enum bug & hidden keys
	  while (names.length > i) if (has(O, key = names[i++])) {
	    ~arrayIndexOf(result, key) || result.push(key);
	  }
	  return result;
	};


/***/ }),
/* 38 */
/***/ (function(module, exports) {

	var hasOwnProperty = {}.hasOwnProperty;
	module.exports = function (it, key) {
	  return hasOwnProperty.call(it, key);
	};


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

	// to indexed object, toObject with fallback for non-array-like ES3 strings
	var IObject = __webpack_require__(40);
	var defined = __webpack_require__(42);
	module.exports = function (it) {
	  return IObject(defined(it));
	};


/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

	// fallback for non-array-like ES3 and non-enumerable old V8 strings
	var cof = __webpack_require__(41);
	// eslint-disable-next-line no-prototype-builtins
	module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
	  return cof(it) == 'String' ? it.split('') : Object(it);
	};


/***/ }),
/* 41 */
/***/ (function(module, exports) {

	var toString = {}.toString;

	module.exports = function (it) {
	  return toString.call(it).slice(8, -1);
	};


/***/ }),
/* 42 */
/***/ (function(module, exports) {

	// 7.2.1 RequireObjectCoercible(argument)
	module.exports = function (it) {
	  if (it == undefined) throw TypeError("Can't call method on  " + it);
	  return it;
	};


/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

	// false -> Array#indexOf
	// true  -> Array#includes
	var toIObject = __webpack_require__(39);
	var toLength = __webpack_require__(44);
	var toAbsoluteIndex = __webpack_require__(46);
	module.exports = function (IS_INCLUDES) {
	  return function ($this, el, fromIndex) {
	    var O = toIObject($this);
	    var length = toLength(O.length);
	    var index = toAbsoluteIndex(fromIndex, length);
	    var value;
	    // Array#includes uses SameValueZero equality algorithm
	    // eslint-disable-next-line no-self-compare
	    if (IS_INCLUDES && el != el) while (length > index) {
	      value = O[index++];
	      // eslint-disable-next-line no-self-compare
	      if (value != value) return true;
	    // Array#indexOf ignores holes, Array#includes - not
	    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
	      if (O[index] === el) return IS_INCLUDES || index || 0;
	    } return !IS_INCLUDES && -1;
	  };
	};


/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

	// 7.1.15 ToLength
	var toInteger = __webpack_require__(45);
	var min = Math.min;
	module.exports = function (it) {
	  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
	};


/***/ }),
/* 45 */
/***/ (function(module, exports) {

	// 7.1.4 ToInteger
	var ceil = Math.ceil;
	var floor = Math.floor;
	module.exports = function (it) {
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	};


/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

	var toInteger = __webpack_require__(45);
	var max = Math.max;
	var min = Math.min;
	module.exports = function (index, length) {
	  index = toInteger(index);
	  return index < 0 ? max(index + length, 0) : min(index, length);
	};


/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

	var shared = __webpack_require__(48)('keys');
	var uid = __webpack_require__(49);
	module.exports = function (key) {
	  return shared[key] || (shared[key] = uid(key));
	};


/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

	var global = __webpack_require__(21);
	var SHARED = '__core-js_shared__';
	var store = global[SHARED] || (global[SHARED] = {});
	module.exports = function (key) {
	  return store[key] || (store[key] = {});
	};


/***/ }),
/* 49 */
/***/ (function(module, exports) {

	var id = 0;
	var px = Math.random();
	module.exports = function (key) {
	  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
	};


/***/ }),
/* 50 */
/***/ (function(module, exports) {

	// IE 8- don't enum bug keys
	module.exports = (
	  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
	).split(',');


/***/ }),
/* 51 */
/***/ (function(module, exports) {

	exports.f = Object.getOwnPropertySymbols;


/***/ }),
/* 52 */
/***/ (function(module, exports) {

	exports.f = {}.propertyIsEnumerable;


/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

	// 7.1.13 ToObject(argument)
	var defined = __webpack_require__(42);
	module.exports = function (it) {
	  return Object(defined(it));
	};


/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	exports.__esModule = true;

	var _defineProperty = __webpack_require__(55);

	var _defineProperty2 = _interopRequireDefault(_defineProperty);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	exports.default = function (obj, key, value) {
	  if (key in obj) {
	    (0, _defineProperty2.default)(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	};

/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(56), __esModule: true };

/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

	__webpack_require__(57);
	var $Object = __webpack_require__(22).Object;
	module.exports = function defineProperty(it, key, desc) {
	  return $Object.defineProperty(it, key, desc);
	};


/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

	var $export = __webpack_require__(20);
	// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
	$export($export.S + $export.F * !__webpack_require__(30), 'Object', { defineProperty: __webpack_require__(26).f });


/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(59), __esModule: true };

/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

	__webpack_require__(60);
	module.exports = __webpack_require__(22).Object.keys;


/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

	// 19.1.2.14 Object.keys(O)
	var toObject = __webpack_require__(53);
	var $keys = __webpack_require__(36);

	__webpack_require__(61)('keys', function () {
	  return function keys(it) {
	    return $keys(toObject(it));
	  };
	});


/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

	// most Object methods by ES6 should accept primitives
	var $export = __webpack_require__(20);
	var core = __webpack_require__(22);
	var fails = __webpack_require__(31);
	module.exports = function (KEY, exec) {
	  var fn = (core.Object || {})[KEY] || Object[KEY];
	  var exp = {};
	  exp[KEY] = exec(fn);
	  $export($export.S + $export.F * fails(function () { fn(1); }), 'Object', exp);
	};


/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
	  return _c('div', {
	    staticClass: "wrapper",
	    attrs: {
	      "id": "grey-wrap"
	    }
	  }, [_c('div', {
	    staticClass: "top-pic-container",
	    style: ({
	      height: _vm.windowHeight * 0.3148 + 'px'
	    })
	  }, [_c('div', {
	    staticClass: "top-bar"
	  }, [_c('div', {
	    staticClass: "back-button",
	    style: ({
	      backgroundImage: 'url(' + _vm.backImgUrl + ')',
	      width: 0.024 * _vm.bodyWidth + 'px',
	      height: 0.048 * _vm.bodyWidth + 'px',
	      marginLeft: 0.0453 * _vm.bodyWidth + 'px'
	    }),
	    on: {
	      "click": _vm.goBack
	    }
	  }), _vm._v(" "), _c('div', {
	    staticClass: "cart-button",
	    style: ({
	      backgroundImage: 'url(' + _vm.cartUrl + ')',
	      width: 0.0506 * _vm.bodyWidth + 'px',
	      height: 0.0453 * _vm.bodyWidth + 'px',
	      marginRight: 0.0453 * _vm.bodyWidth + 'px'
	    }),
	    on: {
	      "click": _vm.goCart
	    }
	  }, [(_vm.cartNum > 0) ? _c('div', {
	    staticClass: "cartBadge",
	    style: ({
	      top: 0.025 * _vm.bodyWidth + 'px',
	      right: 0.02 * _vm.bodyWidth + 'px',
	      fontSize: 0.026 * _vm.bodyWidth + 'px',
	      padding: 0.00267 * _vm.bodyWidth + 'px' + ' ' + 0.0106 * _vm.bodyWidth + 'px',
	      borderRadius: 0.02 * _vm.bodyWidth + 'px',
	    })
	  }, [_vm._v("\n                    " + _vm._s(_vm.cartNum) + "\n                ")]) : _vm._e()])]), _vm._v(" "), _c('img', {
	    staticClass: "top-pic-overlay",
	    style: ({
	      height: _vm.windowHeight * 0.154 + 'px'
	    }),
	    attrs: {
	      "src": _vm.overUrl
	    }
	  }), _vm._v(" "), _c('img', {
	    staticClass: "top-pic",
	    style: ({
	      height: _vm.windowHeight * 0.3148 + 'px'
	    }),
	    attrs: {
	      "src": _vm.itemPic
	    }
	  })]), _vm._v(" "), _c('div', {
	    staticClass: "info-wrapper",
	    style: ({
	      paddingTop: _vm.bodyWidth * 0.064 + 'px',
	      paddingBottom: _vm.bodyWidth * 0.064 + 'px'
	    })
	  }, [_c('div', {
	    staticClass: "item-title",
	    style: ({
	      fontSize: _vm.bodyWidth * 0.0533 + 'px'
	    })
	  }, [_vm._v("\n            " + _vm._s(_vm.itemName) + "\n        ")]), _vm._v(" "), _c('div', {
	    staticClass: "item-price",
	    style: ({
	      fontSize: _vm.bodyWidth * 0.048 + 'px',
	      marginTop: _vm.bodyWidth * 0.0426 + 'px'
	    })
	  }, [_vm._v("\n            " + _vm._s('$' + _vm.itemPrice) + "\n        ")]), _vm._v(" "), _c('hr', {
	    style: ({
	      marginTop: _vm.bodyWidth * 0.0533 + 'px'
	    }),
	    attrs: {
	      "id": "the-hr"
	    }
	  }), _vm._v(" "), _c('div', {
	    staticClass: "desc-container",
	    style: ({
	      marginTop: _vm.bodyWidth * 0.064 + 'px'
	    })
	  }, [_c('div', {
	    staticClass: "desc-title"
	  }, [_vm._v("\n                " + _vm._s(_vm.descWord) + "\n            ")]), _vm._v(" "), (_vm.itemDesc !== '') ? _c('div', {
	    staticClass: "desc-detail",
	    style: ({
	      marginTop: _vm.bodyWidth * 0.048 + 'px',
	      fontSize: _vm.bodyWidth * 0.04 + 'px'
	    })
	  }, [_vm._v("\n                " + _vm._s(_vm.itemDesc) + "\n            ")]) : _c('div', {
	    staticClass: "desc-detail",
	    style: ({
	      marginTop: _vm.bodyWidth * 0.048 + 'px',
	      fontSize: _vm.bodyWidth * 0.04 + 'px'
	    })
	  }, [_vm._v("\n                Sorry, no description available at the moment.\n            ")])])]), _vm._v(" "), _c('div', {
	    staticClass: "bottom-grey",
	    style: ({
	      height: 0.6 * _vm.bodyWidth + 'px'
	    })
	  }, [_c('div', {
	    staticClass: "bottom-logo",
	    style: ({
	      backgroundImage: 'url(' + _vm.bottomUrl + ')',
	      width: 0.253 * _vm.bodyWidth + 'px',
	      height: 0.0533 * _vm.bodyWidth + 'px'
	    })
	  })]), _vm._v(" "), _c('div', {
	    staticClass: "bottom-bar",
	    style: ({
	      height: 0.133 * _vm.bodyWidth + 'px'
	    })
	  }, [_c('div', {
	    staticClass: "pre-button",
	    style: ({
	      fontSize: 0.04 * _vm.bodyWidth + 'px'
	    }),
	    on: {
	      "click": _vm.toCart
	    }
	  }, [_vm._v("\n            ADD TO CART\n        ")])])])
	},staticRenderFns: []}
	module.exports.render._withStripped = true
	if (false) {
	  module.hot.accept()
	  if (module.hot.data) {
	     require("vue-hot-reload-api").rerender("data-v-88191f9a", module.exports)
	  }
	}

/***/ })
/******/ ]);