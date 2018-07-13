//variable to store logged in user data
var currentUser;

//logout user
function logout() {
    var url = config.serverURL + config.signout;
    getRequest(url, function(response){
        window.location.href = "/sign-in";
    });
}

//get logged in user data
function getProfile() {
    return new Promise(function(resolve, reject) {
        var url = config.serverURL + config.getProfile;
        getRequest(url, function(response){
            currentUser = response.data;
            $("#username").html(currentUser.username);
            $("#assigned-roles").html(currentUser.roles.join());
            resolve(response);
        });
    });
}

//local file upload validations
function localFileUpload(event) {
    var uploadedFile = event.target.files[0];
    if(!uploadedFile.name.match(/\.(jpg|jpeg|png|GIF|gif)$/)) {
        $('.error-msg').text(config.invalidFileFormat);
    } else {
        imagesCaptured.push(event.target.files[0]);
        var reader = new FileReader();
        reader.onload = function (e) {
            // get loaded data and render thumbnail.
            renderUploadedImages(e, event.target.files[0]);
        };
        // read the image file as a data URL.
        reader.readAsDataURL(this.files[0]);
        checkUploadLimit();
    }
}

//to get image blob from image url - used in image edit/take snap pages
function getImageBlob(imageIndex) {
    return new Promise(function(resolve, reject) {
        var imageURL = imagesCaptured[imageIndex];
        var format = imageURL.split('.').pop();
        var image = new Image();
        var onload = function () {
            var canvas = document.createElement("canvas");
            canvas.width =this.width;
            canvas.height =this.height;

            canvas.getContext("2d").drawImage(this, 0, 0);
            var dataUri = canvas.toDataURL('image/' + format);
            var blob = getBlobFromDataUri(dataUri);
            var name = imageURL.split('/').pop();
            blob.name = name;
            imagesCaptured[imageIndex] = blob;
            resolve();
        };
        image.onload = onload;
        image.src = imageURL;
    });
  }

  //to get image blob from data uri
  function getBlobFromDataUri(dataUri) {
    var data = dataUri.split(',')[1];
    var mimeType = dataUri.split(';')[0].slice(5)

    var bytes = window.atob(data);
    var buf = new ArrayBuffer(bytes.length);
    var arr = new Uint8Array(buf);

    for (var i = 0; i < bytes.length; i++) {
        arr[i] = bytes.charCodeAt(i);
    }

    return new Blob([ arr ], { type: mimeType });
  }

//populate product details
function populateValue(res, isRejectedByDesigner) {
    $('.product-details-wrap .productProperties').empty();
    $('.productHeading').text(res.name);
    $('.productId').find('span').text(res.productID);
    $('.productPrice').find('span').text(res.price);
    var propertyMapper = {type: 'Type', material: 'Material', occasion: 'Occasion', color: 'Color', finishing: 'Finishing', weightInGrams: 'Weight in grams', wash: 'Wash', exchange: 'Exchange', shipping: 'Shipping', disclaimer: 'Disclaimer'};
    propertyMapper.rejectReason = isRejectedByDesigner ? "Rejected reason" : "Reason for rejection";
    var ignoredProperties = ["images", "productID", "price", "_id", "supplier", "status", "designer", "reviewer", "createdDate", "updatedDate", "__v"];
    for (var property in res) {
      if(ignoredProperties.indexOf(property) === -1 && res[property]) {
        var label = propertyMapper[property] ? propertyMapper[property] : property;
        $('.product-details-wrap .productProperties').append(res[property]);
      }
      // else if(property === "images"){
      //   $('.product-details-wrap .productProperties').append('<div class="row"><div class="col-sm-4 col-md-4 col-lg-4">Images</div><div class="uploadedImages col-sm-8 col-md-8 col-lg-8"></div></div>')
      // }
    }

    // $('.uploadedImages').find('img').remove();
    // for(var i=0;i<res.images.length;i++){
    //   var img = $('<img />').attr({
    //       'id': 'productImage' + scanImgIndex,
    //       'src': res.images[i],
    //       'width': 100,
    //       'class':'pb-10'
    //   }).appendTo('.uploadedImages');
    //   scanImgIndex++;
    // }
}


//load images in approval page
function loadImagesToUpload() {
    $('.img-thumbnails').find('.thumbnail-wrap').remove();
    $('.img-preview').find('img').attr("src", "");
    if (imagesCaptured.length <= 0) {
        console.log("no images present");
    } else {
        for (var i = 0; i < imagesCaptured.length; i++) {
           var wrapper = $('<div></div>').attr({
               'id': 'screenshotupload' + i,
               'class': 'thumbnail-wrap',
               'onClick': 'showPreview(this.id)'
           });
          
         var deletebtn = $('<button></button>').attr({
               'class': 'fa fa-close',
               'onClick': 'deletebtn(this.id)'
           });
           
           var img = $('<img />').attr({
               'class': "col-lg-4 p-10",
               'src': (typeof imagesCaptured[i]) === "string" ? imagesCaptured[i] : URL.createObjectURL(imagesCaptured[i])
           });
           wrapper.append(img);
           wrapper.append(deletebtn);
           $('#thumbnailView').prepend(wrapper);
          
        }
        //Load screenshotupload0 => id by default
        showPreview('screenshotupload' + (imagesCaptured.length - 1));
    }
}


//show the selected thumb in preview - approval page
function showPreview(id) {
   $(".thumbnail-wrap").removeClass("selected");
   
   $("#" + id).addClass("selected");
   $("#fullViewImage").attr("src", $("#" + id + " img").attr("src"));
}

function deletebtn(id){
        //$(".thumbnail-wrap.selected").remove(); 
        
      // $('.img-thumbnails').each(function() {
    //if ($(this).find('img').length===0) {
        
       // $(".img-preview").css("display","none");
       // $(".control-btn.green-btn").css("display","none");
       // $("div#screenshotContainer").css("display","none");
        
   // }
//});

}

//global search
$(".product-search-input").keypress(function(event) {
    if (event.which == 13) {
        console.log(location.pathname)
        if(location.pathname === "/image-list") {
            getQueriedProducts();
        } else {
            if($(".product-search-input").val()) {
                localStorage.setItem("searchParam", $(".product-search-input").val());
                window.location = '/image-list';
            } else {
                window.location = '/image-list';
            }

        }
     }
});

//clear error message on document click
$(document).click(function() {
    $('.error-msg, .field-error').text("");
});
