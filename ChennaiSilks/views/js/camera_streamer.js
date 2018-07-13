var socket = io();
var params = {};

function buildAttrs() {
  for(param in params) {
    var select = $("#param-" + param);
    if(select.length) {
      select.empty();
    } else {
      console.log("adding param " + param);
      $('#params').append('<li style="padding: 10px;">' + param + ': <select id="param-' + param + '"></select></li>');
      select = $("#param-" + param);
      (function(p) {
        select.change(function(){
          console.log("setting " + p + " to " + $(this).val());
          socket.emit('set', p, $(this).val());
        });
      })(param);
    }
    for(var i = 0; i < params[param].available.length; i++) {
      var selected = (params[param].current == params[param].available[i]) ? "selected " : "";
      select.append($("<option " + selected + "/>").val(params[param].available[i]).text(params[param].available[i]));
    }
  }
}

$('form').submit(function(){
  socket.emit('message', $('#m').val());
  $('#m').val('');
  return false;
});
socket.on('update', function(param, data){
  $('#updates').append($('<li>').text(param + ": " + data.current));
  params[param] = data;
  buildAttrs();
});
socket.on('status', function(message){
  $('#updates').append($('<li>').text(message));
});
socket.on('params', function(data){
  params = data;
  buildAttrs();
});
socket.on('image', function(img) {
  $("#img").attr('src', 'data:image/png;base64,' + img);
});

$(window).ready(function(){
  console.log("ready");
  $('#capture').click(function(){
    console.log("sending capture command");
    socket.emit("capture");
  });
  $('#startViewfinder').click(function(){
    console.log("sending startViewfinder command");
    socket.emit("startViewfinder");
  });
  $('#stopViewfinder').click(function(){
    console.log("sending stopViewfinder command");
    socket.emit("stopViewfinder");
  });
});
