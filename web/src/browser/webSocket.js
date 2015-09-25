/* global io, webSocketPort */

let socket;

export function on() {
    return socket.on(...arguments);
}

export function off() {
    return socket.off(...arguments);
}

export function emit() {
    const args = arguments;
    console.log('webSocket [emit]', args);

    return new Promise((resolve, reject) => {
        let resolved;
        socket.emit(...args, function(err, result) {
            clearTimeout(resolved);
            console.log('webSocket [emit response]', arguments);
            if (err !== null) {
                reject(err);
            } else {
                resolve(result);
            }
        });
        resolved = setTimeout(function() {
            console.log('webSocket [emit timeout]', args);
            reject(new Error('Timeout'));
        }, 10000);
    });
}

export function send() {
    return socket.send(...arguments);
}

export function create() {
    return new Promise((resolve, reject) => {
        socket = io(
            'http://' + window.location.hostname + ':' + webSocketPort,
            {
                transports: ['websocket', 'polling', 'flashsocket'],
                reconnectionDelay: 500,
                reconnectionDelayMax: 3000,
                timeout: 2000
            }
        );

        socket.on('connect', function() {
            resolve();
        });
    });
}
