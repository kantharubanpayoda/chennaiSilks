var path = require('path');
//var pathComp = require("express-static");
var passport = require('passport');

function formRolesObject(roles) {
    return {
        admin: roles.indexOf('admin') !== -1,
        reviewer: roles.indexOf('reviewer') !== -1,
        designer: roles.indexOf('designer') !== -1,
        supplier: roles.indexOf('supplier') !== -1
    };
}
function routes(app) {
    app.get('/views/:file', function(req, res) {
      res.sendFile(path.join(appPath + '/views/'+req.params.file));
    });
    app.get('/views/:dir/:file', function(req, res) {
      res.sendFile(path.join(appPath + '/views/'+req.params.dir+'/'+req.params.file));
    });
    app.get('/views/:dir/:sub_dir/:file', function(req, res) {
      res.sendFile(path.join(appPath + '/views/'+req.params.dir+'/'+req.params.sub_dir+'/'+req.params.file));
    });
    app.get('/views/:assets/:dir/:sub_dir/:file', function(req, res) {
      res.sendFile(path.join(appPath + '/views/'+req.params.assets+'/'+req.params.dir+'/'+req.params.sub_dir+'/'+req.params.file));
    });
    app.get('/views/:assets/:dir/:sub_dir/:category/:file', function(req, res) {
      res.sendFile(path.join(appPath + '/views/'+req.params.assets+'/'+req.params.dir+'/'+req.params.sub_dir+'/'+req.params.category+'/'+req.params.file));
    });
    app.get('/views/:assets/:dir/:sub_dir/:category/:extension/:file', function(req, res) {
      res.sendFile(path.join(appPath + '/views/'+req.params.assets+'/'+req.params.dir+'/'+req.params.sub_dir+'/'+req.params.category+'/'+req.params.extension+'/'+req.params.file));
    });
    app.get('/sign-in', function(req, res) {
        if(req.user) {
            res.redirect('/');
        } else {
            res.render('sign_in', {title: 'Sign In'});
        }

    });
    app.get('/recover-password', function(req, res) {
        if(req.user) {
            res.redirect('/');
        } else {
            res.render('recover_password', {title: 'Recover Password'});
        }
    });
    app.get('/profile', passport.authenticationMiddleware.viewRequests, function(req, res) {
        var rolesObj = formRolesObject(req.user.roles);
        res.render('profile', {title: 'Profile', profile: true, roles: rolesObj});
    });
    app.get('/QR-scanner', passport.authenticationMiddleware.viewRequests, function(req, res) {
        var rolesObj = formRolesObject(req.user.roles);
        if(rolesObj.supplier) {
            res.render('QR_scanner', {title: 'QR Scanner', qrScanner: true, roles: rolesObj});
        } else {
            res.redirect('/unauthorised');
        }
    });
    app.get('/scan', passport.authenticationMiddleware.viewRequests, function(req, res) {
        var rolesObj = formRolesObject(req.user.roles);
        if(rolesObj.supplier) {
            res.sendFile(path.join(appPath + '/views/templates/scan.html'));
        } else {
            res.redirect('/unauthorised');
        }
    });
    app.get('/capture-stream', passport.authenticationMiddleware.viewRequests, function(req, res) {
        var rolesObj = formRolesObject(req.user.roles);
        if(rolesObj.supplier) {
            res.sendFile(path.join(appPath + '/views/templates/capture_stream.html'));
        } else {
            res.redirect('/unauthorised');
        }
    });
    app.get('/transmit-stream', passport.authenticationMiddleware.viewRequests, function(req, res) {
        res.sendFile(path.join(appPath + '/views/templates/video_streamer_client.html'));
    });
    app.get('/image-edit', passport.authenticationMiddleware.viewRequests, function(req, res) {
        var rolesObj = formRolesObject(req.user.roles);
        if(rolesObj.designer) {
            res.sendFile(path.join(appPath + '/views/templates/image_edit.html'));
        } else {
            res.redirect('/unauthorised');
        }
    });
    app.get('/upload-image', passport.authenticationMiddleware.viewRequests, function(req, res) {
        var rolesObj = formRolesObject(req.user.roles);
        if(rolesObj.supplier || rolesObj.designer || rolesObj.reviewer) {
            res.sendFile(path.join(appPath + '/views/templates/upload.html'));
        } else {
            res.redirect('/unauthorised');
        }
    });
    app.get('/gallery', passport.authenticationMiddleware.viewRequests, function(req, res) {
        var rolesObj = formRolesObject(req.user.roles);
        res.render('gallery', {title: 'Gallery', gallery: true, roles: rolesObj});
    });
    app.get('/image-list', passport.authenticationMiddleware.viewRequests, function(req, res) {
        var rolesObj = formRolesObject(req.user.roles);
        res.render('image_list', {title: 'Image List', imageList: true, roles: rolesObj});
    });
    app.get('/unauthorised', passport.authenticationMiddleware.viewRequests, function(req, res) {
        var rolesObj = formRolesObject(req.user.roles);
        res.render('unauthorised', {title: 'Unauthorised', roles: rolesObj});
    });
    app.get('/', passport.authenticationMiddleware.viewRequests, function(req, res) {
        var rolesObj = formRolesObject(req.user.roles);
        res.render('dashboard', {title: 'Dashboard', dashboard: true, roles: rolesObj});
    });
    app.get('/category', passport.authenticationMiddleware.viewRequests, function(req, res) {
        var rolesObj = formRolesObject(req.user.roles);
        if(rolesObj.admin) {
            res.render('category', {title: 'category', category: true, roles: rolesObj});
        } else {
            res.redirect('/unauthorised');
        }        
    });
    app.get('/users', passport.authenticationMiddleware.viewRequests, function(req, res) {
        var rolesObj = formRolesObject(req.user.roles);
        res.render('users', {title: 'users', users: true, roles: rolesObj});
    });
    app.use(passport.authenticationMiddleware.viewRequests, function(req, res) {
        var rolesObj = formRolesObject(req.user.roles);
        res.render('invalid', {title: 'Invalid', roles: rolesObj});
    });
}

module.exports = routes
