window.addEventListener("load", function() {
  
  var socket = io.connect();
  var stage = document.getElementById("stage");

  var floors = [];
  var users = {};
  var elevators = [];
  var id = 0;
  
  var USER_WIDTH = 100;
  var DOOR_WIDTH = 140;
  var FLOOR_HEIGHT = 210;
  var SKY_HEIGHT = 300;
  
  var commands = {
    87: "UP",
    83: "DOWN",
    65: "IN",
    68: "OUT",
    81: "OPEN",
    69: "CLOSE"
  };
  
  //creating a floor 
  var addFloor = function() {
    var floor = document.createElement("div");
    floor.className = "floor";
    
    var door = document.createElement("div");
    door.className = "door";
    
    floor.appendChild(door);
    stage.appendChild(floor);
    
    floors.push({
      element: floor,
      queue: []
    });
    
    door.innerHTML = floors.length;
  };
  
  var moveElevator = function(elevator) {
    elevator.sprite.style.top = (SKY_HEIGHT + elevator.floor*FLOOR_HEIGHT) + "px";
  };

  //making an elevator object
  var addElevator = function(elevator) {
    var elevatorSprite = document.createElement("div");
    elevatorSprite.className = "elevator";
    stage.appendChild(elevatorSprite);
    elevator.sprite = elevatorSprite;
    moveElevator(elevator);
    elevators.push(elevator);
  };
  
  var addUser = function(user) {
    
    var sprite = document.createElement("div");
    sprite.className = "user animated";
    
    sprite.style.left = (DOOR_WIDTH + floors[user.floor].queue.length*USER_WIDTH) + "px";
    sprite.style.top = (SKY_HEIGHT + user.floor*FLOOR_HEIGHT) + "px";
    
    if (id == user.id) {
      sprite.id = "me";
      stage.style.top = (0 - SKY_HEIGHT - user.floor*FLOOR_HEIGHT + 150) + "px";
    }
    
    stage.appendChild(sprite);
    setTimeout(function() {
      sprite.classList.remove("animated");
    }, 1000);
    
    users[user.id] = user;
    users[user.id].sprite = sprite;
    floors[user.floor].queue.push(users[user.id]);
  };
  
  var updateCommand = function(user, command) {
    if (command == "UP" || command == "DOWN") {
      users[user].command.direction = command;
    } else if (command == "IN" || command == "OUT") {
      users[user].command.action = command;
    } else if (command == "OPEN" || command == "CLOSE") {
      users[user].command.door = command;
    } else if (command == "") {
      
      //reset all
      users[user].command.direction = "";
      users[user].command.action = "";
      users[user].command.door = "";
    }
    
    users[user].sprite.innerHTML = users[user].command.door + "<br>" + users[user].command.direction + "<br>" + users[user].command.action;
    if (users[user].sprite.className.indexOf("animated") == -1 && command != "") {
      users[user].sprite.classList.add("bounce");
      users[user].sprite.addEventListener("webkitAnimationEnd", function animationend(event) {
        this.classList.remove("bounce");
        this.removeEventListener("webkitAnimationEnd", animationend, false);
      }, false);
    }
    
  };

  var updatePosition = function(user, user2) {
    if (user.elevator != user2.elevator || user2.elevator) {
      if (user2.elevator) {
        if (!user.elevator) {
          floors[user.floor].queue = floors[user.floor].queue.filter(function(element) {
            return (element.id != user.id);
          });
          
          //Shift waiting users over
          for (var i=0; i<floors[user.floor].queue.length; i++) {
            floors[user.floor].queue[i].sprite.style.left = (DOOR_WIDTH + i*USER_WIDTH) + "px";
          }
        }
        user.sprite.style.left = "10px";
        user.sprite.style.top = (SKY_HEIGHT + elevators[0].floor*FLOOR_HEIGHT) + "px";
      } else {
        user.floor = user2.floor;
        user.sprite.style.left = (DOOR_WIDTH + floors[user.floor].queue.length*USER_WIDTH) + "px";
        user.sprite.style.top = (SKY_HEIGHT + user.floor*FLOOR_HEIGHT) + "px";
        floors[user.floor].queue.push(users[user.id]);
      }
      user.elevator = user2.elevator;
    } else if (user.floor != user2.floor) {
      floors[user.floor].queue = floors[user.floor].queue.filter(function(element) {
        return (element.id != data);
      });
      
      //Shift waiting users over
      for (var i=0; i<floors[user.floor].queue.length; i++) {
        floors[user.floor].queue[i].sprite.style.left = (DOOR_WIDTH + i*USER_WIDTH) + "px";
      }

      user.floor = user2.floor;

      user.sprite.style.left = (DOOR_WIDTH + floors[user.floor].queue.length*USER_WIDTH) + "px";
      user.sprite.style.top = (SKY_HEIGHT + user.floor*FLOOR_HEIGHT) + "px";
      floors[user.floor].queue.push(users[user.id]);
    }

    if (id == user.id) {
      user.floor = user2.floor;
      console.log((0 - SKY_HEIGHT - user.floor*FLOOR_HEIGHT + 150) + "px");
      stage.style.top = (0 - SKY_HEIGHT - user.floor*FLOOR_HEIGHT + 150) + "px";
    }
  };

  socket.on('info', function (data) {
    if (!id) {
      id = data.id;
      
      var sky = document.createElement("div");
      sky.id = "sky";
      stage.appendChild(sky);
      
      for (var i=0; i<data.floors; i++) {
        addFloor();
      }
      
      var ground = document.createElement("div");
      ground.id = "ground";
      stage.appendChild(ground);
      
      for (var userid in data.users) {
        if (id != userid) {
          addUser(data.users[userid]);
        }
      }
      
      for (var i=0; i<data.elevator.length; i++){
        addElevator(data.elevator[i]);
      }
    }
  });
  
  socket.on("connected", function(data) {
    addUser(data);
  });
  
  socket.on("disconnected", function(data) {
    users[data].sprite.classList.add("disconnected");
    setTimeout(function() {
      
      var exiting = users[data];
      
      exiting.sprite.parentElement.removeChild(exiting.sprite);
      
      //Remove user from queue
      floors[exiting.floor].queue = floors[exiting.floor].queue.filter(function(element) {
        return (element.id != data);
      });
      
      //Shift waiting users over
      for (var i=0; i<floors[exiting.floor].queue.length; i++) {
        floors[exiting.floor].queue[i].sprite.style.left = (DOOR_WIDTH + i*USER_WIDTH) + "px";
      }
      
      delete users[data];
    }, 500);
  });
  
  socket.on("out_command", function(data) {
    updateCommand(data.id, data.command);
  });
  
  socket.on("reset_command", function(data) {
    for (var i=0; i<data.elevator.length; i++){
      elevators[i].floor = data.elevator[i].floor;
      moveElevator(elevators[i]);
    }
    for (var userid in data.users) {
      //users[userid].floor = data.users[userid].floor;
      //users[userid].elevator = data.users[userid].elevator;
      updateCommand(userid, "");
      updatePosition(users[userid], data.users[userid]);
    }
  });
  
  
  //Send commands
  window.addEventListener("keydown", function(event) {
    if (commands[event.keyCode]) {
      var newCommand = commands[event.keyCode];
      if (users[id].command != newCommand) {
        socket.emit("inc_command", {
          command: newCommand
        });
      }
      event.preventDefault();
      return false;
    }
    return true;
  });
  
});