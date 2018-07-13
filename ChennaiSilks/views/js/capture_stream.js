var imagesCaptured = [];
var streamLoaded = false;

//init function on clicking camera tab
 function loadCaptureTab() {
    loadImagesEdited();
    checkUploadLimit();
    getCameraStream();
    $(".product-info .name").text(productDataReceived.name);
    $(".product-info .id").text("Product ID: " + productDataReceived.productID);
    $(".take-snap-btn").addClass("disabled-btn");
}

//open webcamera and get the live view
function getCameraStream() {
  var video = document.querySelector('#live-view');
  var constraints = {
    audio: false,
    video: true
  };
  function handleSuccess(stream) {
    window.stream = stream; // make stream available to browser console
    video.srcObject = stream;
    setTimeout(function(){
      streamLoaded = true;
      $(".screenshot-wrap").css("height", ($('.live-view-wrap').height()) + "px");
      $(".screenshot-wrap").nanoScroller({alwaysVisible: true,
        preventPageScrolling: true});
        checkUploadLimit();
    },500);
  }
  function handleError(error) {
    console.log('navigator.getUserMedia error: ', error);
  }
  navigator.mediaDevices.getUserMedia(constraints).
      then(handleSuccess).catch(handleError);
}

//crop video to remove unwanted part
// function setOffset() {
//   var video = document.querySelector('#live-view');
//   var videoHeight = $(video).height();
//   var videoWidth = $(video).width();
//   //Demo
//   offset = videoWidth * 0.2;
//   console.log(offset);
// }
// $( window ).resize(function() {
//   setOffset();
// })

//take snap from video stream
function takeSnapshot() {
    var frame = captureVideoFrame('live-view', config.snapshotFormat);
    imagesCaptured.push(frame.blob);
    var img = $('<img />').attr({
        'id': 'screenshot' + (imagesCaptured.length-1),
        'src': URL.createObjectURL(frame.blob),
        'onClick': 'selectAddedImage(this.id)'
    }).prependTo('#screenshotContainer');
    selectAddedImage('screenshot' + (imagesCaptured.length-1));
    checkUploadLimit();
}

//select image on clicking over the image
function selectAddedImage(id) {
  $(".snapshot-wrap img").removeClass("selected");
  $(".snapshot-wrap #" + id).addClass("selected");
}


//clear the last image taken
function cancelImage() {
  if(imagesCaptured.length > 0) {
    var selectedImage = $(".snapshot-wrap").find("img.selected").attr("id");
    var selectedImageIndex = selectedImage.split('screenshot').pop();
    imagesCaptured.splice(selectedImageIndex, 1);
    $(".snapshot-wrap").find("#" + selectedImage).remove();

    for(var i = parseInt(selectedImageIndex); i < imagesCaptured.length; i++) {
      $(".snapshot-wrap #screenshot" + (i+1)).attr({"id": "screenshot"+i});
    }
    if(imagesCaptured.length > 0) {
      selectAddedImage('screenshot' + (imagesCaptured.length - 1));
    }
    checkUploadLimit();
  }
}

//local file upload
$(document).on('change', '#file-select-btn', function(event) {
  localFileUpload.call(this, event);
});
function renderUploadedImages(e) {
  var img = $('<img />').attr({
    'id': 'screenshot' + (imagesCaptured.length-1),
    'src': e.target.result,
    'onClick': 'selectAddedImage(this.id)'
  }).prependTo('#screenshotContainer');
  selectAddedImage('screenshot' + (imagesCaptured.length-1));
}

//clear already uploaded data - to upload the same file again
$(document).on('click', '#file-select-btn', function () {
  this.value = null;
});

//based on the uploaded image count enable/disable tabs/buttons
function checkUploadLimit() {
  if(imagesCaptured.length >= config.maxImageLimit) {
    $('.file-upload-btn').prop('disabled', true).parent().addClass("disabled-btn");
    $('.take-snap-btn').addClass("disabled-btn");
  } else {
    $('.file-upload-btn').prop('disabled', false).parent().removeClass("disabled-btn");
    if(streamLoaded) {
      $('.take-snap-btn').removeClass("disabled-btn");
    }
  }
  if(imagesCaptured.length === 0) {
    $('.cancel-btn').addClass("disabled-btn");
    $('.to-submit-tab-btn').addClass("disabled-btn");
    disableTabs(["qr-scanner-upload"]);
  } else {
    enableTabs(["qr-scanner-upload"]);
    $('.cancel-btn').removeClass("disabled-btn");
    $('.to-submit-tab-btn').removeClass("disabled-btn");
  }
  setTimeout(function(){
    $(".screenshot-wrap").nanoScroller({alwaysVisible: true,
      preventPageScrolling: true});
  });
}

//to load images on scanning existing products
function loadImagesEdited(){
      $('#screenshotContainer').empty();
      for(var i=0;i<imagesCaptured.length;i++){
        var img = $('<img />').attr({
            'id': 'screenshot' + i,
            'src': URL.createObjectURL(imagesCaptured[i]),
            'onClick': 'selectAddedImage(this.id)'
        }).prependTo('#screenshotContainer');
      if(imagesCaptured.length > 0) {
        selectAddedImage('screenshot' + (imagesCaptured.length-1));
      }
  }
}

//go to send for approval tab
function goToSubmitTab(){
  $('.qr-scanner-tabs a[href="#upload"]').tab('show');
};

// function openMobileStream() {
//     $('#videoStreamer').show();
//     $('#cameraStreamer').hide();
//     $('#mobileStreamerButton').addClass('btn-primary').removeClass('btn-default');
//     $('#camStreamerButton').removeClass('btn-primary').addClass('btn-default');
// }

// function openCameraStreamer() {
//     $('#server_messages').empty();
//     $('#cameraStreamer').show();
//     $('#videoStreamer').hide();
//     $('#mobileStreamerButton').removeClass('btn-primary').addClass('btn-default');
//     $('#camStreamerButton').addClass('btn-primary').removeClass('btn-default');
// }
