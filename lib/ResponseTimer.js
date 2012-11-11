var https = require('https');

function ResponseTimer(options){
    this.options = options || {};
    this.pushInterval = { time: this.options.pushInterval || 30000 };
    this.circonusConfig = this.options.circonusConfig || {};
    this.stats = {};
    this.registeredURIs = {};
    this.debug = this.options.debug || false;
    this.push();
}

ResponseTimer.prototype.registerURI = function(uri){
    var self = this;

    if(self.registeredURIs[uri]) return;

    self.debugLog('Registering URI:', uri);
    self.stats[uri] = {
        _type: 'n',
        _value: []
    };
    self.registeredURIs[uri] = true;
};

ResponseTimer.prototype.resetStats = function(completeReset){
    var self = this;

    if(completeReset){
        self.stats = {};
        self.registeredURIs = {};
        self.debugLog('Reset Stats to {}');
        return;
    }
    
    for(var uri in self.stats){
        self.stats[uri]._value = [];
    }
    self.debugLog('Reset Stats (_value only)');
};

ResponseTimer.prototype.track = function(req, res){
    var self = this;
    var uri = req._parsedUrl.pathname;
    self.debugLog('Tracking URI:',uri);

    var trackTimeBegin = Date.now();
    res.on('end', function(){
        self.debugLog('Storing response time for URI:',uri);
        var trackTimeEnd = Date.now();
        self.stats[uri]._value.push(trackTimeEnd - trackTimeBegin);
        console.log(self.stats);
    });
};

ResponseTimer.prototype.push = function(){
    var self = this;
    self.debugLog('Beginning stat push');

    clearTimeout(self.pushInterval.timer);

    var payload = JSON.stringify(self.stats);
    self.resetStats();

    var httpOptions = {
        host: self.circonusConfig.host,
        port: self.circonusConfig.port,
        path: self.circonusConfig.path,
        method: 'PUT',
        headers:{
            'Content-Length': payload.length
        }
    };

    self.debugLog('Pushing with http options',httpOptions);

    var req = https.request(httpOptions, function(res){
        var buffer = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk){
            buffer += chunk;
        });

        res.on('end', function(){
            self.debugLog('Push "end" response, setting timer');
            self.pushInterval.timer = setTimeout(self.push.bind(self), self.pushInteval.time);
        });
        res.on('close', function(){
            self.debugLog('Push "close" response, setting timer');
            self.pushInterval.timer = setTimeout(self.push.bind(self), self.pushinterval.time);
        });
    });

    req.on('error', function(err){
        self.debugLog('Push "error" response, setting timer. Err:',err);
        self.pushInterval.timer = setTimeout(self.push.bind(self), self.pushInterval.time);
    });

    req.write(payload);
    req.end();
};

ResponseTimer.prototype.debugLog = function(){
    var self = this;
    if(!self.debug) return;

    var args = arguments;
    var logArgs = ['[',new Date(),']','[ Stat Collector - ResponseTimer DEBUG ]'];
    for(var i = 0, len = args.length; i < len; i++){
        logArgs.push(args[i]);
    }
    
    console.log.apply(this, logArgs);
};

module.exports = ResponseTimer;
