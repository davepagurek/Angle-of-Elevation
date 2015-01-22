window.addEventListener("load", function() {
  
  var socket = io.connect();
  var stage = document.getElementById("stage");

  var floors = [];
  var users = {};
  var id = 0;
  
  var USER_WIDTH = 100;
  var DOOR_WIDTH = 140;
  var FLOOR_HEIGHT = 210;
  

  var addFloor = function() {
    var floor = document.createElement("div");
    floor.className = "floor";
    
    var door = document.createElement("div");
    door.className = "door";
    
    var queue = document.createElement("div");
    queue.className = "queue";
    
    floor.appendChild(door);
    floor.appendChild(queue);
    stage.appendChild(floor);
    
    floors.push({
      element: floor,
      queue: 0
    });
  };
  
  var addUser = function(userid, user) {
    
    var sprite = document.createElement("div");
    sprite.className = "user";
    
    sprite.style.left = (DOOR_WIDTH + floors[user.floor].queue*USER_WIDTH) + "px";
    sprite.style.top = (user.floor*FLOOR_HEIGHT) + "px";
    floors[user.floor].queue++;
    
    if (id == userid) {
      sprite.id = "me";
      stage.style.top = "-" + sprite.style.top;
    }
    
    stage.appendChild(sprite);
    users[userid] = user;
    users[userid].sprite = sprite;
  };

  socket.on('connected', function (data) {
    if (!id) {
      id = data.id;
      console.log(id);
      for (var i=0; i<data.floors; i++) {
        addFloor();
      }
      //users = data.users;
      console.log(data.users);
      for (var userid in data.users) {
        addUser(userid, data.users[userid]);
      }
    }
  });
  
  socket.on("disconnected", function(data) {
    
  });
  
});