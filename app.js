var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');

var app = express();
var server = app.listen(3000);
var io = require('socket.io').listen(server);

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


io.sockets.on('connection', function (socket) {
  console.log('A new user connected!');
  socket.emit('test', { msg: 'hello world' });
});




module.exports = app;
