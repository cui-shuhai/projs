
binode is a project to implement a scalable high performance server
supports upto millions connections implements via javascript, express, REST

create steps:

$ npm install express-generator -g
$ express s3bi
$ cd s3bi
$ npm install
$ DEBUG=s3bi npm start  #run the app instead of node s3bi.js


scui@ubuntu:~/gitprojs/binode$ express s3bi
    create : s3bi
    create : s3bi/package.json
    create : s3bi/app.js
    create : s3bi/public
    create : s3bi/public/javascripts
    create : s3bi/public/images
    create : s3bi/public/stylesheets
    create : s3bi/public/stylesheets/style.css
    create : s3bi/routes
    create : s3bi/routes/index.js
    create : s3bi/routes/users.js
    create : s3bi/views
    create : s3bi/views/index.jade
    create : s3bi/views/layout.jade
    create : s3bi/views/error.jade
    create : s3bi/bin
    create : s3bi/bin/www

    install dependencies:
    $ cd s3bi && npm install

    run the app:
    $ DEBUG=s3bi:* npm start


