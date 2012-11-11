# node-stat-collector

Basic stat collection for Node.js web applications. Comes with Express.js middleware support.

## Installation

    npm install stat-collector

## Available Tracking ##

* Query Counts - saved to Redis
* Response Times - pushed to Circonus

Only configured components will be enabled, allowing one to only track what is necessary.

## Examples

### Using Express.js Middleware

    var express = require('express');
    var StatCollector = require('StatCollector');

    var statCollector = new StatCollector();
    statCollector.setDebug(true); // Global debug logging (default false)

    var queryCounterConfig = {
        redisConfig: { // Configuration options for node-redis
            host: 'localhost',
            port: 1234,
            options: {}
        },
        statPrefix: 'foo_', // Prefix for stat hashes in Redis (e.g. 'foo_' for foo_requestTotal)
        pushInterval: 30000, // Interval (ms) in which to update Redis (default 30000)
        debug: false // Debug logging (default false)
    };

    var responseTimerConfig = {
        circonusConfig: { // Circonus HTTP Trap check config
            host: 'foo',
            port: 1234,
            path: '/'
        },
        pushInterval: 30000,  // Interval (ms) in which to push to Circonus (default 30000)
        debug: false // Debug loging for this module (default false)
    };

    statCollector.configureQueryCounter(queryCounterConfig);
    statCollector.configureResponseTimer(responseTimerConfig);

    var app = express();

    app.configure( function(){
        app.use(statCollector.middleware());
        app.use(app.router);
    });

    app.get('/foo',function(req,res){
        res.jsend('success',{'foo':'bar'});
    });

    app.listen(9000);
