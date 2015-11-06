'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys').default;

var _getIterator = require('babel-runtime/core-js/get-iterator').default;

var _child_process = require('child_process');

var _net = require('net');

var _os = require('os');

var _nightingale = require('nightingale');

const argv = require('minimist')(process.argv.slice(2));
const logger = new _nightingale.ConsoleLogger('client');

const port = argv.port || 3007;
const host = argv.host || 'localhost';
const script = '/home/pi/screen.sh';

const netInterface = function netInterface() {
    const interfaces = (0, _os.networkInterfaces)();
    for (var _iterator = _Object$keys(interfaces), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _getIterator(_iterator);;) {
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

        let netInterface = interfaces[key];
        let filtered = netInterface.filter(function (item) {
            return item.family === 'IPv4';
        });

        if (filtered.length !== 0) {
            netInterface = filtered;
        }

        for (var _iterator2 = netInterface, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _getIterator(_iterator2);;) {
            var _ref2;

            if (_isArray2) {
                if (_i2 >= _iterator2.length) break;
                _ref2 = _iterator2[_i2++];
            } else {
                _i2 = _iterator2.next();
                if (_i2.done) break;
                _ref2 = _i2.value;
            }

            let item = _ref2;

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
                ip: item.address
            };
        }
    }

    throw new Error('Could not find valid mac/ip');
};

let client;

( /** @function */function openSocket() {
    if (client) {
        return;
    }

    let pingInterval;
    logger.info('connect to ' + host + ':' + port);
    client = (0, _net.connect)(port, host, function () {
        const interfaceInfo = netInterface();
        logger.info('interface', { mac: interfaceInfo.mac, ip: interfaceInfo.ip });
        client.write('hello: ' + interfaceInfo.mac + ',' + interfaceInfo.ip + ';');
        pingInterval = setInterval(function () {
            return client.write('ping;');
        }, 10000);
    });

    client.setKeepAlive(true);
    client.on('error', function (err) {
        logger.error(err.message);

        if (pingInterval) {
            clearInterval(pingInterval);
        }

        client.destroy();
        client = null;
        setTimeout(function () {
            return openSocket();
        }, 1000);
    });

    client.on('end', function () {
        logger.info('ended connection by server');
        client = null;

        if (pingInterval) {
            clearInterval(pingInterval);
        }

        setTimeout(function () {
            return openSocket();
        }, 1000);
    });

    client.on('data', /** @function 
                      * @param data */function (data) {
        const string = data.toString();
        logger.debug('data', { string });

        string.split(';').forEach(function (string) {
            if (string === '') {
                return;
            }

            var _string$split = string.split(': ');

            const instruction = _string$split[0];
            const value = _string$split[1];

            switch (instruction) {
                case 'pong':
                    break;

                case 'url':
                case 'change-url':
                    const url = value.trim();

                    try {
                        logger.info('reload', { url });
                        (0, _child_process.spawnSync)(script, ['reload', url], { stdio: 'inherit' });
                        logger.info('reload done');
                    } catch (err) {
                        logger.error(err.message);
                    }

                    break;

                case 'refresh':
                    try {
                        logger.info('refresh');
                        (0, _child_process.spawnSync)(script, ['refresh'], { stdio: 'inherit' });
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
//# sourceMappingURL=index.js.map