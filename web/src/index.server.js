import 'html-document/lib/global';
global.React = global.$ = require('springbokjs-dom/lib/$');
import express from 'express';
import errorParser from 'springbokjs-errors';
import createBasicInstanceFactory from 'turaco/lib/factories/basicInstanceFactory';
import ComponentRenderer from 'turaco/lib/renderers/ComponentRenderer';
import ViewRenderer from 'turaco/lib/renderers/ViewRenderer';
const fs = require('fs');
import { createServer as createNetServer } from 'net';
const app = express();
const basicAuth = require('basic-auth');
const cookieParser = require('cookie-parser')
const argv = require('minimist')(process.argv.slice(2));
const errorsParser = require('springbokjs-errors');
import ErrorHtmlRenderer from 'springbokjs-errors/lib/HtmlRenderer';
const errorHtmlRenderer = new ErrorHtmlRenderer();
const config = require('../config.js');

import IndexView from './views/IndexView';

const viewDirname = __dirname + '/views/';
const dataFilename = __dirname + '/../../data.json';
const data = JSON.parse(fs.readFileSync(dataFilename));
const items = Object.keys(data).map(key => Object.assign({ id: key, online: false }, data[key]));
const itemsMap = new Map();
const itemsMapByMac = new Map();
items.forEach(item => {
    itemsMap.set(item.id, item);
    itemsMapByMac.set(item.mac, item);
});

process.on('uncaughtException', function(err) {
    try {
        errorsParser.log(err);
    } catch (err2) {
        console.error(err.stack);
        console.error(err2.stack);
    }
});

// connection to tcp server

let netSocket;
const netServer = createNetServer(socket => {
    netSocket = socket;
    console.log('client connected (net server)');
    let mac;

    socket.on('end', function() {
        netSocket = null;
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
                    }

                    break;

                case 'disconnected':
                    rasberry = itemsMapByMac.get(value);
                    if (rasberry) {
                        rasberry.online = false;
                    }

                    break;

                default:
                    console.log('unsupported instruction: ' + instruction);
                    break;
            }
        });
    });
});
try {
    fs.unlinkSync(argv.socketWebserver || __dirname + '/../../socket-webserver');
} catch (err) {}

netServer.listen(argv.socketWebserver || __dirname + '/../../socket-webserver');

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
    return render(res, IndexView, {}, { items });
});

app.get('/save', function(req, res) {
    if (!itemsMap.has(req.query.id)) {
        return res.status(404).send('not found');
    }

    const item = itemsMap.get(req.query.id);
    item.url = req.query.url;
    res.status(200).send('ok');

    data[req.query.id].url = req.query.url;
    fs.writeFileSync(dataFilename, JSON.stringify(data));
});

app.get('/refresh', function(req, res) {
    if (!itemsMap.has(req.query.id)) {
        return res.status(404).send('not found');
    }

    const item = itemsMap.get(req.query.id);

    if (item.online) {
        netSocket.write('refresh: ' + item.mac);
    }
});


const port = argv.port || 3005;
app.listen(port);
console.log('listening on port ' + port);


