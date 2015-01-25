var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');

var app = express();
var http = require('http').createServer(app);
var io = require('socket.io');
io = io.listen(http.listen(process.env.PORT||3000, function(){
  console.log('listening on port '+ process.env.PORT||3000);
}));
io.settings.log = false;
//var io = require('socket.io').listen(server);

//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


app.get("/", function(req, res) {
    res.sendFile("/public/index.html");
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send("Woops, that's an error");
});



var myVar=setInterval(function () {votingTimer()}, 5000);
var floors = 5;
var users = {};
var elevator = {
  floor: Math.round(Math.random()*(floors-1)),
  users: []
};

//Initialize buttons of elevator  
var buttons = {
    up_down: [0,0],
    open_clos:[0,0]
};


function votingTimer() {
  io.sockets.emit("reset_command");
}

io.sockets.on("connection", function (socket) {
  var floor = Math.round(Math.random()*(floors-1));
  
  
  users[socket.id] = {
    floor: floor,
    id: socket.id,
    command:{
      direction: "";
      door: "";
      action: ""  
    }
  };
  
  socket.emit("info", {
    floors: floors,
    id: socket.id,
    users: users,
    elevator: elevator
  });
  
  io.sockets.emit("connected", {
    id: socket.id,
    floor: users[socket.id].floor
  });
  
  socket.on("disconnect", function() {
    delete users[socket.id];
    io.sockets.emit("disconnected", socket.id);
  });

  socket.on("inc_command", function(data) {
    users[socket.id].command = data.command;
    io.sockets.emit("out_command", {
      id: socket.id,
      command: data.command
    });
  });
});

module.exports = app;
