const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

let rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', () => {
    const roomCode = Math.random().toString(36).substr(2, 5).toUpperCase();
    rooms[roomCode] = [socket.id];
    socket.join(roomCode);
    socket.emit('roomCreated', roomCode);
    console.log('Room created:', roomCode);
  });

  socket.on('joinRoom', (roomCode) => {
    if (rooms[roomCode] && rooms[roomCode].length === 1) {
      rooms[roomCode].push(socket.id);
      socket.join(roomCode);
      socket.emit('joinedRoom');
      io.to(roomCode).emit('startGame', { roomCode });
    } else {
      socket.emit('error', 'Room full or does not exist');
    }
  });

  socket.on('findMatch', () => {
    let joined = false;
    for (let code in rooms) {
      if (rooms[code].length === 1) {
        rooms[code].push(socket.id);
        socket.join(code);
        socket.emit('joinedRoom');
        io.to(code).emit('startGame', { roomCode: code });
        joined = true;
        break;
      }
    }
    if (!joined) {
      const roomCode = Math.random().toString(36).substr(2, 5).toUpperCase();
      rooms[roomCode] = [socket.id];
      socket.join(roomCode);
      socket.emit('roomCreated', roomCode);
    }
  });

  socket.on('disconnect', () => {
    for (let code in rooms) {
      rooms[code] = rooms[code].filter(id => id !== socket.id);
      if (rooms[code].length === 0) delete rooms[code];
    }
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
