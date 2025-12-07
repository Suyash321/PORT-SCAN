const net = require('net');
const ip = require('ip');

/**
 * Parses a port string into an array of numbers.
 * Supports: "80", "80,443", "1-1024"
 */
function parsePorts(portStr) {
    const ports = new Set();
    const parts = portStr.split(',');

    for (const part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end) && start <= end) {
                for (let i = start; i <= end; i++) {
                    if (i >= 1 && i <= 65535) ports.add(i);
                }
            }
        } else {
            const p = Number(part);
            if (!isNaN(p) && p >= 1 && p <= 65535) {
                ports.add(p);
            }
        }
    }
    return Array.from(ports).sort((a, b) => a - b);
}

/**
 * Parses an IP input into an array of IP addresses.
 * Supports: Single IP ("192.168.1.1"), CIDR ("192.168.1.0/24"), Range ("192.168.1.1-192.168.1.5")
 */
function parseIPs(ipInput) {
    const ips = [];

    if (ipInput.includes('/')) {
        // CIDR
        try {
            const subnet = ip.cidrSubnet(ipInput);
            let current = ip.toLong(subnet.firstAddress);
            const last = ip.toLong(subnet.lastAddress);
            while (current <= last) {
                ips.push(ip.fromLong(current));
                current++;
            }
        } catch (e) {
            console.error(`Invalid CIDR: ${ipInput}`);
        }
    } else if (ipInput.includes('-')) {
        // Range
        const [startStr, endStr] = ipInput.split('-');
        if (ip.isV4Format(startStr) && ip.isV4Format(endStr)) {
            let current = ip.toLong(startStr);
            const last = ip.toLong(endStr);
            while (current <= last) {
                ips.push(ip.fromLong(current));
                current++;
            }
        }
    } else {
        // Single IP or comma separated
        const parts = ipInput.split(',');
        for (const part of parts) {
            if (ip.isV4Format(part.trim())) {
                ips.push(part.trim());
            }
        }
    }
    return ips;
}

module.exports = { parsePorts, parseIPs };
