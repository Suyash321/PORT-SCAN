const { Worker } = require('worker_threads');
const EventEmitter = require('events');
const path = require('path');

class Scanner extends EventEmitter {
    constructor() {
        super();
        this.workers = [];
        this.queue = [];
        this.activeWorkers = 0;
        this.results = [];
    }

    /**
     * Starts the scan.
     * @param {Array<string>} ips 
     * @param {Array<number>} ports 
     * @param {object} options { concurrency: number, timeout: number }
     */
    start(ips, ports, options = {}) {
        const concurrency = options.concurrency || 10;
        const timeout = options.timeout || 500;

        // Generate queue
        for (const ip of ips) {
            for (const port of ports) {
                this.queue.push({ host: ip, port, timeout });
            }
        }

        this.totalTasks = this.queue.length;
        this.completedTasks = 0;

        // Initialize workers
        const workerCount = Math.min(concurrency, this.queue.length);

        for (let i = 0; i < workerCount; i++) {
            this.spawnWorker();
        }

        // Start processing
        this.processQueue();
    }

    spawnWorker() {
        const worker = new Worker(path.join(__dirname, 'worker.js'));

        worker.on('message', (result) => {
            this.emit('result', result);
            this.results.push(result);
            this.completedTasks++;

            // Worker is free, give it another task
            this.assignTask(worker);

            if (this.completedTasks === this.totalTasks) {
                this.emit('complete', this.results);
                this.terminateAll();
            }
        });

        worker.on('error', (err) => {
            console.error('Worker error:', err);
            // Try to replace worker or just ignore?
        });

        this.workers.push({ worker, busy: false });
        // Initially assign a task
        this.assignTask(worker);
    }

    assignTask(worker) {
        if (this.queue.length > 0) {
            const task = this.queue.shift();
            worker.postMessage(task);
        } else {
            // No more tasks, this worker is idle.
            // If all tasks are done, we terminate (handled in message event)
        }
    }

    processQueue() {
        // This is largely handled by the initial assignment and the callback loop
    }

    terminateAll() {
        for (const w of this.workers) {
            w.worker.terminate();
        }
        this.workers = [];
    }
}

module.exports = Scanner;
