import { connect } from 'net';
import { networkInterfaces } from 'os';
import { execSync } from 'child_process';
const argv = require('minimist')(process.argv.slice(2));

const port = argv.port || 3006;
const host = argv.host || 'localhost';

const mac = (() => {
    const interfaces = networkInterfaces();
    return (interfaces.wlan0 || interfaces.eth0 || interfaces.en0)[0].mac;
})();

let client;

(function openSocket() {
    if (client) {
        return;
    }

    let pingInterval;
    client = connect(port, host, () => {
        client.write('mac: ' + mac);
        pingInterval = setInterval(() => client.write('ping: '), 10000);
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

        const [instruction, value] = string.split(': ');

        switch (instruction) {
            case 'pong':
                break;

            case 'refresh':
                console.log('refresh !');
                execSync('xdotool key r');
                break;

            default:
                console.log('unsupported instruction: ' + instruction);
                break;
        }
    });
})();
