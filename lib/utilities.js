module.exports.jsend = function(status, data){
    var obj = {
        status: status,
        data: data
    };

    this.jsendStatusSent = status;
    this.send(obj);
};

module.exports.resEnd = function(data, encoding){
    this.realEnd(data, encoding);
    this.emit('end');
}
