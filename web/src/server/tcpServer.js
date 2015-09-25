import { createServer as createNetServer } from 'net';
import { unlinkSync } from 'fs';
import { io } from './webSocket';
import { items, itemsMapByMac } from './data';

let _socket;

export function write() {
    _socket.write(...arguments);
}

export function create(path) {
    const netServer = createNetServer(socket => {
        _socket = socket;
        console.log('client connected (net server)');
        let mac;

        socket.on('end', function() {
            socket = null;
            console.log('client disconnected (net server)');
            items.forEach(item => item.online = false);
        });

        socket.on('data', function(data) {
            const string = data.toString();
            console.log('data', string);
            string.split(';').forEach((string) => {
                if (string === '') {
                    return;
                }

                let rasberry;

                const [instruction, value] = string.split(': ');
                console.log(instruction, value);

                switch (instruction) {
                    case 'ping':
                        socket.write('pong');
                        break;

                    case 'connected-clients':
                        if (value === '') {
                            items.forEach(item => item.online = false);
                        }

                        const connectedClients = value.split(',');
                        connectedClients.forEach(mac => {
                            const rasberry = itemsMapByMac.get(mac);
                            if (!rasberry) {
                                console.log('unknown mac: ' + mac);
                            } else {
                                rasberry.online = true;
                            }
                        });

                        break;

                    case 'connected':
                        rasberry = itemsMapByMac.get(value);
                        if (!rasberry) {
                            console.log('unknown mac: ' + value);
                        } else {
                            rasberry.online = true;
                            io.emit('online', rasberry.id);
                            socket.write(`url: ${rasberry.url}`);
                        }

                        break;

                    case 'disconnected':
                        rasberry = itemsMapByMac.get(value);
                        if (rasberry) {
                            rasberry.online = false;
                            io.emit('offline', rasberry.id);
                        }

                        break;

                    default:
                        console.log('unsupported instruction: ' + instruction);
                        break;
                }
            });
        });
    });

    path = path || __dirname + '/../../../socket-webserver';
    try {
        unlinkSync(path);
    } catch (err) {}

    netServer.listen(path);
    console.log('listening on ' + path);
}
