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

	var __vue_exports__, __vue_options__
	var __vue_styles__ = []

	/* styles */
	__vue_styles__.push(__webpack_require__(4)
	)

	/* script */
	__vue_exports__ = __webpack_require__(5)

	/* template */
	var __vue_template__ = __webpack_require__(51)
	__vue_options__ = __vue_exports__ = __vue_exports__ || {}
	if (
	  typeof __vue_exports__.default === "object" ||
	  typeof __vue_exports__.default === "function"
	) {
	if (Object.keys(__vue_exports__).some(function (key) { return key !== "default" && key !== "__esModule" })) {console.error("named exports are not supported in *.vue files.")}
	__vue_options__ = __vue_exports__ = __vue_exports__.default
	}
	if (typeof __vue_options__ === "function") {
	  __vue_options__ = __vue_options__.options
	}
	__vue_options__.__file = "/home/scui/projs/IM/deal_app/src/each_item.vue"
	__vue_options__.render = __vue_template__.render
	__vue_options__.staticRenderFns = __vue_template__.staticRenderFns
	__vue_options__._scopeId = "data-v-3362ed1b"
	__vue_options__.style = __vue_options__.style || {}
	__vue_styles__.forEach(function (module) {
	  for (var name in module) {
	    __vue_options__.style[name] = module[name]
	  }
	})
	if (typeof __register_static_styles__ === "function") {
	  __register_static_styles__(__vue_options__._scopeId, __vue_styles__)
	}

	module.exports = __vue_exports__
	module.exports.el = 'true'
	new Vue(module.exports)


/***/ }),
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */
/***/ (function(module, exports) {

	module.exports = {
	  "cartBadge": {
	    "backgroundColor": "#CB202D",
	    "color": "#FFFFFF",
	    "position": "absolute"
	  },
	  "pre-button": {
	    "background": "#cb202d",
	    "width": 50,
	    "height": 100,
	    "color": "#ffffff",
	    "fontWeight": "600",
	    "display": "flex",
	    "justifyContent": "center",
	    "alignItems": "center"
	  },
	  "bottom-bar": {
	    "background": "#fff",
	    "width": 100,
	    "borderTop": "1px solid #d8d8d8",
	    "display": "flex",
	    "flexDirection": "row",
	    "justifyContent": "flex-end",
	    "alignItems": "center",
	    "position": "fixed",
	    "bottom": 0,
	    "zIndex": 1
	  },
	  "bottom-logo": {
	    "backgroundRepeat": "no-repeat",
	    "backgroundSize": "contain"
	  },
	  "bottom-grey": {
	    "width": 100,
	    "background": "#f9f9f9",
	    "display": "flex",
	    "justifyContent": "center",
	    "alignItems": "center"
	  },
	  "desc-detail": {
	    "color": "#666666",
	    "fontWeight": "200"
	  },
	  "desc-container": {
	    "width": 100,
	    "display": "flex",
	    "flexDirection": "column",
	    "justifyContent": "flex-start"
	  },
	  "desc-title": {
	    "fontWeight": "600",
	    "color": "#333333"
	  },
	  "item-price": {
	    "fontWeight": "600",
	    "color": "#CB202D"
	  },
	  "item-title": {
	    "fontWeight": "600",
	    "color": "#333333"
	  },
	  "info-wrapper": {
	    "width": 87.2,
	    "paddingLeft": 6.4,
	    "paddingRight": 6.4
	  },
	  "top-bar": {
	    "width": 100,
	    "height": 8,
	    "display": "flex",
	    "flexDirection": "row",
	    "justifyContent": "space-between",
	    "alignItems": "center",
	    "position": "fixed",
	    "zIndex": 2,
	    "top": 0
	  },
	  "back-button": {
	    "backgroundSize": "contain"
	  },
	  "cart-button": {
	    "backgroundSize": "contain"
	  },
	  "top-pic-container": {
	    "width": 100
	  },
	  "top-pic": {
	    "objectFit": "cover",
	    "width": 100
	  },
	  "top-pic-overlay": {
	    "width": 100,
	    "position": "absolute",
	    "zIndex": 1
	  }
	}

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _assign = __webpack_require__(6);

	var _assign2 = _interopRequireDefault(_assign);

	var _defineProperty2 = __webpack_require__(43);

	var _defineProperty3 = _interopRequireDefault(_defineProperty2);

	var _keys = __webpack_require__(47);

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
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(7), __esModule: true };

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	__webpack_require__(8);
	module.exports = __webpack_require__(11).Object.assign;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	// 19.1.3.1 Object.assign(target, source)
	var $export = __webpack_require__(9);

	$export($export.S + $export.F, 'Object', { assign: __webpack_require__(24) });


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

	var global = __webpack_require__(10);
	var core = __webpack_require__(11);
	var ctx = __webpack_require__(12);
	var hide = __webpack_require__(14);
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
/* 10 */
/***/ (function(module, exports) {

	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var global = module.exports = typeof window != 'undefined' && window.Math == Math
	  ? window : typeof self != 'undefined' && self.Math == Math ? self
	  // eslint-disable-next-line no-new-func
	  : Function('return this')();
	if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef


/***/ }),
/* 11 */
/***/ (function(module, exports) {

	var core = module.exports = { version: '2.5.1' };
	if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

	// optional / simple context binding
	var aFunction = __webpack_require__(13);
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
/* 13 */
/***/ (function(module, exports) {

	module.exports = function (it) {
	  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
	  return it;
	};


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

	var dP = __webpack_require__(15);
	var createDesc = __webpack_require__(23);
	module.exports = __webpack_require__(19) ? function (object, key, value) {
	  return dP.f(object, key, createDesc(1, value));
	} : function (object, key, value) {
	  object[key] = value;
	  return object;
	};


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

	var anObject = __webpack_require__(16);
	var IE8_DOM_DEFINE = __webpack_require__(18);
	var toPrimitive = __webpack_require__(22);
	var dP = Object.defineProperty;

	exports.f = __webpack_require__(19) ? Object.defineProperty : function defineProperty(O, P, Attributes) {
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
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(17);
	module.exports = function (it) {
	  if (!isObject(it)) throw TypeError(it + ' is not an object!');
	  return it;
	};


/***/ }),
/* 17 */
/***/ (function(module, exports) {

	module.exports = function (it) {
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = !__webpack_require__(19) && !__webpack_require__(20)(function () {
	  return Object.defineProperty(__webpack_require__(21)('div'), 'a', { get: function () { return 7; } }).a != 7;
	});


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

	// Thank's IE8 for his funny defineProperty
	module.exports = !__webpack_require__(20)(function () {
	  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
	});


/***/ }),
/* 20 */
/***/ (function(module, exports) {

	module.exports = function (exec) {
	  try {
	    return !!exec();
	  } catch (e) {
	    return true;
	  }
	};


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(17);
	var document = __webpack_require__(10).document;
	// typeof document.createElement is 'object' in old IE
	var is = isObject(document) && isObject(document.createElement);
	module.exports = function (it) {
	  return is ? document.createElement(it) : {};
	};


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

	// 7.1.1 ToPrimitive(input [, PreferredType])
	var isObject = __webpack_require__(17);
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
/* 23 */
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
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	// 19.1.2.1 Object.assign(target, source, ...)
	var getKeys = __webpack_require__(25);
	var gOPS = __webpack_require__(40);
	var pIE = __webpack_require__(41);
	var toObject = __webpack_require__(42);
	var IObject = __webpack_require__(29);
	var $assign = Object.assign;

	// should work with symbols and should have deterministic property order (V8 bug)
	module.exports = !$assign || __webpack_require__(20)(function () {
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
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

	// 19.1.2.14 / 15.2.3.14 Object.keys(O)
	var $keys = __webpack_require__(26);
	var enumBugKeys = __webpack_require__(39);

	module.exports = Object.keys || function keys(O) {
	  return $keys(O, enumBugKeys);
	};


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

	var has = __webpack_require__(27);
	var toIObject = __webpack_require__(28);
	var arrayIndexOf = __webpack_require__(32)(false);
	var IE_PROTO = __webpack_require__(36)('IE_PROTO');

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
/* 27 */
/***/ (function(module, exports) {

	var hasOwnProperty = {}.hasOwnProperty;
	module.exports = function (it, key) {
	  return hasOwnProperty.call(it, key);
	};


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

	// to indexed object, toObject with fallback for non-array-like ES3 strings
	var IObject = __webpack_require__(29);
	var defined = __webpack_require__(31);
	module.exports = function (it) {
	  return IObject(defined(it));
	};


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

	// fallback for non-array-like ES3 and non-enumerable old V8 strings
	var cof = __webpack_require__(30);
	// eslint-disable-next-line no-prototype-builtins
	module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
	  return cof(it) == 'String' ? it.split('') : Object(it);
	};


/***/ }),
/* 30 */
/***/ (function(module, exports) {

	var toString = {}.toString;

	module.exports = function (it) {
	  return toString.call(it).slice(8, -1);
	};


/***/ }),
/* 31 */
/***/ (function(module, exports) {

	// 7.2.1 RequireObjectCoercible(argument)
	module.exports = function (it) {
	  if (it == undefined) throw TypeError("Can't call method on  " + it);
	  return it;
	};


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

	// false -> Array#indexOf
	// true  -> Array#includes
	var toIObject = __webpack_require__(28);
	var toLength = __webpack_require__(33);
	var toAbsoluteIndex = __webpack_require__(35);
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
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

	// 7.1.15 ToLength
	var toInteger = __webpack_require__(34);
	var min = Math.min;
	module.exports = function (it) {
	  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
	};


/***/ }),
/* 34 */
/***/ (function(module, exports) {

	// 7.1.4 ToInteger
	var ceil = Math.ceil;
	var floor = Math.floor;
	module.exports = function (it) {
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	};


/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

	var toInteger = __webpack_require__(34);
	var max = Math.max;
	var min = Math.min;
	module.exports = function (index, length) {
	  index = toInteger(index);
	  return index < 0 ? max(index + length, 0) : min(index, length);
	};


/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

	var shared = __webpack_require__(37)('keys');
	var uid = __webpack_require__(38);
	module.exports = function (key) {
	  return shared[key] || (shared[key] = uid(key));
	};


/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

	var global = __webpack_require__(10);
	var SHARED = '__core-js_shared__';
	var store = global[SHARED] || (global[SHARED] = {});
	module.exports = function (key) {
	  return store[key] || (store[key] = {});
	};


/***/ }),
/* 38 */
/***/ (function(module, exports) {

	var id = 0;
	var px = Math.random();
	module.exports = function (key) {
	  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
	};


/***/ }),
/* 39 */
/***/ (function(module, exports) {

	// IE 8- don't enum bug keys
	module.exports = (
	  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
	).split(',');


/***/ }),
/* 40 */
/***/ (function(module, exports) {

	exports.f = Object.getOwnPropertySymbols;


/***/ }),
/* 41 */
/***/ (function(module, exports) {

	exports.f = {}.propertyIsEnumerable;


/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

	// 7.1.13 ToObject(argument)
	var defined = __webpack_require__(31);
	module.exports = function (it) {
	  return Object(defined(it));
	};


/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	exports.__esModule = true;

	var _defineProperty = __webpack_require__(44);

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
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(45), __esModule: true };

/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

	__webpack_require__(46);
	var $Object = __webpack_require__(11).Object;
	module.exports = function defineProperty(it, key, desc) {
	  return $Object.defineProperty(it, key, desc);
	};


/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

	var $export = __webpack_require__(9);
	// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
	$export($export.S + $export.F * !__webpack_require__(19), 'Object', { defineProperty: __webpack_require__(15).f });


/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(48), __esModule: true };

/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

	__webpack_require__(49);
	module.exports = __webpack_require__(11).Object.keys;


/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

	// 19.1.2.14 Object.keys(O)
	var toObject = __webpack_require__(42);
	var $keys = __webpack_require__(25);

	__webpack_require__(50)('keys', function () {
	  return function keys(it) {
	    return $keys(toObject(it));
	  };
	});


/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

	// most Object methods by ES6 should accept primitives
	var $export = __webpack_require__(9);
	var core = __webpack_require__(11);
	var fails = __webpack_require__(20);
	module.exports = function (KEY, exec) {
	  var fn = (core.Object || {})[KEY] || Object[KEY];
	  var exp = {};
	  exp[KEY] = exec(fn);
	  $export($export.S + $export.F * fails(function () { fn(1); }), 'Object', exp);
	};


/***/ }),
/* 51 */
/***/ (function(module, exports) {

	module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
	  return _c('div', {
	    staticClass: ["wrapper"],
	    attrs: {
	      "id": "grey-wrap"
	    }
	  }, [_c('div', {
	    staticClass: ["top-pic-container"],
	    style: {
	      height: _vm.windowHeight * 0.3148 + 'px'
	    }
	  }, [_c('div', {
	    staticClass: ["top-bar"]
	  }, [_c('div', {
	    staticClass: ["back-button"],
	    style: {
	      backgroundImage: 'url(' + _vm.backImgUrl + ')',
	      width: 0.024 * _vm.bodyWidth + 'px',
	      height: 0.048 * _vm.bodyWidth + 'px',
	      marginLeft: 0.0453 * _vm.bodyWidth + 'px'
	    },
	    on: {
	      "click": _vm.goBack
	    }
	  }), _c('div', {
	    staticClass: ["cart-button"],
	    style: {
	      backgroundImage: 'url(' + _vm.cartUrl + ')',
	      width: 0.0506 * _vm.bodyWidth + 'px',
	      height: 0.0453 * _vm.bodyWidth + 'px',
	      marginRight: 0.0453 * _vm.bodyWidth + 'px'
	    },
	    on: {
	      "click": _vm.goCart
	    }
	  }, [(_vm.cartNum > 0) ? _c('div', {
	    staticClass: ["cartBadge"],
	    style: {
	      top: 0.025 * _vm.bodyWidth + 'px',
	      right: 0.02 * _vm.bodyWidth + 'px',
	      fontSize: 0.026 * _vm.bodyWidth + 'px',
	      padding: 0.00267 * _vm.bodyWidth + 'px' + ' ' + 0.0106 * _vm.bodyWidth + 'px',
	      borderRadius: 0.02 * _vm.bodyWidth + 'px',
	    }
	  }, [_vm._v("\n                    " + _vm._s(_vm.cartNum) + "\n                ")]) : _vm._e()])]), _c('img', {
	    staticClass: ["top-pic-overlay"],
	    style: {
	      height: _vm.windowHeight * 0.154 + 'px'
	    },
	    attrs: {
	      "src": _vm.overUrl
	    }
	  }), _c('img', {
	    staticClass: ["top-pic"],
	    style: {
	      height: _vm.windowHeight * 0.3148 + 'px'
	    },
	    attrs: {
	      "src": _vm.itemPic
	    }
	  })]), _c('div', {
	    staticClass: ["info-wrapper"],
	    style: {
	      paddingTop: _vm.bodyWidth * 0.064 + 'px',
	      paddingBottom: _vm.bodyWidth * 0.064 + 'px'
	    }
	  }, [_c('div', {
	    staticClass: ["item-title"],
	    style: {
	      fontSize: _vm.bodyWidth * 0.0533 + 'px'
	    }
	  }, [_vm._v("\n            " + _vm._s(_vm.itemName) + "\n        ")]), _c('div', {
	    staticClass: ["item-price"],
	    style: {
	      fontSize: _vm.bodyWidth * 0.048 + 'px',
	      marginTop: _vm.bodyWidth * 0.0426 + 'px'
	    }
	  }, [_vm._v("\n            " + _vm._s('$' + _vm.itemPrice) + "\n        ")]), _c('hr', {
	    style: {
	      marginTop: _vm.bodyWidth * 0.0533 + 'px'
	    },
	    attrs: {
	      "id": "the-hr"
	    }
	  }), _c('div', {
	    staticClass: ["desc-container"],
	    style: {
	      marginTop: _vm.bodyWidth * 0.064 + 'px'
	    }
	  }, [_c('div', {
	    staticClass: ["desc-title"]
	  }, [_vm._v("\n                " + _vm._s(_vm.descWord) + "\n            ")]), (_vm.itemDesc !== '') ? _c('div', {
	    staticClass: ["desc-detail"],
	    style: {
	      marginTop: _vm.bodyWidth * 0.048 + 'px',
	      fontSize: _vm.bodyWidth * 0.04 + 'px'
	    }
	  }, [_vm._v("\n                " + _vm._s(_vm.itemDesc) + "\n            ")]) : _c('div', {
	    staticClass: ["desc-detail"],
	    style: {
	      marginTop: _vm.bodyWidth * 0.048 + 'px',
	      fontSize: _vm.bodyWidth * 0.04 + 'px'
	    }
	  }, [_vm._v("\n                Sorry, no description available at the moment.\n            ")])])], 1), _c('div', {
	    staticClass: ["bottom-grey"],
	    style: {
	      height: 0.6 * _vm.bodyWidth + 'px'
	    }
	  }, [_c('div', {
	    staticClass: ["bottom-logo"],
	    style: {
	      backgroundImage: 'url(' + _vm.bottomUrl + ')',
	      width: 0.253 * _vm.bodyWidth + 'px',
	      height: 0.0533 * _vm.bodyWidth + 'px'
	    }
	  })]), _c('div', {
	    staticClass: ["bottom-bar"],
	    style: {
	      height: 0.133 * _vm.bodyWidth + 'px'
	    }
	  }, [_c('div', {
	    staticClass: ["pre-button"],
	    style: {
	      fontSize: 0.04 * _vm.bodyWidth + 'px'
	    },
	    on: {
	      "click": _vm.toCart
	    }
	  }, [_vm._v("\n            ADD TO CART\n        ")])])])
	},staticRenderFns: []}
	module.exports.render._withStripped = true

/***/ })
/******/ ]);