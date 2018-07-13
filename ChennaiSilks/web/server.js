// Load required modules
var express = require("express"); // web framework external module
app = express();
var path = require('path');
var envReader = require('dotenv').config()// To access .env file
var fs = require('fs');
var config = require('../config/config');
var exphbs  = require('express-handlebars');//view engine
var log = require('../lib/logger.js');
var request = require('request');
var log = require('../config/config.js');
var oAuthToken;

require('../auth/auth.js')(app);


// Set process name
process.title = "Chennai Silks";

var appDir = path.dirname(require.main.filename);
global.appPath = path.dirname(appDir);

var privateKey  = fs.readFileSync('../certs/key.pem');
var certificate = fs.readFileSync('../certs/cert.pem');
var sslOptions = {key: privateKey, cert: certificate};
var https = require('https').Server(sslOptions, app);
// var socketIo = require("socket.io")(https);


app.use('/uploads',express.static(path.join(__dirname, '../uploads')));



// Start Express https server
var port = config.port || 7000;
//server listens to the port which is supplied
global.webServer = https.listen(port, function() {
    console.log('listening on *:' + port);
//     request.post(
//     'http://192.168.100.172/tcs_ui/rest/V1/integration/admin/token',
//     { json: { username: config.magentoUsername , password : config.magentoPassword} },
//     function (error, response, body) {
//         if (!error && response.statusCode == 200) {
//             console.log(body);
//             oAuthToken = body;
//         }
//     }
// );
});

var bodyParser = require('body-parser');
//Body parser helps to get request from body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*' );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type','X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

//set the view engine as handlebars and ser default layout
app.engine('handlebars', exphbs({
    layoutsDir: path.join(__dirname, '..', 'views', 'templates', 'layouts'),
    defaultLayout: 'main',
    helpers: {
      section: function(name, options){
          if(!this._sections) this._sections = {};
          this._sections[name] = options.fn(this);
          return null;
      }
    }
  }));

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '..', 'views', 'templates'));

// Global Vars
app.use(function (req, res, next) {
  res.locals.user = req.user || null;
  next();
});

module.exports = app;

// Routers for API
var profile = require('../routes/profile.js');
var product = require('../routes/product.js');
var statistics = require('../routes/statistics.js');
var category = require('../routes/category.js');


app.use('/profile', profile);
app.use('/product', product);
app.use('/statistics', statistics);
app.use('/categories', category);

//Services

require('../views/routes/route.js')(app);
//require('../cameraService/clientConnector.js')(app,socketIo);
//require('../cameraService/sonyConnector.js')(app,https,socketIo);
//require('../routes/uploadImage.js')(app,socketIo);
