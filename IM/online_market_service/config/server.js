exports.config = {
    express: {
        shared: {
            maxRequestSize: 52428800,
            server_port: 8080,
            server_name: 'order'
        },
        environment: {
            development: {},
            test: {},
            production: {}
        }
    },

    mongo: {
        shared: {
            hosts: [
                {

                    /*****
                     *
                     * Default

                     server: '127.0.0.1',
                     port: 27017

                     * Dev004

                     server: '52.10.125.235',
                     port: 27017

                     * Dev005

                     server: '54.69.146.168',
                     port: 27017

                     * Default

                     server: '127.0.0.1',
                     port: 27017

                     *
                     *****/

                    server: '127.0.0.1',//'54.69.146.168',
                    port: 27017,
                    username: 'fandine',
                    password: 'fand1ne'

                }
            ]
        },
        environments: {
            development: {
                database: 'fandine_development',
                replSet: 'fandine'
            },
            test: {
                database: 'fandine_test',
                replSet: 'fandine'
            },
            production: {
                database: 'fandine',
                replSet: 'fandine'
            }
        }
    },

    redis: {
        redis_host: 'localhost',
        redis_port: '6379',
        redis_password:null
    },

    //-- FBE-678
    other_servers: {
        gold_dollar: {
            enable:true,
            min_amount_to_pay:1,//need at least 1 dollar to pay through stripe, 0 yuan to pay through alipay
            use_gold_dollar_percent:0.7 //can use 70% gold dollar
        },
        stripe_gold_dollar:{
            enable:true,
            min_amount_to_stripe:1,//need at least 1 dollar to pay through stripe
            use_gold_dollar_percent:0.7 //can use 80% gold dollar
        },
        alipay: {
            single_trade_query: 'single_trade_query'
            , partner : '2088811392236243'
            , key : 'gqbag98o2m10ua0fsuwq8dtxkod9010p'
            , alipay_gateway : 'https://mapi.alipay.com/gateway.do?'
            , input_charset : 'utf-8'
            , sign_type : 'MD5'
        },
        grant_goldDollars_to_servers:true,
        grant_goldDollar_amount_to_server:5,
        consume_blueDollar_amount_from_server:8,
        postgre_sql: {
            //-- PostgreSQL connection string form: 'postgres://user:password@host:port/database'
            connection_string: 'postgres://fandine:fandine@localhost:5432/fandine'
        },
        fandine_fee: 0,
        lock_duration_mins: 30,
        stripe: {
            online_transaction_charge_variable: .029,
            online_transaction_charge_constant: .3
        },
        oauth: {
            TOKEN_OFF: true,
            server_port: 80,
            server_name: 'oauth',
            server_url: 'oauth.qa.services.fandine.com'
        },
        reward: {
            server_port: 80,
            server_name: 'rewards',
            server_url: 'rewards.qa.services.fandine.com'
        },
        region: {
            //-- node app NA || CHN
            north_america: ['NA', 'NorthAmerica'],
            china: ['CHN','China','CN']
        },
        notification: {
            server_port: 80,
            server_name: 'notification',
            server_url: 'notification.qa.services.fandine.com'
        },
        other_rates: {
            //-- If the available blue dollar to buy is less than this preset value, the Get Bill API will NOT lock any others_blue_dollars.
            //-- Ratio of blueDollars to goldDollars is 10:9
            transaction_charge:0.01,
            transaction_charge_include_alipay:0.005,
            ap_settlement_rate: 0.8,
            blue_dollar_rate: 0.9,
            blue_dollar_minimum_to_buy: 0,
            alipay_fee_rate: 0.01,
            tip_rate_china: 0,
            tip_rate_north_america: 0,
            fandine_commission_rate_not_first_time: 0.01,
            fandine_commission_rate_first_time: 0.05,
            fandine_revenue_bd_exchange_service_rate: .1,
            fandine_general_bd_gain_rate: .01,
            recommender_reward_rule_china: [{ min: 20, max: 100, reward: 1}, {min: 100, max: null, reward: 5}],
            recommender_reward_rule_north_america: [{ min: 10, max: 20, reward: 0.5}, {min: 20, max: null, reward: 1}],
            grant_amount_for_comments:1,
            standard_menu_item_price:20,
            grant_amount_for_comments_NA:0.5,
            standard_menu_item_price_NA:10,
            tip_rate_takeout: 0,
            tip_rate_delivery: 10,
            tip_rate_preorder: 18,
            tip_rate_dinein: 15
        },
        zookeeper: {
            enabled:false,
            path: '/backend-service/order/server_',
            server_url: 'localhost:2181',
            session_timeout:10000,
            retries:10
        },
        default_stat_day: 90,
        default_stat_hour: 8640,
        default_stat_week: 52,
        default_stat_month: 12,
        search: {
            server_port: 80,
            server_name: 'search',
            server_url: 'search.dev.services.fandine.com'
        },
        rewards_credit:{
            pre_consumed_amount:25,
            grant_credit_amount:0.05,
            from_fandine_account:true,
            rewards_all:false
        },
        food_market:{
          generate_fandine_credit:false
        },
        pos_printer_svr: {
            enable:false,
            server_port: 9000,
            server_name: 'pos_printer_svr',
            server_url: '127.0.0.1'
        },
        email_config: {
            enabled: true
        },
        invitation_code_discount_config:{enabled: true},
        time_zone:{
            default_time_zone:"Asia/Shanghai"
        },
        delivery_fee_promotion:{enable_delivery_fee_exempt:true}
    },
    pre_order_checkin:{
        ahead_minutes: 120,
        late_minutes: 120,
        wild_table_id:"00000000-0000-40a4-a9f6-f5e893daf87a"
    }
};
