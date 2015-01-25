window.addEventListener("load", function() {
  
  var socket = io.connect();
  var stage = document.getElementById("stage");

  var floors = [];
  var users = {};
  var elevator = {};
  var id = 0;
  
  var USER_WIDTH = 100;
  var DOOR_WIDTH = 140;
  var FLOOR_HEIGHT = 210;
  var SKY_HEIGHT = 300;
  
  var commands = {
    38: "UP",
    40: "DOWN",
    48: "0",
    49: "1",
    50: "2",
    51: "3",
    52: "4",
    53: "5",
    54: "6",
    55: "7",
    56: "8",
    57: "9"
  };
  

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
  
  var moveElevator = function() {
    //sprite.style.top = (SKY_HEIGHT + user.floor*FLOOR_HEIGHT) + "px";
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
    
    sprite.addEventListener("transitionend", function transitionend(event) {
      this.classList.remove("animated");
      this.removeEventListener('transitionend', transitionEnd, false);
    }, false);
    
    stage.appendChild(sprite);
    users[user.id] = user;
    users[user.id].sprite = sprite;
    floors[user.floor].queue.push(users[user.id]);
  };
  
  var updateCommand = function(user, command) {
    users[user].command = command;
    users[user].sprite.classList.remove("commandUp");
    users[user].sprite.classList.remove("commandDown");
    users[user].sprite.classList.remove("commandNumber");
    users[user].sprite.innerHTML = "";
    
    if (command == "UP") {
      users[user].sprite.classList.add("commandUp");
    } else if (command == "DOWN") {
      users[user].sprite.classList.add("commandDown");
    } else {
      users[user].sprite.classList.add("commandNumber");
      users[user].sprite.innerHTML = command;
    }
    
    //temporary, for testing. will be done with css eventually
    users[user].sprite.innerHTML = command;
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
      
      elevator = data.elevator;
      moveElevator();
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
      console.log(floors[exiting.floor].queue);
      
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
    for (var userid in users) {
      updateCommand(userid, "");
    }
  });
  
  
  //Send commands
  window.addEventListener("keyup", function(event) {
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
  });
  
});