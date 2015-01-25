var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');

var app = express();
var http = require('http').createServer(app);
var io = require('socket.io');
io = io.listen(http.listen(process.env.PORT || 3000, function() {
    console.log('listening on port ' + process.env.PORT || 3000);
}));
io.settings.log = false;
//var io = require('socket.io').listen(server);

//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
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




var floors = 5;
var users = {};
var direction =0;
var door = 0;
var elevator = [{
    floor: Math.round(Math.random() * (floors - 1)),
    users: []
}];


//Initialize global buttons of elevator
//For up_down-->[number of UP, number of DOWN]
//For open_close-->[number of OPEN, number of CLOSE]
var buttons = {
    up_down: [0, 0],
    open_close: [0, 0]
};


io.sockets.on("connection", function(socket) {
    var floor = Math.round(Math.random() * (floors - 1));


    users[socket.id] = {
        floor: floor,
        elevator:false,
        id: socket.id,
        command: {
            direction: "",
            door: "",
            action: ""
        }
    };

    socket.emit("info", {
        floors: floors,
        id: socket.id,
        users: users,
        elevator: elevator
    });

    io.sockets.emit("connected", users[socket.id]);

    socket.on("disconnect", function() {
        delete users[socket.id];
        io.sockets.emit("disconnected", socket.id);
    });



    socket.on("inc_command", function(data) {
        if (data.command == "UP" || data.command == "DOWN") {
            users[socket.id].command.direction = data.command;
        } else if (data.command == "IN" || data.command == "OUT") {
            users[socket.id].command.action = data.command;
        } else if (data.command == "OPEN" || data.command == "CLOSE") {
            users[socket.id].command.door = data.command;
        }
        io.sockets.emit("out_command", {
            id: socket.id,
            command: data.command
        });
    });
});



 //Function to count the number of vote for up/down and open/close    
function collectData() {

        for (var userid in users) {
            if (users[userid].command.direction == "UP")
                buttons.up_down[0] ++;
            else if (users[userid].command.direction == "DOWN")
                buttons.up_down[1] ++;
            if (users[userid].command.door == "OPEN")
                buttons.open_close[0] ++;
            else if (users[userid].command.door == "CLOSE")
                buttons.open_close[1] ++;
        }

    }

    //Depending of commands, set the new state of the elevator

    function getNewElevatorInfo() {

        if (buttons.up_down[0] > buttons.up_down[1]){
            direction = -1;
        }
        else if (buttons.up_down[0] < buttons.up_down[1]){
            direction = 1;
        }
        //else
        //    direction = Math.round(Math.random())*2-1;
        
        if(elevator[0].floor==floors-1 && direction>0){
            elevator[0].floor-=1;
        }
        else if(elevator[0].floor==0 && direction<0){
            elevator[0].floor+=1;
        }
        else{
            elevator[0].floor+=direction;
        }

        if (buttons.open_close[0] > buttons.open_close[1])
            door = 1;
        else if (buttons.open_close[0] < buttons.open_close[1])
            door = 0;
       // else
      //  door = Math.round(Math.random());
        
    }
    

    //Depending of info, set each users info
    function setUserInfo(){
        for(var userid in users){
            if(users[userid].elevator == true){        
                users[userid].floor=elevator[0].floor;
                if(door==1 && users[userid].command.action=="OUT"){
                    users[userid].elevator = false;
                }
            }
            else if(users[userid].elevator==false){
                if(users[userid].floor==elevator[0].floor &&
                  users[userid].command.action=="IN"){
                    users[userid].elevator=true;
                }
            }
            else{}
            console.log("" + elevator[0].floor+"  "+ users[userid].floor+"    "+users[userid].elevator);
        }
    }

    //execute every times at the end of turn
    function votingTimer() {
        collectData();
        getNewElevatorInfo();
        setUserInfo();
        
        direction=0;
        door=0;
        action=0;
        buttons.open_close=[0,0];
        buttons.up_down=[0,0];
        io.sockets.emit("reset_command", {
            elevator: elevator,
            users: users
        });
    }

    var myVar = setInterval(function() {
        votingTimer()
    }, 5000);

module.exports = app;