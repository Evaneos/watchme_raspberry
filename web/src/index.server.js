import 'html-document/lib/global';
global.React = global.$ = require('springbokjs-dom/lib/$');
import express from 'express';
import errorParser from 'springbokjs-errors';
import createBasicInstanceFactory from 'turaco/lib/factories/basicInstanceFactory';
import ComponentRenderer from 'turaco/lib/renderers/ComponentRenderer';
import ViewRenderer from 'turaco/lib/renderers/ViewRenderer';
const app = express();
const basicAuth = require('basic-auth');
const cookieParser = require('cookie-parser');
import argv from './server/argv';
const errorsParser = require('springbokjs-errors');
import ErrorHtmlRenderer from 'springbokjs-errors/lib/HtmlRenderer';
const errorHtmlRenderer = new ErrorHtmlRenderer();
const config = require('../config.js');

import { write as netSocketWrite } from './server/tcpServer';
import { webSocketPort } from './server/webSocket';
import { items, itemsMap, itemsMapByMac, data as itemsData, write as writeData } from './server/data';

import IndexView from './views/IndexView';

const viewDirname = __dirname + '/views/';

const port = argv.port || 3005;

process.on('uncaughtException', function(err) {
    try {
        errorsParser.log(err);
    } catch (err2) {
        console.error(err.stack);
        console.error(err2.stack);
    }
});

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
