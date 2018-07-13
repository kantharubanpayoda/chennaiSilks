var express = require('express');
var router = express.Router();
var log = require('../lib/logger.js');
var db = require('../models/schema');
var passport = require('passport');
var util = require("../util/util");
var async = require('async');

var multer  = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, '../uploads/profile_images')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  });
var imageFilter = function(req, file, cb) {
    //console.log("Inside Filterrr", req.files, file);
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    } else {
        cb(null, true);
    }
};
var upload = multer({ storage: storage, fileFilter: imageFilter }).single('file');

router.post('/signin', function(req, res, next) {
    log.info("SignIn Starts");
    passport.authenticate('local', function(err, user, info) {
        log.info("Signin - user validation");
        if(err) {
            log.error("sign in FAILED");
            log.error("Error: ", err);
            res.status(500).send({'error': 'Internal server error'});
        } else {
            if(!user) {
                log.error("Invalid Username/Password");
                res.status(401).send({'error': info.message});
            } else {
                req.login(user, function(err) {
                  log.info("user found - Valid user");
                  res.status(200).json({'data': user});
                  log.info("SignIn Ends");
                });
            }

        }
    })(req, res);
});

router.get('/getProfile', passport.authenticationMiddleware.apiRequests, function(req, res) {
    log.info("Get Profile Starts");
    res.status(200).json({'data': req.user});
    log.info("Get Profile Ends");
});

router.post('/updateProfile', passport.authenticationMiddleware.apiRequests, function(req, res) {
    log.info("Update Profile Starts", req.body);


    db.profiles.findByIdAndUpdate(req.user._id, {
        name: req.body.name,
        emailId: req.body.emailId,
        profileImage: req.body.profileImage
    }, {new: true}, function(err, updatedProfile) {
        if(err) {
            log.error("Update Profile FAILED");
            log.error("Error: ", err);
            res.status(500).send({'error': 'Internal server error'});
        } else {
            res.status(200).json({"data": updatedProfile});
            log.info("Update Profile Success");
        }
        log.info("Update Profile Ends");
    })
    log.info("Update Profile Ends");
});


router.post('/addProfileImage', passport.authenticationMiddleware.apiRequests, function(req, res, next) {
    log.info("Add Profile Image Starts");
    upload(req, res, function (err) {
        if(err) {
            //log.info("&&&&&Error:", err);
            res.status(400).send({'error': 'Bad Request'});
        } else {
            var imageUrl = "/uploads/profile_images/" + req.file.originalname;
            res.status(200).json({"data": imageUrl});
        }
    });
    log.info("Add Profile Image Ends");
});



router.get('/signout', passport.authenticationMiddleware.apiRequests, function(req, res) {
    log.info("SignOut Starts");
    req.logout();
    res.status(200).json({'data': 'logged out'});
    log.info("SignOut Ends");
});

router.get('/getUserList',passport.authenticationMiddleware.apiRequests,function(req, res) {
    log.info("Get user list API Starts"+req.query.start+" end "+req.query.end+"user"+req.user);
    var start = parseInt(req.query.start);
    var end = parseInt(req.query.end);
    var query = util.getUserFilterQuery(req.user);
    var sortType = req.query.sortType || "";
    var sortOrder = req.query.sortOrder || "";
    var order,sortQuery;
    //query = util.getProductQuery(req.query.type, req.query.queryParam, query);
    async.parallel({
        total: function(callback) {
            db.profiles.find(query).count(function(err, total) {
                if(err) {
                    log.info("Get User Count FAILED");
                    callback(err, null);
                } else {
                    callback(null, total);
                }
            })
        },
        profiles: function(callback) {

          if(sortType == "" || sortOrder == ""){

            log.info("Without sorting called");
            db.profiles.find(query).skip(start).limit(end - start).sort({_id:-1}).exec(function(err, profiles) {
                if(err) {
                    log.info("Get profiles FAILED");
                    callback(err, null);
                } else {
                    callback(null, profiles);
                }
            });

          }else{

            log.info("with sorting called");
            if(sortOrder == "asc"){
              order = 1;
            }else{
              order = -1;
            }
            log.info("sortType "+sortType);
            log.info("order "+order);

            if(sortType == "name"){
              sortQuery = { "name" : order };
            }else if(sortType == "userId"){
              sortQuery = { "userId" : order };
            }else if(sortType == "emailId"){
              sortQuery = { "emailId" : order };
            }

            db.profiles.find(query).skip(start).limit(end - start).sort(sortQuery).exec(function(err, profiles) {
                if(err) {
                    log.info("Get profiles FAILED");
                    callback(err, null);
                } else {
                    callback(null, profiles);
                }
            });
          }
        }
    }, function(err, response) {
        if(err) {
            log.info("Error: ", err);
            res.status(500).send({'error': 'Internal server error'});
        } else {
            res.status(200).json({"data": response});
            log.info("Get profiles Success");
        }
    });
    log.info("Get profiles Ends");
});

router.post('/addUser', passport.authenticationMiddleware.apiRequests, function(req, res) {
    log.info("add User API Starts");
    var userId = req.body.userId;
    var name = req.body.name;
    var username = req.body.username;
    var mailId = req.body.mailId;
    var password = req.body.password;
    var roles = req.body.roles;
    var profileImage = req.body.profileImage;
    var mappedUser = req.body.mappedUser;
    var subject = "Chennai Silks - Login Credentials";
    var content =  '<p>You have been added as <b>'+roles[0]+'</b></p><p>Please find your login credentials</p>'+'<p>Username : '+username+'</p><p>Password : '+password;

    db.profiles.update({'userId':userId},
                  {
                    name:name,
                    username:username,
                    password:password,
                    roles:roles,
                    profileImage:profileImage,
                    emailId:mailId
                  },
            {upsert:true},function(err,updateResult){
            if(err)
            {
              log.error('Error in adding user'+err);
              res.status(500).json({'error':'Error in adding user','status':'500'});
            }
            else
            {
              log.info("user added successfully");
              util.sendEmail(mailId,subject,content);
              res.status(200).json({'success':'user added successfully','status':'200'});
            }
    });
});

router.post('/getRoleBasedUserList', passport.authenticationMiddleware.apiRequests, function(req, res) {
    log.info("get role based User API Starts");
    var role = req.body.role;
    db.profiles.find({roles: role},function(err, result){
      if (err) {
        res.status(500).json({'Result':'Error in getting user list based on role','status':'500'});
      }else{
        // log.info(result);
        res.status(200).json({'Result':result,'status':'200'});
      }
    });
});

router.post('/deleteUser', function(req, res, next) {
    log.info("Delete User Starts");
    db.profiles.remove({ userId: req.body.userId}, function (err, result) {
        if (err) {
            log.info("Error: ", err);
            res.status(500).send({'error': 'Internal server error'});
          } else {
            res.status(200).json({ 'data': 'User removed successfully'});
          }
    });
});

router.post('/getUser', passport.authenticationMiddleware.apiRequests, function(req, res) {
    log.info("get User based on User ID Starts");
    log.info("UserId"+req.body.userId);
    db.profiles.findOne({userId: req.body.userId},function(err, result){
      if (err) {
        res.status(500).json({'Result':'Error in getting user list based on role','status':'500'});
      }else{
        // log.info(result);
        res.status(200).json({'Result':result,'status':'200'});
      }
    });
});

router.post('/sortUser',function(req,res){

      log.info("sort user called");
      var sortType = req.body.sortType;
      var sortOrder = req.body.sortOrder;
      var order,query;

      if(sortOrder == "asc"){
        order = 1;
      }else{
        order = -1;
      }
      log.info("sortType "+sortType);
      log.info("order "+order);

      if(sortType == "name"){
        query = { "name" : order };
      }else if(sortType == "userId"){
        query = { "userId" : order };
      }else if(sortType == "emailId"){
        query = { "emailId" : order };
      }

      db.profiles.find({}).sort(query).exec(function(err, result){
        if (err) {
          res.status(500).json({'Result':'Error in getting company details','status':'500'});
        }else{
          // log.info(result);
          res.status(200).json({'Result':result,'status':'200'});
        }
      });

});


module.exports = router;
