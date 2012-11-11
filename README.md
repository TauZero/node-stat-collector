# node-stat-collector

    Basic stat collection for Node.js web applications. Comes with Express.js middleware support.

### Available Tracking ###

    * Query Counts - saved to Redis
    * Response Times - pushed to Circonus

## Installation
    npm install stat-collector

## Examples

### Using Express.js Middleware

    var express = require('express');
    var StatCollector = require('StatCollector');

    var statCollector = new StatCollector();
    statCollector.setDebug(true);

    statCollector.configureQueryCounter({redisConfig:{host:'localhost'},statPrefix:'foo_'});
    statCollector.configureResponseTimer({circonusConfig:{host:'FOO',port:12345,path:'/module/httptrap/BAR/BAZ'}});

    var app = express();

    app.configure( function(){
        app.use(statCollector.middleware());
        app.use(app.router);
    });

    app.get('/foo',function(req,res){
        res.jsend('success',{'foo':'bar'});
    });

    app.listen(9000);
