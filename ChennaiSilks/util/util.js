var mongoose = require('mongoose');
var multer  = require('multer');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var fs = require('fs');
var log = require('../lib/logger.js');
var db = require('../models/schema');
var nodemailer = require("nodemailer");
var config = require('../config/config');

//status mapping to match product status in product api's
var statusMapper = {all: "all", toBeApproved: "Yet to be Approved", rejToSupplier: "Rejected to Supplier",  subToApprover: "Submitted to the Approver", rejFromApprover: "Rejected from Approver", approved: "Approved"}

//associated statuses to a status
var toBeApprovedUpdate = [statusMapper.toBeApproved, statusMapper.rejToSupplier, statusMapper.subToApprover, statusMapper.approved];
var rejToSupplierUpdate = [statusMapper.toBeApproved];
var subToApproverUpdate = [statusMapper.subToApprover, statusMapper.approved, statusMapper.rejFromApprover];
var rejFromApproverUpdate = [statusMapper.subToApprover];

module.exports.statusMapper = statusMapper;

module.exports.getUserFilterQuery = function(user) {
    if(user.roles[0] === "supplier") {
        return {"supplier": mongoose.Types.ObjectId(user._id)};
    } else if(user.roles[0] === "designer") {
        return {"designer": mongoose.Types.ObjectId(user._id)};
    } else if(user.roles[0] === "reviewer") {
        return {"reviewer": mongoose.Types.ObjectId(user._id)};
    } else {
        return {};
    }
}

module.exports.getProductQuery = function(type, search, query) {
    //var query = (type === "all") ? {} : {"status": statusMapper[type]};
    if(type !== statusMapper.all) {
        //query.status = statusMapper[type];
        query.$or = (type === "approvedForSupplier") ? [{status: statusMapper.subToApprover}, {status: statusMapper.approved}, {status: statusMapper.rejFromApprover}] : [{status: statusMapper[type]}];
    }
    if(search) {
        query.$text = { $search: "\"" + search + "\"" };
    }
    return query;
}

module.exports.productRoleValidation = function(req, res, next) {
    if(req.user.roles[0] === "admin") {
        log.error("Access Failed - Error: Admin restricted to access products");
        res.status(200).send({'error': 'Unauthorized user'});
    } else if(req.path === "/createProduct" && req.user.roles[0] !== "supplier") {
        log.error("Create Product Failed - Error: Unauthorized user");
        res.status(200).send({'error': 'Unauthorized user'});
    } else if(req.path === "/addImage") {
        addImageValidation(req, res, next);
    } else if(req.path === "/updateProduct") {
        updateProductValidation(req, res, next);
    } else {
        next();
    }
}

module.exports.productDataValidation = function(req, res, next) {
    if(req.body.images && req.body.images.length === 0) {
        log.error("Create Product Failed - Error: Image not found");
        res.status(200).send({'error': 'Image not found'});
    } else if((req.body.status === statusMapper.rejToSupplier || req.body.status === statusMapper.rejFromApprover) && !req.body.rejectReason) {
        log.error("Update Product Failed - Error: Reject reason is mandatory");
        res.status(200).send({'error': 'Reason for rejection is empty'});
    } else {
        next();
    }
}

module.exports.deleteFolder = function(folderName) {
    rimraf('../uploads/product_images/' + folderName, function (err) {
        if(err) {
            log.error("Error in delete folder: ", err);
        } else {
            log.info('Deleted Folder:', folderName);
        }
    });
}

//set the destination folder and file name for uploads
module.exports.storage = multer.diskStorage({
    destination: function (req, file, cb) {
      mkdirp.sync('../uploads/product_images/' + req.body.folderName);
      cb(null, '../uploads/product_images/' + req.body.folderName);
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  });

//format validation for uploaded files
module.exports.imageFilter = function(req, file, cb) {
    var imageIndex = file.originalname.split("_").pop();
    imageIndex = imageIndex.split(".")[0];
    if(req.body.isUpdate && imageIndex === "0") {
        try {
            rimraf.sync('../uploads/product_images/' + req.body.folderName);
        }
        catch (err){
           log.info("Folder not found")
        }
    }
    if(!req.body.isUpdate && imageIndex === "0" && fs.existsSync('../uploads/product_images/' + req.body.folderName)) {
        cb({errorCode: 'PROD_EXISTS'}, false);
    } else if(!file.originalname.match(/\.(jpg|jpeg|png|gif|GIF)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    } else {
        cb(null, true);
    }
};

module.exports.sendEmail = function(toAddress,subject,content){
      var smtpTransport = nodemailer.createTransport("SMTP",{
          service: "Gmail",
          auth: {
              user: config.authEmail,
              pass: config.password
          }
      });
      var mailOptions = {
          from: config.authEmail, // sender address
          to: toAddress,
          subject: subject, // Subject line
          html: content
      };
      smtpTransport.sendMail(mailOptions, function(error, response){
          if(error){
              console.log(error);
          }else{
              console.log("Message sent: " + response.message);
          }
      });
};

//validate whether the user is authorized to update the product
function updateProductValidation(req, res, next) {
    db.productDetail.findOne({productID: req.body.productID}, function(err, product) {
        if(err) {
            log.error("Update Product Failed - Error: Internal server error");
            res.status(500).send({'error': 'Internal server error'});
        } else if(product){
            var userId = req.user._id.toString();
            if(userId !== product.supplier.toString() && userId !== product.designer.toString() && userId !== product.reviewer.toString()) {
                log.error("Update Product Failed - Error: Unauthorized user");
                res.status(200).send({'error': 'Not authorized to update this product'});
            } else if(product.status === statusMapper.approved) {
                log.error("Update Product Failed - Error: Product is approved already");
                res.status(200).send({'error': 'Approved product cannot be updated'});
            } else if(validateStatus(product.status, req.body.status)) {
                log.error("Update Product Failed - Error: Product status error");
                res.status(200).send({'error': 'Product status invalid'});
            } else if(req.body.status === statusMapper.approved && req.user.roles[0] === "supplier") {
                log.error("Update Product Failed - Error: Unauthorized user");
                res.status(200).send({'error': 'Unauthorized user'});
            } else if((req.body.status === statusMapper.rejFromApprover) && req.user.roles[0] !== "reviewer") {
                log.error("Update Product Failed - Error: Unauthorized user");
                res.status(200).send({'error': 'Unauthorized user'});
            } else if((req.body.status === statusMapper.subToApprover || req.body.status === statusMapper.rejToSupplier) && req.user.roles[0] !== "designer") {
                log.error("Update Product Failed - Error: Unauthorized user");
                res.status(200).send({'error': 'Unauthorized user'});
            } else {
                next();
            }
        } else {
            log.error("Update Product Failed - Error: Product not found");
            res.status(200).send({'error': 'Product not found'});
        }
    });
}

//check product status before update
function validateStatus(oldStatus, newStatus) {
    if(oldStatus === statusMapper.toBeApproved && toBeApprovedUpdate.indexOf(newStatus) >= 0) {
        return false;
    } else if(oldStatus === statusMapper.rejToSupplier && rejToSupplierUpdate.indexOf(newStatus) >= 0) {
        return false;
    } else if(oldStatus === statusMapper.subToApprover && subToApproverUpdate.indexOf(newStatus) >= 0) {
        return false;
    } else if(oldStatus === statusMapper.rejFromApprover && rejFromApproverUpdate.indexOf(newStatus) >= 0) {
        return false;
    } else {
        return true;
    }
}

//validate whether the user is authorized to add image to the product
function addImageValidation(req, res, next) {
    log.info("Add Image Validation Starts");
    if(req.user.roles[0] === "reviewer" || req.user.roles[0] === "admin") {
        log.error("Image Upload Failed - Error: Unauthorized user");
        res.status(200).send({'error': 'Unauthorized user'});
    } else {
        db.productDetail.findOne({productID: req.query.productId}, function(err, product) {
            if(err || !product) {
                next();
            } else if(product) {
                var userId = req.user._id.toString();
                if(userId !== product.supplier.toString() && userId !== product.designer.toString() && userId !== product.reviewer.toString()) {
                    log.error("Add Image Failed - Error: Unauthorized user");
                    res.status(200).send({'error': 'Not authorized to update this product'});
                } else if(product.status === statusMapper.approved) {
                    log.error("Add Image Failed - Error: Product is approved already");
                    res.status(200).send({'error': 'Approved product cannot be updated'});
                } else {
                    next();
                }
            }
        });
    }
    log.info("Add Image Validation Ends");
}
