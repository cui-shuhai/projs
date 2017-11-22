/**
 * Created by Andy.Gao on 7/8/16.
 */
exports.config = {
    CN: {
        development: {
            other_servers: {
                stripe_gold_dollar:{
                    enable:false
                },
                oauth: {
                    TOKEN_OFF: true,
                    server_url: 'oauth.dev.services.fandanfanli.com'
                },
                reward: {
                    server_url: 'rewards.dev.services.fandanfanli.com'
                },
                notification: {
                    server_url: 'notification.dev.services.fandanfanli.com'
                },
                search: {
                    server_url: 'search.dev.services.fandanfanli.com'
                },
                gold_dollar: {
                    min_amount_to_pay: 0
                },
                delivery_fee_promotion:{enable_delivery_fee_exempt:true}
            }
        },
        qa: {
            mongo: {
                shared: {
                    hosts: [
                        {
                            server: process.env.MONGO_S1_HOST ||'general-mongodb-01',
                            port: process.env.MONGO_S1_PORT || 27017,
                            username: 'fandine',
                            password: 'fand1ne'
                        },
                        {
                            server: process.env.MONGO_S2_HOST ||'general-mongodb-02',
                            port: process.env.MONGO_S2_PORT || 27017,
                            username: 'fandine',
                            password: 'fand1ne'
                        },
                        {
                            server: process.env.MONGO_S3_HOST ||'general-mongodb-03',
                            port: process.env.MONGO_S3_PORT || 27017,
                            username: 'fandine',
                            password: 'fand1ne'
                        }
                    ]
                }
            },
            redis: {
                redis_host: '10.171.216.253',
                redis_port: '6379'
            },
            other_servers: {
                grant_goldDollars_to_servers: true,
                stripe_gold_dollar:{
                    enable:false
                },
                postgre_sql: {
                    connection_string: 'postgres://fandine:fandine@10.171.216.253:5432/fandine'
                },
                oauth: {
                    TOKEN_OFF: true,
                    server_url: 'oauth.qa.services.fandanfanli.com'
                },
                reward: {
                    server_url: 'rewards.qa.services.fandanfanli.com'
                },
                notification: {
                    server_url: 'notification.qa.services.fandanfanli.com'
                },
                search: {
                    server_url: 'search.qa.services.fandanfanli.com'
                },
                zookeeper: {
                    enabled: true,
                    server_url: 'zkserver1:2181,zkserver2:2181,zkserver3:2181'
                },
                gold_dollar: {
                    min_amount_to_pay: 0
                },
                rewards_credit:{
                    pre_consumed_amount:25,
                    grant_credit_amount:0.05,
                    from_fandine_account:true,
                    rewards_all:false
                },
                delivery_fee_promotion:{enable_delivery_fee_exempt:false}
            }
        },
        beta: {
            mongo: {
                shared: {
                    hosts: [
                        {
                            server: process.env.MONGO_S1_HOST ||'general-mongodb-01',
                            port: process.env.MONGO_S1_PORT || 27017,
                            username: 'fandine',
                            password: 'fand1ne'
                        },
                        {
                            server: process.env.MONGO_S2_HOST ||'general-mongodb-02',
                            port: process.env.MONGO_S2_PORT || 27017,
                            username: 'fandine',
                            password: 'fand1ne'
                        },
                        {
                            server: process.env.MONGO_S3_HOST ||'general-mongodb-03',
                            port: process.env.MONGO_S3_PORT || 27017,
                            username: 'fandine',
                            password: 'fand1ne'
                        }
                    ]
                }
            },
            redis: {
                redis_host: '56fbc2d0735641c9.m.cnhza.kvstore.aliyuncs.com',
                redis_port: '6379',
                redis_password: 'ho4gaI8100p'
            },
            other_servers: {
                grant_goldDollars_to_servers: true,
                stripe_gold_dollar:{
                    enable:false
                },
                postgre_sql: {
                    connection_string: 'postgres://fandine:fandine@fandinetransaction.pg.rds.aliyuncs.com:3499/fandine'
                },
                oauth: {
                    TOKEN_OFF: true,
                    server_url: 'oauth.beta.services.fandanfanli.com'
                },
                reward: {
                    server_url: 'rewards.beta.services.fandanfanli.com'
                },
                notification: {
                    server_url: 'notification.beta.services.fandanfanli.com'
                },
                search: {
                    server_url: 'search.beta.services.fandanfanli.com'
                },
                zookeeper: {
                    enabled: false,
                    server_url: 'zkserver1:2181,zkserver2:2181,zkserver3:2181'
                },
                gold_dollar: {
                    min_amount_to_pay: 0
                },
                delivery_fee_promotion:{enable_delivery_fee_exempt:false}
            }
        },
        production: {
            mongo: {
                shared: {
                    hosts: [
                        {
                            server: process.env.MONGO_S1_HOST ||'general-mongodb-01',
                            port: process.env.MONGO_S1_PORT || 27017,
                            username: 'fandine',
                            password: 'fand1ne'
                        },
                        {
                            server: process.env.MONGO_S2_HOST ||'general-mongodb-02',
                            port: process.env.MONGO_S2_PORT || 27017,
                            username: 'fandine',
                            password: 'fand1ne'
                        },
                        {
                            server: process.env.MONGO_S3_HOST ||'general-mongodb-03',
                            port: process.env.MONGO_S3_PORT || 27017,
                            username: 'fandine',
                            password: 'fand1ne'
                        }
                    ]
                }
            },
            redis: {
                redis_host: '56fbc2d0735641c9.m.cnhza.kvstore.aliyuncs.com',
                redis_port: '6379',
                redis_password: 'ho4gaI8100p'
            },
            other_servers: {
                grant_goldDollars_to_servers: true,
                stripe_gold_dollar:{
                    enable:false
                },
                postgre_sql: {
                    connection_string: 'postgres://fandine:fandine@fandinetransaction.pg.rds.aliyuncs.com:3499/fandine'
                },
                oauth: {
                    TOKEN_OFF: true,
                    server_url: 'oauth.services.fandanfanli.com'
                },
                reward: {
                    server_url: 'rewards.services.fandanfanli.com'
                },
                notification: {
                    server_url: 'notification.services.fandanfanli.com'
                },
                search: {
                    server_url: 'search.services.fandanfanli.com'
                },
                zookeeper: {
                    enabled: true,
                    server_url: 'zkserver1:2181,zkserver2:2181,zkserver3:2181'
                },
                gold_dollar: {
                    min_amount_to_pay: 0
                },
                delivery_fee_promotion:{enable_delivery_fee_exempt:false}
            }
        }
    },
    NA: {
        development: {
        },
        qa: {
            mongo: {
                shared: {
                    hosts: [
                        {
                            server: process.env.MONGO_S1_HOST ||'general-mongodb-01',
                            port: process.env.MONGO_S1_PORT || 27017,
                            username: 'fandine',
                            password: 'fand1ne'
                        },
                        {
                            server: process.env.MONGO_S2_HOST ||'general-mongodb-02',
                            port: process.env.MONGO_S2_PORT || 27017,
                            username: 'fandine',
                            password: 'fand1ne'
                        },
                        {
                            server: process.env.MONGO_S3_HOST ||'general-mongodb-03',
                            port: process.env.MONGO_S3_PORT || 27017,
                            username: 'fandine',
                            password: 'fand1ne'
                        }
                    ]
                }
            },
            redis: {
                redis_host: '192.168.1.4',
                redis_port: '6379'
            },
            other_servers: {
                gold_dollar: {
                    enable:true,
                    min_amount_to_pay:0,
                    use_gold_dollar_percent: 1
                },
                grant_goldDollars_to_servers: false,
                stripe_gold_dollar:{
                    enable:true,
                    min_amount_to_stripe:1,//need at least 1 dollar to pay through stripe
                    use_gold_dollar_percent:1 //can use 80% gold dollar
                },
                postgre_sql: {
                    connection_string: 'postgres://fandine:fandine@192.168.1.4:5432/fandine'
                },
                oauth: {
                    TOKEN_OFF: true,
                    server_url: 'oauth.qa.services.fandine.com'
                },
                reward: {
                    server_url: 'rewards.qa.services.fandine.com'
                },
                notification: {
                    server_url: 'notification.qa.services.fandine.com'
                },
                search: {
                    server_url: 'search.qa.services.fandine.com'
                },
                zookeeper: {
                    enabled: true,
                    server_url: 'zkserver1:2181,zkserver2:2181,zkserver3:2181'
                },
                time_zone:{
                    default_time_zone:"America/Vancouver"
                },
                delivery_fee_promotion:{enable_delivery_fee_exempt:true}
            }
        },
        beta: {
            mongo: {
                shared: {
                    hosts: [
                        {
                            server: process.env.MONGO_S1_HOST ||'general-mongodb-01',
                            port: process.env.MONGO_S1_PORT || 27017,
                            username: 'fandine',
                            password: 'fand1ne'
                        },
                        {
                            server: process.env.MONGO_S2_HOST ||'general-mongodb-02',
                            port: process.env.MONGO_S2_PORT || 27017,
                            username: 'fandine',
                            password: 'fand1ne'
                        },
                        {
                            server: process.env.MONGO_S3_HOST ||'general-mongodb-03',
                            port: process.env.MONGO_S3_PORT || 27017,
                            username: 'fandine',
                            password: 'fand1ne'
                        }
                    ]
                }
            },
            redis: {
                redis_host: 'r-rj989497abd34b74.redis.rds.aliyuncs.com',
                redis_port: '6379',
                redis_password: 'FDho4gaI8100p'
            },
            other_servers: {
                gold_dollar: {
                    enable:true,
                    min_amount_to_pay:0,
                    use_gold_dollar_percent: 1
                },
                grant_goldDollars_to_servers: false,
                stripe_gold_dollar:{
                    enable:true,
                    min_amount_to_stripe:1,//need at least 1 dollar to pay through stripe
                    use_gold_dollar_percent:1 //can use 80% gold dollar
                },
                postgre_sql: {
                    connection_string: 'postgres://fandine:ho4gaI8100p@aliyun-na-vpc-prod-fandine.pg.rds.aliyuncs.com:3433/fandine'
                },
                oauth: {
                    TOKEN_OFF: true,
                    server_url: 'oauth.beta.services.fandine.com'
                },
                reward: {
                    server_url: 'rewards.beta.services.fandine.com'
                },
                notification: {
                    server_url: 'notification.beta.services.fandine.com'
                },
                search: {
                    server_url: 'search.beta.services.fandine.com'
                },
                zookeeper: {
                    enabled: false,
                    server_url: 'zkserver1:2181,zkserver2:2181,zkserver3:2181'
                },
                time_zone:{
                    default_time_zone:"America/Vancouver"
                },
                delivery_fee_promotion:{enable_delivery_fee_exempt:true}
            }
        },
        production: {
            mongo: {
                shared: {
                    hosts: [
                        {
                            server: process.env.MONGO_S1_HOST ||'general-mongodb-01',
                            port: process.env.MONGO_S1_PORT || 27017,
                            username: 'fandine',
                            password: 'fand1ne'
                        },
                        {
                            server: process.env.MONGO_S2_HOST ||'general-mongodb-02',
                            port: process.env.MONGO_S2_PORT || 27017,
                            username: 'fandine',
                            password: 'fand1ne'
                        },
                        {
                            server: process.env.MONGO_S3_HOST ||'general-mongodb-03',
                            port: process.env.MONGO_S3_PORT || 27017,
                            username: 'fandine',
                            password: 'fand1ne'
                        }
                    ]
                }
            },
            redis: {
                redis_host: 'r-rj989497abd34b74.redis.rds.aliyuncs.com',
                redis_port: '6379',
                redis_password: 'FDho4gaI8100p'
            },
            other_servers: {
                gold_dollar: {
                    enable:true,
                    min_amount_to_pay:0,
                    use_gold_dollar_percent: 1
                },
                grant_goldDollars_to_servers: false,
                stripe_gold_dollar:{
                    enable:true,
                    min_amount_to_stripe:1,//need at least 1 dollar to pay through stripe
                    use_gold_dollar_percent:1 //can use 80% gold dollar
                },
                postgre_sql: {
                    connection_string: 'postgres://fandine:ho4gaI8100p@aliyun-na-vpc-prod-fandine.pg.rds.aliyuncs.com:3433/fandine'
                },
                oauth: {
                    TOKEN_OFF: true,
                    server_url: 'oauth.services.fandine.com'
                },
                reward: {
                    server_url: 'rewards.services.fandine.com'
                },
                notification: {
                    server_url: 'notification.services.fandine.com'
                },
                search: {
                    server_url: 'search.services.fandine.com'
                },
                zookeeper: {
                    enabled: true,
                    server_url: 'zkserver1:2181,zkserver2:2181,zkserver3:2181'
                },
                time_zone:{
                    default_time_zone:"America/Vancouver"
                },
                delivery_fee_promotion:{enable_delivery_fee_exempt:true}
            }
        }
    }
};
