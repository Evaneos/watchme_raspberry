import { spawnSync } from 'child_process';
import { connect } from 'net';
import { networkInterfaces } from 'os';
const argv = require('minimist')(process.argv.slice(2));

const port = argv.port || 3007;
const host = argv.host || 'localhost';
const script = '/home/pi/screen.sh';

const netInterface = () => {
    const interfaces = networkInterfaces();
    for (let key of Object.keys(interfaces)) {
        let netInterface = interfaces[key];
        let filtered = netInterface.filter(item => item.family === 'IPv4');

        if (filtered.length !== 0) {
            netInterface = filtered;
        }

        for (let item of netInterface) {
            if (!item.mac || !item.address) {
                continue;
            }

            if (item.mac === '00:00:00:00:00:00') {
                continue;
            }

            if (item.address === '127.0.0.1' || item.address === '::1') {
                continue;
            }

            return {
                mac: item.mac,
                ip: item.address,
            };
        }
    }

    throw new Error('Could not find valid mac/ip');
};

let client;

(function openSocket() {
    if (client) {
        return;
    }

    let pingInterval;
    client = connect(port, host, () => {
        const interfaceInfo = netInterface();
        console.log(interfaceInfo);
        client.write(`hello: ${interfaceInfo.mac},${interfaceInfo.ip};`);
        pingInterval = setInterval(() => client.write('ping'), 10000);
    });

    client.setKeepAlive(true);
    client.on('error', (err) => {
        console.log(err.message);

        if (pingInterval) {
            clearInterval(pingInterval);
        }

        client.destroy();
        client = null;
        setTimeout(() => openSocket(), 1000);
    });

    client.on('end', () => {
        console.log('ended connection by server');
        client = null;

        if (pingInterval) {
            clearInterval(pingInterval);
        }

        setTimeout(() => openSocket(), 1000);
    });

    client.on('data', function(data) {
        const string = data.toString();
        console.log('data', string);

        string.split(';').forEach((string) => {
            if (string === '') {
                return;
            }

            const [instruction, value] = string.split(': ');

            switch (instruction) {
                case 'pong':
                    break;

                case 'url':
                case 'change-url':
                    const url = value.trim();

                    try {
                        console.log('reload ' + url);
                        spawnSync(script, ['reload', url], { stdio: 'inherit' });
                        console.log('reload done');
                    } catch (err) {
                        console.log(err.message);
                    }

                    break;

                case 'refresh':
                    try {
                        console.log('refresh');
                        spawnSync(script, ['refresh'], { stdio: 'inherit' });
                        console.log('refresh done');
                    } catch (err) {
                        console.log(err.message);
                    }

                    break;

                default:
                    console.log('unsupported instruction: ' + instruction);
                    break;
            }
        });
    });
})();
