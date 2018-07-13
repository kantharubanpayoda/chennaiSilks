function postRequest(url,postData,callback, errorCallback){
  $.ajax({
      type: "POST",
      beforeSend: function(request) {
          request.setRequestHeader("Content-Type", 'application/json');
      },
      url: url,
      data: JSON.stringify(postData),
      success: function(data) {
          // console.log(JSON.stringify(data));
          callback(data);
      },
      error: function(jqXHR, textStatus, errorThrown) {
          console.log('jqXHR:'+jqXHR);
          console.log('textStatus:'+textStatus);
          console.log('errorThrown:'+errorThrown);
          errorCallback();
      }
  });
}

function PostRequestWithOauth(url,token,callback, errorCallback){
  $.ajax({
      type: "POST",
      beforeSend: function(request) {
          var oAuthToken = 'Bearer '+token;
          request.setRequestHeader("Content-Type",'application/json');
          request.setRequestHeader("Authorization",oAuthToken);
      },
      url: url,
      data: "",
      success: function(data) {
          // console.log(JSON.stringify(data));
          callback(data);
      },
      error: function(jqXHR, textStatus, errorThrown) {
          console.log('jqXHR:'+JSON.stringify(jqXHR));
          console.log('textStatus:'+textStatus);
          console.log('errorThrown:'+errorThrown);
          errorCallback();
      }
  });
}

function getRequest(url,callback, errorCallback){
  $.ajax({
      type: "GET",
      beforeSend: function(request) {
          request.setRequestHeader("Content-Type", 'application/json');
      },
      url: url,
      data: "",
      success: function(data) {
          // console.log(JSON.stringify(data));
          callback(data);
      },
      error: function(jqXHR, textStatus, errorThrown) {
          console.log('jqXHR:'+JSON.stringify(jqXHR));
          console.log('textStatus:'+textStatus);
          console.log('errorThrown:'+errorThrown);
          errorCallback();
      }
  });
}

function getRequestWithOauth(url,token,callback, errorCallback){
  $.ajax({
      type: "GET",
      beforeSend: function(request) {
          var oAuthToken = 'Bearer '+token;
          request.setRequestHeader("Content-Type",'application/json');
          request.setRequestHeader("Authorization",oAuthToken);
      },
      url: url,
      data: "",
      success: function(data) {
          // console.log(JSON.stringify(data));
          callback(data);
      },
      error: function(jqXHR, textStatus, errorThrown) {
          console.log('jqXHR:'+JSON.stringify(jqXHR));
          console.log('textStatus:'+textStatus);
          console.log('errorThrown:'+errorThrown);
          errorCallback();
      }
  });
}

function uploadRequest(url,formData,callback, errorCallback){
    $.ajax({
        url: url,
        type: 'POST',
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        success: function(data) {
            callback(data);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log('jqXHR:'+jqXHR);
            console.log('textStatus:'+textStatus);
            console.log('errorThrown:'+errorThrown);
            errorCallback();
        }
    });
  }
