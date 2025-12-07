const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const Scanner = require('./scanner');
const { parseIPs, parsePorts } = require('./utils');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('start-scan', (data) => {
        console.log('Starting scan:', data);
        const { ip, ports, speed, timeout } = data;

        let ips = [];
        try {
            ips = parseIPs(ip);
        } catch (e) {
            socket.emit('error', 'Invalid IP format');
            return;
        }

        let portList = [];
        try {
            portList = parsePorts(ports);
        } catch (e) {
            socket.emit('error', 'Invalid Port format');
            return;
        }

        if (ips.length === 0 || portList.length === 0) {
            socket.emit('error', 'No valid IPs or Ports');
            return;
        }

        let concurrency = 20;
        switch (speed) {
            case 'fast': concurrency = 100; break;
            case 'slow': concurrency = 5; break;
            case 'normal': default: concurrency = 20; break;
        }

        const scanner = new Scanner();

        // Send initial info
        socket.emit('scan-started', { total: ips.length * portList.length });

        scanner.on('result', (result) => {
            socket.emit('scan-result', result);
        });

        scanner.on('complete', (results) => {
            socket.emit('scan-complete', results);
        });

        scanner.start(ips, portList, { concurrency, timeout: parseInt(timeout) || 500 });

        // Handle disconnect to stop scan? 
        // For now, let it finish or we can implement scanner.terminateAll()
        socket.on('disconnect', () => {
            scanner.terminateAll();
        });

        socket.on('stop-scan', () => {
            scanner.terminateAll();
            socket.emit('scan-stopped');
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
