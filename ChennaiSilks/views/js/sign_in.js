// $("#signin-form").submit(function(event){
//     event.preventDefault();
//     var postData = {
//         "name": $(this).find('input[name="username"]').val(),
//         "password": $(this).find('input[name="pwd"]').val()
//     };
//     var url = config.serverURL + config.authenticate;
//     postRequest(url, postData, function(response){      
//       window.location.href = "/";
//     });
//     window.location.href = "/";
// });
$("#signin-form").validate({
    highlight: function( label ) {
        $(label).closest('.form-group').removeClass('has-success').addClass('has-error');
    },
    success: function( label ) {
        $(label).closest('.form-group').removeClass('has-error');
        label.remove();
    },
    submitHandler: function(form, event) {
        event.preventDefault();
        var postData = {
            "username": $(form).find('input[name="username"]').val(),
            "password": $(form).find('input[name="pwd"]').val()
        };
        var url = config.serverURL + config.signin;        
        postRequest(url, postData, function(response){  
            window.location.href = "/";
        });
    },
    errorPlacement: function( error, element ) {
        var placement = element.closest('.input-group');
        if (!placement.get(0)) {
            placement = element;
        }
        if (error.text() !== '') {
            placement.after(error);
        }
    }
});


