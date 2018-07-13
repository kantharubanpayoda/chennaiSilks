$("#recover-pwd-form").validate({
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
            "emailid": $(form).find('input[name="user-email"]').val()
        };
        console.log("postData", postData);
        var url = config.serverURL + config.recoverPassword;
        postRequest(url, postData, function(response){      
        window.location.href = "/sign-in";
        });
        window.location.href = "/sign-in";
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