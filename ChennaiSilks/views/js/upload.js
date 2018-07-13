  var cropperRef;
 var camanRef;
 var context;
 var selectedImageID;
//  var socket = io();

//submit product to server
 function sendForApproval() {
    $(".loading-icon").show();
    var formData = new FormData();    
    //var postData = { "productID":Math.floor((Math.random() * 10000) + 1), "price":"10000", "type":"Cotton Silk Saree", "material":"Cotton", "occuation":"Wedding", "color":"Red", "finishing":"Soft Finishing", "weightInGrams":"0.800", "wash":"Dry Wash", "exchange":"No", "shipping":"Worldwide", "disclaimer":"Actual product may vary upto 5% in color" ,"images": [], "reviewer":"5acf4c7411b3a6fbc1241b6e", "status": "Yet to be Approved"};
    formData.append('folderName', productDataReceived.productID);    
    formData.append('isUpdate', isUpdate);
    for(var j=0; j<imagesCaptured.length; j++) {
        if(imagesCaptured[j].name) {
            var imageFormat = imagesCaptured[j].name.split('.').pop();
            formData.append('files', imagesCaptured[j], productDataReceived.productID + '_' + j +'.' + imageFormat);
        } else {
            formData.append('files', imagesCaptured[j], productDataReceived.productID + '_' + j +'.' + config.snapshotFormat);                       
        }
    }    
    var uploadUrl = config.serverURL + config.addImage + '?productId=' + productDataReceived.productID;
    uploadRequest(uploadUrl, formData, function(response) {
        if(response.error) {
            $(".loading-icon").hide();
            $(".error-msg").text(response.error);
        } else {
            if(isUpdate) {
                updateProduct(response);
            } else {
                createProduct(response);
            }
        }
    }, function() {
        $(".loading-icon").hide();
        $(".error-msg").text(config.serverError);
    });    
}


function a(data) {  
        //console.log(data);
        $("#total-photos").text(data.total);
        
        switch (currentUser.roles[0]) {
            
            case 'supplier':
                $("#rejected").text(data.rejToSupplier);
                $("#to-be-approved").text(data.toBeApproved);
                $("#digitized").text(data.subToApprover + data.rejFromApprover + data.approved);
                
                break;
            case 'designer':
                $("#rejected").text(data.rejFromApprover);
                $("#to-be-approved").text(data.toBeApproved);
                $("#digitized").text(data.approved);
                break;
            case 'reviewer':
                $("#rejected").text(data.rejFromApprover);
                $("#to-be-approved").text(data.subToApprover);
                $("#digitized").text(data.approved);
                break;
            default:
                $("#rejected").text(data.rejFromApprover + data.rejToSupplier);
                $("#to-be-approved").text(data.subToApprover + data.toBeApproved);
                $("#digitized").text(data.approved);
                 
        }
             
    };






//create product
function createProduct(response) {
    var url = config.serverURL + config.createProduct;
    productDataReceived.images = response.data;    
    postRequest(url,productDataReceived,function(response){
        if(response.error) {
            $(".loading-icon").hide();
            $(".error-msg").text(response.error);
        } else {
            unsavedChanges = false;
            window.location = '/image-list';
        }         
    }, function() {
        $(".loading-icon").hide();
        $(".error-msg").text(config.serverError);
    });
}

//update product
function updateProduct(response) {
    var url = config.serverURL + config.updateProduct;
    productDataReceived.images = response.data;    
    productDataReceived.status = config.statusMapper.toBeApproved;
    postRequest(url,productDataReceived,function(response){
        if(response.error) {
            $(".loading-icon").hide();
            $(".error-msg").text(response.error);
        } else {
            unsavedChanges = false;
            window.location = '/image-list';
        }                
    }, function() {
        $(".loading-icon").hide();
        $(".error-msg").text(config.serverError);
    });
}








 