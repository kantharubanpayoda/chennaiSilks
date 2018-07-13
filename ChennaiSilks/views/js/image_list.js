var table, filterType = "all", products, recentListFilter, recentProductId;
$(".product-filters a#all").addClass("selected");
$(function() {
    // var url = config.serverURL + config.getProducts + "?type=all&start=0&end=100";

    // getRequest(url,function(response){
    // 	showImageList(response.data.products);
    // });

    $(document).on("click", ".product-filters a", function() {
        $(".product-filters a").removeClass("selected");
        $(this).addClass("selected");
        filterType = $(this).attr("id");
        table.ajax.reload( null, true );
    });

    // $('#datatable-editable').on('click', 'tr', function () {
    //     var data = table.row( this ).data();
    //     console.log(data);
    //     alert( 'You clicked on '+data.productID+'\'s row' );
    // });

});
function showImageList(productUrl){
    var fieldMapper = {0: " productID", 1: "name", 2: "createdDate"};
    table = $('#datatable-editable').DataTable({
        "columns": [
            {
              "data": null,
              "defaultContent": ''
            },
            { "data": "images",
              "className": "actions",
              "render": function ( data, type, row, meta ) {
                //console.log("data type"+typeof(data));
                return '<img src="'+data[0]+'" height="35" alt="Porto Admin" class="logo m-w-100"/>';
                }
            },
                { "data": null,
             "render": function ( data, type, row, meta ) {
                return '<p class="name">' + row.name + '</p>' +
                '<p>'+ row.productID + '</p>';
              
                
             }
         },
            { "data": "createdDate"},
            
            { "data": null, 
              "render" : function(data, type, row, meta){
               if (currentUser.roles[0]=='supplier') {
                  if (data.status == 'Rejected to Supplier'){
                      return '<span style="color:orange">Rejected</span>';
                  } else if(data.status == 'Submitted to the Approver')
                  {
                      return  '<span  style="color:green">Approved</span>';
                     
                  } 
                  else if(data.status == 'Yet to be Approved')
                  {
                      return  '<span  style="color:green">Submitted</span>';
                     
                  } else(data.status == 'Approved')
                  {
                      return  '<span  style="color:green">Approved</span>';
                     
                  }     
               } 
               else if (currentUser.roles[0]=='designer')
               {
                      return  data.status;    
               }
               else if (currentUser.roles[0]=='reviewer')
               {
                  return  data.status;  
               }
              }
            },  
            { "data": null,
              "className": "actions",
              "render": function ( data, type, row, meta ) {
              if (data.status == 'yet to be Approved') {
                    return '<a class="on-default edit-row" onclick="openProduct(\'' + row.productID + '\')"><span class="pencil"></a><a class="on-default remove-row" onclick="singleProductDelete(\'' + row.productID + '\')"><span class="trash"></span></a><a class="on-default approve-row" onclick="singleProductApprove(\'' + row.productID + '\')"><span class="approve"></a>';
                    }
                  else {
                    return '<a class="on-default edit-row" onclick="openProduct(\'' + row.productID + '\')"><span class="pencil"></a><a class="on-default remove-row" onclick="singleProductDelete(\'' + row.productID + '\')"><span class="trash"></span></a>';
                    };
                    }                         
          }
            
        ],
        columnDefs: [ {
            orderable: false,
            className: 'select-checkbox',
            targets:  0,
            
        } ],
        select: {
            style:    'multi',
            selector: 'td:first-child'
        },
        order: [[ 1, 'asc' ]],
        "pageLength": config.gridPageSize,
        "searching": false,
        "serverSide": true,
        "lengthChange": false,
        "stateSave": false,
        "deferRender": true,
        
        "ajax": {
            "url": config.serverURL + productUrl,
            "contentType": "application/json",
            "type": "GET",
            "data": function ( d ) {
              return {
                  type: filterType,
                  queryParam: $(".product-search-input").val() ? $(".product-search-input").val() : "",
                  start: d.start,
                  end: d.start + config.gridPageSize,
                  sortType: fieldMapper[d.order[0].column],
              sortOrder: d.order[0].dir === "desc" ? "dsc" : "asc"
              };
            },
            "dataFilter": function(data) {
                var json = jQuery.parseJSON( data );
                json = json.data;
                json.recordsTotal = json.total;
                json.recordsFiltered = json.total;
                json.data = json.products;
                products = json.products;
                return JSON.stringify( json ); // return JSON string
            }
          }
    });
}


///filtered result
function getFilteredStatus() { 
    console.log("in09");
                $(".product-list-wrap > .loading-icon").show();            
                var filteredUrl = config.serverURL + "/product/getProductsStats" ;
                getRequest(filteredUrl,function(response){
                     console.log(response);
                    $(".product-list-wrap > .loading-icon").hide();
                    if(response.error) {                    
                        $(".error-msg").text(response.error);
                    } else {
                        statistics = response.data;
                        showStatisticsResult(response.data.filtered, getCurrentMonth());      
         
                    }
                }, function() {
                    $(".product-list-wrap > .loading-icon").hide();
                    $(".error-msg").text(config.serverError);
                });
    };


function showStatisticsResult(data) {  
        
        $("#all span").text(data.total);
        
        switch (currentUser.roles[0]) {
            
            case 'supplier':
                $("#rejToSupplier span").text(data.rejToSupplier);
                $("#toBeApproved span").text(data.toBeApproved);
                $("#approvedForSupplier span").text(data.subToApprover + data.rejFromApprover + data.approved);
                
                break;
            case 'designer':
                $("#rejToSupplier span").text(data.rejToSupplier);
                $("#toBeApproved span").text(data.toBeApproved);
                $("#approvedForSupplier span").text(data.subToApprover + data.rejFromApprover + data.approved);
                
                break;
            case 'reviewer':
                $("#rejToSupplier span").text(data.rejToSupplier);
                $("#toBeApproved span").text(data.toBeApproved);
                $("#approvedForSupplier span").text(data.subToApprover + data.rejFromApprover + data.approved);
                
                break;
            default:
                $("#rejected").text(data.rejFromApprover + data.rejToSupplier);
                $("#to-be-approved").text(data.subToApprover + data.toBeApproved);
                $("#digitized").text(data.approved);
                 
        }
             
    };
    

function getQueriedProducts() {
    console.log("search func called");
    table.ajax.reload( null, true );
}

function reloadGrid() {
    table.ajax.reload( null, false );
}

function singleProductDelete(product) {
    deleteProduct([product]);
}

function multiProductDelete() {
    var productIds = $.map(table.rows('.selected').data(), function(product) {
        return product.productID;
    });
    deleteProduct(productIds);
}

function deleteProduct(id) {
    var postData = {productIds: id};
    var url = config.serverURL + config.deleteProduct;
    postRequest(url, postData, function(response){
        console.log(response);
        table.ajax.reload( null, false );
    });
}



function singleProductApprove(id){
    //$('.approve').click( function() {
    //$(this).css('background', 'green');
  //} );
    var postData = {productIds: id};
    var url = config.serverURL + "/approveProducts";
      postRequest(url, postData, function(response){
        console.log(response);
        table.ajax.reload( null, false );
    });
} 


//show the product detail page on
function openRecentProduct() {
    
    if(recentProductId) {
        localStorage.removeItem("productToUpdate");
        $(".loading-icon").show();
        var url = config.serverURL + config.fetchProductById + "?productId=" + recentProductId;
        getRequest(url, function(response) {
          if(response.data) {
            selectedProduct = response.data;
            openProduct(recentProductId, selectedProduct);
            
          } else if(response.error) {
            $(".loading-icon").hide();
            showGetProductError(response.error);
          }
        }, function() {
          $(".loading-icon").hide();
          showGetProductError(config.serverError);
        });
    }
}

$(document).ready(function() {
    
    var getProfilePromise = getProfile();
    recentProductId = localStorage.getItem("productToUpdate");
    getProfilePromise.then(function(response) {
        openRecentProduct();
        $(".product-filters").empty();
        $.each(config.filterMapper[response.data.roles[0]], function(index, filter) {
            var filterItems = `<div class="row">
                                <div class="col-md-12">
                                    <a id="`+ filter.key +`" class="on-default remove-row">`+ filter.value +`<span>(10,000)</span></a>
                                </div>
                            </div>`;
            $(".product-filters").append(filterItems);
        });
        if(recentListFilter === "overDue") {
            var overDueFilter = `<div class="row">
                <div class="col-md-12">
                    <a id="overDue" class="on-default remove-row">Over Due<span>(10,000)</span></a>
                </div>
            </div>`;
            $(".product-filters").append(overDueFilter);
        }
        $(".product-filters a#" + filterType).addClass("selected");
        
        if(!recentProductId) {
        $(".product-list-wrap").show();
        var searchValue = localStorage.getItem("searchParam");
        if(searchValue) {
            localStorage.removeItem("searchParam");
            $(".product-search-input").val(searchValue);
        }
        recentListFilter = localStorage.getItem("recentList");
        if(recentListFilter) {
            filterType = recentListFilter;
            localStorage.removeItem("recentList");
            showImageList(config.getRecentProducts);
            
        } else {
            showImageList(config.getProducts);
            getFilteredStatus();
        }
    }  else {
        $(".product-list-wrap").hide();
    }
    });

    

   // $('#datatable-editable_previous').on('click', function () {
       // alert();
    //if($tabs.filter('.active').prev('li').length==0)
    //{ 
     // $(this).attr("disabled",true);
     //}
   // $tabs.filter('.active').prev('li').find('a[data-toggle="tab"]').tab('show');

//});

 
});
