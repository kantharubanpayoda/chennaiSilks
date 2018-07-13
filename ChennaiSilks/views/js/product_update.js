var imagesCaptured, selectedProduct, unsavedChanges = false;

//get the selected product details
function openProduct(productID, selectedProductData) {
    $(".loading-icon").show();
    if(selectedProductData) {
        selectedProduct = selectedProductData;
    } else {
        selectedProduct = products.find(function(product){
            return product.productID === productID;
        });
    }    
    console.log("selectedProduct", selectedProduct)
    openProductHelper();
}

//open the product detail page based on logged in user role
function openProductHelper() {
    if(currentUser.roles[0] === 'designer') {
        openImageEdit();
    } else if(currentUser.roles[0] === 'applier') {
        openQrScanner();
    } else if(currentUser.roles[0] === 'reviewer') {
        openApprovalPage();
    }
}

//open image edit page for designer
function openImageEdit() {    
    imagesCaptured = selectedProduct.images;
    var imageLoadPromise = [];
    for(var i=0; i<imagesCaptured.length; i++) {
        if(typeof imagesCaptured[i] === "string") {
            imageLoadPromise.push(getImageBlob(i));
        }
    }
    $(".product-list-wrap").hide();
    $(".product-update-wrap").load("/image-edit", function() {
        $(".product-info .name, .sub-page").text(selectedProduct.type);
        $(".product-info .id").text("Product ID: " + selectedProduct.productID);
        loadTabs();        
        Promise.all(imageLoadPromise).then(function() {
            $("#approvalPage").load("/upload-image", function() {
                $(".loading-icon").hide();
                if(selectedProduct.status === config.statusMapper.rejFromApprover) {
                    checkUploadLimit();  
                    $('.product-edit-tabs a[href="#approvalPage"]').tab('show');
                } else {
                    loadEditTab();
                }
            });
        });           
    });
}

//go back to grid  page
function goToImageList() {    
    window.location = '/image-list';
}

function showProductGrid() {
    $(".product-list-wrap").show();
    reloadGrid();
    $(".product-update-wrap").empty();
}

//open qrscanner page for supplier
function openQrScanner() {
    localStorage.setItem("productToUpdate", selectedProduct.productID);
    window.location = '/QR-scanner';
}

//open approval page for reviewer
function openApprovalPage() {
    $(".product-list-wrap").hide();
    $(".product-update-wrap").addClass("reviewer-page-wrap");
    $(".product-update-wrap").load("/upload-image", function() {
        $(".sub-page").text(selectedProduct.type);
        imagesCaptured = selectedProduct.images;
        populateValue(selectedProduct, true);
        loadImagesToUpload();
        $(".loading-icon").hide();
    });
}

//approve the product

function approve() {
    $(".reviewer-page-wrap .loading-icon").show();
    var postData = {};
    postData.productID = selectedProduct.productID;    
    postData.status = config.statusMapper.approved;
    updateProduct(postData, '.reviewer-page-wrap');
}

//reject product to designer
function rejectToDesigner() {
    $(".reviewer-page-wrap .loading-icon").show();
    var rejectReason = $('#reject-reason').val();
    if(rejectReason) {
        var postData = {};
        postData.productID = selectedProduct.productID;    
        postData.status = config.statusMapper.rejFromApprover;
        postData.rejectReason = rejectReason;
        updateProduct(postData, '.reviewer-page-wrap');
    } else {
        setTimeout(function() {            
            $(".reviewer-page-wrap .field-error").text(config.reasonInvalid);
            $('#reject-reason').focus();
        });        
        $(".reviewer-page-wrap .loading-icon").hide();
    }
}

//api call to update product
function updateProduct(postData, wrapper) {
    var url = config.serverURL + config.updateProduct;    
    postRequest(url, postData,function(response){
        if(response.error) {
            $(wrapper + " .loading-icon").hide();
            $(wrapper + " .error-msg").text(response.error);
            
        } else {
            $(wrapper + " .loading-icon").hide();
            unsavedChanges = false;
            window.location = '/image-list';
            updateProductByID(postData, '.reviewer-page-wrap');
        }                
    }, function() {
        $(wrapper + " .loading-icon").hide();
        $(wrapper + " .error-msg").text(config.serverError);
    });
}

function updateProductByID(postData) {
    console.log("postData");
    
    var url = config.magentoServerURl + config.getOauthToken;
    var postData = {
      'username' : config.magentoUsername,
      'password':  config.magentoPassword
    };
    postRequest(url, postData, function(token){
        console.log(token);
        
        var url = config.magentoServerURl + config.getProductFromMagento;
       // var form  = new FormData();
        //var image = $('#thumbnailView')[0].files[0];
        //form.append('url', image);
        var postData = {};
           postData.sku = '7114';    
           postData.url=selectedProduct.images;
        PostRequestWithOauth(url,postData,token,function(response) {
           
          console.log(response.data);
        });
    });
}


$(document).ready(function () {
    window.onbeforeunload = function (e) {
        if (unsavedChanges) {
            var message = "Some changes are not saved. Unsaved changes will be lost. Do you want to leave anyway?", e = e || window.event;
            if (e) {
                e.returnValue = message;
            }
            return message;
        }
    }
});