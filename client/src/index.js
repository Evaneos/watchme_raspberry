import { spawnSync } from 'child_process';
import { connect } from 'net';
import { networkInterfaces } from 'os';
import { ConsoleLogger } from 'nightingale';

const argv = require('minimist')(process.argv.slice(2));
const logger = new ConsoleLogger('server');

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
    logger.info(`connect to ${host}:${port}`);
    client = connect(port, host, () => {
        const interfaceInfo = netInterface();
        logger.info(interfaceInfo);
        client.write(`hello: ${interfaceInfo.mac},${interfaceInfo.ip};`);
        pingInterval = setInterval(() => client.write('ping;'), 10000);
    });

    client.setKeepAlive(true);
    client.on('error', (err) => {
        logger.error(err.message);

        if (pingInterval) {
            clearInterval(pingInterval);
        }

        client.destroy();
        client = null;
        setTimeout(() => openSocket(), 1000);
    });

    client.on('end', () => {
        logger.info('ended connection by server');
        client = null;

        if (pingInterval) {
            clearInterval(pingInterval);
        }

        setTimeout(() => openSocket(), 1000);
    });

    client.on('data', function(data) {
        const string = data.toString();
        logger.debug('data', { string });

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
                        logger.info('reload', { url });
                        spawnSync(script, ['reload', url], { stdio: 'inherit' });
                        logger.info('reload done');
                    } catch (err) {
                        logger.error(err.message);
                    }

                    break;

                case 'refresh':
                    try {
                        logger.info('refresh');
                        spawnSync(script, ['refresh'], { stdio: 'inherit' });
                        logger.info('refresh done');
                    } catch (err) {
                        logger.error(err.message);
                    }

                    break;

                default:
                    logger.warn('unsupported instruction', { instruction });
                    break;
            }
        });
    });
})();
