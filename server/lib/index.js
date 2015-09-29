'use strict';

var _Map = require('babel-runtime/core-js/map').default;

var _getIterator = require('babel-runtime/core-js/get-iterator').default;

var _net = require('net');

const argv = require('minimist')(process.argv.slice(2));

const serverClients = new _Map();
let client;

const server = (0, _net.createServer)(function (socket) {
    console.log('client connected');
    let mac;

    socket.on('end', /** @function */function () {
        console.log('client disconnected');
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
            socket.write('pong');
            return;
        }

        console.log('data', string);

        string.split(';').forEach(function (string) {
            if (string === '') {
                return;
            }

            const splittedString = string.split(': ');

            if (splittedString.length !== 2) {
                console.log('unexpected format, length = ' + splittedString.length);
                return socket.end();
            }

            const instruction = splittedString[0];
            const value = splittedString[1];

            switch (instruction) {
                case 'ping':
                    socket.write('pong');
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
                    console.log('unsupported instruction by client ' + mac);
                    return socket.end();
            }
        });
    });
});

server.listen(argv.port || 3007);

( /** @function */function openSocket() {
    client = (0, _net.connect)(argv.socketWebserver || __dirname + '/../../socket-webserver', function () {
        console.log('connected to web server');
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
        console.log(err.message);

        setTimeout(function () {
            return openSocket();
        }, 1000);
    });

    client.on('data', /** @function 
                      * @param data */function (data) {
        const string = data.toString();
        console.log('data', string);

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
                console.log('unsupported instruction: ' + instruction);
                break;
        }
    });
})();
//# sourceMappingURL=index.js.map