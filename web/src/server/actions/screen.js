import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom/server';

import ScreenPage from '../../reactComponents/ScreenPage';
import Html from '../../reactComponents/Html';
import withContext from './withContextDecorator';

@withContext
class App extends React.Component {
    static propTypes = {
      children: PropTypes.element.isRequired,
    };

    render() {
        return this.props.children;
    }

}

const router = {
    dispatch({ context }) {
        return {
            component: <App context={context}><ScreenPage /></App>,
        }
    }
};

export default function screen(req, res, next) {
    try {
        let statusCode = 200;
        const data = {title: '', description: '', css: '', body: ''};
        const css = [];
        const context = {
            onInsertCss: value => css.push(value),
            onSetTitle: value => data.title = value,
            onSetMeta: (key, value) => data[key] = value,
            onPageNotFound: () => statusCode = 404,
        };

        const { state, component } = router.dispatch({ path: req.path, context });
        data.body = ReactDOM.renderToString(component);
        data.css = css.join('');

        const html = ReactDOM.renderToStaticMarkup(<Html {...data} />);
        res.status(statusCode).send('<!doctype html>\n' + html);
    } catch (err) {
        next(err);
    }
}
