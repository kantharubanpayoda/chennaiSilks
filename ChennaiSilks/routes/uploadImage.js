var cloudinary = require('cloudinary');
var log = require('../lib/logger.js');
var db = require('../models/schema');

function imageUpload(app,io){
	io.on('connection', function(socket){
	  socket.on('uploadImage', function(data){
	  	log.info("Image received via socket"+data.length);
			//This can be used to upload image to cloud	  	

	        // cloudinary.uploader.upload(data, function(req, res) {
	        //  });
	        
	        db.productDetail.update({'productID':'3333'},{$addToSet:{'images':data}},function(err, result){
				if (err) {
					log.info('error in updating streams in productDetail'+err);
				}else{
					log.info('updated stream in productDetails'+JSON.stringify(result));
				}
			});

			//var postData = { "productID":"4", "price":"10000", "type":"Cotton Silk Saree", "material":"Cotton", "occuation":"Wedding", "color":"Red", "finishing":"Soft Finishing", "weightInGrams":"0.800", "wash":"Dry Wash", "exchange":"No", "shipping":"Worldwide", "disclaimer":"Actual product may vary upto 5% in color" ,"images": imagesCaptured, "reviewer":"5acf4c7411b3a6fbc1241b6e", "status": "Yet to be Approved"};
	  });
	});
}
module.exports = imageUpload;