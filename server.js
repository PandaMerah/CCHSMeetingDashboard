const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server); // WebSocket Server
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Helper to read data
const readData = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
// Helper to write data
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// API to get current data
app.get('/api/data', (req, res) => res.json(readData()));

// API for Staff Input (Saves current and pushes to history)
app.post('/api/update', (req, res) => {
    const { department, updateText, questionText } = req.body;
    let data = readData();
    
    // Create new entry
    const newEntry = {
        update: updateText,
        question: questionText
    };

    // Update current state
    if (!data.departments[department]) data.departments[department] = {};
    data.departments[department] = newEntry;

    // Add to history
    data.history.unshift({
        timestamp: Date.now(),
        dateString: new Date().toLocaleString('en-MY'),
        department: department,
        update: updateText,
        question: questionText
    });

    writeData(data);
    io.emit('dataChanged', data); // Broadcast to TV immediately
    res.send({ message: "Update successful and broadcasted to TV!" });
});

// API for Admin Controls
app.post('/api/admin', (req, res) => {
    const { showLastMinuteSpeech, lastMinuteSpeechText } = req.body;
    let data = readData();
    
    data.config.showLastMinuteSpeech = showLastMinuteSpeech;
    data.config.lastMinuteSpeechText = lastMinuteSpeechText;
    
    writeData(data);
    io.emit('dataChanged', data); // Broadcast to TV immediately
    res.send({ message: "Admin settings updated!" });
}); // <-- Add this missing closing parenthesis and brace

server.listen(PORT, '0.0.0.0', () => {
    console.log(`TV Dashboard: http://localhost:${PORT}`);
    console.log(`Staff Input: http://localhost:${PORT}/input.html`);
    console.log(`Admin Panel: http://localhost:${PORT}/admin.html`);
});