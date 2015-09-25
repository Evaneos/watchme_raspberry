import 'html-document/lib/global';
global.React = global.$ = require('springbokjs-dom/lib/$');
import express from 'express';
import errorParser from 'springbokjs-errors';
import createBasicInstanceFactory from 'turaco/lib/factories/basicInstanceFactory';
import ComponentRenderer from 'turaco/lib/renderers/ComponentRenderer';
import ViewRenderer from 'turaco/lib/renderers/ViewRenderer';
const app = express();
const basicAuth = require('basic-auth');
const cookieParser = require('cookie-parser')
const argv = require('minimist')(process.argv.slice(2));
const errorsParser = require('springbokjs-errors');
import ErrorHtmlRenderer from 'springbokjs-errors/lib/HtmlRenderer';
const errorHtmlRenderer = new ErrorHtmlRenderer();
const config = require('../config.js');

import { create as createNetSocket, socket as netSocket } from './server/tcpServer';
import { create as createWebSocket } from './server/webSocket';
import { items, itemsMap, data as itemsData, write as writeData } from './server/data';

import IndexView from './views/IndexView';

const viewDirname = __dirname + '/views/';

const port = argv.port || 3005;
const webSocketPort = argv.webSocketPort || 3006;

process.on('uncaughtException', function(err) {
    try {
        errorsParser.log(err);
    } catch (err2) {
        console.error(err.stack);
        console.error(err2.stack);
    }
});

createNetSocket(argv.socketWebserver);
const io = createWebSocket(webSocketPort);

// web server

const componentRenderer = new ComponentRenderer(
    createBasicInstanceFactory(viewDirname + 'components/', 'Component')
);

const viewRenderer = new ViewRenderer(
    createBasicInstanceFactory(viewDirname, 'View'),
    componentRenderer
);

function render(res, View, properties, data) {
    return viewRenderer.createThenRender(View, properties, data)
        .then((view) => res.send(view.toHtmlString()))
        .catch((err) => {
            res.status(500).send(errorHtmlRenderer.render(err));
        });
}

app.locals.code = function(args) {
    var contents = args[0]
        .trim()
        .replace(/&(?!\w+;)/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    return '<pre><code>' + contents + '</code></pre>';
};

app.use(express.static(__dirname + '/../public'));

app.use(cookieParser(config.cookieSecret));

app.use(function(req, res, next) {
    if (req.cookies && req.cookies.connected === true) {
        return next();
    }

    function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.send(401);
    };

    let user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
        return unauthorized(res);
    }

    if (user.name === config.basicauth.username && user.pass === config.basicauth.password) {
        res.cookie('connected', 'true', { maxAge: 2592000000, httpOnly: true, signed: true });
        return next();
    } else {
        return unauthorized(res);
    }
});

app.use(function(err, req, res, next) {
    errorsParser.log(err);
    if (argv.production) {
        res.status(500).send('Error: ' + err.message);
    } else {
        res.status(500).send(errorHtmlRenderer.render(err));
    }
});


app.get('/', function(req, res) {
    return render(res, IndexView, { }, { items, dataLayout: { hostname: req.hostname, webSocketPort } });
});

app.listen(port);
console.log('listening on port ' + port);

// web socket

io.on('connection', function(socket) {
    socket.on('save', (id, url, response) => {
        console.log('save', id, url);
        if (!itemsMap.has(id)) {
            return response(id + ' not found');
        }

        const item = itemsMap.get(id);
        item.url = url;
        response(null);

        itemsData[id].url = url;
        socket.broadcast.emit('saved', id, url);
        writeData();
    });

    socket.on('refresh', (id, response) => {
        console.log('refresh', id);
        if (!itemsMap.has(id)) {
            return response(id + ' not found');
        }

        const item = itemsMap.get(id);

        if (item.online) {
            netSocket.write('refresh: ' + item.mac);
        }

        response(null);
    });
});

io.on('error', (err) => {
    try {
        errorsParser.log(err);
    } catch (err2) {
        console.error(err.stack);
        console.error(err2.stack);
    }
});
