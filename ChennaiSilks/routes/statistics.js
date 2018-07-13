var express = require('express');
var router = express.Router();
var log = require('../lib/logger.js');
var db = require('../models/schema');
var util = require("../util/util");
var passport = require('passport');
var mongoose = require('mongoose');
var async = require('async');

router.use(passport.authenticationMiddleware.apiRequests);

//get statistics
router.get('/getStatistics', function(req, res, next) {
    try {
        log.info("Get Statistics Starts");
        async.parallel({
            annual: function(callback) { 
                getAnnualStatus(callback, req)
            },
            filtered: function(callback) { 
                getFilteredStatus(callback, req)
            }
        }, function(err, response) {
            if(err) {
                log.error("Error: ", err);
                res.status(200).send({'error': 'Internal server error'});
            } else {
                res.status(200).json({"data": response});
                log.info("Get Statistics Success");
            }
        });
    } catch(err) {
        log.error("Error in Get Statistics:"+err);
        res.status(500).json({'error': 'Error in Get Statistics'});
    }
});

//get month wise status
function getAnnualStatus(callback, req) {
    var query = util.getUserFilterQuery(req.user);
    var currentYear = new Date().getFullYear();
    db.productDetail.aggregate([
        {$match: query},
        {$project: {year: {$year: "$createdDate"}, month: {$month: "$createdDate"}, status: 1}},
        {$match: {year: currentYear}},
        {$group : {_id : "$month", total: { $sum: 1 }, 
                                     toBeApproved: {$sum: {"$cond": [{$eq: ["$status", util.statusMapper.toBeApproved]},1,0]}},
                                     subToApprover: {$sum: {"$cond": [{$eq: ["$status", util.statusMapper.subToApprover]},1,0]}},
                                     approved: {$sum: {"$cond": [{$eq: ["$status", util.statusMapper.approved]},1,0]}},
                                     rejToSupplier: {$sum: {"$cond": [{$eq: ["$status", util.statusMapper.rejToSupplier]},1,0]}},
                                     rejFromApprover: {$sum: {"$cond": [{$eq: ["$status", util.statusMapper.rejFromApprover]},1,0]}}
         }},
        {$project: {_id: 0, month: "$_id", total: 1, toBeApproved: 1, subToApprover: 1, approved: 1, rejToSupplier: 1, rejFromApprover: 1}}
    ], function(err, statistics){
        if(err) {
            log.error("Get Annual Statistics Failed");
            callback(err, null);
        } else {
            log.info("Get Annual Statistics Success");
            callback(null, statistics);
        }        
    });
};


//get status for the date filtered
function getFilteredStatus(callback, req) {
    if(!req.query.from || !req.query.to) {
        callback(err, null);  
    }
    var query = util.getUserFilterQuery(req.user);
    query.createdDate = {$gte: new Date(parseInt(req.query.from)) , $lte: new Date(parseInt(req.query.to))};
    db.productDetail.aggregate([
        {$match: query},
        {$project: {status: 1}},
        {$group : {_id : null, total: { $sum: 1 }, 
                                    toBeApproved: {$sum: {"$cond": [{$eq: ["$status", util.statusMapper.toBeApproved]},1,0]}},
                                    subToApprover: {$sum: {"$cond": [{$eq: ["$status", util.statusMapper.subToApprover]},1,0]}},
                                    approved: {$sum: {"$cond": [{$eq: ["$status", util.statusMapper.approved]},1,0]}},
                                    rejToSupplier: {$sum: {"$cond": [{$eq: ["$status", util.statusMapper.rejToSupplier]},1,0]}},
                                    rejFromApprover: {$sum: {"$cond": [{$eq: ["$status", util.statusMapper.rejFromApprover]},1,0]}},
        }},
        {$project: {_id: 0, total: 1, toBeApproved: 1, subToApprover: 1, approved: 1, rejToSupplier: 1, rejFromApprover: 1}}
    ], function(err, statistics){
        if(err) {
            log.error("Get Filtered Statistics Failed");
            callback(err, null);
        } else {
            log.info("Get Filtered Statistics Success");
            if(statistics.length > 0) {
                callback(null, statistics[0]);
            } else {
                callback(null, {total: 0, toBeApproved: 0, subToApprover: 0, approved: 0, rejToSupplier: 0, rejFromApprover: 0});
            }
            
        }        
    });
};

router.get('/getUserStatistics', passport.authenticationMiddleware.apiRequests, function(req, res) {
    try {
        db.profiles.aggregate([
            {$match: { $or: [{roles: "designer"}, {roles: "reviewer"}]}},
            {$unwind : "$roles" },
            {$group : {_id : null, designerCount: {$sum: {"$cond": [{$eq: ["$roles", "designer"]},1,0]}},
                                reviewerCount: {$sum: {"$cond": [{$eq: ["$roles", "reviewer"]},1,0]}}                                
            }},
            {$project: {_id: 0, designerCount: 1, reviewerCount: 1}}
        ], function(err, statistics){
            if(err) {
                log.error("Get User Statistics Failed");
                res.status(200).send({'error': 'Internal server error'});
            } else {
                log.info("Get User Statistics Success");            
                res.status(200).json({"data": statistics[0]});
            }        
        });
    }
    catch(err) {
        log.error("Get User Statistics Failed:"+err);
        res.status(500).json({'error': 'Error in Get User Statistics'});
    }
});

module.exports = router;