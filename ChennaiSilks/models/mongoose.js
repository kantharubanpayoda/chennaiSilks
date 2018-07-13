var mongoose = require('mongoose');
var config = require('../config/config');
var log = require('../lib/logger.js');
//connect database
mongoose.connect(config.dbHost+'/'+config.dbName);
var connection = mongoose.connection;
connection.on('connected', function() {
    log.info("DATABASE CONNECTED");
});
connection.on('disconnected', function() {
    log.info("DATABASE DISCONNECTED");
});
connection.on('error', function() {
    log.error("DATABASE ERROR");
});

module.exports = mongoose;
