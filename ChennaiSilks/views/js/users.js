var filterType = "all",table;

$(document).ready(function(){
    $(".addUser").hide();
    showUserList();
});
$.validate({
  form : '#addUserForm',
  validateOnBlur : true, // disable validation when input looses focus
  scrollToTopOnError : false, // Set this property to true on longer forms
  onSuccess : function($form) {
         var postData = {};
             postData.userId = $("#userId").text();
             postData.name = $("#userName").val();
             postData.username = $("#userName").val();
             postData.mailId = $("#userEmail").val();
             postData.password = $("#userPassword").val();
             postData.profileImage = "";
             postData.mappedUser = $(".mappingUser option:selected").val();
             console.log(postData);
             roleMapperForBackend($(".roles option:selected").val(),function(mappedRole){
                 var roles = [];
                     roles.push(mappedRole);
                 postData.roles = roles;
                 addUser(postData);
             });
    }
});
function roleMapperForBackend(role,callback){
    var mappedRole;
  if(role == "Supplier"){
    mappedRole = "supplier";
  }else if(role == "Designer"){
    mappedRole = "designer";
  }else if(role == "Reviewer"){
    mappedRole = "reviewer";
  }else{
    mappedRole = "";
  }
  callback(mappedRole);
}
function roleMapperForUI(role,callback){
    var mappedRole;
  if(role == "supplier"){
    mappedRole = "Supplier";
  }else if(role == "designer"){
    mappedRole = "Designer";
  }else if(role == "reviewer"){
    mappedRole = "Reviewer";
  }else{
    mappedRole = "";
  }
  callback(mappedRole);
}
$("#addnewuser").click(function(){
    console.log("add new user called");
    //show add category screen components
    $('#addUserForm').get(0).reset();
    $(".userList").hide();
    $(".userText").text("Add new user");
    $("#addUpdateUser").html('Save');
    $(".addUser").show();
    $(".mappedUser option").remove();
    $('.mappedUser')
        .append($("<option></option>")
                   .attr("value","select")
                   .text("select"));
    // $(".roles").val("Select");
    $(".mappedToView").hide();
    var userId = Math.floor(Math.random()*1000000);
    var tcsuserId = "tcs"+userId;
    $("#userId").text(tcsuserId);

    $("#userName").val("");
});
$("#cancelUser").click(function(){
    $(".userList").show();
    $(".addUser").hide();
});

$('.roles').change(function() {
        var roleSelected = $('.roles option:selected').val();
        if(roleSelected != "select" && roleSelected == "Supplier"){
          $(".mappedToView").show();
          $(".mappedToText").text("Designer");
          getRoleBasedUserList(config.designer,function(roleBasedUserList){
            $(".mappedUser option").remove();
            $.each(roleBasedUserList, function(key, value) {
                 $('.mappedUser')
                     .append($("<option></option>")
                                .attr("value",value.username)
                                .text(value.username));
            });
          });
        }else if (roleSelected != "select" && roleSelected == "Designer"){
          $(".mappedToView").show();
          $(".mappedToText").text("Reviewer");
          getRoleBasedUserList(config.reviewer,function(roleBasedUserList){
            $(".mappedUser option").remove();
            $.each(roleBasedUserList, function(key, value) {
                 $('.mappedUser')
                     .append($("<option></option>")
                                .attr("value",value.username)
                                .text(value.username));
            });
          });
        }else if(roleSelected != "select" && roleSelected == "Reviewer"){
            //hide mapped to dropdown box
          $(".mappedToView").hide();
        }
});

function getRoleBasedUserList(roleSelected,callback){
  console.log("mapped to "+roleSelected);
  var postData = {
    role: roleSelected
  };
  var url = config.serverURL + config.getRoleBasedUserList;
  postRequest(url, postData,function(response){
      console.log(response);
      if(response.error) {
        //need to handle error case
        callback("");
      } else {
          if(response.Result.length){
            callback(response.Result);
          }
      }
  });
}


//api call to add User
function addUser(postData) {
    var url = config.serverURL + config.addUser;
    postRequest(url, postData,function(response){
        console.log(response);
        if(response.error) {
          //need to handle error case
        } else {
          $(".userList").show();
          $(".addUser").hide();
        }
    });
}

//api call to show category list
function showUserList(){
    var fieldMapper = {0: "userId", 1: "username", 2: "Date Created"};
  table = $('#categories-datatables').DataTable({
      "columns": [
          { "data": "userId" },
          { "data": "username" },
          { "data": "emailId" },
          { "data": "roles"},
//          { "data": "Date Created"},
          { "data": null,
            "className": "actions",
            "render": function ( data, type, row, meta ) {
              return '<a class="on-default edit-row" onclick="editUser(\'' + row.userId + '\')"><span class="edit"></span></a><a class="on-default remove-row" onclick="deleteUser(\'' + row.userId + '\')"><span class="trash"></span></a>';
              }
          }
      ],
      columnDefs: [ {
          orderable: false
      } ],
      order: [[ 1, 'asc' ]],
      "ajax": {
        "url": config.serverURL + config.getUserList,
        "contentType": "application/json",
        "type": "GET",
        "data": function ( d ) {
          return {
              type: filterType,
              queryParam: $("#categorySearch").val() ? $("#categorySearch").val() : "",
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
            json.recordsFiltered  = json.total;
            json.data = json.profiles;
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
      "deferRender": true,


  });
}
function editUser(Id){
  // console.log("edit User called"+userId);
  $("#userId").text(Id);
  $(".userList").hide();
  $(".userText").text("Update user");
  $("#addUpdateUser").html('Update');
  $(".addUser").show();

  getUserBasedOnId(Id,function(result){
    console.log(result);
    $("#userName").val(result.name);
    $("#userEmail").val(result.emailId);
    $("#userPassword").val(result.password);
    roleMapperForUI(result.roles[0],function(mappedRole){
        $(".roles").val(mappedRole);
    });
    if(result.roles[0] == "supplier"){
      $(".mappedToView").show();
      $(".mappedToText").text("Designer");
      getRoleBasedUserList(config.designer,function(roleBasedUserList){
        $(".mappedUser option").remove();
        $.each(roleBasedUserList, function(key, value) {
             $('.mappedUser')
                 .append($("<option></option>")
                            .attr("value",value.username)
                            .text(value.username));
        });
      });
    }else if (result.roles[0] == "designer"){
      $(".mappedToView").show();
      $(".mappedToText").text("Reviewer");
      getRoleBasedUserList(config.reviewer,function(roleBasedUserList){
        $(".mappedUser option").remove();
        $.each(roleBasedUserList, function(key, value) {
             $('.mappedUser')
                 .append($("<option></option>")
                            .attr("value",value.username)
                            .text(value.username));
        });
      });
    }else if(result.roles[0] == "reviewer"){
        //hide mapped to dropdown box
      $(".mappedToView").hide();
    }
  });
}
function getUserBasedOnId(Id,callback){
  var postData = { "userId" : Id};
  console.log(postData);
  var url = config.serverURL + config.getUser;
  postRequest(url, postData, function(response){
    if(response.error) {
      //need to handle error case
          callback("");
    } else {
        if(response.Result){
          callback(response.Result);
        }
    }
  });
}
function deleteUser(id) {
    var postData = {"userId": id};
    var url = config.serverURL + config.deleteUser;
    postRequest(url, postData, function(response){
        console.log(response);
        table.ajax.reload( null, false );
    });
}
$('#categorySearch').on('click', function () {

  table.column(1).search(
       $('#userSearchText').val()
   ).draw();

});
