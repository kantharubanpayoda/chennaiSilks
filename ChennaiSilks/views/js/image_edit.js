var cropperRef, camanRef, selectedImageID;

 //init function
 function loadEditTab() {
     $('#imageEditContainer').empty();
     
     if (imagesCaptured.length <= 0) {
         //future manipulations to be addded
         console.log("no images present");
     } else {        
         // $("#targetEditorImage").attr('src', imagesCaptured[0]);                 
         for (var i = 0; i < imagesCaptured.length; i++) {
            var img = $('<img />').attr({
                'id': 'screenshot' + i,
                'src': URL.createObjectURL(imagesCaptured[i]),
                'onClick': 'selectImage(this.id)',
            }).prependTo('#imageEditContainer');
         }
         //Load screenshot0 => id by default
         selectImage('screenshot' + (imagesCaptured.length - 1));
         updateScrollBar();
         checkUploadLimit();    
     }
 }

 //load the selected image in edit box
 function selectImage(id) {     
     $(".img-edit-thumbs img").removeClass("selected");
     $(".img-edit-thumbs #" + id).addClass("selected");
     var canvasWidth = $("#targetEditorImage").parent().width();
     var canvas = document.getElementById('targetEditorImage');
     var context = canvas.getContext('2d');
     removeEditReference();
     var base_image = new Image();
     cropperRef = $("#targetEditorImage");
     cropperRef.off('ready');
     cropperRef.on('ready', function(){
       unsavedChanges = true;
       $('.edit-save-btn, .cancel-btn').removeClass('disabled-btn');
     });
     var imageIndex = id.split('screenshot');
     base_image.src = URL.createObjectURL(imagesCaptured[imageIndex[1]]);     
     selectedImageID = id;
     base_image.onload = function() {
         context.canvas.width = canvasWidth;
         context.canvas.height = canvasWidth * base_image.height/base_image.width;
         camanRef = Caman("#targetEditorImage", function() {});
         context.drawImage(base_image, 0, 0, canvasWidth, canvasWidth * base_image.height/base_image.width);
         updateScrollBar();
     }
 }


 //delete selected image
 function deleteImage() {
    var selectedImage = $(".img-edit-thumbs").find("img.selected").attr("id");    
    var selectedImageIndex = selectedImage.split('screenshot').pop();
    imagesCaptured.splice(selectedImageIndex, 1);
    $(".img-edit-thumbs").find("#" + selectedImage).remove();
    for(var i = parseInt(selectedImageIndex); i < imagesCaptured.length; i++) {
        $(".img-edit-thumbs #screenshot" + (i+1)).attr({"id": "screenshot"+i});
    }
    if(imagesCaptured.length >= 1) {
        selectImage('screenshot' + (imagesCaptured.length - 1));
    }
    checkUploadLimit();
 }

 /*************************** Download Tab Functions ****************************/
var selectedImages = [], selectedImageIds = [];
//load images in download/upload tab
 function loadProductImages(isUpload) {
    var wrapperElement = (isUpload) ? 'upload-images-wrap' : 'download-images-wrap';
    $('.upload-images-wrap, .download-images-wrap').empty();
     for(var i=0; i<imagesCaptured.length; i++) {
        renderImage(imagesCaptured[i], i, wrapperElement);
        if(!isUpload) {
            $('#download-img-' + i).prop('checked', true);
        }                
     }
 }

 function renderImage(imageFile, index, wrapperElement) {
    var name = imageFile.name;        
    var label = name.split('.')[0];
    var imgElement = "<div class='col-sm-12 col-md-4' id='dwn-img-wrap-" + index +"'><div class='download-image'>" +
                    "<img src='" + URL.createObjectURL(imageFile) + "' alt='Image" + index + "' />" +
                    "<div class='mg-thumb-options'><div class='mg-toolbar'><div class='mg-option checkbox-custom checkbox-inline'>" +
                    "<input class='image-checkbox' type='checkbox' id='download-img-" + index +"' value='" + name +"'>" +
                    "<label for='download-img-" + index +"'>" + label + "</label>" +
                    "</div></div></div>" +
                  "</div></div>";
    $('.' + wrapperElement).append(imgElement);    
 }

//load images in download tab
 function loadDownloadTab() {
    loadProductImages(false);
    checkboxUpdated();
 }

 //load images in upload tab
 function loadUploadTab() {
    loadProductImages(true);
    checkUploadLimit();
 }

//to download the selected images
function downloadImages() {
    $("#downloadPage .loading-icon").show();
    var zip = new JSZip();    
    selectedImageIds.forEach(function(id) {
        var selectedImageIndex = id.split('download-img-').pop();
        var format = imagesCaptured[selectedImageIndex].name.split('.').pop();     
        zip.file(selectedProduct.productID + '_' + selectedImageIndex + '.' + format, imagesCaptured[selectedImageIndex]);    
    });
    zip.generateAsync({type:"blob"})
    .then(function(content) {
        saveAs(content, selectedProduct.productID + ".zip");
        $("#downloadPage .loading-icon").hide();
    }, function() {
        $("#downloadPage .loading-icon").hide();
        $("#downloadPage .error-msg").text("Download Error");
    });
}

//delete selected images
function deleteDownloadedImage(activeTab) {    
    selectedImageIds.forEach(function(id) {
        var selectedImageIndex = id.split('download-img-').pop();        
        imagesCaptured.splice(selectedImageIndex, 1);
        $(".edit-image-gallery").find("#dwn-img-wrap-" + selectedImageIndex).remove();        
    });    
    $(".edit-image-gallery > div").each(function(index) {
        $(this).find('input').attr("id","download-img-" + index);
        $(this).find('label').attr("for","download-img-" + index);
        $(this).attr("id", "dwn-img-wrap-" + index);
    });
    $('#downloadPage .edit-delete-btn, #uploadPage .edit-delete-btn, #downloadPage .edit-download-btn').addClass('disabled-btn');
    if(imagesCaptured.length === 0) {
        if(activeTab === 'download') {
            goToTab("uploadPage");
        }        
    }    
    checkUploadLimit();
}


//local file upload
$(document).on('change', '#file-select-btn', function(event) {
    localFileUpload.call(this, event);
});
function renderUploadedImages(e, file) {
    renderImage(file, imagesCaptured.length - 1, 'upload-images-wrap');        
}
  
//clear already uploaded data - to upload the same file again
$(document).on('click', '#file-select-btn', function () {
    this.value = null;
});

//function called on checkbox change
$(document).on('change', '.edit-image-gallery .image-checkbox', checkboxUpdated);
function checkboxUpdated() {
    selectedImages = [];
    selectedImageIds = [];
    $(".edit-image-gallery .image-checkbox:checked").each(function(){
        selectedImages.push($(this).val());
        selectedImageIds.unshift($(this).attr("id"));
    });    
    if(selectedImages.length > 0) {
        $('#downloadPage .edit-delete-btn, #uploadPage .edit-delete-btn, #downloadPage .edit-download-btn').removeClass('disabled-btn');
    } else {
        $('#downloadPage .edit-delete-btn, #uploadPage .edit-delete-btn, #downloadPage .edit-download-btn').addClass('disabled-btn');
    }
}

/********************* Product Approve/Reject Functions *******************/
function loadApprovalTab() {    
    var isRejectedByDesigner = (selectedProduct.status === config.statusMapper.toBeApproved && selectedProduct.rejectReason) ? true : false;
    populateValue(selectedProduct, isRejectedByDesigner);    
    if(selectedProduct.status === config.statusMapper.subToApprover || selectedProduct.status === config.statusMapper.rejFromApprover) {
        $('.reject-btn, .reason-textarea-wrap').hide();
    }
    
   if(selectedProduct.isApprovalNeeded==false){
         $('.submit-btn').text("Approve");          
   }
   else{
       $('.submit-btn').text("Send for Approval");
   }
      
}

//approve and send to reviewer
function sendToReviewer() {
    $("#approvalPage .loading-icon").show();
    var formData = new FormData();    
    formData.append('folderName', selectedProduct.productID);    
    formData.append('isUpdate', true);
    for(var j=0; j<imagesCaptured.length; j++) {
        if(imagesCaptured[j].name) {
            var imageFormat = imagesCaptured[j].name.split('.').pop();
            formData.append('files', imagesCaptured[j], selectedProduct.productID + '_' + j +'.' + imageFormat);
        } else {
            formData.append('files', imagesCaptured[j], selectedProduct.productID + '_' + j +'.' + config.snapshotFormat);                       
        }
    }    
    var uploadUrl = config.serverURL + config.addImage + '?productId=' + selectedProduct.productID;
    uploadRequest(uploadUrl, formData, function(response) {
        if(response.error) {
            $("#approvalPage .loading-icon").hide();
            $("#approvalPage .error-msg").text(response.error);
        } else {
            var postData = {};
            postData.productID = selectedProduct.productID;
            postData.images = response.data;    
            postData.status = config.statusMapper.approved;
            if(selectedProduct.isApprovalNeeded) {
             postData.status = config.statusMapper.subToApprover;   
            } else {
                postData.status = config.statusMapper.approved;
            }            
            postData.oldStatus = selectedProduct.status;
            updateProduct(postData, '#approvalPage');
        }
    }, function() {
        $("#approvalPage .loading-icon").hide();
        $("#approvalPage .error-msg").text(config.serverError);
    });
}



  function approve1() {
    $(".product-update-wrap .loading-icon").show();
    var postData = {};
    postData.productID = selectedProduct.productID;    
    postData.status = config.statusMapper.approved;
    updateProduct(postData, '.reviewer-page-wrap');
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
    
    




/*************************** Common Functions ****************************/
  //update thumbnail scrollbar based on preview container height
  function updateScrollBar() {
    setTimeout(function() {
        $(".img-edit-thumbs").css("height", ($('.edit-preview-wrap').height()) + "px");
        $(".img-edit-thumbs").nanoScroller({alwaysVisible: true,
            preventPageScrolling: true});
     });
 }

 //check the image count to enable/ disable elements
 function checkUploadLimit() {
    if(imagesCaptured.length <= 1) {
        $('#editPage .edit-delete-btn').addClass('disabled-btn');
    } else {
        $('#editPage .edit-delete-btn').removeClass('disabled-btn');
    }
    if(imagesCaptured.length > 0) {
        $(".product-image-edit, .product-approve, .product-image-down, .product-image-upload").removeClass("disabled-tabs");
        $('.to-approval-tab-btn').removeClass('disabled-btn');
        $('#uploadPage .edit-delete-btn').parent().show();
        $('#uploadPage .upload-btn').parent().removeClass('col-md-offset-5 upload-btn-center');
    } else {
        $(".product-image-edit, .product-approve, .product-image-down").addClass("disabled-tabs");
        $('.to-approval-tab-btn').addClass('disabled-btn');
        $('#uploadPage .edit-delete-btn').parent().hide();
        $('#uploadPage .upload-btn').parent().addClass('col-md-offset-5 upload-btn-center');
    }
    if(imagesCaptured.length >= 10) {
        $('#uploadPage .upload-btn').addClass('disabled-btn');
    } else {
        $('#uploadPage .upload-btn').removeClass('disabled-btn');
    }
 }

 //to activate respective tabs on clicking continue
 function goToTab(tabName) {
    $('.product-edit-tabs a[href="#' + tabName +'"]').tab('show');
 }

 
 //load respective tabs on tab click
 function loadTabs() {
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {   
       $('html,body').animate({scrollTop:0},0);        
       switch($(e.target).attr("href")) {
           case "#editPage": 
               loadEditTab();
               break;
           case "#downloadPage": 
               loadDownloadTab();
               break;
            case "#uploadPage": 
                loadUploadTab();
                break;
            case "#approvalPage": 
                loadApprovalTab();
                break;
       }    
   });
 }
 /********************************* Image Edit Functions *******************************/

 // Show crop box
 function cropImage() {
   cropperRef.cropper();   
 }

 //rotate image
 function rotateRight() {
     if(cropperRef && cropperRef.data('cropper')) {
        cropperRef.cropper('rotate', +90);
     } else {
        cropperRef.cropper({ready: function() {
            cropperRef.cropper('rotate', +90);
        }});
     }     
 }

 //zoom image
 function zoomIn() {
    if(cropperRef && cropperRef.data('cropper')) {
        cropperRef.cropper('zoom', '0.5');
     } else {
        cropperRef.cropper({ready: function() {
            cropperRef.cropper('zoom', '0.5');
        }});
     }  
 }

 //save the edited image
 function saveImage() {
     var imageIndex = selectedImageID.split('screenshot').pop();
     var imgurl;
     if(cropperRef && cropperRef.data('cropper')) {
        imgurl = cropperRef.cropper('getCroppedCanvas').toDataURL(imagesCaptured[imageIndex].type);
     } else {
        imgurl = document.getElementById('targetEditorImage').toDataURL(imagesCaptured[imageIndex].type);
     }
     var imgBlob = getBlobFromDataUri(imgurl);
     imgBlob.name = imagesCaptured[imageIndex].name;
     imagesCaptured[imageIndex] = imgBlob;
     removeEditReference();
     $('#screenshot' + imageIndex).attr('src', URL.createObjectURL(imagesCaptured[imageIndex]));
     selectImage('screenshot' + imageIndex);     
 }

 //to edit the image if the cropper is already added, cropper has to be reinitialized
 function retainCropperData() {
    // Initialize a new cropper 
    if (cropperRef && cropperRef.data('cropper')) { 
        var image = cropperRef.cropper('getImageData');  
        image.zoomLevel = (image.width / image.naturalWidth) - 1;
        image.defaultLevel = (image.zoomLevel * -1).toString();
        cropperRef.cropper('zoom', image.defaultLevel);
        var croppedData = cropperRef.cropper('getData', true);        
        cropperRef.cropper('destroy');
        cropperRef.cropper({ready: function() {
            cropperRef.cropper('setData', croppedData);
            cropperRef.cropper('zoom', image.zoomLevel);
        }});        
    }
}

//function call on color filters change
 $(document).on('change', 'input[type=range]', function() {
     unsavedChanges = true;
     var bright = parseInt($('#bright').val());
     var cntrst = parseInt($('#contrast').val());
     var gamma = parseInt($('#gamma').val());
     var saturation = parseInt($('#saturation').val());
     var hue = parseInt($('#hue').val());
     var vibrance = parseInt($('#vibrance').val());
     var exposure = parseInt($('#exposure').val());
     var sepia = parseInt($('#sepia').val());
     camanRef.revert(false);
     // Send Callback back to Cropper to edited save image
     camanRef.brightness(bright).contrast(cntrst).gamma(gamma).saturation(saturation).hue(hue).vibrance(vibrance).exposure(exposure).sepia(sepia).render(retainCropperData);     
     $('.edit-save-btn, .cancel-btn').removeClass('disabled-btn');
 });

 // Remove/Reset all edits to start fresh
 function removeEditReference() {
     if (cropperRef && cropperRef.data('cropper')) {         
         cropperRef.cropper('destroy'); // destroy cropper
     }
     if(camanRef) {
        $('input[type=range]').val(0);
        $('input[type=range]#gamma').val(1);
        camanRef.revert(false);
        camanRef.render();
     }    
     $('.edit-save-btn, .cancel-btn').addClass('disabled-btn');
     $("#targetEditorImage").removeAttr("data-caman-id"); // Clear caman reference
 }

