const socket = io();

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resultsList = document.getElementById('resultsList');
const statusSpan = document.getElementById('status');
const progressSpan = document.getElementById('progress');

let totalTasks = 0;
let completedTasks = 0;

startBtn.addEventListener('click', () => {
    const ip = document.getElementById('ip').value;
    const ports = document.getElementById('ports').value;
    const speed = document.getElementById('speed').value;
    const timeout = document.getElementById('timeout').value;

    if (!ip || !ports) return;

    // Reset UI
    resultsList.innerHTML = '';
    completedTasks = 0;
    totalTasks = 0;
    updateStatus('Initializing...', '0%');

    setScanningState(true);

    socket.emit('start-scan', { ip, ports, speed, timeout });
});

stopBtn.addEventListener('click', () => {
    socket.emit('stop-scan');
});

socket.on('scan-started', (data) => {
    totalTasks = data.total;
    updateStatus('Scanning...', '0%');
});

socket.on('scan-result', (result) => {
    completedTasks++;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    updateStatus('Scanning...', `${percentage}%`);

    // Only show open ports or maybe all? 
    // Usually users care about open ports. 
    // Let's show open ports prominently, maybe others less so.
    if (result.status === 'open') {
        addResultItem(result);
    }
});

socket.on('scan-complete', (results) => {
    setScanningState(false);
    updateStatus('Completed', '100%');

    if (results.filter(r => r.status === 'open').length === 0) {
        resultsList.innerHTML = '<div style="text-align:center; padding: 1rem; color: var(--text-muted);">No open ports found.</div>';
    }
});

socket.on('scan-stopped', () => {
    setScanningState(false);
    updateStatus('Stopped', `${progressSpan.innerText}`);
});

socket.on('error', (msg) => {
    alert(msg);
    setScanningState(false);
    updateStatus('Error', '0%');
});

function setScanningState(isScanning) {
    startBtn.disabled = isScanning;
    stopBtn.disabled = !isScanning;
}

function updateStatus(text, percent) {
    statusSpan.innerText = text;
    progressSpan.innerText = percent;
}

function addResultItem(result) {
    const div = document.createElement('div');
    div.className = `result-item ${result.status}`;
    div.innerHTML = `
        <div class="port-info">${result.host}:${result.port}</div>
        <div class="status-badge">${result.status}</div>
    `;
    resultsList.prepend(div);
}
