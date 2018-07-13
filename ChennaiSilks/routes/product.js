var express = require('express');
var router = express.Router();
var log = require('../lib/logger.js');
var db = require('../models/schema');
var path = require('path');
var passport = require('passport');
var mongoose = require('mongoose');
var archiver = require('archiver');
var mkdirp = require('mkdirp');
var async = require('async');
var rimraf = require('rimraf');
var multer  = require('multer');
var util = require("../util/util");
var config = require('../config/config');

//configure file upload
var upload = multer({ storage: util.storage, fileFilter: util.imageFilter, limits: {files: 10} }).array('files');

//authenticate requests
router.use(passport.authenticationMiddleware.apiRequests);
router.use(util.productRoleValidation);

//to upload files to fileserver
router.post('/addImage', function(req, res, next) {
    try {
        log.info("File Upload starts");
        upload(req, res, function (err) {
            if(err) {
                log.error("File Upload Failed - Error:", err);
                if(err.errorCode === 'PROD_EXISTS') {
                    res.status(200).send({'error': 'Product already exists'});
                } else {
                    util.deleteFolder(req.body.folderName);
                    res.status(200).send({'error': 'File validation error'});
                }
            } else {
                log.info("File Upload Success");
                var imageUrl = [];
                for(var i=0;i<req.files.length;i++) {
                    imageUrl.push("/uploads/product_images/" + req.body.folderName + "/" + req.files[i].originalname);
                }
                res.status(200).json({"data": imageUrl});
            }
            log.info("File Upload ends");
        });
    }
    catch(err)
    {
        log.info("Error in File Upload"+err);
        res.status(500).json({'error': 'Error in File Upload'});
    }
});

//create new product
router.post('/createProduct', util.productDataValidation, function(req, res, next) {
    try {
        log.info("Create Product Starts");
        req.body.supplier = req.user._id;
        req.body.status = util.statusMapper.toBeApproved;
        req.body.designer = req.user.mappedUser;
        req.body.createdDate = new Date();
        req.body.updatedDate = new Date();
        var product = new db.productDetail(req.body);
        product.save(function(err) {
            if (err) {
                log.error("Create Product Failed - Error: ", err);
                util.deleteFolder(req.body.productID);
                res.status(200).send({'error': 'Bad Request'});
            } else {
                log.info("Create Product Success");
                res.status(200).json({data: 'Product saved successfully!'});
            }
        });
        log.info("Create Product Ends");
    }
    catch(err)
    {
        log.error("Error in Create Product"+err);
        res.status(500).json({'error': 'Error in Create Product'});
    }
});

//update product
router.post('/updateProduct', util.productDataValidation, function(req, res, next) {
    try {
        log.info("Update Product Starts");
        req.body.updatedDate = new Date();
        if(req.body.status === util.statusMapper.subToApprover) {
            req.body.reviewer = req.user.mappedUser;
        }
        if((req.body.oldStatus === util.statusMapper.toBeApproved && req.body.status === util.statusMapper.subToApprover) || req.body.status === util.statusMapper.approved) {
            req.body.rejectReason = '';
        }
        delete req.body.oldStatus;
        db.productDetail.findOneAndUpdate({"productID": req.body.productID}, req.body, {new: true}, function(err, product) {
            if (err) {
                log.error("Update Product Failed - Error: ", err);
                res.status(200).send({'error': 'Bad Request'});
            } else {
                log.info("Update Product Success");
                res.status(200).json({data: product});
            }
        });
        log.info("Update Product Ends");
    }
    catch(err)
    {
        log.info("Error in Update Product"+err);
        res.status(500).json({'error': 'Error in Update Product'});
    }
});

//download product - to get products to be downloaded in post data and store in temp variable
var downloadProducts = {};
router.post('/downloadProducts', function(req, res, next) {
    try {
        log.info("Download product Generate Id starts");
        if(req.body.length > 0) {
            var downloadId = "download" + new Date().getTime();
            downloadProducts[downloadId] = req.body;
            res.status(200).send({'data': downloadId});
        } else {
            log.error("Error in Download Product: Array is empty");
            res.status(200).send({'error': 'Product data empty'});
        }
        log.info("Download product Generate Id ends");
    }
    catch(err) {
        log.error("Error in Download Product"+err);
        res.status(500).json({'error': 'Error in Download Product'});
    }
});

//download product - form the zip file and send
router.get('/downloadProducts', function(req, res, next) {
    try {
        log.info("Download product starts");
        if(downloadProducts[req.query.downloadId]) {
            var archive = archiver('zip');
            archive.on('error', function(err) {
                res.status(200).send({error: err.message});
            });
            //on stream closed we can end the request
            archive.on('end', function() {
                log.info('Archive wrote %d bytes', archive.pointer());
            });
        //set the archive name
        if(downloadProducts[req.query.downloadId].length > 1) {
            res.attachment(config.folderName + '.zip');
        } else {
            res.attachment(downloadProducts[req.query.downloadId][0].productId + '.zip');
        }
        //this is the streaming magic
        archive.pipe(res);
        var directory = "";
        downloadProducts[req.query.downloadId].forEach(function( downloadObj, index ) {
            directory = path.join(__dirname, '..', 'uploads', 'product_images', downloadObj.productId);
            archive.directory(directory, directory.replace(path.join(__dirname, '..', 'uploads', 'product_images'), ''));
        });
        archive.finalize();
        delete downloadProducts[req.query.downloadId];
        } else {
            res.status(200).send({'error': 'Download id incorrect'});
        }
        log.info("Download product Ends");
    }
    catch(err) {
        log.error("Error in Download Product"+err);
        res.status(500).json({'error': 'Error in Download Product'});
    }
});

router.get('/getProductById', function(req, res, next) {
    log.info("Get Product By Id Starts", req.query.productId, typeof req.query.productId);
    db.productDetail.findOne({productID: req.query.productId}, function(err, product){
        if(err) {
            log.error("Get Product By Id FAILED");
            log.error("Error: ", err);
            res.status(200).send({'error': 'Internal server error'});
        } else {
            res.status(200).json({"data": product});
            log.info("Get Product By Id Success");
        }
        log.info("Get Product By Id Ends");
    });
});

// router.get('/getAllProductDetails', function(req, res, next) {
//     db.productDetail.find({}).exec(function(err, productDetail) {
//         if (err)
//             res.send(err);

//         res.json(productDetail);
//     });
// });

router.get('/getProducts', function(req, res) {
    log.info("Get Approved Products Starts");
    var start = parseInt(req.query.start);
    var end = parseInt(req.query.end);
    var sortType = req.query.sortType || "";
    var sortOrder = req.query.sortOrder || "";
    var order,sortQuery;
    var query = util.getUserFilterQuery(req.user);
    query = util.getProductQuery(req.query.type, req.query.queryParam, query);
    async.parallel({
        total: function(callback) {
            db.productDetail.find(query).count(function(err, total) {
                if(err) {
                    log.info("Get Approved Products Count FAILED");
                    callback(err, null);
                } else {
                    callback(null, total);
                }
            })
        },
        products: function(callback) {


          if(sortType == "" || sortOrder == ""){

            log.info("Without sorting called");
            db.productDetail.find(query).skip(start).limit(end - start).sort({_id:-1}).exec(function(err, approvedProducts) {
                if(err) {
                    log.info("Get Approved Products FAILED");
                    callback(err, null);
                } else {
                    callback(null, approvedProducts);
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

            if(sortType == "productID"){
              sortQuery = { "productID" : order };
            }else if(sortType == "name"){
              sortQuery = { "name" : order };
            }else if(sortType == "createdDate"){
              sortQuery = { "createdDate" : order };
            }else if(sortType == "status"){
              sortQuery = { "status" : order };
            }

            db.productDetail.find(query).skip(start).limit(end - start).sort(sortQuery).exec(function(err, approvedProducts) {
                if(err) {
                    log.info("Get Approved Products FAILED");
                    callback(err, null);
                } else {
                    callback(null, approvedProducts);
                }
            })
          }
        }
    }, function(err, response) {
        if(err) {
            log.info("Error: ", err);
            res.status(200).send({'error': 'Internal server error'});
        } else {
            res.status(200).json({"data": response});
            log.info("Get Approved Products Success");
        }
    });
    log.info("Get Approved Products Ends");
});

router.get('/getRecentProductStats',function(req,res){
  log.info("get recent product called");

  var filterDate = new Date(new Date().getTime() - (config.recentDays * 24 * 60 * 60 * 1000));
  log.info(filterDate);

  async.parallel({
      approved: function(callback) {
          db.productDetail.find({"createdDate": {$gte: filterDate},"status":"Approved"}).count(function(err, approved) {
              if(err) {
                  log.info("Get Recent Products Count FAILED");
                  callback(err, null);
              } else {
                  callback(null, approved);
              }
          })
      },
      all: function(callback) {
          db.productDetail.find({"createdDate": {$gte: filterDate}}).count(function(err, all) {
              if(err) {
                  log.info("Get Recent Products Count FAILED");
                  callback(err, null);
              } else {
                  callback(null, all);
              }
          })
      },
      yetToBeApproved: function(callback) {
          db.productDetail.find({"createdDate": {$gte: filterDate},"status":"yet to be Approved"}).count(function(err, yetToBeApproved) {
              if(err) {
                  log.info("Get Recent Products Count FAILED");
                  callback(err, null);
              } else {
                  callback(null, yetToBeApproved);
              }
          })
      },
      rejected: function(callback) {
          db.productDetail.find({"createdDate": {$gte: filterDate},"status":"Rejected"}).count(function(err,rejected) {
              if(err) {
                  log.info("Get Recent Products Count FAILED");
                  callback(err, null);
              } else {
                  callback(null,rejected);
              }
          })
      }
  }, function(err, response) {
      if(err) {
          log.info("Error: ", err);
          res.status(200).send({'error': 'Internal server error'});
      } else {
          res.status(200).json({"data": response});
          log.info("Get Recent Product stats Success");
      }
  });
});




router.get('/getProductsStats', function(req, res) {
    log.info("Get Products Stats called");
    async.parallel({
        approved: function(callback) {
            db.productDetail.find({status:"Approved"}).count(function(err, approved) {
                if(err) {
                    log.info("Get Approved Products Count FAILED");
                    callback(err, null);
                } else {
                    callback(null, approved);
                }
            })
        },
        all: function(callback) {
            db.productDetail.find().count(function(err, all) {
                if(err) {
                    log.info("Get Approved Products Count FAILED");
                    callback(err, null);
                } else {
                    callback(null, all);
                }
            })
        },
        yetToBeApproved: function(callback) {
            db.productDetail.find({status:"yet to be Approved"}).count(function(err, yetToBeApproved) {
                if(err) {
                    log.info("Get Approved Products Count FAILED");
                    callback(err, null);
                } else {
                    callback(null, yetToBeApproved);
                }
            })
        },
        rejected: function(callback) {
            db.productDetail.find({status:"Rejected"}).count(function(err,rejected) {
                if(err) {
                    log.info("Get Approved Products Count FAILED");
                    callback(err, null);
                } else {
                    callback(null,rejected);
                }
            })
        }
    }, function(err, response) {
        if(err) {
            log.info("Error: ", err);
            res.status(200).send({'error': 'Internal server error'});
        } else {
            res.status(200).json({"data": response});
            log.info("Get Approved Products Success");
        }
    });
    log.info("Get Products Stats called");
});

router.post('/deleteProduct', function(req, res, next) {
    log.info("Delete Products Starts");
    db.productDetail.remove({ productID: {'$in': req.body.productIds} }, function (err, result) {
        if (err) {
            log.info("Error: ", err);
            res.status(200).send({'error': 'Internal server error'});
          } else {
            if(result.n > 0) {
                req.body.productIds.forEach(function(folderName) {
                    rimraf('../uploads/product_images/' + folderName, function (err) {
                        if(err) {
                            log.info("Error: ", err);
                        } else {
                            log.info('Deleted:', folderName);
                        }
                    });
                });
                res.status(200).json({ 'data': 'Product removed successfully'});
            } else {
                res.status(200).json({ 'error': 'Product not found'});
            }
            log.info("Delete Products Ends");
          }
    });
});

// router.post('/deleteMultipleProduct', function(req, res, next) {

//     db.productDetail.remove({'productID':{'$in':req.body.productID}}, function (err, result) {
//         if (err) {
//             res.status(417).json({ 'error': 'productID does not exist'});
//           } else {
//             res.status(200).json({ 'success': 'products removed successfully'});
//           }
//     });

// });

router.get('/getRecentProducts', function(req, res, next) {
    try {
        log.info("Get Recent Products Starts");
        var start = parseInt(req.query.start);
        var end = parseInt(req.query.end);
        var userQuery = util.getUserFilterQuery(req.user);
        var prodQuery;
        if(req.query.type === "overDue") {
            var overDueDate = new Date(new Date().getTime() - (config.overDueDays * 24 * 60 * 60 * 1000));
            prodQuery = {"createdDate": {$lte: overDueDate}, "status": util.statusMapper.toBeApproved};
        } else {
            var filterDate = new Date(new Date().getTime() - (config.recentDays * 24 * 60 * 60 * 1000));
            prodQuery = {"createdDate": {$gte: filterDate}};
            prodQuery = util.getProductQuery(req.query.type, "", prodQuery);
        }
        if(req.query.queryParam)
        prodQuery.$text = { $search: "\"" + req.query.queryParam + "\"" };
        async.parallel({
            total: function(callback) {
                db.productDetail.find(Object.assign(userQuery, prodQuery)).count(function(err, total) {
                    if(err) {
                        log.info("Get Recent Products Count FAILED");
                        callback(err, null);
                    } else {
                        callback(null, total);
                    }
                })
            },
            products: function(callback) {
                db.productDetail.find(Object.assign(userQuery, prodQuery)).skip(start).limit(end - start).sort({_id:-1}).exec(function(err, recentList) {
                    if(err) {
                        log.info("Get Recent Products FAILED");
                        callback(err, null);
                    } else {
                        callback(null, recentList);
                    }
                    log.info("Get Recent Products Ends");
                });
            }
        }, function(err, response) {
            if(err) {
                log.error("Get Recent Products FAILED - Error:" + err);
                res.status(200).send({'error': 'Internal server error'});
            } else {
                res.status(200).json({data: response});
                log.info("Get Recent Products Success");
            }
        });
    }
    catch(err) {
        log.error("Error in Get Recent Products"+err);
        res.status(500).json({'error': 'Error in Get Recent Products'});
    }
});

router.post('/approveProducts', function(req, res, next) {
    log.info("approve Products Starts");
    db.productDetail.updateMany({ productID: {'$in': req.body.productIds} },
        {
          status:"Approved"
        },function(err,updateResult){
          if(err)
          {
            log.error('Error in updating product status'+err);
            res.status(500).json({'error':'Error in updating product status','status':'500'});
          }
          else
          {
            log.info("product approved successfully");
            res.status(200).json({'success':'product approved successfully','status':'200'});
          }
        });
});

// router.get('/getApprovalRequired', function(req, res, next){
//     log.info("Get Products Waiting for approval Starts");
//     var query = util.getUserFilterQuery(req.user);
//     var filterDate = new Date(new Date().getTime() - (2 * 24 * 60 * 60 * 1000));
//     db.productDetail.aggregate([
//         {$match: query},
//         {$match: {"updatedDate": {$gte: filterDate}, "status": "Yet to be Approved"}},
//     ], function(err, approvalRequiredList){
//         if(err) {
//             log.error("Get Products Waiting for approval FAILED");
//             log.error("Error: ", err);
//             res.status(500).send({'error': 'Internal server error'});
//         } else {
//             res.status(200).json({"data": approvalRequiredList});
//             log.info("Get Products Waiting for approval Success");
//         }
//         log.info("Get Products Waiting for approval Ends");
//     });
// });





module.exports = router;
