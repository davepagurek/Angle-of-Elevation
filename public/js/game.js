var socket = io.connect();

socket.on('test', function (data) {
  console.log(data);
});