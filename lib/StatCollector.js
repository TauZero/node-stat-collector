/**
 * Module dependencies.
 */
var utilities = require('./utilities'),
    ResponseTimer = require('./ResponseTimer'),
    QueryCounter = require('./QueryCounter');

function StatCollector(){
    this.responseTimer = undefined;
    this.queryCounter = undefined;
    this.debug = false;
}

StatCollector.prototype.configureResponseTimer = function(options){
    var self = this;

    self.responseTimer = new ResponseTimer(options);
    if(!options || typeof options.debug === 'undefined') self.responseTimer.debug = self.debug;
};

StatCollector.prototype.configureQueryCounter = function(options){
    var self = this;

    self.queryCounter = new QueryCounter(options);
    if(!options || typeof options.debug === 'undefined') self.queryCounter.debug = self.debug;
};

StatCollector.prototype.middleware = function(){
    var self = this;
    return self._middleware.bind(self);
}

StatCollector.prototype._middleware = function(req, res, next){
    var self = this;

    res.jsend = utilities.jsend;
    res.realEnd = res.end;
    res.end = utilities.resEnd;

    self.registerURI(req._parsedUrl.pathname);

    if(self.responseTimer) self.responseTimer.track(req, res);
    if(self.queryCounter) self.queryCounter.track(req, res);
    
    next();
};

StatCollector.prototype.registerURI = function(uri){
    var self = this;

    if(self.responseTimer) self.responseTimer.registerURI(uri);
    if(self.queryCounter) self.queryCounter.registerURI(uri);
};

StatCollector.prototype.setDebug = function(debug){
    var self = this;

    debug = !!debug;
    self.debug = debug;
    if(self.responseTimer) self.responseTimer.debug = debug;
    if(self.queryCounter) self.queryCounter.debug = debug;
};

module.exports = StatCollector;
