const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(bodyParser.json());

let tasks = []; // store tasks in memory

// Get all tasks
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

// Add new task
app.post('/tasks', (req, res) => {
  const task = req.body; // task = { id, name, column }
  tasks.push(task);
  io.emit('taskAdded', task);
  res.status(201).json(task);
});

// Move task to another column
app.put('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { column } = req.body;
  tasks = tasks.map(t => t.id === Number(id) ? { ...t, column } : t);
  io.emit('taskUpdated', { id: Number(id), column });
  res.json({ id: Number(id), column });
});


io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
