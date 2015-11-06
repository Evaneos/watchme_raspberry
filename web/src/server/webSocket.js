import socketio from 'socket.io';
import { createServer } from 'http';
import argv from './argv';
import { write as netSocketWrite } from './tcpServer';
import { itemsMap, data as itemsData, write as writeData } from './data';
import { ConsoleLogger } from 'nightingale';
import errorParser from 'springbokjs-errors';
const config = require('../../config.js');

const logger = new ConsoleLogger('webSocket');

export const webSocketPort = argv.webSocketPort || 3006;
const server = createServer();
export const io = socketio(server, config.webSocket);

io.use(function(socket, next) {
    var handshakeData = socket.request;
    next();
});

server.listen(webSocketPort);

io.on('connection', function(socket) {
    socket.on('save', (id, url, response) => {
        logger.info('save', { id, url });
        if (!itemsMap.has(id)) {
            return response(id + ' not found');
        }

        const item = itemsMap.get(id);
        if (item.url === url) {
            return response(null);
        }

        item.url = url;
        response(null);

        itemsData[id].url = url;
        socket.broadcast.emit('saved', id, url);
        writeData();

        if (item.online) {
            netSocketWrite(`change-url: ${item.mac},${item.url}`);
        }
    });

    socket.on('refresh', (id, response) => {
        logger.info('refresh', { id });
        if (!itemsMap.has(id)) {
            return response(id + ' not found');
        }

        const item = itemsMap.get(id);

        if (item.online) {
            netSocketWrite(`refresh: ${item.mac},${item.url}`);
        }

        response(null);
    });
});

io.on('error', (err) => {
    try {
        errorParser.log(err);
    } catch (err2) {
        console.error(err.stack);
        console.error(err2.stack);
    }
});
