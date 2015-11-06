import { createServer as createNetServer } from 'net';
import { unlinkSync } from 'fs';
import { io } from './webSocket';
import argv from './argv';
import { items, itemsMapByMac } from './data';
import { ConsoleLogger } from 'nightingale';

const logger = new ConsoleLogger('tcpServer');

let _socket;

export function write() {
    _socket.write(...arguments);
}

const path = argv.socketWebserver || __dirname + '/../../../socket-webserver';

const netServer = createNetServer(socket => {
    _socket = socket;
    logger.info('client connected (net server)');
    let mac;

    socket.on('end', function() {
        socket = null;
        logger.info('client disconnected (net server)');
        items.forEach(item => item.online = false);
    });

    socket.on('data', function(data) {
        const string = data.toString();
        logger.debug('data', {string});
        string.split(';').forEach((string) => {
            if (string === '') {
                return;
            }

            let raspberry;

            const [instruction, value] = string.split(': ');

            switch (instruction) {
                case 'ping':
                    socket.write('pong;');
                    break;

                case 'connected-clients':
                    if (value === '') {
                        items.forEach(item => item.online = false);
                        break;
                    }

                    const connectedClients = value.split(',');
                    connectedClients.forEach(connectedClient => {
                        const [mac, ip] = connectedClient.split('|');
                        const raspberry = itemsMapByMac.get(mac);
                        if (!raspberry) {
                            logger.warn('unknown mac', {mac});
                        } else {
                            raspberry.ip = ip;
                            raspberry.online = true;
                        }
                    });

                    break;

                case 'connected':
                    const [mac, ip] = value.split(',');

                    raspberry = itemsMapByMac.get(mac);
                    if (!raspberry) {
                        logger.warn('unknown mac', {mac});
                    } else {
                        raspberry.online = true;
                        raspberry.ip = ip;
                        io.emit('online', raspberry.id, ip);
                        socket.write(`url: ${raspberry.mac},${raspberry.url}`);
                    }

                    break;

                case 'disconnected':
                    raspberry = itemsMapByMac.get(value);
                    if (raspberry) {
                        raspberry.online = false;
                        io.emit('offline', raspberry.id);
                    }

                    break;

                default:
                    logger.warn('unsupported instruction: ' + instruction);
                    break;
            }
        });
    });
});


try {
    unlinkSync(path);
} catch (err) {}

netServer.listen(path);
logger.info('listening on ' + path);
