# PORT-SCAN

A customizable, high-performance port scanner built with Node.js. Supports multi-threaded scanning, CLI usage, and a modern Web UI.

## Features

- **Multi-threaded Scanning**: Uses Node.js `worker_threads` for high concurrency.
- **Flexible Inputs**: Supports single IPs, CIDR blocks (e.g., `192.168.1.0/24`), and IP ranges.
- **Port Ranges**: Supports lists (`80,443`) and ranges (`1-1024`).
- **CLI Interface**: Robust command-line tool with JSON output support.
- **Web Interface**: Beautiful, dark-mode UI with real-time progress updates via WebSockets.

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### CLI

Run the scanner directly from the command line:

```bash
# Scan a single IP
node src/cli.js --ip 127.0.0.1 --ports 1-1000

# Scan a CIDR block with high speed
node src/cli.js --cidr 192.168.1.0/24 --ports 80,443 --speed fast

# Output JSON
node src/cli.js --ip 127.0.0.1 --ports 22 --json
```

**Options:**
- `--ip <ip>`: Single IP address.
- `--ip-range <start-end>`: IP range (e.g., `192.168.1.1-192.168.1.5`).
- `--cidr <cidr>`: CIDR block.
- `--ports <ports>`: Port range (default: `1-1024`).
- `--timeout <ms>`: Connection timeout in ms (default: `500`).
- `--speed <fast|normal|slow>`: Scan speed (controls thread count).
- `--json`: Output results in JSON format.

### Web Interface

1. Start the server:
   ```bash
   node src/server.js
   ```
2. Open your browser and navigate to:
   [http://localhost:3000](http://localhost:3000)

## Project Structure

- `src/cli.js`: CLI entry point.
- `src/scanner.js`: Core scanning engine (manages worker pool).
- `src/worker.js`: Worker thread logic for TCP connection.
- `src/server.js`: Express server for the Web UI.
- `public/`: Frontend assets (HTML, CSS, JS).

## License

MIT
