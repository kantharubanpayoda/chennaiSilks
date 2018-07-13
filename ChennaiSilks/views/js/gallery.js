        var downloaded = 0;
        var products = [];
        var pagingOptions = {
            pageSize: config.galleryPageSize,
            currentPage: 1,
            noOfPages: 1
        };
        
        
        
   /*$(document).ready(function() {   
        alert()
        console.log($(".thumb-image").attr("data-image"))
      /*   $('.isotope-item.document').magnificPopup({
    items: [  
      {
        src: '{{lookup images 0}}',
        type: 'inline'
      },
    ],
    gallery: { 
      enabled: true
    },
    });
    
    $(document).on("click","#test",function(){
        console.log($(".thumb-image").attr("data-image"))
    });
    

    });*/
        var image_list_source = `{{#each this}}       
        <div class='isotope-item document col-sm-6 col-md-4 col-lg-2'>
            <div class='thumbnail'>
                <div class='thumb-preview'>
                    <a class='thumb-image' data-id='{{@index}}'  data-image='{{lookup images o}}'>
                        <img src='{{lookup images 0}}' class='img-responsive' alt='images'></a> 
                        <div class='mg-thumb-options'>
                            <div class='mg-toolbar'>
                            <div class='mg-option checkbox-custom checkbox-inline'>
                                <input type='checkbox' name="productData" id='{{productID}}' value='{{productID}}'>
                                <label for='{{productID}}'>{{productID}}</label>
                                </div>
                            </div>
                    </div>
                </div>
                </div>
            </div>
        {{/each}}`;
                
                
        
 
       
        var image_list_template = Handlebars.compile(image_list_source);       
            function getApprovedProducts() {
                var start = (pagingOptions.currentPage - 1) * pagingOptions.pageSize;
                var end = pagingOptions.currentPage * pagingOptions.pageSize;
                var url = config.serverURL + config.getProducts + "?type=approved&start=" + start + "&end=" + end;
                getRequest(url,function(response){
                    products = response.data.products;
                    pagingOptions.noOfPages = Math.ceil(response.data.total / pagingOptions.pageSize);
                    $(".gallery-total").text("Total Results (" + response.data.total + ")");
                    updateBtnState();
                    showGalleryImages(products);
                    
                   
                    /*products.images.each(function(i,data){
alert(i)
                               var item = $('<div class="item"></div>');
                                    var itemDiv = $(this).parents('div');
                                    var title = $(this).parent('a').attr("title");
                                    item.attr("title", title);
                                    $(itemDiv.html()).appendTo(item);
                                    item.appendTo('.carousel-inner');
                                    if (i == 0){ // set first item active
                                        item.addClass('active');
                                    }
                           }) */
                   
                

                /* when clicking a thumbnail */
                $('.thumb-image').click(function(){
                    var index = $(this).attr("data-id");
                     var str="";
               // $.each( products, function( j, value ){
                    console.log(products[index].images)
                    //if(index==j){
                        $.each( products[index].images, function( i, value ){
                            console.log( "index", i, "value", value );
                                        if (i == 0){ // set first item active
                                            str ='<div class="item active" data-id='+index+'> <img src="'+value+'" alt="item0"></div>'
                                        } else {
                                            str+='<div class="item" data-id='+index+'> <img src="'+value+'" alt="item0"></div>'
                                        }
                        });
                        $(".carousel-inner").html(str);
                   //}
               // });
                    $('#myModal').modal('show'); // show the modal
                   // $('#modalCarousel').carousel(id); // slide carousel to selected
                });
                
                /* activate the carousel */
                $('#modalCarousel').carousel({interval:false});

                /* change modal title when slide changes */
                $('#modalCarousel').on('slid.bs.carousel', function () {
                  $('.modal-title').html($(this).find('.active').attr("title"));
                })
                });
            }
            
            
        /* copy loaded thumbnails into carousel */
                       
          
            getApprovedProducts();
            function goToNext() {
                if(pagingOptions.currentPage < pagingOptions.noOfPages) {
                    pagingOptions.currentPage++;
                    getApprovedProducts();
                }
                updateBtnState();
                
                    
            }
            function goToPrevious() {
                if(pagingOptions.currentPage > 1) {
                    pagingOptions.currentPage--;
                    getApprovedProducts();
                }
                updateBtnState();
            }
            function updateBtnState() {
                if(pagingOptions.currentPage >= pagingOptions.noOfPages) {
                    $(".gallery-next-btn").addClass("disabled");
                } else {
                    $(".gallery-next-btn").removeClass("disabled");
                }
                if(pagingOptions.currentPage <= 1) {
                    $(".gallery-prev-btn").addClass("disabled");
                } else {
                    $(".gallery-prev-btn").removeClass("disabled");
                }
            }

        function downloadImages(argument) {
        //     console.log("downloadImages called");
        //     $('.checkbox-custom input[type="checkbox"]:checked').each(function () {
        //        var imageUrl = (this.checked ? $(this).attr('id') : "");
        //        var imageUrlSplitted = imageUrl.split(':');
        //        var imageParam = imageUrlSplitted[1].split(';');
        //        var imageFormat = imageParam[0].split('/');
        //        var imageName = 'test'+downloaded+'.'+ imageFormat[1];
        //        downloaded++;
        //          download(imageUrl, imageName, imageParam[0]);
        //   });
            var selectedProductIds = [];
            $("input:checkbox[name=productData]:checked").each(function(){
                selectedProductIds.push($(this).val());
            });
            var selectedProducts = products.filter(function(product){
                return selectedProductIds.indexOf(product.productID) !== -1 ? true : false;
            });
            var postData = [];
            $.each(selectedProducts, function( index, product ) {
                postData.push({"productId": product.productID, "images": product.images});
            });

            var url = config.serverURL + config.downloadProducts;
            postRequest(url, postData, function(response){
                var downloadUrl = config.serverURL + config.downloadProducts + "?downloadId=" + response.data;
                var anchor = $('<a/>');
                anchor.attr({
                    href: downloadUrl
                });
                document.body.appendChild(anchor[0]);
                setTimeout(function() {
                    anchor[0].click();
                    document.body.removeChild(anchor[0]);
                });
                            
            });


        }
        


        function showGalleryImages(data){
            var image_list = image_list_template(data);
            $('#media_gallery_list').html(image_list);
        }

        

        getProfile();
    


