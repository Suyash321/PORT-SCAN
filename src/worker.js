const { parentPort, workerData } = require('worker_threads');
const net = require('net');

/**
 * Scans a single port on a host.
 * @param {string} host 
 * @param {number} port 
 * @param {number} timeout 
 * @returns {Promise<object>}
 */
function scanPort(host, port, timeout) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let status = 'closed';

        socket.setTimeout(timeout);

        socket.on('connect', () => {
            status = 'open';
            socket.destroy();
        });

        socket.on('timeout', () => {
            status = 'filtered'; // or timeout
            socket.destroy();
        });

        socket.on('error', (err) => {
            // ECONNREFUSED usually means closed
            if (err.code === 'ECONNREFUSED') {
                status = 'closed';
            } else {
                status = 'closed'; // Treat other errors as closed/filtered for now
            }
            socket.destroy();
        });

        socket.on('close', () => {
            resolve({ host, port, status });
        });

        socket.connect(port, host);
    });
}

// Listen for messages from the main thread
parentPort.on('message', async (task) => {
    const { host, port, timeout } = task;
    try {
        const result = await scanPort(host, port, timeout);
        parentPort.postMessage(result);
    } catch (error) {
        parentPort.postMessage({ host, port, status: 'error', error: error.message });
    }
});
