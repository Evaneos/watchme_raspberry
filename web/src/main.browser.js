global.React = global.$ = require('springbokjs-dom/lib/$');
import L from 'leaflet';
import 'leaflet/dist/leaflet.css!';
L.Icon.Default.imagePath = 'jspm_packages/npm/leaflet@0.7.3/dist/images/';

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
