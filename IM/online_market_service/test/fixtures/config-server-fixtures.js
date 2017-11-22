exports.config = {
    express: {
        shared: {
            maxRequestSize: 52428800,
            server_port: 8011,
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

                    server: '127.0.0.1',
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

    //-- FBE-678
    other_servers: {
        grant_goldDollars_to_servers:false,
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
            development: {
                server_url: 'oauth.dev.services.fandine.com'
            },
            test: {
                server_url: 'oauth.qa.services.fandine.com'
            },
            production: {
                server_url: 'oauth.services.fandine.com'
            }
        },
        chat: {
            server_port: 80,
            server_name: 'chat',
            development: {
                server_url: 'chat.dev.services.fandine.com'
            },
            test: {
                server_url: 'chat.qa.services.fandine.com'
            },
            production: {
                server_url: 'chat.services.fandine.com'
            }
        },
        reward: {
            server_port: 80,
            server_name: 'rewards',
            development: {
                server_url: 'rewards.dev.services.fandine.com'
            },
            test: {
                server_url: 'rewards.qa.services.fandine.com'
            },
            production: {
                server_url: 'rewards.services.fandine.com'
            }
        },
        region: {
            //-- node app NA || CHN
            north_america: ['NA', 'NorthAmerica'],
            china: ['CHN','China','CN']
        },
        notification: {
            server_port: 80,
            server_name: 'notification',
            development: {
                server_url: 'notification.dev.services.fandanfanli.com'
            },
            test: {
                server_url: 'notification.dev.services.fandanfanli.com'
            },
            production: {
                server_url: 'notification.services.fandanfanli.com'
            }
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
            standard_menu_item_price_NA:10
        }
    }
};
