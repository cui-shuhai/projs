/**
 * Created by richardmaglaya on 2014-10-27.
 */
'use strict';


var combo = {
    '_id': '54317785dfc8fbae7856940b',
    'restaurantId': '5431776edfc8fbae78569375',
    'comboItems': [
        {
            'id': '54317785dfc8fbae7856940a'
        },
        {
            'id': '54317785dfc8fbae7856940c'
        },
        {
            'id': '54317785dfc8fbae7856940d'
        },
        {
            'id': '54317785dfc8fbae7856940e'
        },
        {
            'id': '54317785dfc8fbae7856940f'
        },
        {
            'id': '54317785dfc8fbae78569410'
        },
        {
            'id': '54317785dfc8fbae78569411'
        }
    ],
    'saleTypePrice': [
        {
            'saleType': 'DINE_IN',
            'price': {
                'currency': {
                    'currencyCode': 'CAD',
                    'currencySymbol': 'CAD'
                },
                'listPrice': 1990,
                'sellPrice': 0,
                'exponent': 2
            }
        }
    ],
    'shortNames': [
        {
            'locale': 'en_US',
            'name': 'Served with choice of seasoned breakfast potatoes or fresh seasonal fruit.',
            'suggest': {
                'input': [
                    'Served',
                    'with',
                    'choice',
                    'of',
                    'seasoned',
                    'breakfast',
                    'potatoes',
                    'or',
                    'fresh',
                    'seasonal',
                    'fruit.'
                ],
                'output': 'Served with choice of seasoned breakfast potatoes or fresh seasonal fruit.'
            }
        }
    ],
    'longNames': [
        {
            'locale': 'en_US',
            'name': 'Served with choice of seasoned breakfast potatoes or fresh seasonal fruit.',
            'suggest': {
                'input': [
                    'Served',
                    'with',
                    'choice',
                    'of',
                    'seasoned',
                    'breakfast',
                    'potatoes',
                    'or',
                    'fresh',
                    'seasonal',
                    'fruit.'
                ],
                'output': 'Served with choice of seasoned breakfast potatoes or fresh seasonal fruit.'
            }
        }
    ],
    'description': [
        {
            'locale': 'en_US',
            'name': ''
        }
    ],
    'applicableTaxes': [
        {
            'id': '5431776edfc8fbae78569378'
        },
        {
            'id': '5431776edfc8fbae78569379'
        }
    ]
};


var comboItem = {
    '_id': '54317785dfc8fbae7856940a',
    'maxSelection': 2,
    'minSelection': 0,
    'defaultChoice': 'false',
    'shortNames': [
        {
            'locale': 'en_US',
            'name': 'Lumberjack Breakfast',
            'suggest': {
                'input': [
                    'Lumberjack',
                    'Breakfast'
                ],
                'output': 'Lumberjack Breakfast'
            }
        }
    ],
    'longNames': [
        {
            'locale': 'en_US',
            'name': 'Lumberjack Breakfast',
            'suggest': {
                'input': [
                    'Lumberjack',
                    'Breakfast'
                ],
                'output': 'Lumberjack Breakfast'
            }
        }
    ],
    'description': [
        {
            'locale': 'en_US',
            'name': 'Ham, bacon, sausage and two eggs served alongside French toast dusted with powdered sugar.'
        }
    ],
    'restaurantId': '5431776edfc8fbae78569375',
    'dishes': [
        {
            'id': '54317784dfc8fbae78569409',
            'priceDiff': {
                'currency': {
                    'currencyCode': 'CAD',
                    'currencySymbol': 'CAD'
                },
                'listPrice': 899,
                'sellPrice': 899,
                'exponent': 2
            }
        }
    ]
};


var cuisine = {
    '_id': '54317694dfc8fbae78568f81',
    'code': '1',
    'names': [
        {
            'locale': 'en_US',
            'name': 'Lebanese'
        }
    ],
    'descriptions': [
        {
            'locale': 'en_US',
            'name': 'Lebanese'
        }
    ]
};


var dish = {
    '_id': '54317694dfc8fbae78568f88',
    'rating': '4.00',
    'enabled': true,
    'recommended': true,
    'saleTypePrice': [
        {
            'saleType': 'DINE_IN',
            'price': {
                'currency': {
                    'currencyCode': 'CAD',
                    'currencySymbol': 'CAD'
                },
                'listPrice': 500,
                'sellPrice': 475,
                'exponent': 2
            }
        }
    ],
    'shortNames': [
        {
            'locale': 'en_US',
            'name': 'seasonal fruit',
            'suggest': {
                'input': [
                    'seasonal',
                    'fruit'
                ],
                'output': 'seasonal fruit'
            }
        },
        {
            'locale': 'fr_FR',
            'name': 'seasonal fruit',
            'suggest': {
                'input': [
                    'seasonal',
                    'fruit'
                ],
                'output': 'seasonal fruit'
            }
        }
    ],
    'longNames': [
        {
            'locale': 'fr_FR',
            'name': 'seasonal fruit',
            'suggest': {
                'input': [
                    'seasonal',
                    'fruit'
                ],
                'output': 'seasonal fruit'
            }
        },
        {
            'locale': 'en_US',
            'name': 'seasonal fruit',
            'suggest': {
                'input': [
                    'seasonal',
                    'fruit'
                ],
                'output': 'seasonal fruit'
            }
        }
    ],
    'description': [
        {
            'locale': 'en_US',
            'name': 'seasonal fruit'
        },
        {
            'locale': 'fr_FR',
            'name': 'seasonal fruit'
        }
    ],
    'images': [
        {
            'locale': 'en_US',
            'imageList': [
                {
                    'image': 'http://restaurantassets.s3-website-us-west-2.amazonaws.com/restaurant/Test_images/image1.jpg'
                },
                {
                    'image': 'http://restaurantassets.s3-website-us-west-2.amazonaws.com/restaurant/Test_images/image1.jpgs'
                }
            ]
        },
        {
            'locale': 'fr_FR',
            'imageList': [
                {
                    'image': 'http://restaurantassets.s3-website-us-west-2.amazonaws.com/restaurant/Test_images/image1.jpg'
                },
                {
                    'image': 'http://restaurantassets.s3-website-us-west-2.amazonaws.com/restaurant/Test_images/image1.jpg'
                }
            ]
        }
    ],
    'videos': [
        {
            'locale': 'en_US',
            'videoList': [
                {
                    'video': 'http://ec2-54-191-213-205.us-west-2.compute.amazonaws.com/videos/20ebb374-15bb-11e0-b40e-0018512e6b26/dish/imageEnglish1'
                },
                {
                    'video': 'http://ec2-54-191-213-205.us-west-2.compute.amazonaws.com/videos/20ebb374-15bb-11e0-b40e-0018512e6b26/dish/imageEnglish1s'
                }
            ]
        },
        {
            'locale': 'fr_FR',
            'videoList': [
                {
                    'video': 'http://ec2-54-191-213-205.us-west-2.compute.amazonaws.com/videos/20ebb374-15bb-11e0-b40e-0018512e6b26/dish/imageFrench1'
                },
                {
                    'video': 'http://ec2-54-191-213-205.us-west-2.compute.amazonaws.com/videos/20ebb374-15bb-11e0-b40e-0018512e6b26/dish/imageFrench1s'
                }
            ]
        }
    ],
    'smallIcons': [
        {
            'locale': 'en_US',
            'image': 'http://restaurantassets.s3-website-us-west-2.amazonaws.com/restaurant/Test_images/image1.jpg'
        },
        {
            'locale': 'fr_FR',
            'image': 'http://restaurantassets.s3-website-us-west-2.amazonaws.com/restaurant/Test_images/image1.jpg'
        }
    ],
    'mediumIcons': [
        {
            'locale': 'en_US',
            'image': 'http://restaurantassets.s3-website-us-west-2.amazonaws.com/restaurant/Test_images/image1.jpg'
        },
        {
            'locale': 'fr_FR',
            'image': 'http://restaurantassets.s3-website-us-west-2.amazonaws.com/restaurant/Test_images/image1.jpg'
        }
    ],
    'largeIcons': [
        {
            'locale': 'en_US',
            'image': 'http://restaurantassets.s3-website-us-west-2.amazonaws.com/restaurant/Test_images/image1.jpg'
        },
        {
            'locale': 'fr_FR',
            'image': 'http://restaurantassets.s3-website-us-west-2.amazonaws.com/restaurant/Test_images/image1.jpg'
        }
    ],
    'ratings': {
        'FIVE': 0,
        'FOUR': 1,
        'THREE': 0,
        'TWO': 0,
        'ONE': 0
    },
    'restaurantId': '54317694dfc8fbae78568f80',
    'applicableTaxes': [
        {
            'id': '54317694dfc8fbae78568f83'
        },
        {
            'id': '54317694dfc8fbae78568f84'
        }
    ]
};


var menu = {
    '_id': '54317784dfc8fbae78569407',
    'saleType': 'DINE_IN',
    'shortNames': [
        {
            'locale': 'en_US',
            'name': 'Combo Special',
            'suggest': {
                'input': [
                    'Combo',
                    'Special'
                ],
                'output': 'Combo Special'
            }
        },
        {
            'locale': 'fr_FR',
            'name': 'Combo Special',
            'suggest': {
                'input': [
                    'Combo',
                    'Special'
                ],
                'output': 'Combo Special'
            }
        }
    ],
    'longNames': [
        {
            'locale': 'fr_FR',
            'name': 'Combo Special',
            'suggest': {
                'input': [
                    'Combo',
                    'Special'
                ],
                'output': 'Combo Special'
            }
        },
        {
            'locale': 'en_US',
            'name': 'Combo Special',
            'suggest': {
                'input': [
                    'Combo',
                    'Special'
                ],
                'output': 'Combo Special'
            }
        }
    ],
    'description': [
        {
            'locale': 'en_US',
            'name': 'Combo Special'
        },
        {
            'locale': 'fr_FR',
            'name': 'Combo Special'
        }
    ],
    'images': [
        {
            'locale': 'en_US',
            'imageList': [
                {
                    'image': 'HTTP://ec2-54-191-213-205.us-west-2.compute.amazonaws.com/5431776edfc8fbae78569375/img/imageEnglish1'
                },
                {
                    'image': 'HTTP://ec2-54-191-213-205.us-west-2.compute.amazonaws.com/5431776edfc8fbae78569375/img/imageEnglish1s'
                }
            ]
        },
        {
            'locale': 'fr_FR',
            'imageList': [
                {
                    'image': 'HTTP://ec2-54-191-213-205.us-west-2.compute.amazonaws.com/5431776edfc8fbae78569375/img/imageFrench1'
                },
                {
                    'image': 'HTTP://ec2-54-191-213-205.us-west-2.compute.amazonaws.com/5431776edfc8fbae78569375/img/imageFrench1s'
                }
            ]
        }
    ],
    'videos': [
        {
            'locale': 'en_US',
            'videoList': [
                {
                    'video': 'HTTP://ec2-54-191-213-205.us-west-2.compute.amazonaws.com/5431776edfc8fbae78569375/img/imageEnglish1'
                },
                {
                    'video': 'HTTP://ec2-54-191-213-205.us-west-2.compute.amazonaws.com/5431776edfc8fbae78569375/img/imageEnglish1s'
                }
            ]
        },
        {
            'locale': 'fr_FR',
            'videoList': [
                {
                    'video': 'HTTP://ec2-54-191-213-205.us-west-2.compute.amazonaws.com/5431776edfc8fbae78569375/img/imageFrench1'
                },
                {
                    'video': 'HTTP://ec2-54-191-213-205.us-west-2.compute.amazonaws.com/5431776edfc8fbae78569375/img/imageFrench1s'
                }
            ]
        }
    ],
    'smallIcons': [
        {
            'locale': 'en_US',
            'image': 'HTTP://ec2-54-191-213-205.us-west-2.compute.amazonaws.com/5431776edfc8fbae78569375/img/imageEnglish1'
        },
        {
            'locale': 'fr_FR',
            'image': 'HTTP://ec2-54-191-213-205.us-west-2.compute.amazonaws.com/5431776edfc8fbae78569375/img/imageFrench1'
        }
    ],
    'mediumIcons': [
        {
            'locale': 'en_US',
            'image': 'HTTP://ec2-54-191-213-205.us-west-2.compute.amazonaws.com/5431776edfc8fbae78569375/img/imageEnglish1'
        },
        {
            'locale': 'fr_FR',
            'image': 'HTTP://ec2-54-191-213-205.us-west-2.compute.amazonaws.com/5431776edfc8fbae78569375/img/imageFrench1'
        }
    ],
    'largeIcons': [
        {
            'locale': 'en_US',
            'image': 'HTTP://ec2-54-191-213-205.us-west-2.compute.amazonaws.com/5431776edfc8fbae78569375/img/imageEnglish1'
        },
        {
            'locale': 'fr_FR',
            'image': 'HTTP://ec2-54-191-213-205.us-west-2.compute.amazonaws.com/5431776edfc8fbae78569375/img/imageFrench1'
        }
    ],
    'restaurantId': '5431776edfc8fbae78569375',
    'dishes': [
        {
            'dishId': '54317784dfc8fbae78569409',
            'price': null,
            'dishCatoryId': '54317784dfc8fbae78569408'
        },
        {
            'dishId': '54317785dfc8fbae78569412',
            'price': null,
            'dishCatoryId': '54317784dfc8fbae78569408'
        }
    ]
};


//-- Merchant ID with 3 Restaurant Ids
var merchant = {
    '_id' : '54317693dfc8fbae78568f7f',
    'payableAccountNo' : '325117398334566',
    'receiableAccountNo' : '114274747842848',
    'shortNames' : [
        {
            'locale' : 'en_US',
            'name' : 'Nuba Restaurant'
        }
    ],
    'longNames' : [
        {
            'locale' : 'en_US',
            'name' : 'Nuba Restaurant'
        }
    ],
    'parentMerchantId' : '',
    'communications' : [
        {
            'accessDetail' : '',
            'commType' : '',
            'oderNum' : 0
        }
    ],
    'addresses' : [
        {
            'address1' : '207-B W. Hastings St.',
            'address2' : '',
            'city' : 'Vancouver',
            'state' : 'BC',
            'countryCode' : 'CA',
            'postalCode' : 'V6B 1H7',
            'location' : {
                'lat' : 49.282539,
                'lon' : -123.109607
            },
            'addressType' : 'BUSINESS_ADDRESS'
        }
    ],
    'website' : 'http://www.nuba.ca',
    'contactPersons' : [
        {
            'firstName' : '',
            'lastName' : '',
            'fullName' : ', ',
            'gender' : 'MALE',
            'department' : '',
            'position' : '',
            'orderNum' : 0
        }
    ],
    'restaurantIds' : [
        {
            'restaurantId' : '54317694dfc8fbae78568f80'
        },
        {
            'restaurantId' : '543176bfdfc8fbae7856903e'
        },
        {
            'restaurantId' : '543176d5dfc8fbae785690b9'
        }
    ]
};


var merchantWithNoRestaurant = {
    '_id' : '543dd73117de90ba054f868a',
    'payableAccountNo' : '669359947736',
    'receiableAccountNo' : '649380459327',
    'restaurantIds' : [
        {
            'restaurantId' : '54317694dfc8fbae78568f80'
        },
        {
            'restaurantId' : '543176bfdfc8fbae7856903e'
        },
        {
            'restaurantId' : '543176d5dfc8fbae785690b9'
        },
        {
            'restaurantId' : '5464150ef72f592010fa90f6'
        }
    ]
};


var restaurant = {
    '_id': '54317694dfc8fbae78568f80',
    'restaurantBarCode': '20ebb374-15bb-11e0-b40e-0018512e6b26',
    'isChain': false,
    'rating': 49,
    'shortNames' : [
        {
            'locale' : 'en_US',
            'name' : '2014-11-11T01:24:33.000Z',
            'suggest' : {
                'input' : [
                    'Sample-Test',
                    'Restaurant'
                ],
                'output' : 'Sample-Test Restaurant'
            }
        }
    ],
    'longNames' : [
        {
            'locale' : 'fr_FR',
            'name' : 'Nuba Restaurant',
            'suggest' : {
                'input' : [
                    'Nuba',
                    'Restaurant'
                ],
                'output' : 'Nuba Restaurant'
            }
        },
        {
            'locale' : 'en_US',
            'name' : 'Nuba Restaurant',
            'suggest' : {
                'input' : [
                    'Nuba',
                    'Restaurant'
                ],
                'output' : 'Nuba Restaurant'
            }
        }
    ],
    'description' : [
        {
            'locale' : 'en_US',
            'name' : ''
        }
    ],
    'images' : [
        {
            'locale' : 'en_US',
            'imageList' : [
                {
                    'image' : 'imageEnglish'
                }
            ]
        },
        {
            'locale' : 'fr_FR',
            'imageList' : [
                {
                    'image' : 'imageFrench'
                }
            ]
        }
    ],
    'videos' : [
        {
            'locale' : 'en_US',
            'videoList' : [
                {
                    'video' : 'imageEnglish'
                }
            ]
        },
        {
            'locale' : 'fr_FR',
            'videoList' : [
                {
                    'video' : 'imageFrench'
                }
            ]
        }
    ],
    'smallIcons' : [
        {
            'locale' : 'en_US',
            'image' : 'imageEnglish'
        },
        {
            'locale' : 'fr_FR',
            'image' : 'imageFrench'
        }
    ],
    'mediumIcons' : [
        {
            'locale' : 'en_US',
            'image' : 'imageEnglish'
        },
        {
            'locale' : 'fr_FR',
            'image' : 'imageFrench'
        }
    ],
    'largeIcons' : [
        {
            'locale' : 'en_US',
            'image' : 'imageEnglish'
        },
        {
            'locale' : 'fr_FR',
            'image' : 'imageFrench'
        }
    ],
    'lastUpdateTime' : '2014-11-11T01:24:33.000Z',
    'holidayHours' : [
        {
            'startDate' : '2014-7-1',
            'endDate' : '2014-7-2',
            'availableHour' : {
                'start' : '930',
                'end' : '1620'
            }
        },
        {
            'startDate' : '2014-9-30',
            'endDate' : '2014-10-6',
            'availableHour' : {
                'start' : '930',
                'end' : '1620'
            }
        }
    ],
    'regularHours' : [
        {
            'weekDayConstants' : 'MONDAY',
            'availableHour' : {
                'start' : '11:30',
                'end' : '22:30'
            }
        },
        {
            'weekDayConstants' : 'TUESDAY',
            'availableHour' : {
                'start' : '11:30',
                'end' : '23:30'
            }
        },
        {
            'weekDayConstants' : 'WEDNESDAY',
            'availableHour' : {
                'start' : '11:30',
                'end' : '23:30'
            }
        },
        {
            'weekDayConstants' : 'THURSDAY',
            'availableHour' : {
                'start' : '11:30',
                'end' : '11:30'
            }
        },
        {
            'weekDayConstants' : 'FRIDAY',
            'availableHour' : {
                'start' : '11:30',
                'end' : '23:30'
            }
        },
        {
            'weekDayConstants' : 'SATURDAY',
            'availableHour' : {
                'start' : '11:30',
                'end' : '22:00'
            }
        },
        {
            'weekDayConstants' : 'SUNDAY',
            'availableHour' : {
                'start' : '11:30',
                'end' : '22:30'
            }
        }
    ],
    'cuisines' : [
        {
            'id' : '54317694dfc8fbae78568f81'
        }
    ],
    'averagePricePerPerson' : {
        'currency' : {
            'currencyCode' : 'CAD',
            'currencySymbol' : 'CAD'
        },
        'listPrice' : 2679,
        'sellPrice' : 624,
        'exponent' : 2
    },
    'addresses' : {
        'address2' : '',
        'address1' : '207-B W. Hastings St.',
        'city' : 'Vancouver',
        'state' : 'BC',
        'countryCode' : 'CA',
        'postalCode' : 'V6B 1H7',
        'location' : {
            'lat' : 49.282539,
            'lon' : -123.109607
        },
        'addressType' : 'BUSINESS_ADDRESS'
    },
    'tables' : [
        {
            'tableBarCode' : '601547787211',
            'section' : 'D',
            'tableNo' : 1,
            'size' : 2,
            'tableId' : '54317694dfc8fbae78568f82',
            'restaurantId' : '54317694dfc8fbae78568f80'
        }
    ],
    'serviceCharge' : {
        'name' : 'Service Charge',
        'value' : 10,
        'type' : 'byPercentage'
    },
    'taxationRule' : {
        'taxMethod' : 'ParaMel',
        'serviceChargeOn' : false,
        'serviceChargeCalculatedAfterTax' : false,
        'serviceChargeTaxable' : false
    },
    'taxes' : [
        {
            'name' : 'GST',
            'rate' : 5,
            'type' : 'T1',
            'id' : '54317694dfc8fbae78568f83'
        },
        {
            'name' : 'PST',
            'rate' : 7,
            'type' : 'T2_1',
            'id' : '54317694dfc8fbae78568f84'
        },
        {
            'name' : 'HST',
            'rate' : 12,
            'type' : 'T2_2',
            'id' : '54317694dfc8fbae78568f85'
        }
    ],
    'v' : 1,
    'createDate' : '2014-11-11T01:24:33.000Z'
};


var restaurantNeededReplacement = {
    '_id': '543e02fe17de90ba054f8ac8',
    'restaurantBarCode': '20ebb374-15bb-11e0-b40e-0018512e6b26',
    'isChain': false,
    'rating': 49
};


var restaurantNeededRemoved = {
    '_id': '543dd73117de90ba054f8694',
    'restaurantBarCode': '20ebb374-15bb-11e0-b40e-0018512e6b26',
    'isChain': false,
    'rating': 49
};


var config = {
    hosts: [
        {
            server: '127.0.0.1',
            port: 27017
        }
    ],
    database: 'fandine_development'
};


var selectorForRestaurant = {
    'sort': ['createDate', 'desc'],
    fields: {'_id': 1, 'isChain': 1, 'tables': 1, 'taxationRule': 1, 'taxes': 1}
};


var configMongo = {
    mongo: {
        shared: {
            hosts: [
                {
                    server: process.env.MONGO_S1_HOST || '127.0.0.1',
                    port: process.env.MONGO_S1_PORT || 27017
                },
                {
                    server: process.env.MONGO_S2_HOST || '127.0.0.1',
                    port: process.env.MONGO_S2_PORT || 27018
                },
                {
                    server: process.env.MONGO_S3_HOST || '127.0.0.1',
                    port: process.env.MONGO_S3_PORT || 27019
                }
            ]
        },
        environments: {
            development: {
                database: 'fandine_development'
            },
            test: {
                database: 'fandine_test'
            },
            production: {
                database: 'fandine'
            }
        }
    }
};


module.exports = function() {
    return {
        combo: combo,
        comboItem: comboItem,
        cuisine: cuisine,
        dish: dish,
        menu: menu,
        merchant: merchant,
        merchantWithNoRestaurant: merchantWithNoRestaurant,
        restaurant: restaurant,
        restaurantNeededReplacement: restaurantNeededReplacement,
        restaurantNeededRemoved: restaurantNeededRemoved,
        config: config,
        configMongo: configMongo,
        selectorForRestaurant: selectorForRestaurant
    }
};