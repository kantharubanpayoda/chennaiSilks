var table;

$(document).ready(function(){
    $(".addCategory").hide();
    showcategoryList();
});
$("#addnewcategory").click(function(){
    console.log("add new category called");
    //show add category screen components
    $(".categoryList").hide();
    $(".categoryText").text("Add new category");
    $("#addUpdateCategory").html('Save');
    $(".addCategory").show();
    $(".category-field-error").text("");

    var categoryId = new Date().getTime();
    var tcsCategoryID = "tcs"+categoryId;
    $("#categoryId").text(tcsCategoryID);
    $("#categoryName").val("");
    $("#approvalNeeded").attr("checked",true);
});
$("#addUpdateCategory").click(function(){
    var categoryName = $("#categoryName").val();
   if(categoryName == ""){
     $(".category-field-error").text(config.categoryInvalid);
     $('.category-field-error').focus();
   }else{
     $(".category-field-error").text("");
     var postData = {};
     postData.categoryId = $("#categoryId").text();
     postData.name = $("#categoryName").val();
     postData.approvalNeeded = $("#approvalNeeded").is(':checked');
     console.log(postData);
     addCategory(postData);
   }
});
$("#cancelCategory").click(function(){
    $(".categoryList").show();
    $(".addCategory").hide();
});

//api call to add category
function addCategory(postData) {
    var url = config.serverURL + config.addUpdateCategory;
    postRequest(url, postData,function(response){
        console.log(response);
        if(response.error) {
          //need to handle error case
        } else {
          $(".categoryList").show();
          $(".addCategory").hide();
          table.ajax.reload( null, false );
        }
    });
}

//api call to show category list
function showcategoryList(){
	var fieldMapper = {0: "categoryId", 1: "name", 2: "approvalNeeded"};
  table = $('#categories-datatables').DataTable({
      "columns": [
          { "data": "categoryId" },
          { "data": "name" },
          { "data": null,
            "render": function(data, type, row, meta)
            {
                if (data.approvalNeeded == true)
                console.log(data.approvalNeeded);
             if (data.approvalNeeded == false){
                 
                 return '<span style="color:Orange">NO</span>';
                 
             }
             else if (data.approvalNeeded == true){
                 return  '<span style="color:Green">YES</span>';
             }     
            }
            
          },
          { "data": null,
            "className": "actions",
            "render": function ( data, type, row, meta ) {
              return '<a class="on-default edit-row" onclick="editCategory(\'' + row.categoryId+','+row.name+','+row.approvalNeeded + '\')"><span class="edit"></span></a><a class="on-default remove-row" onclick="deleteCategory(\'' + row.categoryId + '\')"><span class="trash"></span></a>';
              }
          }
      ],
      columnDefs: [ {
          orderable: false
      } ],
      order: [[ 1, 'asc' ]],
      "ajax": {
        "url": config.serverURL + config.getCategories, 
        "contentType": "application/json",
        "type": "GET",
        "data": function ( d ) {
          return {
              queryParam: $("#categorySearchText").val() ? $("#categorySearchText").val() : "",
              start: d.start,
              end: d.start + config.gridPageSize,
              sortType: fieldMapper[d.order[0].column],
              sortOrder: d.order[0].dir === "desc" ? "dsc" : "asc"
          };
        },
        "dataFilter": function(data) {
            var json = jQuery.parseJSON( data );
            console.log(data);
            json = json.data;
            json.recordsTotal = json.total;
            json.recordsFiltered  = json.total;
            json.data = json.category;
            products = json.category;
            return JSON.stringify( json ); // return JSON string
        }
      },
      "pageLength": config.gridPageSize,
      "searching": false,
      "bFilter":true,
      "serverSide": true,
      "lengthChange": false,
      "stateSave": false,
      "deferRender": true,
	  "bSortable":true,
      "bProcessing": true
  });
}
function editCategory(category){
  console.log("edit category called");
  //update category screen components
  $(".categoryList").hide();
  $(".categoryText").text("Update category");
  $("#addUpdateCategory").html('Update');
  $(".addCategory").show();

  var categoryDetails = category.split(',');
  console.log(categoryDetails);
  $("#categoryId").text(categoryDetails[0]);
  $("#categoryName").val(categoryDetails[1]);
  $("#approvalNeeded").attr('checked',categoryDetails[2]);

}
function deleteCategory(id) {
    var postData = {"categoryId": id};
    var url = config.serverURL + config.deleteCategory;
    postRequest(url, postData, function(response){
        console.log(response);
        table.ajax.reload( null, false );
    });
}
$('#categorySearch').on('click', function () {

  table.column(1).search(
       $('#categorySearchText').val()
   ).draw();

});
