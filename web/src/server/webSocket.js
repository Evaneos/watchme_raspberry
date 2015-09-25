import socketio from 'socket.io';
import { createServer } from 'http';
const config = require('../../config.js');

export let io;

export function create(websocketPort) {
    const server = createServer();
    io = socketio(server, config.webSocket);

    io.use(function(socket, next) {
        var handshakeData = socket.request;
        next();
    });

    server.listen(websocketPort);

    return io;
};
