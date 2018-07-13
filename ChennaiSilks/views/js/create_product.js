var updateProductId;
$(function() {            
    $("#captureStream").load("/capture-stream");
    $("#scanPage").load("/scan", function() {
        updateProductId = localStorage.getItem("productToUpdate");
        if(updateProductId) {
            localStorage.removeItem("productToUpdate");
            $(".update-product-id").text("- Product ID: " + updateProductId);
        }
    });
    $("#upload").load("/upload-image");
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        $('html,body').animate({scrollTop:0},0);  
        if($(e.target).attr("href") !== "#captureStream" && window.stream) {                   
            window.stream.getTracks().forEach(function(track) {
                track.stop();
            });
        }
        switch($(e.target).attr("href")) {
            case "#captureStream": 
                loadCaptureTab();
                break;
            case "#upload": 
                loadImagesToUpload();
                break;
        }
        if($(e.relatedTarget).attr("href") === "#scanPage") {
            unbindScanner();
        }
    });

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

});