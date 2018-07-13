var scanImgIndex = 1;
var productDataReceived = {};
var productToBeUpdated = {};
var unsavedChanges = false;
var isUpdate = false;

//get product details from ERP
function fetchProductDetailByID(productID) {
    console.log("productID"+productID);
    resetData();
    $(".loading-icon").show();
    $(".scan-icon").hide();
    var getTokenUrl = config.magentoServerURl + config.getOauthToken;
    var postData = {
      'username' : config.magentoUsername,
      'password':  config.magentoPassword
    };
    postRequest(getTokenUrl, postData, function(token){
        console.log(token);
        var url = config.magentoServerURl + config.getProductFromMagento + "/" + productID;
        getRequestWithOauth(url,token,function(response) {
          
          var isapprovalNeeded=false;
          
          
      
            
          // response.data = productDataReceived;
        //  getcategoryapprovals();
          if(response[0].status) {              
            productDataReceived = {'productID':productID,'name':response[0].message.name,'price':response[0].message.price,'description':response[0].message.description, 'isApprovalNeeded':isapprovalNeeded};
            var url1 = config.serverURL + config.getCategories+"?queryParam="+ response[0].message.categoryName;
            getRequest(url1, function(response1) {
               if(response1.data.category.length > 0) {
                   productDataReceived.isApprovalNeeded = response1.data.category[0].approvalNeeded;
               }
                
            });
            $(".loading-icon").hide();
            populateProductDetails(response[0].message,productID);
            console.log()
            // populateValue(response.data);
            unsavedChanges = true;
            $(".scanned-details-wrap").show();
            unbindScanner();
            //to check whether the product is  already available
            getProduct(productID);
          } else{
            $(".loading-icon").hide();
            showScanError(response[0].message);
          }
        }, function() {
          showScanError(config.serverError);
        });
    });
}

/*function getcategoryapprovals(){
   var url = config.serverURL + config.getCategories;
  getRequest(url, function(response) {
      console.log(response);
    if(response.name[0]===categoryName) {
       
    } 
    
    
},function() {
    $(".loading-icon").hide();
    console.log(config.serverError);
  });
}*/

function populateProductDetails(data,productID){
  
  $('.product-details-wrap .productProperties').empty();
  $('.productHeading').text(data.name);
  $('.productId').find('span').text(productID);
  $('.productPrice').find('span').text(data.price);
  $('.product-details-wrap .productProperties').append(data.description);
  
}



//display error messages
function showScanError(error) {
  $(".scan-icon").show();
  $(".loading-icon").hide();
  $(".error-msg").text(error);
}

//check if product already exists and if exists load it
function getProduct(productId) {
  var url = config.serverURL + config.fetchProductById + "?productId=" +  productId;
  getRequest(url, function(response) {
    if(response.data) {
      isUpdate = true;
      productToBeUpdated = response.data;
      imagesCaptured = response.data.images;
      var imageLoadPromise = [];
      for(var i=0; i<imagesCaptured.length; i++) {
        if(typeof imagesCaptured[i] === "string") {
          imageLoadPromise.push(getImageBlob(i));
        }
      }
      Promise.all(imageLoadPromise).then(function() {
        $(".loading-icon").hide();
        enableTabs(["qr-scanner-camera"]);
        $('.add-image-btn').removeClass('disabled-btn');
        checkUploadLimit();
        loadImagesEdited();
        if(productToBeUpdated.rejectReason) {
          $('.product-details-wrap .productProperties').append('<div class="row"><div class="col-sm-4 col-md-4 col-lg-4">Reason for rejection</div><div class="col-sm-8 col-md-8 col-lg-8">' + productToBeUpdated.rejectReason  + '</div></div>');
        }
      });

    } else {
      $(".loading-icon").hide();
      $('.add-image-btn').removeClass('disabled-btn');
      enableTabs(["qr-scanner-camera"]);
      isUpdate = false;
    }
  }, function() {
    $(".loading-icon").hide();
    console.log(config.serverError);
  });
}


//clear data on re-scan
function resetData() {
  unsavedChanges = false;
  $(".scan-icon").show();
  $(".error-msg").text("");
  $(".scanned-details-wrap").hide();
  $('.productProperties').empty();
  $('.add-image-btn').addClass('disabled-btn');
  productDataReceived = {};
  disableTabs(["qr-scanner-camera", "qr-scanner-upload"]);
  imagesCaptured = [];
}

//go to camera page
function goToAddImage(){
    $('.qr-scanner-tabs a[href="#captureStream"]').tab('show');
};

//to enable tabs
function enableTabs(elements) {
  elements.forEach(function(element){
    $("." + element).removeClass("disabled-tabs");
  })
};

//to disable tabs
function disableTabs(elements) {
  elements.forEach(function(element){
    $("." + element).addClass("disabled-tabs");
  })
};

//check for new product or update product
function checkForUpdate(barcode) {
  if(updateProductId) {
    if(updateProductId === barcode) {
      fetchProductDetailByID(barcode);
    } else {
      showScanError(config.invalidProductScanned + " " + updateProductId);
    }
  } else {
    fetchProductDetailByID(barcode);
  }
}

//function to get scanned data from barcode
function bindScanner() {
  var barcode = "";
  unbindScanner();
  $(document).on('keypress.readBarcode', function(e) {
      var code = (e.keyCode ? e.keyCode : e.which);
      if(code === 13) {
          checkForUpdate(barcode);
          $('.qr-scanner-code').find('canvas').remove();
          $('.qr-scanner-code').qrcode({width: 150,height: 150,text: barcode});
          $('.scanned-product-code').text("Product Code: " + barcode);
          barcode = "";
      } else {
          barcode = barcode+String.fromCharCode(code);
      }
  });
}

//unbind keypress event
function unbindScanner() {
  $(document).off('keypress.readBarcode');
}
bindScanner();
//get user details on page load
$(document).ready(function() {
  disableTabs(["qr-scanner-camera", "qr-scanner-upload"]);
  getProfile();
});
