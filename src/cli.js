#!/usr/bin/env node
const { Command } = require('commander');
const chalk = require('chalk');
const Scanner = require('./scanner');
const { parseIPs, parsePorts } = require('./utils');

const program = new Command();

program
    .version('1.0.0')
    .description('Node.js Port Scanner')
    .option('--ip <ip>', 'Single IP address')
    .option('--ip-range <range>', 'IP range (e.g., 192.168.1.1-192.168.1.5)')
    .option('--cidr <cidr>', 'CIDR block (e.g., 192.168.1.0/24)')
    .option('--ports <ports>', 'Port range (e.g., 80, 1-1024)', '1-1024')
    .option('--timeout <ms>', 'Timeout in ms', '500')
    .option('--speed <speed>', 'Scan speed: fast, normal, slow', 'normal')
    .option('--concurrency <number>', 'Specific number of worker threads')
    .option('--json', 'Output results as JSON')
    .action((options) => {
        run(options);
    });

program.parse(process.argv);

function run(options) {
    let ips = [];

    if (options.ip) {
        ips = ips.concat(parseIPs(options.ip));
    }
    if (options.ipRange) {
        ips = ips.concat(parseIPs(options.ipRange));
    }
    if (options.cidr) {
        ips = ips.concat(parseIPs(options.cidr));
    }

    // Remove duplicates
    ips = [...new Set(ips)];

    if (ips.length === 0) {
        console.error(chalk.red('Error: No IP addresses specified. Use --ip, --ip-range, or --cidr.'));
        process.exit(1);
    }

    const ports = parsePorts(options.ports);
    if (ports.length === 0) {
        console.error(chalk.red('Error: No valid ports specified.'));
        process.exit(1);
    }

    let concurrency = 20;
    if (options.concurrency) {
        concurrency = parseInt(options.concurrency);
    } else {
        switch (options.speed) {
            case 'fast': concurrency = 100; break;
            case 'slow': concurrency = 5; break;
            case 'normal': default: concurrency = 20; break;
        }
    }

    const timeout = parseInt(options.timeout);

    if (!options.json) {
        console.log(chalk.blue(`Starting scan on ${ips.length} IP(s) for ${ports.length} port(s)...`));
        console.log(chalk.gray(`Concurrency: ${concurrency}, Timeout: ${timeout}ms`));
    }

    const scanner = new Scanner();
    const startTime = Date.now();

    scanner.on('result', (result) => {
        if (!options.json && result.status === 'open') {
            console.log(`${chalk.green('[OPEN]')} ${result.host}:${result.port}`);
        }
    });

    scanner.on('complete', (results) => {
        const duration = (Date.now() - startTime) / 1000;

        if (options.json) {
            console.log(JSON.stringify(results, null, 2));
        } else {
            console.log(chalk.blue(`\nScan completed in ${duration}s`));
            const openPorts = results.filter(r => r.status === 'open');
            console.log(chalk.green(`Found ${openPorts.length} open ports.`));
        }
    });

    scanner.start(ips, ports, { concurrency, timeout });
}
