var express = require('express');
var router = express.Router();
var log = require('../lib/logger.js');
var db = require('../models/schema');
var path = require('path');
var passport = require('passport');
var mongoose = require('mongoose');
var multer = require('multer');
var util = require("../util/util");
var config = require('../config/config');
var passport = require('passport');
var async = require('async');
router.use(passport.authenticationMiddleware.apiRequests);

router.post('/addupdateCategory', function(req, res, next) {
    try {
        log.info("Add/Update Category called");
        var categoryId = req.body.categoryId;
        var name = req.body.name;
        var approvalNeeded = req.body.approvalNeeded;
        db.category.update({'categoryId': categoryId}, {name: name, approvalNeeded: approvalNeeded}, {upsert: true}, function(err, updateResult) {
            if (err) {
                log.error('Error in adding category' + err);
                var errorMsg = (err.code === 11000) ? "Category already exists" : 'Error in Adding Category';
                res.status(200).json({
                    'error': errorMsg,
                    'status': '200'
                });
            } else {
                log.info("Category added successfully");
                res.status(200).json({
                    'data': 'Category added successfully',
                    'status': '200'
                });
            }
        });
        log.info("Add/Update Category Ends");
    }
    catch(err)
    {
        log.error("Error in adding category"+err);
        res.status(500).json({'error': 'Error in Adding Category'});
    }
});

router.post('/deleteCategory', function(req, res, next) {
    try {
        log.info("Delete Category Starts");
        db.category.remove({categoryId: req.body.categoryId}, function(err, result) {
            if (err) {
                log.error("Error in Delete Category: ", err);
                res.status(200).send({
                    'error': 'Error in Delete Category'
                });
            } else {
                res.status(200).json({
                    'data': 'Category removed successfully'
                });
            }
        });
        log.info("Delete Category Ends");
    }
    catch(err)
    {
        log.error("Error in delete category"+err);
        res.status(500).json({'error': 'Error in Delete Category'});
    }
});

router.get('/getCategoryList', function(req, res) {
    try {
        log.info("Get Category List Starts");
        var start = parseInt(req.query.start);
        var end = parseInt(req.query.end);
        var sortType = req.query.sortType || "";
        var sortOrder = req.query.sortOrder || "";
        var order,sortQuery;
        var query = {};
        if(req.query.queryParam) {
            query.$text = { $search: req.query.queryParam };
        }
        async.parallel({
            total: function(callback) {
                db.category.find(query).count(function(err, total) {
                    if (err) {
                        log.error("Get category Count FAILED");
                        callback(err, null);
                    } else {
                        callback(null, total);
                    }
                })
            },
            category: function(callback) {

              if(sortType == "" || sortOrder == ""){

                log.info("Without sorting called");
                db.category.find(query).skip(start).limit(end - start).sort({
                    _id: -1
                }).exec(function(err, category) {
                    if (err) {
                        log.error("Get category FAILED");
                        callback(err, null);
                    } else {
                        callback(null, category);
                    }
                })

              }else{

                log.info("with sorting called");
                if(sortOrder == "asc"){
                  order = 1;
                }else{
                  order = -1;
                }
                log.info("sortType "+sortType);
                log.info("order "+order);

                if(sortType == "categoryId"){
                  sortQuery = { "categoryId" : order };
                }else if(sortType == "name"){
                  sortQuery = { "name" : order };
                }else if(sortType == "approvalNeeded"){
                  sortQuery = { "approvalNeeded" : order };
                }

                db.category.find(query).skip(start).limit(end - start).sort(sortQuery).exec(function(err, category) {
                    if (err) {
                        log.error("Get category FAILED");
                        callback(err, null);
                    } else {
                        console.log("category", category)
                        callback(null, category);
                    }
                })
              }
            }
        }, function(err, response) {
            if (err) {
                log.error("Error in Get category: ", err);
                res.status(200).send({
                    'error': 'Error in Get Category'
                });
            } else {
                res.status(200).json({"data": response});
                log.info("Get category Success");
            }
        });
        log.info("Get category Ends");
    }
    catch(err) {
        log.error("Error in get category"+err);
        res.status(500).json({'error': 'Error in Get Category'});
    }
});

router.post('/sortCategory',function(req,res){

      log.info("sort category called");
      var sortType = req.body.sortType;
      var sortOrder = req.body.sortOrder;
      var order,query;

      if(sortOrder == "asc"){
        order = 1;
      }else{
        order = -1;
      }

      if(sortType == "categoryId"){
        query = { "categoryId" : order };
      }else if(sortType == "name"){
        query = { "name" : order };
      }else if(sortType == "approvalNeeded"){
        query = { "approvalNeeded" : order };
      }

      db.category.find({}).sort(query).exec(function(err, result){
        if (err) {
          res.status(500).json({'Result':'Error in getting company details','status':'500'});
        }else{
          // log.info(result);
          res.status(200).json({'Result':result,'status':'200'});
        }
      });

});



// router.get('/searchCategoryList', function(req, res) {
//     log.info("searchCategoryList Starts");
//     var start = parseInt(req.query.start);
//     var end = parseInt(req.query.end);
//     var search = req.body.search;
//     var query = {
//         "$or": [{
//             "categoryId": "/.*" + search + ".*/i"
//         }, {
//             "name": "/.*" + search + ".*/i"
//         }]
//     };
//     //query = util.getProductQuery(req.query.type, req.query.queryParam, query);
//     async.parallel({
//         total: function(callback) {
//             db.category.find(query).count(function(err, total) {
//                 if (err) {
//                     log.info("Get category Count FAILED");
//                     callback(err, null);
//                 } else {
//                     callback(null, total);
//                 }
//             })
//         },
//         category: function(callback) {
//             db.category.find(query).skip(start).limit(end - start).sort({
//                 _id: -1
//             }).exec(function(err, category) {
//                 if (err) {
//                     log.info("Get category FAILED");
//                     callback(err, null);
//                 } else {
//                     callback(null, category);
//                 }
//             })
//         }
//     }, function(err, response) {
//         if (err) {
//             log.info("Error: ", err);
//             res.status(500).send({
//                 'error': 'Internal server error'
//             });
//         } else {
//             res.status(200).json({
//                 "data": response
//             });
//             log.info("Get category Success");
//         }
//     });
//     log.info("Get category Ends");
// });


module.exports = router;
