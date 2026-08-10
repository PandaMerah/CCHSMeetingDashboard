const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Helpers for Data Persistence
const readData = () => {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (err) {
        console.error("Error reading data.json:", err);
        return { config: {}, departments: {}, history: [] };
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error writing data.json:", err);
    }
};

// API: Fetch State
app.get('/api/data', (req, res) => res.json(readData()));

// API: Staff Update Submission
app.post('/api/update', (req, res) => {
    const { department, updateText, questionText } = req.body;
    let data = readData();

    const newEntry = { update: updateText, question: questionText };
    if (!data.departments[department]) data.departments[department] = {};
    data.departments[department] = newEntry;

    data.history.unshift({
        timestamp: Date.now(),
        dateString: new Date().toLocaleString('en-MY'),
        department: department,
        update: updateText,
        question: questionText
    });

    writeData(data);
    io.emit('dataChanged', data);
    res.json({ message: "Update successfully broadcasted to TV!" });
});

// API: Save Admin Settings (Fixes Persisting Toggles, Depts & Texts)
app.post('/api/admin', (req, res) => {
    try {
        let data = readData();
        const { config, departments } = req.body;

        if (config) {
            data.config = {
                ...data.config,
                ...config
            };
        }

        if (departments) {
            data.departments = departments;
        }

        writeData(data);
        io.emit('dataChanged', data);
        res.json({ message: "Admin settings saved and broadcasted to TV!" });
    } catch (err) {
        console.error("Failed to save admin settings:", err);
        res.status(500).json({ message: "Failed to save admin settings." });
    }
});

// API: Reset Current Meeting Updates
app.post('/api/admin/reset', (req, res) => {
    let data = readData();
    for (const dept in data.departments) {
        data.departments[dept] = { update: "Pending update...", question: "N/A" };
    }
    writeData(data);
    io.emit('dataChanged', data);
    res.json({ message: "Meeting session reset for all departments!" });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`TV Dashboard: http://localhost:${PORT}`);
    console.log(`Staff Input:  http://localhost:${PORT}/input.html`);
    console.log(`Admin Panel:  http://localhost:${PORT}/admin.html`);
});