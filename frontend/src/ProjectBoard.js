import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const columns = ["To Do", "In Progress", "Done"];

function ProjectBoard() {
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState('');

  // Fetch tasks from backend and setup real-time listeners
  useEffect(() => {
    fetch('http://localhost:5000/tasks')
      .then(res => res.json())
      .then(data => setTasks(data));

    socket.on('taskAdded', (task) => {
      setTasks(prev => [...prev, task]);
    });

    socket.on('taskUpdated', ({ id, column }) => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, column } : t));
    });

    return () => {
      socket.off('taskAdded');
      socket.off('taskUpdated');
    };
  }, []);

  // Add a new task in the specified column
  const addTask = (column) => {
    if (!taskName) return;
    const newTask = { id: Date.now(), name: taskName, column };
    fetch('http://localhost:5000/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    });
    setTaskName('');
  };

  // Move task left (-1) or right (+1)
  const moveTask = (id, direction) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return console.error("Task not found", id);

    const index = columns.indexOf(task.column);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= columns.length) return;

    const newColumn = columns[newIndex];

    fetch(`http://localhost:5000/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column: newColumn })
    })
    .then(res => res.json())
    .then(data => console.log("Task moved", data))
    .catch(err => console.error(err));
  };

  return (
    <div className="board-container">
      {columns.map(col => (
        <div key={col} className="column">
          <h2>{col}</h2>
          {col === "To Do" && (
            <div className="task-input">
              <input
                value={taskName}
                onChange={e => setTaskName(e.target.value)}
                placeholder="New Task..."
              />
              <button onClick={() => addTask(col)}>Add</button>
            </div>
          )}
          {tasks.filter(t => t.column === col).map(task => (
            <div key={task.id} className="task">
              <p>{task.name}</p>
              <div className="task-buttons">
                <button onClick={() => moveTask(task.id, -1)}>&lt;</button>
                <button onClick={() => moveTask(task.id, 1)}>&gt;</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default ProjectBoard;
