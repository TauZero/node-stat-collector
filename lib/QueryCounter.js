var redis = require('redis'),
    async = require('async');

function QueryCounter(options){
    this.options = options || {};
    if(!this.options.redisConfig) this.options.redisConfig = {};
    this.pushInterval = { time: this.options.pushInterval || 30000 };
    this.redisClient = redis.createClient(
        this.options.redisConfig.port,
        this.options.redisConfig.host,
        this.options.redisConfig.options
    );
    this.statPrefix = this.options.statPrefix || '';
    this.stats = {
        requestTotal: {},
        responseTotal: {},
        success: {},
        error: {},
        fail: {}
    };
    this.registeredURIs = {};
    this.debug = this.options.debug || false;
    this.push();
}

QueryCounter.prototype.registerURI = function(uri){
    var self = this;

    if(self.registeredURIs[uri]) return;

    self.debugLog('Registering URI:',uri);
    for(var i in self.stats){
        self.stats[i][uri] = 0;
    }
};

QueryCounter.prototype.track = function(req, res){
    var self = this;
    var uri = req._parsedUrl.pathname;
    self.debugLog('Tracking URI:',uri);

    self.debugLog('Increment requestTotal for URI:',uri);
    self.stats.requestTotal[uri]++;

    res.on('end', function(){
        self.debugLog('Increment responseTotal for URI:',uri);
        self.stats.responseTotal[uri]++;
        
        var responseType = (this.jsendStatusSent || '').toLowerCase();
        if(responseType){
            self.debugLog('Increment',responseType,'for URI:',uri);
            self.stats[responseType][uri]++;
        }
    });
};

QueryCounter.prototype.push = function(){
    var self = this;
    self.debugLog('Beginning stat push');

    clearTimeout(self.pushInterval.timer);

    self.debugLog('Compiling stats array');
    var pushArray = [];
    for(var statName in self.stats){
        var stat = self.stats[statName];
        var totalCount = 0;
        for(var uri in stat){
            var uriCount = stat[uri];
            totalCount += count;
            syncArray.push([statName,uri,uriCount]);
            self.stats[statName][uri] = 0;
        }
        pushArray.push([statName,'total',totalCount]);
    }

    self.debugLog('Incrementing Redis counts');
    async.map(pushArray, function(stat, asyncCallback){
        self.redisClient.hincrby('' + self.statPrefix + stat[0], stat[1], stat[2], function(err, res){
            asyncCallback();
        });
    }, function(err, res){
        self.debugLog('Done incrementing, setting timer');
        self.pushInterval.timer = setTimeout(self.push, self.pushInterval.time);
    });
};

QueryCounter.prototype.debugLog = function(){
    var self = this;

    if(!self.debug) return;

    var args = arguments;
    var logArgs = ['[',new Date (),']','[ Stat Collector - QueryCounter DEBUG ]'];
    for(var i = 0, len = args.length; i < len; i++){
        logArgs.push(args[i]);
    }

    console.log.apply(this, logArgs);
};

module.exports = QueryCounter;
