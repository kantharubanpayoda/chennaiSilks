var getProfilePromise = getProfile();
var profileDetails, selectedImage;
getProfilePromise.then(function(response) {
    console.log("response", response);
    profileDetails = response.data;
    $(".profile-edit-form .data-username").text(response.data.username);
    $(".profile-edit-form .data-name").text(response.data.name);
    $(".profile-edit-form .data-image").attr("src", response.data.profileImage);
    $(".profile-edit-form .data-mail").text(response.data.emailId);
    $(".profile-edit-form .data-password").text(response.data.password);
});

function editProfile() {
    $(".profile-edit-form .data-name").hide();
    $(".profile-edit-form .data-mail").hide();
    $(".profile-edit-form .form-group input").show();
    $(".profile-edit-form #name").val(profileDetails.name);
    $(".profile-edit-form #mailId").val(profileDetails.emailId);
    $(".edit-profile-link").hide();
    $(".profile-edit-form .change-pw-link").show();
    $(".profile-edit-form .cancel-btn").show();    
    $(".profile-edit-form .profile-edit-btns").show();
}

function cancelEditProfile() {
    hideEditOptions();
    $(".profile-edit-form .data-name").show();
    $(".profile-edit-form .data-mail").show();
    $(".profile-edit-form .form-group input").hide();
    $(".profile-edit-form .data-name").text(profileDetails.name);
    $(".profile-edit-form .data-mail").text(profileDetails.emailId);
    $(".profile-edit-form .data-image").attr("src", profileDetails.profileImage);
    $(".edit-profile-link").show();
}
function hideEditOptions() {
    $(".profile-edit-form .form-group input").hide();
    $(".profile-edit-form .change-pw-link").hide();
    $(".profile-edit-form .cancel-btn").hide();
    $(".profile-edit-form .change-pw-wrap").hide();
    $(".profile-edit-form .profile-edit-btns").hide();
}
function changePassword() {
    $(".profile-edit-form .change-pw-wrap").show();
}

$("#edit-profile-form").validate({
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
            "name": $(form).find('input[name="name"]').val(),
            "emailId": $(form).find('input[name="mailid"]').val()
        };        
        saveUpdatedData(postData);        
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
function saveUpdatedData(postData) {
    console.log("in1")
    if(selectedImage) {
        var uploadUrl = config.serverURL + config.addProfileImage;  
        console.log("in2",selectedImage);     
        var formData = new FormData();
        formData.append('file', selectedImage);
        $.ajax({
            url: uploadUrl,
            type: 'POST',
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            success: function (response) {
                var url = config.serverURL + config.createProduct;
                postData.profileImage = response.data;
                saveDataHelper(postData);                 
            },
            error: function(err) {
               
            }        
        });
    } else {
        postData.profileImage = profileDetails.profileImage;
        saveDataHelper(postData);
    }
    
}

function saveDataHelper(postData) {
    console.log(postData);
    var url = config.serverURL + config.updateProfile;    
    postRequest(url,postData,function(response) {                
        console.log(response);
        profileDetails = response.data;
        cancelEditProfile();
    });
}

$(document).on('change', '.profile-edit-form #photo', function(event) {
    selectedImage = event.target.files[0];
});
hideEditOptions();