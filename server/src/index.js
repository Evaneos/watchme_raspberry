import { createServer, connect } from 'net';
const argv = require('minimist')(process.argv.slice(2));

const serverClients = new Map();
let client;

const server = createServer(socket => {
    console.log('client connected');
    let mac;

    socket.on('end', function() {
        console.log('client disconnected');
        if (mac && serverClients.get(mac).socket === socket) {
            serverClients.delete(mac);
        }

        if (mac && client) {
            client.write('disconnected: ' + mac + ';');
        }
    });

    socket.on('data', function(data) {
        const string = data.toString();

        if (string === 'ping') {
            socket.write('pong;');
            return;
        }

        console.log('data', string);

        string.split(';').forEach((string) => {
            if (string === '') {
                return;
            }

            const splittedString = string.split(': ');

            if (splittedString.length !== 2) {
                console.log('unexpected format, length = ' + splittedString.length);
                return socket.end();
            }

            const [instruction, value] = splittedString;

            switch (instruction) {
                case 'ping':
                    socket.write('pong;');
                    break;

                case 'hello':
                    const [macAddress, ip] = value.split(',');
                    mac = macAddress;
                    serverClients.set(mac, { socket, ip });

                    if (client) {
                        client.write(`connected: ${mac},${ip};`);
                    }

                    break;

                case 'mac':
                    mac = value;
                    serverClients.set(mac, { socket });

                    if (client) {
                        client.write(`connected: ${mac};`);
                    }

                    break;

                default:
                    console.log('unsupported instruction by client ' + mac);
                    return socket.end();
            }
        });
    });
});

server.listen(argv.port || 3007);

(function openSocket() {
    client = connect(argv.socketWebserver || __dirname + '/../../socket-webserver', () => {
        console.log('connected to web server');
        const keys = [];
        for (let key of serverClients.keys()) {
            keys.push(key);
        }

        client.write('connected-clients: ' + keys.map(key => `${key}|${serverClients.get(key).ip}`).join(',') + ';');
    });

    client.setKeepAlive(true);
    client.on('error', (err) => {
        client = null;
        console.log(err.message);

        setTimeout(() => openSocket(), 1000);
    });

    client.on('data', function(data) {
        const string = data.toString();
        console.log('data', string);

        string.split(';').forEach((string) => {
            const [instruction, value] = string.split(': ');

            switch (instruction) {
                case 'pong':
                    break;

                case 'url':
                case 'change-url':
                case 'refresh':
                    const [mac, url] = value.split(',', 2);
                    const socket = serverClients.get(mac).socket;
                    if (socket) {
                        socket.write(instruction + ': ' + url);
                    }

                    break;

                default:
                    console.log('unsupported instruction: ' + instruction);
                    break;
            }
        });
    });
})();
