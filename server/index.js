const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// In-memory message log
const messages = [];

app.use(express.static(path.join(__dirname, '../client')));

io.on('connection', (socket) => {
  console.log('A user connected');

  // Send chat history to new client
  socket.emit('chat history', messages);

  socket.on('chat message', (data) => {
    messages.push(data);
    if (messages.length > 100) messages.shift();
    io.emit('chat message', data);
  });

  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', data);
  });

  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing');
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
