var https = require('https');

function ResponseTimer(options){
    this.options = options || {};
    this.pushInterval = { time: this.options.pushInterval || 30000 };
    this.circonusHTTPConfig = this.options.circonusHTTPConfig;
    this.stats = {};
    this.registeredURIs = {};
    this.debug = this.options.debug || false;
}

ResponseTimer.prototype.registerURI = function(uri){
    var self = this;

    if(self.registeredURIs[uri]) return;

    self.debugLog('Registering URI:', uri);
    self.stats[uri] = {
        _type: 'n',
        _value: []
    };
};

ResponseTimer.prototype.resetStats = function(completeReset){
    var self = this;

    if(completeReset){
        self.stats = {};
        self.debugLog('Reset Stats to {}');
        return;
    }
    
    for(var uri in stats){
        self.stats[uri]._value = [];
    }
    self.debugLog('Reset Stats (_value only)');
};

ResponseTimer.prototype.track = function(req, res){
    var self = this;
    var uri = req.route;
    self.debugLog('Tracking URI:',uri);

    var trackTimeBegin = Date.now();
    res.on('end', function(){
        self.debugLog('Storing response time for URI:',uri);
        var trackTimeEnd = Date.now();
        circonusPayload[uri]._value.push(trackTimeEnd - trackTimeBegin);
    });
};

ResponseTimer.prototype.push = function(){
    var self = this;
    self.debugLog('Beginning stat push');

    clearTimeout(self.pushInterval.timer);

    var payload = JSON.stringify(circonusPayload);
    self.resetStats();

    var httpOptions = {
        host: self.circonusHTTPConfig.host,
        port: self.circonusHTTPConfig.port,
        path: self.circonusHTTPConfig.path,
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
            self.pushInterval.timer = setTimeout(self.push, self.pushTimer.time);
        });
        res.on('close', function(){
            self.debugLog('Push "close" response, setting timer');
            self.pushInterval.timer = setTimeout(self.push, self.pushTimer.time);
        });
    });

    req.on('error', function(err){
        self.debugLog('Push "error" response, setting timer. Err:',err);
        self.pushInterval.timer = setTimeout(self.push, self.pushTimer.time);
    });

    req.write(payload);
    req.end();
};

ResponseTimer.prototype.debugLog = function(){
    var self = this;

    if(!self.debug) return;

    var args = arguments;
    var logArgs = ['[',Date,']','[ Stat Collector - ResponseTimer DEBUG ]'];
    for(var i = 0, len = args.length; i < len; i++){
        logArgs.push(args[i]);
    }
    
    console.log.apply(this, logArgs);
};

module.exports = ResponseTimer;
