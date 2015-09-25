'use strict';

var _net = require('net');

var _os = require('os');

var _child_process = require('child_process');

const argv = require('minimist')(process.argv.slice(2));

const port = argv.port || 3007;
const host = argv.host || 'localhost';

const mac = (function () {
    const interfaces = (0, _os.networkInterfaces)();
    return (interfaces.wlan0 || interfaces.eth0 || interfaces.en0)[0].mac;
})();

let client;

( /** @function */function openSocket() {
    if (client) {
        return;
    }

    let pingInterval;
    client = (0, _net.connect)(port, host, function () {
        client.write('mac: ' + mac);
        pingInterval = setInterval(function () {
            return client.write('ping');
        }, 10000);
    });

    client.setKeepAlive(true);
    client.on('error', function (err) {
        console.log(err.message);

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
        console.log('ended connection by server');
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

        if (string === 'pong') {
            return;
        }

        console.log('data', string);

        var _string$split = string.split(': ');

        const instruction = _string$split[0];
        const value = _string$split[1];

        switch (instruction) {
            case 'pong':
                break;

            case 'refresh':
                console.log('refresh !');
                (0, _child_process.execSync)('xdotool key r');
                break;

            default:
                console.log('unsupported instruction: ' + instruction);
                break;
        }
    });
})();
//# sourceMappingURL=index.js.map
