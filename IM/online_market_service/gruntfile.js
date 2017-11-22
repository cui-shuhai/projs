/**
 * Created by richardmaglaya on 2014-10-24.
 */
'use strict';

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        jshint: {
            options: {
                strict: true,
                node: true,
                unused: true,
                bitwise: true,
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                quotmark: true,
                regexp: true,
                undef: true,
                trailing: true,
                smarttabs: true,
                globals: {
                    describe: false,
                    it: false,
                    before: false,
                    beforeEach: false,
                    after: false,
                    afterEach: false
                }
            },
            all: [
                'app.js',
                'cluster.js',
                'app/**/*.js',
                'config/*.js',
                'gruntfile.js',
                'test/e2e/*.js',
                'test/unit/*.js'
            ]
        },
        mochaTest: {

            //-- Unit Tests
            moduleBDD: {
                options: {
                    reporter: 'spec',
                    require: 'test/coverage/blanket'
                },
                src: [
                    'test/unit/*.js'
                ]
            },
            moduleBDDCoverageHTML: {
                options: {
                    reporter: 'html-cov',
                    quiet: true,
                    captureFile: 'test/coverage/coverage.html'
                },
                src: [
                    'test/unit/*.js'
                ]
            },
            moduleBDDCoverageJSON: {
                options: {
                    reporter: 'json-cov',
                    quiet: true,
                    captureFile: 'test/coverage/coverage.json'
                },
                src: [
                    'test/unit/*.js'
                ]
            },

            //-- E2E Tests
            moduleBDDE2E: {
                options: {
                    reporter: 'spec',
                    require: 'test/coverage/blanket'
                },
                src: [
                    'test/e2e/*.js'
                ]
            },
            moduleBDDE2ECoverageHTML: {
                options: {
                    reporter: 'html-cov',
                    quiet: true,
                    captureFile: 'test/coverage/coverage.html'
                },
                src: [
                    'test/e2e/*.js'
                ]
            },
            moduleBDDE2ECoverageJSON: {
                options: {
                    reporter: 'json-cov',
                    quiet: true,
                    captureFile: 'test/coverage/coverage.json'
                },
                src: [
                    'test/e2e/*.js'
                ]
            }
        },
        env: {
            options: {},
            dev: {
                NODE_ENV: 'development'
            },
            test: {
                NODE_ENV: 'test'
            },
            production: {
                NODE_ENV: 'production'
            }
        },
        watch: {
            files: [
                'app/*.js',
                'app/**/*.js',
                'gruntfile.js',
                'test/*.js',
                'test/e2e/*.js',
                'test/unit/*.js'
            ],
            tasks: [
                'jshint',
                'test'
            ]
        },
        shell: {}
    });

    grunt.registerTask('test', [
        'env:test',
        'mochaTest:moduleBDD',
        'mochaTest:moduleBDDCoverageHTML',
        'mochaTest:moduleBDDCoverageJSON'
    ]);

    grunt.registerTask('e2e', [
        'mochaTest:moduleBDDE2E',
        'mochaTest:moduleBDDE2ECoverageHTML',
        'mochaTest:moduleBDDE2ECoverageJSON'
    ]);

    grunt.registerTask('default', [
        'jshint',
        'test',
        'watch'
    ]);
};