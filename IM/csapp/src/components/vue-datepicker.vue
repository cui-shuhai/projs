<style scoped>
    div {
        font-family: system, -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Lucida Grande";
    }

    .datepicker-overlay {
        position: fixed;
        width: 100%;
        height: 100%;
        z-index: 998;
        top: 0;
        left: 0;
        overflow: hidden;
        -webkit-animation: fadein 0.5s;
        /* Safari, Chrome and Opera > 12.1 */
        -moz-animation: fadein 0.5s;
        /* Firefox < 16 */
        -ms-animation: fadein 0.5s;
        /* Internet Explorer */
        -o-animation: fadein 0.5s;
        /* Opera < 12.1 */
        animation: fadein 0.5s;
    }

    @keyframes fadein {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    /* Firefox < 16 */
    @-moz-keyframes fadein {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    /* Safari, Chrome and Opera > 12.1 */
    @-webkit-keyframes fadein {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    /* Internet Explorer */
    @-ms-keyframes fadein {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    /* Opera < 12.1 */
    @-o-keyframes fadein {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .cov-date-body {
        display: inline-block;
        background: #3F51B5;
        overflow: hidden;
        position: relative;
        font-size: 16px;
        font-family: 'Roboto';
        font-weight: 400;
        position: fixed;
        display: block;
        width: 400px;
        max-width: 100%;
        z-index: 999;
        top: 50%;
        left: 50%;
        -webkit-transform: translate(-50%, -50%);
        -ms-transform: translate(-50%, -50%);
        transform: translate(-50%, -50%);
    }

    .cov-picker-box {
        background: #fff;
        width: 100%;
        display: inline-block;
        padding: 25px;
        box-sizing: border-box !important;
        -moz-box-sizing: border-box !important;
        -webkit-box-sizing: border-box !important;
        -ms-box-sizing: border-box !important;
        width: 400px;
        max-width: 100%;
        height: 280px;
        text-align: start !important;
    }

    .cov-picker-box td {
        height: 34px;
        width: 34px;
        padding: 0;
        line-height: 34px;
        color: #000;
        background: #fff;
        text-align: center;
        cursor: pointer;
    }

    .cov-picker-box td:hover {
        background: #E6E6E6;
    }

    table {
        border-collapse: collapse;
        border-spacing: 0;
        width: 100%;
    }

    .day {
        width: 14.2857143%;
        display: inline-block;
        text-align: center;
        cursor: pointer;
        height: 34px;
        padding: 0;
        line-height: 34px;
        color: #000;
        background: #fff;
        vertical-align: middle;
    }

    .week ul {
        margin: 0 0 8px;
        padding: 0;
        list-style: none;
    }

    .week ul li {
        width: 14.2%;
        display: inline-block;
        text-align: center;
        background: transparent;
        color: #000;
        font-weight: bold;
    }

    .passive-day {
        color: #bbb;
    }

    .checked {
        background: #CB202D;
        color: #FFF !important;
        border-radius: 3px;
    }

    .unavailable {
        color: #ccc;
        cursor: not-allowed;
    }

    .cov-date-monthly {
        height: 150px;
    }

    .cov-date-monthly > div {
        display: inline-block;
        padding: 0;
        margin: 0;
        vertical-align: middle;
        color: #fff;
        height: 150px;
        float: left;
        text-align: center;
        cursor: pointer;
    }

    .cov-date-previous,
    .cov-date-next {
        position: relative;
        width: 20% !important;
        text-indent: -300px;
        overflow: hidden;
        color: #fff;
    }

    .cov-date-caption {
        width: 60%;
        padding: 50px 0 !important;
        box-sizing: border-box;
        font-size: 24px;
    }

    .cov-date-caption span:hover {
        color: rgba(255, 255, 255, 0.7);
    }

    .cov-date-previous:hover,
    .cov-date-next:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .day:hover {
        background: #EAEAEA;
    }

    .unavailable:hover {
        background: none;
    }

    .checked:hover {
        background: #FF4F8E;
    }

    .cov-date-next::before,
    .cov-date-previous::before {
        width: 20px;
        height: 2px;
        text-align: center;
        position: absolute;
        background: #fff;
        top: 50%;
        margin-top: -7px;
        margin-left: -7px;
        left: 50%;
        line-height: 0;
        content: '';
        -webkit-transform: rotate(45deg);
        -moz-transform: rotate(45deg);
        transform: rotate(45deg);
    }

    .cov-date-next::after,
    .cov-date-previous::after {
        width: 20px;
        height: 2px;
        text-align: center;
        position: absolute;
        background: #fff;
        margin-top: 6px;
        margin-left: -7px;
        top: 50%;
        left: 50%;
        line-height: 0;
        content: '';
        -webkit-transform: rotate(-45deg);
        -moz-transform: rotate(-45deg);
        transform: rotate(-45deg);
    }

    .cov-date-previous::after {
        -webkit-transform: rotate(45deg);
        -moz-transform: rotate(45deg);
        transform: rotate(45deg);
    }

    .cov-date-previous::before {
        -webkit-transform: rotate(-45deg);
        -moz-transform: rotate(-45deg);
        transform: rotate(-45deg);
    }

    .date-item {
        text-align: center;
        font-size: 20px;
        padding: 10px 0;
        cursor: pointer;
    }

    .date-item:hover {
        background: #e0e0e0;
    }

    .date-list {
        overflow: auto;
        vertical-align: top;
        padding: 0;
    }

    .cov-vue-date {
        display: inline-block;
        color: #5D5D5D;
    }

    .button-box {
        background: #fff;
        vertical-align: top;
        height: 50px;
        line-height: 50px;
        text-align: right;
        padding-right: 20px;
    }

    .button-box span {
        cursor: pointer;
        padding: 10px 20px;
    }

    .watch-box {
        height: 100%;
        overflow: hidden;
    }

    .hour-box,
    .min-box {
        display: inline-block;
        width: 50%;
        text-align: center;
        height: 100%;
        overflow: auto;
        float: left;
    }

    .hour-box ul,
    .min-box ul {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .hour-item,
    .min-item {
        padding: 10px;
        font-size: 36px;
        cursor: pointer;
    }

    .hour-item:hover,
    .min-item:hover {
        background: #E3E3E3;
    }

    .hour-box .active,
    .min-box .active {
        background: #CB202D;
        color: #FFF !important;
    }

    ::-webkit-scrollbar {
        width: 2px;
    }

    ::-webkit-scrollbar-track {
        background: #E3E3E3;
    }

    ::-webkit-scrollbar-thumb {
        background: #C1C1C1;
        border-radius: 2px;
    }
</style>
<template>
    <div class="cov-vue-date">
        <div class="datepickbox">
            <input type="text" title="input date" class="cov-datepicker" readonly="readonly"
                   :placeholder="option.placeholder" v-model="date.time" :required="required" @click="showCheck"
                   @foucus="showCheck" :style="option.inputStyle ? option.inputStyle : {}"/>
        </div>
        <div class="datepicker-overlay" v-if="showInfo.check" @click="dismiss($event)"
             v-bind:style="{'background' : option.overlayOpacity? 'rgba(0,0,0,'+option.overlayOpacity+')' : 'rgba(0,0,0,0.5)'}">
            <div class="cov-date-body" :style="{'background-color': option.color ? option.color.header : '#3f51b5'}">
                <div class="cov-date-monthly">
                    <div class="cov-date-previous" @click="nextMonth('pre')">«</div>
                    <div class="cov-date-caption" :style="{'color': option.color ? option.color.headerText : '#fff'}">
                        <span @click="showYear"><small>{{checked.year}}</small></span>
                        <br/>
                        <span @click="showMonth">{{displayInfo.month}}</span>
                    </div>
                    <div class="cov-date-next" @click="nextMonth('next')">»</div>
                </div>
                <div class="cov-date-box" v-if="showInfo.day">
                    <div class="cov-picker-box">
                        <div class="week">
                            <ul>
                                <li v-for="weekie in library.week" :key="weekie">{{weekie}}</li>
                            </ul>
                        </div>
                        <div class="day" v-for="day in dayList" track-by="$index" @click="checkDay(day)"
                             :class="{'checked':day.checked,'unavailable':day.unavailable,'passive-day': !(day.inMonth)}"
                             :style="day.checked ? (option.color && option.color.checkedDay ? { background: option.color.checkedDay } : { background: '#CB202D' }) : {}">
                            {{day.value}}
                        </div>
                    </div>
                </div>
                <div class="cov-date-box list-box" v-if="showInfo.year">
                    <div class="cov-picker-box date-list" id="yearList">
                        <div class="date-item" v-for="yearItem in library.year" track-by="$index"
                             @click="setYear(yearItem)">{{yearItem}}
                        </div>
                    </div>
                </div>
                <div class="cov-date-box list-box" v-if="showInfo.month">
                    <div class="cov-picker-box date-list">
                        <div class="date-item" v-for="monthItem in months" track-by="$index"
                             @click="setMonth(monthItem)">{{monthItem}}
                        </div>
                    </div>
                </div>
                <div class="cov-date-box list-box" v-if="showInfo.hour">
                    <div class="cov-picker-box date-list">
                        <div class="watch-box">
                            <div class="hour-box">
                                <div class="mui-pciker-rule mui-pciker-rule-ft"></div>
                                <ul>
                                    <li class="hour-item" v-for="hitem in hours" :key="hitem"
                                        @click="setTime('hour', hitem, hours)" :class="{'active':hitem.checked}">
                                        {{hitem.value}}
                                    </li>
                                </ul>
                            </div>
                            <div class="min-box">
                                <div class="mui-pciker-rule mui-pciker-rule-ft"></div>
                                <div class="min-item" v-for="mitem in mins" @click="setTime('min',mitem, mins)"
                                     :class="{'active':mitem.checked}">{{mitem.value}}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="button-box">
                    <span @click="showInfo.check=false">{{option.buttons ? option.buttons.cancel : 'Cancel' }}</span>
                    <span @click="picked">{{option.buttons ? option.buttons.ok : 'Ok'}}</span>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    let _moment = require('moment');

    let _moment2 = _interopRequireDefault(_moment);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {default: obj};
    }

    exports.default = {
        props: {
            required: false,
            preOrderDaysLimit:{
                type: Object,
                default: function(){
                    return {
                        min:0,
                        max:60
                    }
                }
            },
            date: {
                type: Object,
                required: true
            },
            option: {
                type: Object,
                default: function() {
                    return {
                        type: 'day',
                        SundayFirst: false,
                        week: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
                        month: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                        format: 'YYYY-MM-DD',
                        color: {
                            checked: '#CB202D',
                            header: '#3f51b5',
                            headerText: '#fff'
                        },
                        inputStyle: {
                            'display': 'inline-block',
                            'padding': '6px',
                            'line-height': '22px',
                            'font-size': '16px',
                            'color': '#999',
                            'box-shadow': 'none',
                            'border': 'none'
                        },
                        placeholder: 'when?',
                        buttons: {
                            ok: 'OK',
                            cancel: 'Cancel'
                        },
                        overlayOpacity: 0.5,
                        dismissible: true
                    };
                }
            },
            limit: {
                type: Array,
                default: function() {
                    return [];
                }
            }
        },
        data() {
            function hours() {
                let list = [];
                let hour = 24;
                while (hour > 0) {
                    hour--;
                    list.push({
                        checked: false,
                        value: hour < 10 ? '0' + hour : hour
                    });
                }
                return list;
            }

            function mins() {
                let list = [];
                let min = 0;
                while (min < 60) {
                    list.push({
                        checked: false,
                        value: min < 10 ? '0' + min : min
                    });
                    min += 30;
                }
                return list;
            }

            return {
                hours: hours(),
                mins: mins(),
                months: this.option.month,
                businessHours:[],
                showInfo: {
                    hour: false,
                    day: false,
                    month: false,
                    year: false,
                    check: false
                },
                displayInfo: {
                    month: ''
                },
                library: {
                    week: this.option.week,
                    month: this.option.month,
                    year: []
                },
                checked: {
                    oldtime: '',
                    currentMoment: null,
                    initMoment:null,
                    year: '',
                    month: '',
                    day: '',
                    hour: '00',
                    min: '00'
                },
                dayList: [],
                selectedDays: []
            };
        },
        watch: {
            preOrderDaysLimit: {
                handler: function (daysLimit) {
                    let daysMin = daysLimit.min;
                    let startTime = _moment().add(daysMin - 1,'days');
                    let lastMoment = _moment().add(daysLimit.max,'days');
                    lastMoment.hours(23);
                    lastMoment.minute(59);
                    this.limit.push( {
                        type: 'fromto',
                        from: startTime.format("YYYY-MM-DD"),
                        to: lastMoment.format("YYYY-MM-DD")
                    });

                    let regularHours = daysLimit.regularHours;
                    let limit = {
                        type: 'weekday',
                        available: []
                    };
                    let businessHours = ['CLOSED', 'CLOSED', 'CLOSED', 'CLOSED', 'CLOSED', 'CLOSED', 'CLOSED'];
                    function timesLimit(fromto){
                        let ftArray = fromto.split('-');
                        let fromTime = ftArray[0].split(':');
                        let fromHour = parseInt(fromTime[0]);
                        let toTime = ftArray[1].split(':');
                        let toHour = parseInt(toTime[0]);

                        let list = [];
                        let hour = fromHour;
                        while (hour < toHour) {
                            list.push({
                                checked: false,
                                value: hour < 10 ? '0' + hour : '' + hour
                            });
                            hour++;
                        }
                        return list;
                    }
                    function setBusinessHours(day, hours) {
                        limit.available.push(day);
                        businessHours[day] = hours;
                    }
                    regularHours.forEach(function(rh){
                        let rhArray = rh.split(' ');
                        let hours = timesLimit(rhArray[1]);
                        if(rhArray[2]){
                            hours = hours.concat(timesLimit(rhArray[2]));
                        }
                        switch (rhArray[0]){
                            case "Sunday":      {return setBusinessHours(0, hours);}
                            case "Monday":      {return setBusinessHours(1, hours);}
                            case "Tuesday":     {return setBusinessHours(2, hours);}
                            case "Wednesday":   {return setBusinessHours(3, hours);}
                            case "Thursday":    {return setBusinessHours(4, hours);}
                            case "Friday":      {return setBusinessHours(5, hours);}
                            case "Saturday":    {return setBusinessHours(6, hours);}
                        }
                    });
                    this.limit.push(limit);
                    this.businessHours = businessHours;

                    let currMoment = _moment();
                    function getAvailableMoment(m){
                        if(m.isAfter(lastMoment)){return "";}
                        let bh = businessHours[m.day()];
                        if(!Array.isArray(bh)){
                            return getAvailableMoment(m.add(1, 'days'));
                        }
                        if(currMoment.isSame(m, 'days')){
                            bh = bh.filter(function (h) {
                                return parseInt(h.value) >= m.hours();
                            });
                            if(bh.length === 0){
                                m.minute(0);
                            }
                        }
                        if(bh.length === 0){
                            return getAvailableMoment(m.add(1, 'days'));
                        }
                        m.hours(bh[0].value);
                        return m.format('YYYY-MM-DD HH:mm');
                    }
                    let avaMoment = _moment();
                    if(daysMin){
                        avaMoment.add(daysMin,'days');
                        avaMoment.minute(0);
                    } else {
                        if(avaMoment.minute() > 30){
                            avaMoment.add(1, 'hours');
                            avaMoment.minute(0);
                        } else {
                            avaMoment.minute(30);
                        }
                    }

                    this.date.time = getAvailableMoment(avaMoment);
                    this.checked.initMoment = avaMoment;
                },
                deep: true
            },
        },
        methods: {
            pad: function (n) {
                n = Math.floor(n);
                return n < 10 ? '0' + n : n;
            },
            nextMonth: function (type) {
                let next = (type === 'next') ?
                    (0, _moment2.default)(this.checked.currentMoment).add( 1, 'M') :
                    (0, _moment2.default)(this.checked.currentMoment).add(-1, 'M');

                let isStopHere = false;
                let self = this;
                this.limit.forEach(function (li) {
                   if(li.type !== 'fromto') {return;}
                   let sm = (0, _moment2.default)(li.from).add(1, 'D');
                   let em = (0, _moment2.default)(li.to).add( -1, 'D');
                   if(next.isBefore(sm)){
                       next = !!(self.checked.initMoment) ? self.checked.initMoment : start;
                       self.getNextAvailableMoment(next, em);
                   }
                   isStopHere = next.isBefore(sm.startOf('month')) || next.isAfter(em.endOf('month'));
                });

                if(isStopHere){return;}
                this.showDay(next);
            },
            showDay: function (time) {
                if (time === undefined || !Date.parse(time)) {
                    this.checked.currentMoment = (0, _moment2.default)();
                } else {
                    this.checked.currentMoment = (0, _moment2.default)(time, this.option.format);
                }
                this.showOne('day');
                this.checked.year = (0, _moment2.default)(this.checked.currentMoment).format('YYYY');
                this.checked.month = (0, _moment2.default)(this.checked.currentMoment).format('MM');
                this.checked.day = (0, _moment2.default)(this.checked.currentMoment).format('DD');
                this.displayInfo.month = this.library.month[(0, _moment2.default)(this.checked.currentMoment).month()];
                var days = [];
                var currentMoment = this.checked.currentMoment;
                var firstDay = (0, _moment2.default)(currentMoment).date(1).day();
                // gettting previous and next month
                // let currentMonth = moment(currentMoment)
                var previousMonth = (0, _moment2.default)(currentMoment);
                var nextMonth = (0, _moment2.default)(currentMoment);
                nextMonth.add(1, 'months');
                previousMonth.subtract(1, 'months');
                var monthDays = (0, _moment2.default)(currentMoment).daysInMonth();
                var oldtime = this.checked.oldtime;
                for (var i = 1; i <= monthDays; ++i) {
                    days.push({
                        value: i,
                        inMonth: true,
                        unavailable: false,
                        checked: false,
                        moment: (0, _moment2.default)(currentMoment).date(i)
                    });
                    if (i === Math.ceil((0, _moment2.default)(currentMoment).format('D')) && (0, _moment2.default)(oldtime, this.option.format).year() === (0, _moment2.default)(currentMoment).year() && (0, _moment2.default)(oldtime, this.option.format).month() === (0, _moment2.default)(currentMoment).month()) {
                        days[i - 1].checked = true;
                    }
                    this.checkBySelectDays(i, days);
                }
                if (firstDay === 0) firstDay = 7;
                for (var _i = 0; _i < firstDay - (this.option.SundayFirst ? 0 : 1); _i++) {
                    var passiveDay = {
                        value: previousMonth.daysInMonth() - _i,
                        inMonth: false,
                        action: 'previous',
                        unavailable: false,
                        checked: false,
                        moment: (0, _moment2.default)(currentMoment).date(1).subtract(_i + 1, 'days')
                    };
                    days.unshift(passiveDay);
                }
                if (this.limit.length > 0) {
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = this.limit[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var li = _step.value;

                            switch (li.type) {
                                case 'fromto':
                                    days = this.limitFromTo(li, days);
                                    break;
                                case 'weekday':
                                    days = this.limitWeekDay(li, days);
                                    break;
                            }
                        }
                    } catch (err) {
                        _didIteratorError = true;
                        _iteratorError = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion && _iterator.return) {
                                _iterator.return();
                            }
                        } finally {
                            if (_didIteratorError) {
                                throw _iteratorError;
                            }
                        }
                    }
                }
                var passiveDaysAtFinal = 42 - days.length;
                for (var _i2 = 1; _i2 <= passiveDaysAtFinal; _i2++) {
                    var _passiveDay = {
                        value: _i2,
                        inMonth: false,
                        action: 'next',
                        unavailable: false,
                        checked: false,
                        moment: (0, _moment2.default)(currentMoment).add(1, 'months').date(_i2)
                    };
                    days.push(_passiveDay);
                }
                this.dayList = days;
            },
            checkBySelectDays: function (d, days) {
                var _this = this;

                this.selectedDays.forEach(function (day) {
                    if (_this.checked.year === (0, _moment2.default)(day).format('YYYY') && _this.checked.month === (0, _moment2.default)(day).format('MM') && d === Math.ceil((0, _moment2.default)(day).format('D'))) {
                        days[d - 1].checked = true;
                    }
                });
            },
            limitWeekDay: function (limit, days) {
                days.map(function (day) {
                    if (limit.available.indexOf(Math.floor(day.moment.format('d'))) === -1) {
                        day.unavailable = true;
                    }
                });
                return days;
            },
            limitFromTo: function (limit, days) {
                var _this2 = this;

                if (limit.from || limit.to) {
                    days.map(function (day) {
                        if (_this2.getLimitCondition(limit, day)) {
                            day.unavailable = true;
                        }
                    });
                }
                return days;
            },
            getLimitCondition: function (limit, day) {
                var tmpMoment = (0, _moment2.default)(this.checked.year + '-' + this.pad(this.checked.month) + '-' + this.pad(day.value));
                if (limit.from && !limit.to) {
                    return !tmpMoment.isAfter(limit.from);
                } else if (!limit.from && limit.to) {
                    return !tmpMoment.isBefore(limit.to);
                } else {
                    return !tmpMoment.isBetween(limit.from, limit.to);
                }
            },
            checkDay: function (obj) {
                if (obj.unavailable || obj.value === '') {
                    return false;
                }
                if (!obj.inMonth) {
                    this.nextMonth(obj.action);
                }
                if (this.option.type === 'day' || this.option.type === 'min') {
                    this.dayList.forEach(function (x) {
                        x.checked = false;
                    });
                    this.checked.day = this.pad(obj.value);
                    obj.checked = true;
                } else {
                    let day = this.pad(obj.value);
                    let ctime = this.checked.year + '-' + this.checked.month + '-' + day;
                    if (obj.checked === true) {
                        obj.checked = false;
                        this.selectedDays.$remove(ctime);
                    } else {
                        this.selectedDays.push(ctime);
                        obj.checked = true;
                    }
                }
                switch (this.option.type) {
                    case 'day':
                        this.picked();
                        break;
                    case 'min':
                        this.setBusinessHour(obj.moment.day(), obj.moment.isSame(new Date(), "day"));
                        this.showOne('hour');
                        // shift activated time items to visible position.
                        this.shiftActTime();
                        break;
                }
            },
            showYear: function () {
                this.library.year = [];
                let yearTmp = [];
                let _this3 = this;
                let isStopHere = false;
                this.limit.forEach(function (li) {
                    if(li.type !== 'fromto') {return;}
                    let start = (0, _moment2.default)(li.from).add(1, 'D');
                    let end = (0, _moment2.default)(li.to).add( -1, 'D');
                    if(end.year() > start.year() && _this3.businessHours.length){
                        let bh = _this3.businessHours[end.day()];
                        while (!Array.isArray(bh)){
                            end.add( -1, 'D')
                            bh = _this3.businessHours[end.day()];
                        }
                    }
                    for (let i = start.year(); i <= end.year(); i++) {
                        yearTmp.push(i);
                    }
                    isStopHere = true;
                });
                if(isStopHere){
                    this.library.year = yearTmp;
                    return this.showOne('year');
                }


                let year = (0, _moment2.default)(this.checked.currentMoment).year();
                for (let i = year - 100; i < year + 5; ++i) {
                    yearTmp.push(i);
                }
                this.library.year = yearTmp;
                this.showOne('year');
                this.$nextTick(function () {
                    let listDom = document.getElementById('yearList');
                    listDom.scrollTop = listDom.scrollHeight - 100;
                    _this3.addYear();
                });
            },
            showOne: function (type) {
                switch (type) {
                    case 'year':
                        this.showInfo.hour = false;
                        this.showInfo.day = false;
                        this.showInfo.year = true;
                        this.showInfo.month = false;
                        break;
                    case 'month':
                        this.showInfo.hour = false;
                        this.showInfo.day = false;
                        this.showInfo.year = false;
                        this.showInfo.month = true;
                        break;
                    case 'day':
                        this.showInfo.hour = false;
                        this.showInfo.day = true;
                        this.showInfo.year = false;
                        this.showInfo.month = false;
                        break;
                    case 'hour':
                        this.showInfo.hour = true;
                        this.showInfo.day = false;
                        this.showInfo.year = false;
                        this.showInfo.month = false;
                        break;
                    default:
                        this.showInfo.day = true;
                        this.showInfo.year = false;
                        this.showInfo.month = false;
                        this.showInfo.hour = false;
                }
            },
            showMonth: function () {
                let self = this;
                self.months = self.library.month;
                this.limit.forEach(function (li) {
                    if(li.type !== 'fromto') {return;}

                    let start = (0, _moment2.default)(li.from).add(1, 'D');
                    let end = (0, _moment2.default)(li.to).add( -1, 'D');
                    let year = self.checked.currentMoment.year();

                    if(year === start.year()){
                        self.months = self.months.slice(start.month());
                    }
                    if(year === end.year()){
                        let index = 12 - self.months.length - 1;
                        self.months = self.months.slice(0, end.month() - index);
                    }

                    if(year < start.year() || year > end.year()){
                        self.months = [];
                    }

                });
                this.showOne('month');
            },
            addYear: function () {
                let _this4 = this;
                let listDom = document.getElementById('yearList');
                listDom.addEventListener('scroll', function (e) {
                    if (listDom.scrollTop < listDom.scrollHeight - 100) {
                        let len = _this4.library.year.length;
                        let lastYear = _this4.library.year[len - 1];
                        _this4.library.year.push(lastYear + 1);
                    }
                }, false);
            },
            setYear: function (year) {
                if(parseInt(this.checked.year) === year) {return this.showDay(this.checked.currentMoment);}
                let self = this;
                let currentMoment = (year > _moment().year()) ?
                    (0, _moment2.default)(year + '-01-01') :
                    (0, _moment2.default)(year + '-' + this.checked.month + '-' + this.checked.day);

                this.limit.forEach(function (li) {
                    if(li.type !== 'fromto') {return;}

                    let start = (0, _moment2.default)(li.from).add(1, 'D');
                    let end = (0, _moment2.default)(li.to).add( -1, 'D');

                    if(currentMoment.isBefore(start)){
                        currentMoment = !!(self.checked.initMoment) ? self.checked.initMoment : start;
                    }
                    self.getNextAvailableMoment(currentMoment, end);
                });

                this.checked.currentMoment = currentMoment;
                this.showDay(this.checked.currentMoment);
            },
            setMonth: function (month) {
                let mo = this.library.month.indexOf(month) + 1;
                if (mo < 10) {
                    mo = '0' + '' + mo;
                }
                this.checked.currentMoment = (0, _moment2.default)(this.checked.year + '-' + mo + '-' + this.checked.day);
                this.showDay(this.checked.currentMoment);
            },
            showCheck: function () {
                if (this.date.time === '') {
                    this.showDay();
                } else {
                    if (this.option.type === 'day' || this.option.type === 'min') {
                        this.checked.oldtime = this.date.time;
                        this.showDay(this.date.time);
                    } else {
                        this.selectedDays = JSON.parse(this.date.time);
                        if (this.selectedDays.length) {
                            this.checked.oldtime = this.selectedDays[0];
                            this.showDay(this.selectedDays[0]);
                        } else {
                            this.showDay();
                        }
                    }
                }
                this.showInfo.check = true;
            },
            setTime: function (type, obj, list) {
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = list[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var item = _step2.value;

                        item.checked = false;
                        if (item.value === obj.value) {
                            item.checked = true;
                            this.checked[type] = item.value;
                        }
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }
            },
            setBusinessHour(day, isToday){
                if(!Array.isArray(this.businessHours[day])){return;}
                this.hours.forEach(function (h) {
                    h.checked = false;
                });
                this.mins.forEach(function (m) {
                    m.checked = false;
                });
                this.hours = this.businessHours[day].filter(function (hour) {
                    return !(isToday && parseInt(hour.value) <= _moment().hours());
                });
            },
            getNextAvailableMoment(m, lastMoment){
                if(!_moment.isMoment(m) ||
                    !_moment.isMoment(lastMoment) ||
                    this.businessHours.length === 0 ||
                    m.isAfter(lastMoment.endOf('day'))){
                    return false;
                }

                let bh = this.businessHours[m.day()];
                if(!Array.isArray(bh)){
                    return this.getNextAvailableMoment(m.add(1, 'days'));
                }
                if(_moment().isSame(m, 'days')){
                    bh = bh.filter(function (h) {
                        return parseInt(h.value) >= m.hours();
                    });
                    if(bh.length === 0){
                        m.minute(0);
                    }
                }
                if(bh.length === 0){
                    return this.getNextAvailableMoment(m.add(1, 'days'));
                }
                m.hours(bh[0].value);
                return m.format('YYYY-MM-DD HH:mm');
            },
            picked: function () {
                if (this.option.type === 'day' || this.option.type === 'min') {
                    let ctime = this.checked.year + '-' + this.checked.month + '-' + this.checked.day + ' ' + this.checked.hour + ':' + this.checked.min;
                    this.checked.currentMoment = (0, _moment2.default)(ctime, 'YYYY-MM-DD HH:mm');
                    this.date.time = (0, _moment2.default)(this.checked.currentMoment).format(this.option.format);
                } else {
                    this.date.time = JSON.stringify(this.selectedDays);
                }
                this.showInfo.check = false;
                this.$emit('change', this.date.time);
            },
            dismiss: function (evt) {
                if (evt.target.className === 'datepicker-overlay') {
                    if (this.option.dismissible === undefined || this.option.dismissible) {
                        this.showInfo.check = false;
                        this.$emit('cancel');
                    }
                }
            },
            shiftActTime: function () {
                // shift activated time items to visible position.
                this.$nextTick(function () {
                    if (!document.querySelector('.hour-item.active')) {
                        return false;
                    }
                    document.querySelector('.hour-box').scrollTop = (document.querySelector('.hour-item.active').offsetTop || 0) - 250;
                    document.querySelector('.min-box').scrollTop = (document.querySelector('.min-item.active').offsetTop || 0) - 250;
                });
            }
        }
    };
</script>