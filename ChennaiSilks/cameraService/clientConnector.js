
function connectClient(app,socketIo){
  // var socketIo = require("socket.io"); // web socket external module
  var easyrtc = require("easyrtc");
  // Start Socket.io so it attaches itself to Express server
  var socketServer = socketIo.listen(webServer, {"log level":1});

  easyrtc.setOption("logLevel", "debug");


  // Set IceServer Configurations
  var iceServers=[
    {"url":"stun:stun4.l.google.com:19302"},
    {
      "url":        "turn:turn.bistri.com:80",
      "username":   "homeo",
      "credential": "homeo"
    }
  ];

  easyrtc.setOption("appIceServers", iceServers);

  // Overriding the default easyrtcAuth listener, only so we can directly access its callback
  easyrtc.events.on("easyrtcAuth", function(socket, easyrtcid, msg, socketCallback, callback) {
      easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function(err, connectionObj){
          if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
              callback(err, connectionObj);
              return;
          }

          connectionObj.setField("credential", msg.msgData.credential, {"isShared":false});

          console.log("["+easyrtcid+"] Credential saved!", connectionObj.getFieldValueSync("credential"));

          callback(err, connectionObj);
      });
  });

  // To test, lets print the credential to the console for every room join!
  easyrtc.events.on("roomJoin", function(connectionObj, roomName, roomParameter, callback) {
      console.log("["+connectionObj.getEasyrtcid()+"] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
      easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
  });

  // Start EasyRTC server
  var rtc = easyrtc.listen(app, socketServer, null, function(err, rtcRef) {
      
      rtcRef.events.on("roomCreate", function(appObj, creatorConnectionObj, roomName, roomOptions, callback) {
          console.log("roomCreate fired! Trying to create: " + roomName);

          appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
      });
  });
}

module.exports = connectClient;
