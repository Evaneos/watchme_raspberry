global.React = global.$ = require('springbokjs-dom/lib/$');

import { create } from './browser/webSocket';
create();
window.webSocket = require('./browser/webSocket');

import {loadComponents, loadViews} from 'turaco/lib/browser/loaders';
import ComponentRenderer from 'turaco/lib/browser/renderers/BrowserComponentRenderer';
import ViewRenderer from 'turaco/lib/browser/renderers/BrowserViewRenderer';
import basicInstanceFactory from 'turaco/lib/browser/basicInstanceFactory';

const componentRenderer = new ComponentRenderer(
    basicInstanceFactory('js/views/components/')
);

const viewRenderer = new ViewRenderer(
    basicInstanceFactory('js/views/'),
    componentRenderer
);

loadComponents(componentRenderer);
loadViews(viewRenderer);

