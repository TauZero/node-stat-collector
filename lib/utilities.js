module.exports.jsend = function(status, data){
    var obj = {
        status: status,
        data: data
    };

    this.jsendStatusSent = status;
    this.send(obj);
};
