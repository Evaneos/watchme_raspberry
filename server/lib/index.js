'use strict';

var _Map = require('babel-runtime/core-js/map').default;

var _getIterator = require('babel-runtime/core-js/get-iterator').default;

var _net = require('net');

var _nightingale = require('nightingale');

const argv = require('minimist')(process.argv.slice(2));
const logger = new _nightingale.ConsoleLogger('server');

const serverClients = new _Map();
let client;

const server = (0, _net.createServer)(function (socket) {
    logger.info('client connected');
    let mac;

    socket.on('end', /** @function */function () {
        logger.info('client disconnected');
        if (mac && serverClients.get(mac).socket === socket) {
            serverClients.delete(mac);
        }

        if (mac && client) {
            client.write('disconnected: ' + mac + ';');
        }
    });

    socket.on('data', /** @function 
                      * @param data */function (data) {
        const string = data.toString();

        if (string === 'ping') {
            socket.write('pong;');
            return;
        }

        logger.debug('data', { string: string });

        string.split(';').forEach(function (string) {
            if (string === '') {
                return;
            }

            const splittedString = string.split(': ');

            if (string === 'ping') {
                return socket.write('pong;');
            }

            if (splittedString.length !== 2) {
                logger.warn('unexpected format', { string, length: splittedString.length });
                return socket.end();
            }

            const instruction = splittedString[0];
            const value = splittedString[1];

            switch (instruction) {
                case 'ping':
                    socket.write('pong;');
                    break;

                case 'hello':
                    var _value$split = value.split(','),
                        macAddress = _value$split[0],
                        ip = _value$split[1];

                    mac = macAddress;
                    serverClients.set(mac, { socket, ip });

                    if (client) {
                        client.write('connected: ' + mac + ',' + ip + ';');
                    }

                    break;

                case 'mac':
                    mac = value;
                    serverClients.set(mac, { socket });

                    if (client) {
                        client.write('connected: ' + mac + ';');
                    }

                    break;

                default:
                    logger.warn('unsupported instruction by client', { mac, instruction, value });
                    return socket.end();
            }
        });
    });
});

server.listen(argv.port || 3007, function () {
    logger.info('listening');
});

( /** @function */function openSocket() {
    client = (0, _net.connect)(argv.socketWebserver || __dirname + '/../../socket-webserver', function () {
        logger.info('connected to web server');
        const keys = [];
        for (var _iterator = serverClients.keys(), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _getIterator(_iterator);;) {
            var _ref;

            if (_isArray) {
                if (_i >= _iterator.length) break;
                _ref = _iterator[_i++];
            } else {
                _i = _iterator.next();
                if (_i.done) break;
                _ref = _i.value;
            }

            let key = _ref;

            keys.push(key);
        }

        client.write('connected-clients: ' + keys.map(function (key) {
            return key + '|' + serverClients.get(key).ip;
        }).join(',') + ';');
    });

    client.setKeepAlive(true);
    client.on('error', function (err) {
        client = null;
        logger.error(err.message);

        setTimeout(function () {
            return openSocket();
        }, 1000);
    });

    client.on('data', /** @function 
                      * @param data */function (data) {
        const string = data.toString();
        logger.debug('data', { string: string });

        string.split(';').forEach(function (string) {
            var _string$split = string.split(': ');

            const instruction = _string$split[0];
            const value = _string$split[1];

            switch (instruction) {
                case 'pong':
                    break;

                case 'url':
                case 'change-url':
                case 'refresh':
                    var _value$split2 = value.split(',', 2),
                        mac = _value$split2[0],
                        url = _value$split2[1];

                    const socket = serverClients.get(mac).socket;
                    if (socket) {
                        socket.write(instruction + ': ' + url);
                    }

                    break;

                default:
                    logger.warn('unsupported instruction', { instruction, value });
                    break;
            }
        });
    });
})();
//# sourceMappingURL=index.js.map