window.addEventListener("load", function() {
  
  var socket = io.connect();
  var stage = document.getElementById("stage");

  var floors = [];
  var id = 0;

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
    
    floors.push([]);
  };

  socket.on('connected', function (data) {
    if (!id) {
      id = data.id;
      for (var i=0; i<data.floors; i++) {
        addFloor();
      }
      for (i=0; i<data.users.length; i++) {
        //addUser(data.users[i]);
      }
    }
  });
  
});